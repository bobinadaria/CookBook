/**
 * Права и лимиты пользователя (entitlements) — каркас монетизации.
 *
 * Единственный источник истины по тому, что пользователю «можно» в зависимости
 * от его плана. Сейчас используется фичей «Своя книга рецептов» (лимит личных
 * рецептов на Free). Дальше сюда же лягут лимиты на AI-кредиты, фото и т.п.
 *
 * Гейтинг включается фиче-флагом `MONETIZATION_ENABLED` (env). Пока флаг выключен
 * (пре-лонч) лимиты НЕ применяются — все лимиты возвращаются как `null` (безлимит),
 * чтобы можно было свободно тестировать. Реальную монетизацию включаем на этапе
 * платежей (см. MONETIZATION_PLAN.md), просто выставив флаг в `true`.
 *
 * Использование только на сервере (server actions / route handlers / RSC):
 * план читается через service-role, чтобы значение нельзя было подделать с клиента.
 */
import { createServiceRoleClient } from "@/lib/supabase/admin";

/** Тарифный план пользователя (зеркалит `profiles.plan`). */
export type Plan = "free" | "premium" | "lifetime";

/** Лимит личных рецептов для Free-плана. Premium/Lifetime — без лимита. */
export const FREE_RECIPE_LIMIT = 15;

export interface Entitlements {
  /** Текущий план пользователя (по умолчанию 'free'). */
  plan: Plan;
  /** Включён ли гейтинг монетизации прямо сейчас (фиче-флаг). */
  monetizationEnabled: boolean;
  limits: {
    /** Максимум личных рецептов. `null` = безлимит (Premium/Lifetime или флаг выключен). */
    recipes: number | null;
  };
}

/**
 * Фиче-флаг монетизации. Применять ли лимиты/гейтинг.
 * `true` только если env `MONETIZATION_ENABLED === "true"`. По умолчанию выключен.
 */
export function isMonetizationEnabled(): boolean {
  return process.env.MONETIZATION_ENABLED === "true";
}

/** Лимит личных рецептов для плана с учётом фиче-флага. */
function recipeLimitFor(plan: Plan, monetizationEnabled: boolean): number | null {
  if (!monetizationEnabled) return null; // флаг выключен — лимит не применяется
  return plan === "free" ? FREE_RECIPE_LIMIT : null;
}

/** Безопасно привести произвольное значение из БД к Plan (фолбэк — 'free'). */
function normalizePlan(value: unknown): Plan {
  return value === "premium" || value === "lifetime" ? value : "free";
}

/**
 * Возвращает права/лимиты пользователя.
 *
 * План читается через service-role (как `isAdmin`) — авторитетно, не подделать
 * с клиента. При выключенном `MONETIZATION_ENABLED` лимиты не применяются
 * (`limits.recipes === null`). При ошибке чтения профиля безопасно падаем на 'free'.
 */
export async function getEntitlements(userId: string): Promise<Entitlements> {
  const monetizationEnabled = isMonetizationEnabled();
  let plan: Plan = "free";

  if (userId) {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .single();

    if (error) {
      console.error(
        "[getEntitlements] Failed to read plan:",
        error.message,
        "userId:",
        userId
      );
    } else {
      plan = normalizePlan(data?.plan);
    }
  }

  return {
    plan,
    monetizationEnabled,
    limits: {
      recipes: recipeLimitFor(plan, monetizationEnabled),
    },
  };
}

/**
 * Можно ли пользователю создать ещё один личный рецепт.
 *
 * Чистая проверка лимита: `currentCount` (текущее число рецептов пользователя)
 * передаёт вызывающая сторона — сервер-экшен сам делает `count(owner_id)`.
 * Возвращает `allowed`, действующий `limit` (null = безлимит) и `plan` —
 * чтобы UI/экшен мог собрать понятное сообщение «достигнут лимит Free».
 */
export async function canCreateRecipe(
  userId: string,
  currentCount: number
): Promise<{ allowed: boolean; limit: number | null; plan: Plan }> {
  const { plan, limits } = await getEntitlements(userId);
  const limit = limits.recipes;
  const allowed = limit === null || currentCount < limit;
  return { allowed, limit, plan };
}
