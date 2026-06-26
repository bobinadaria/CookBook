/**
 * POST /api/payments/create-checkout-session
 *
 * Создаёт Stripe Checkout Session для выбранного товара и возвращает URL,
 * на который нужно перенаправить пользователя. Всё оформление — на стороне
 * Stripe; никаких карточных данных не касаемся.
 *
 * Порядок работы:
 *  1. Проверяем auth (только залогиненные могут покупать).
 *  2. Берём или создаём Stripe-кастомера (stripe_customer_id в profiles).
 *  3. Создаём сессию в режиме subscription (Premium) или payment (Lifetime).
 *  4. Возвращаем { url } — CheckoutModal делает window.location.href = url.
 *
 * После оплаты Stripe редиректит на /pricing/success, а вебхук
 * /api/webhooks/stripe обновляет profiles.plan.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { stripe, getPriceId } from "@/lib/stripe";
import { getSiteUrl } from "@/lib/site-url";
import { getEntitlements } from "@/lib/entitlements";
import type { CheckoutItem } from "@/lib/checkout";

export async function POST(request: Request) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let item: CheckoutItem;
  try {
    const body = await request.json();
    item = body.item;
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  if (!item || (item.kind === "plan" && item.plan === "free")) {
    return NextResponse.json({ message: "Unsupported item" }, { status: 400 });
  }

  // Серверная защита: пакеты только для Premium/Lifetime (UI тоже блокирует кнопку).
  if (item.kind === "pack") {
    const { aiEnabled } = await getEntitlements(user.id);
    if (!aiEnabled) {
      return NextResponse.json({ message: "Cover packs require Premium or Lifetime plan" }, { status: 403 });
    }
  }

  // ── Get or create Stripe customer ─────────────────────────────────────────
  const admin = createServiceRoleClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id, display_name")
    .eq("id", user.id)
    .single();

  let customerId = profile?.stripe_customer_id ?? null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: profile?.display_name ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await admin
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  // ── Build checkout session ────────────────────────────────────────────────
  const siteUrl = getSiteUrl();
  const cancelUrl = `${siteUrl}/pricing`;

  try {
    let sessionUrl: string | null = null;

    if (item.kind === "plan" && item.plan === "premium") {
      const successUrl = `${siteUrl}/pricing/success?plan=premium&session_id={CHECKOUT_SESSION_ID}`;
      const session = await stripe.checkout.sessions.create({
        customer:    customerId,
        mode:        "subscription",
        line_items:  [{ price: getPriceId("premium_monthly"), quantity: 1 }],
        success_url: successUrl,
        cancel_url:  cancelUrl,
        metadata: { user_id: user.id, plan: "premium" },
        payment_method_collection: "always",
        custom_text: {
          terms_of_service_acceptance: {
            message: "I agree to the [Terms of Service](https://bydaria.kitchen/terms) and [Privacy Policy](https://bydaria.kitchen/privacy).",
          },
        },
        consent_collection: { terms_of_service: "required" },
      });
      sessionUrl = session.url;

    } else if (item.kind === "plan" && item.plan === "lifetime") {
      const successUrl = `${siteUrl}/pricing/success?plan=lifetime&session_id={CHECKOUT_SESSION_ID}`;
      const session = await stripe.checkout.sessions.create({
        customer:    customerId,
        mode:        "payment",
        line_items:  [{ price: getPriceId("lifetime"), quantity: 1 }],
        success_url: successUrl,
        cancel_url:  cancelUrl,
        metadata: { user_id: user.id, plan: "lifetime" },
        custom_text: {
          terms_of_service_acceptance: {
            message: "I agree to the [Terms of Service](https://bydaria.kitchen/terms) and [Privacy Policy](https://bydaria.kitchen/privacy).",
          },
        },
        consent_collection: { terms_of_service: "required" },
      });
      sessionUrl = session.url;

    } else if (item.kind === "pack") {
      const packKey = `pack_${item.size.toLowerCase()}` as "pack_s" | "pack_m" | "pack_l";
      const successUrl = `${siteUrl}/pricing/success?plan=pack&size=${item.size}&session_id={CHECKOUT_SESSION_ID}`;
      const session = await stripe.checkout.sessions.create({
        customer:    customerId,
        mode:        "payment",
        line_items:  [{ price: getPriceId(packKey), quantity: 1 }],
        success_url: successUrl,
        cancel_url:  cancelUrl,
        metadata: { user_id: user.id, kind: "pack", size: item.size },
        custom_text: {
          terms_of_service_acceptance: {
            message: "I agree to the [Terms of Service](https://bydaria.kitchen/terms) and [Privacy Policy](https://bydaria.kitchen/privacy).",
          },
        },
        consent_collection: { terms_of_service: "required" },
      });
      sessionUrl = session.url;
    }

    if (!sessionUrl) {
      return NextResponse.json({ message: "Failed to create session" }, { status: 500 });
    }

    return NextResponse.json({ url: sessionUrl });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error";
    console.error("[create-checkout-session]", message);
    return NextResponse.json({ message }, { status: 500 });
  }
}
