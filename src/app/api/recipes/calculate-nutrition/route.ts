/**
 * POST /api/recipes/calculate-nutrition
 *
 * Пользовательский аналог /api/admin/calculate-nutrition: считает КБЖУ для
 * СВОЕГО (приватного) рецепта текущего пользователя и сохраняет в recipes.nutrition.
 *
 * Доступ (гейт): требуется залогиненный пользователь, у которого план даёт доступ
 * к AI (`entitlements.aiEnabled` → premium/lifetime). Так приглашённые тестеры
 * получают AI ДО запуска монетизации: достаточно выставить им profiles.plan='premium'.
 * Считать можно ТОЛЬКО свой рецепт (owner_id === user.id).
 *
 * Body: { recipeId: uuid, force?: boolean }
 * Возвращает: { recipeId, nutrition, cached }
 */
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getEntitlements } from "@/lib/entitlements";
import { CalculateNutritionRequestSchema } from "@/lib/validations";
import { calculateNutrition } from "@/lib/nutrition/calculate";
import { ingredientsHash } from "@/lib/nutrition/ingredients-hash.mjs";
import type { NutritionData } from "@/types";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

// OpenAI-парсинг может занять до ~30с на большом составе.
export const maxDuration = 60;

/**
 * Best-effort per-user rate limit. AI-вызовы стоят денег, поэтому ограничиваем
 * частоту. NOTE: in-memory, живёт в пределах тёплого инстанса — это лишь грубая
 * защита от циклов злоупотребления, не жёсткая квота (жёсткая придёт со слоем
 * кредитов/монетизации). Глобальный потолок расходов задаётся лимитом в OpenAI.
 */
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 10; // расчётов в минуту на пользователя
const calcHits = new Map<string, number[]>();
function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const recent = (calcHits.get(userId) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    calcHits.set(userId, recent);
    return true;
  }
  recent.push(now);
  calcHits.set(userId, recent);
  return false;
}

export async function POST(req: NextRequest) {
  // 1. Требуется аутентифицированная сессия (роль admin НЕ нужна).
  const supabaseAuth = createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Гейт доступа к AI по плану (premium/lifetime). Free → 403.
  const { aiEnabled } = await getEntitlements(user.id);
  if (!aiEnabled) {
    return NextResponse.json(
      { error: "AI-функции недоступны для вашего аккаунта." },
      { status: 403 },
    );
  }

  // 3. Грубый rate-limit (AI стоит денег).
  if (isRateLimited(user.id)) {
    return NextResponse.json(
      { error: "Слишком часто. Подождите немного и попробуйте снова." },
      { status: 429 },
    );
  }

  // 4. Валидация тела.
  const body = await req.json().catch(() => ({}));
  const parsed = CalculateNutritionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { recipeId, force } = parsed.data;

  // 5. Читаем рецепт через service-role (нужен и для чтения ingredients_base).
  const supabase = createServiceRoleClient();
  const { data: recipe, error: fetchError } = await supabase
    .from("recipes")
    .select("title, ingredients, servings, nutrition, owner_id")
    .eq("id", recipeId)
    .single();
  if (fetchError || !recipe) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  // 6. Владелец: считать можно только СВОЙ рецепт.
  if (recipe.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!recipe.ingredients || recipe.ingredients.trim().length === 0) {
    return NextResponse.json(
      { error: "У рецепта пустой состав — нечего считать." },
      { status: 422 },
    );
  }

  // 7. Кеш по хешу состава (как в админском роуте): если состав не менялся и не
  //    force — не дёргаем OpenAI, возвращаем сохранённое.
  const currentHash = ingredientsHash(recipe.ingredients);
  const existing = recipe.nutrition as NutritionData | null;
  if (!force && existing?.ingredients_hash === currentHash) {
    return NextResponse.json({ recipeId, nutrition: existing, cached: true });
  }

  // 8. Парс → матч → расчёт (тот же движок, что и в админке).
  let nutrition;
  try {
    nutrition = await calculateNutrition({
      ingredientsText: recipe.ingredients,
      servings: recipe.servings,
      supabase,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[user calculate-nutrition] failed:", msg);
    return NextResponse.json(
      { error: "Не удалось рассчитать КБЖУ. Попробуйте ещё раз." },
      { status: 500 },
    );
  }

  // 9. Сохраняем (ещё раз scoped to owner — defense in depth).
  const { error: updateError } = await supabase
    .from("recipes")
    .update({ nutrition, updated_at: new Date().toISOString() })
    .eq("id", recipeId)
    .eq("owner_id", user.id);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // 10. Обновляем кеш страницы просмотра рецепта.
  revalidatePath(`/dashboard/recipes/${recipeId}`);

  return NextResponse.json({ recipeId, nutrition, cached: false });
}
