"use server";

/**
 * Server actions для аккаунта (не привязаны к конкретному рецепту).
 *
 * downgradeToFree — единственный способ понизить свой план до Free. Делает
 * это через service-role, а не клиентский update: RLS не защищает колонку
 * `plan` саму по себе (см. scripts/migration-protect-plan-column.sql —
 * применить вручную, если ещё не применена), поэтому план меняем только
 * здесь, на сервере, после собственной проверки текущего плана.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

export type DowngradeResult =
  | { ok: true }
  | { ok: false; error: "unauthorized" | "not_premium" | "db_error" };

/**
 * Переводит текущего пользователя с Premium на Free.
 *
 * Lifetime сознательно НЕ обрабатываем здесь: это разовый платёж, а не
 * подписка — «отменять» нечего, и понижение плана не возвращает деньги.
 * Если человек на Lifetime всё же хочет вернуться на Free — это отдельный
 * разговор/поддержка, не самостоятельная кнопка.
 *
 * Последствия (честно, без скрытого удаления данных):
 *  - AI-доступ (ссылка/обложка/КБЖУ) отключается сразу — aiEnabled пересчитается
 *    из нового plan при следующем запросе.
 *  - Уже сохранённые рецепты, избранное, обложки и посчитанное КБЖУ остаются
 *    как есть — ничего не удаляется и не блокируется на чтение.
 *  - Если рецептов больше лимита Free (15) — создать НОВЫЙ рецепт нельзя, пока
 *    не удалишь лишние или не вернёшься на Premium (canCreateRecipe уже это
 *    проверяет, отдельной логики здесь не нужно).
 */
export async function downgradeToFree(): Promise<DowngradeResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const admin = createServiceRoleClient();
  const { data: profile, error: readError } = await admin
    .from("profiles")
    .select("plan, stripe_subscription_id")
    .eq("id", user.id)
    .single();
  if (readError) return { ok: false, error: "db_error" };

  // Только Premium → Free. Free уже free (не-о-чём), Lifetime — см. комментарий выше.
  if (profile?.plan !== "premium") {
    return { ok: false, error: "not_premium" };
  }

  // Отменяем Stripe-подписку, если она есть (иначе пользователь продолжит списание)
  if (profile.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(profile.stripe_subscription_id);
    } catch (err) {
      // Не блокируем даунгрейд если Stripe недоступен — вебхук dogоварится сам
      console.error("[downgradeToFree] Failed to cancel Stripe subscription:", err);
    }
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({ plan: "free", stripe_subscription_id: null })
    .eq("id", user.id);
  if (updateError) return { ok: false, error: "db_error" };

  revalidatePath("/pricing");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/recipes");
  return { ok: true };
}
