/**
 * AI-генерация обложки для админ-формы рецепта.
 *
 * Только для админа (RU-only бэкофис автора). Может подтягивать EN-переводы из
 * БД по recipeId — англоязычный промпт даёт стабильно лучший результат.
 * Параллельный роут для премиум-юзеров — `/api/recipes/generate-image`.
 *
 * Сама генерация + загрузка вынесены в `lib/cover-image.ts` (общее с user-роутом).
 */
import { createServiceRoleClient, isValidUUID } from "@/lib/supabase/admin";
import { requireAdmin, isAuthSuccess } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import {
  buildCoverPrompt,
  generateCoverImage,
  uploadCoverToStorage,
  type RecipeKind,
} from "@/lib/cover-image";

// Генерация изображения может занимать до ~60с
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // 1. Verify admin auth
  const auth = await requireAdmin();
  if (!isAuthSuccess(auth)) return auth;

  // 2. Parse + validate request body
  const body = await req.json().catch(() => ({}));
  const { title, description, ingredients, recipeId, recipeType } = body as {
    title?: string;
    description?: string;
    ingredients?: string;
    recipeId?: string;
    recipeType?: RecipeKind;
  };

  if (!title?.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  // 3. Подтягиваем EN-переводы и тип из БД, если есть recipeId.
  let promptTitle = title.trim();
  let promptDescription = description?.trim();
  let promptIngredients = ingredients?.trim();
  let promptType: RecipeKind = recipeType === "drink" ? "drink" : "food";

  if (recipeId && isValidUUID(recipeId)) {
    const supabaseAdmin = createServiceRoleClient();
    const { data: recipe } = await supabaseAdmin
      .from("recipes")
      .select("title_en, description_en, ingredients_en, recipe_type")
      .eq("id", recipeId)
      .single();

    if (recipe) {
      if (recipe.title_en) promptTitle = recipe.title_en;
      if (recipe.description_en) promptDescription = recipe.description_en;
      if (recipe.ingredients_en) promptIngredients = recipe.ingredients_en;
      if (recipe.recipe_type === "drink" || recipe.recipe_type === "food") {
        promptType = recipe.recipe_type;
      }
    }
  }

  // 4. Сборка промпта → генерация → загрузка.
  const prompt = buildCoverPrompt(
    promptTitle,
    promptType,
    promptDescription,
    promptIngredients,
  );

  try {
    const { buffer, model } = await generateCoverImage(prompt);
    const { url, path } = await uploadCoverToStorage(buffer);
    return NextResponse.json({
      url,
      path,
      prompt,
      model,
      usedEnglish: promptTitle !== title.trim(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Ошибка генерации: ${message}` }, { status: 500 });
  }
}
