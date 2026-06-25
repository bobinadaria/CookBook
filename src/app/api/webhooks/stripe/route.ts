/**
 * POST /api/webhooks/stripe
 *
 * Принимает события от Stripe и обновляет profiles.plan в Supabase.
 * Верифицирует подпись через STRIPE_WEBHOOK_SECRET — без него событие отклоняется.
 *
 * Обрабатываемые события:
 *  - checkout.session.completed → устанавливает plan = 'premium' или 'lifetime'
 *    и сохраняет stripe_subscription_id (для подписок).
 *  - customer.subscription.deleted → устанавливает plan = 'free' при отмене
 *    (конец периода или немедленная отмена через downgradeToFree).
 *
 * ВАЖНО: тело запроса читаем как raw text (не JSON) — иначе подпись не сойдётся.
 * В Next.js App Router body parser выключен по умолчанию в route handlers,
 * поэтому request.text() возвращает оригинальное тело.
 *
 * Настройка:
 *  1. В Stripe Dashboard → Developers → Webhooks → Add endpoint:
 *     URL: https://bydaria.kitchen/api/webhooks/stripe
 *     Events: checkout.session.completed, customer.subscription.deleted
 *  2. Скопировать Signing secret → STRIPE_WEBHOOK_SECRET в .env.local
 *  3. Для локальной разработки: stripe listen --forward-to localhost:3000/api/webhooks/stripe
 */

import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { PACK_COVER_CREDITS } from "@/lib/entitlements";

// Отключаем парсинг тела Next.js — нужно сырое тело для верификации подписи Stripe
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.text();
  const sig  = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ message: "Missing stripe-signature header" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe/webhook] Missing STRIPE_WEBHOOK_SECRET");
    return NextResponse.json({ message: "Webhook secret not configured" }, { status: 500 });
  }

  // ── Верификация подписи ───────────────────────────────────────────────────
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid signature";
    console.error("[stripe/webhook] Signature verification failed:", msg);
    return NextResponse.json({ message: msg }, { status: 400 });
  }

  const admin = createServiceRoleClient();

  // ── Обработка событий ────────────────────────────────────────────────────
  try {
    switch (event.type) {

      // Покупка завершена (подписка, разовый платёж или пакет обложек)
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId  = session.metadata?.user_id;
        const kind    = session.metadata?.kind;   // 'pack' для пакетов
        const plan    = session.metadata?.plan as "premium" | "lifetime" | undefined;

        if (!userId) {
          console.warn("[stripe/webhook] checkout.session.completed: missing user_id", session.id);
          break;
        }

        // ── Пакет AI-обложек ──────────────────────────────────────────────
        if (kind === "pack") {
          const size    = session.metadata?.size ?? "";  // "S" | "M" | "L"
          const credits = PACK_COVER_CREDITS[size];

          if (!credits) {
            console.warn("[stripe/webhook] pack: unknown size", size, session.id);
            break;
          }

          // Идемпотентность: вставляем только если такое событие ещё не обработано
          const { error } = await admin
            .from("credit_ledger")
            .insert({
              user_id:         userId,
              delta:           credits,
              reason:          `pack_${size.toLowerCase()}`,
              stripe_event_id: event.id,
            });

          if (error) {
            // 23505 = unique violation — событие уже обработано, это нормально
            if (error.code !== "23505") {
              console.error("[stripe/webhook] Failed to credit pack:", error.message);
            }
          } else {
            console.log(`[stripe/webhook] Credited ${credits} covers (pack ${size}) for user ${userId}`);
          }
          break;
        }

        // ── Подписка / Lifetime ───────────────────────────────────────────
        if (!plan) {
          console.warn("[stripe/webhook] checkout.session.completed: missing plan metadata", session.id);
          break;
        }

        if (session.mode === "subscription") {
          // Premium подписка — сохраняем subscription ID для последующей отмены
          const subscriptionId = typeof session.subscription === "string"
            ? session.subscription
            : (session.subscription as Stripe.Subscription | null)?.id ?? null;

          const { error } = await admin
            .from("profiles")
            .update({ plan: "premium", stripe_subscription_id: subscriptionId })
            .eq("id", userId);

          if (error) {
            console.error("[stripe/webhook] Failed to update plan to premium:", error.message);
          } else {
            console.log(`[stripe/webhook] Plan set to premium for user ${userId}`);
          }

        } else if (session.mode === "payment" && plan === "lifetime") {
          // Разовая покупка Lifetime — подписки нет, очищаем subscription_id
          const { error } = await admin
            .from("profiles")
            .update({ plan: "lifetime", stripe_subscription_id: null })
            .eq("id", userId);

          if (error) {
            console.error("[stripe/webhook] Failed to update plan to lifetime:", error.message);
          } else {
            console.log(`[stripe/webhook] Plan set to lifetime for user ${userId}`);
          }
        }
        break;
      }

      // Подписка отменена (вручную через downgradeToFree или истёк срок)
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId   = typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

        // Находим юзера по stripe_customer_id
        const { data: profile, error: findError } = await admin
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (findError || !profile) {
          console.warn("[stripe/webhook] customer.subscription.deleted: user not found for customer", customerId);
          break;
        }

        const { error } = await admin
          .from("profiles")
          .update({ plan: "free", stripe_subscription_id: null })
          .eq("id", profile.id);

        if (error) {
          console.error("[stripe/webhook] Failed to downgrade to free:", error.message);
        } else {
          console.log(`[stripe/webhook] Plan set to free for user ${profile.id} (subscription deleted)`);
        }
        break;
      }

      default:
        // Игнорируем остальные события — Stripe отправляет многие, нам нужны только эти два
        break;
    }
  } catch (err) {
    console.error("[stripe/webhook] Handler error:", err);
    return NextResponse.json({ message: "Handler error" }, { status: 500 });
  }

  // Всегда возвращаем 200 — иначе Stripe будет повторять попытки
  return NextResponse.json({ received: true });
}
