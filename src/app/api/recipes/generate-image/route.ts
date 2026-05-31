/**
 * AI-генерация обложки для пользовательских рецептов (юзер-форма «Моя книга»).
 *
 * Доступ — только пользователям с `aiEnabled` (premium/lifetime). Это та же
 * политика, что у `/api/recipes/calculate-nutrition`: AI стоит денег, поэтому
 * безусловный гейт по плану, НЕ зависящий от фиче-флага `MONETIZATION_ENABLED`.
 *
 * НЕ принимает `recipeId` (в отличие от админ-роута): юзер генерит обложку из
 * того, что у него сейчас в форме, и подтягивать EN-переводы по чужому recipeId
 * было бы дырой. Если когда-нибудь у юзер-рецептов появятся EN-переводы, можно
 * безопасно передавать `description_en` / `ingredients_en` прямо в теле.
 *
 * Сама генерация и загрузка — `lib/cover-image.ts` (общая с админ-роутом).
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEntitlements } from "@/lib/entitlements";
import {
  buildCoverPrompt,
  generateCoverImage,
  uploadCoverToStorage,
  type RecipeKind,
} from "@/lib/cover-image";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // 1. Аутентификация: должен быть залогинен.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Гейт по плану: AI разрешён только premium/lifetime.
  const { aiEnabled, plan } = await getEntitlements(user.id);
  if (!aiEnabled) {
    return NextResponse.json(
      { error: "AI cover generation is available on Premium and Lifetime plans.", plan },
      { status: 403 },
    );
  }

  // 3. Парсинг тела.
  const body = await req.json().catch(() => ({}));
  const { title, description, ingredients, recipeType } = body as {
    title?: string;
    description?: string;
    ingredients?: string;
    recipeType?: RecipeKind;
  };

  if (!title?.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const promptType: RecipeKind = recipeType === "drink" ? "drink" : "food";

  // 4. Промпт → генерация → загрузка.
  const prompt = buildCoverPrompt(
    title.trim(),
    promptType,
    description?.trim(),
    ingredients?.trim(),
  );

  try {
    const { buffer, model } = await generateCoverImage(prompt);
    const { url, path } = await uploadCoverToStorage(buffer);
    return NextResponse.json({ url, path, model });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[recipes/generate-image] failed:", message);
    return NextResponse.json({ error: `Ошибка генерации: ${message}` }, { status: 500 });
  }
}
