/**
 * POST /api/admin/calculate-nutrition
 *
 * Считает КБЖУ для рецепта на основе recipes.ingredients (текст) + ingredients_base.
 *   1. Парсит ингредиенты через OpenAI gpt-4o-mini в структурированный массив.
 *   2. Матчит каждое название против ingredients_base (exact → pg_trgm fuzzy).
 *   3. Суммирует kcal/protein/fat/carbs пропорционально граммам.
 *   4. Делит на recipes.servings (если есть).
 *   5. Сохраняет результат в recipes.nutrition (JSONB).
 *
 * Body: { recipeId: uuid }
 * Возвращает: NutritionData (см. src/types/index.ts)
 *
 * Auth: только админ (requireAdmin via Supabase session).
 */
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { requireAdmin, isAuthSuccess } from "@/lib/api-auth";
import { CalculateNutritionRequestSchema } from "@/lib/validations";
import { calculateNutrition } from "@/lib/nutrition/calculate";
import { ingredientsHash } from "@/lib/nutrition/ingredients-hash.mjs";
import type { NutritionData } from "@/types";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

// OpenAI-парсинг + множественные RPC-вызовы могут занять до 30с на большом рецепте
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // 1. Auth
  const auth = await requireAdmin();
  if (!isAuthSuccess(auth)) return auth;

  // 2. Validate body
  const body = await req.json().catch(() => ({}));
  const parsed = CalculateNutritionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { recipeId, force } = parsed.data;

  // 3. Fetch recipe. Используем service-role чтобы обойти RLS на ingredients_base.
  const supabase = createServiceRoleClient();
  const { data: recipe, error: fetchError } = await supabase
    .from("recipes")
    .select("slug, title, ingredients, servings, nutrition")
    .eq("id", recipeId)
    .single();

  if (fetchError || !recipe) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  if (!recipe.ingredients || recipe.ingredients.trim().length === 0) {
    return NextResponse.json(
      { error: "У рецепта пустое поле ingredients — нечего считать" },
      { status: 422 },
    );
  }

  // 3.5. Кеш: если состав не менялся с прошлого расчёта (хеш совпал) и не force —
  //      не дёргаем OpenAI, возвращаем уже сохранённое.
  const currentHash = ingredientsHash(recipe.ingredients);
  const existing = recipe.nutrition as NutritionData | null;
  if (!force && existing?.ingredients_hash === currentHash) {
    return NextResponse.json({
      recipeId,
      title: recipe.title,
      nutrition: existing,
      cached: true,
    });
  }

  // 4. Парс → матч → расчёт
  let nutrition;
  try {
    nutrition = await calculateNutrition({
      ingredientsText: recipe.ingredients,
      servings: recipe.servings,
      supabase,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[calculate-nutrition] failed:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // 5. Сохраняем в recipes.nutrition
  const { error: updateError } = await supabase
    .from("recipes")
    .update({ nutrition, updated_at: new Date().toISOString() })
    .eq("id", recipeId);
  if (updateError) {
    return NextResponse.json(
      { error: `Не удалось сохранить nutrition: ${updateError.message}` },
      { status: 500 },
    );
  }

  // 6. Инвалидируем кеш страниц рецепта (public + admin)
  revalidatePath(`/recipes/${recipe.slug}`);
  revalidatePath(`/admin/recipes/${recipeId}/edit`);

  return NextResponse.json({
    recipeId,
    title: recipe.title,
    nutrition,
    cached: false,
  });
}
