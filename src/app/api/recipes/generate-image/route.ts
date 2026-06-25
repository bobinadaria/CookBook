/**
 * AI-генерация обложки для пользовательских рецептов (юзер-форма «Моя книга»).
 *
 * Гейтинг:
 *  1. Только premium/lifetime (aiEnabled) — Free не может генерировать.
 *  2. Если MONETIZATION_ENABLED=true: атомарно списывает 1 кредит из credit_ledger
 *     через RPC `spend_cover_credit`. Если кредитов нет → 402 с кодом NO_CREDITS.
 *     Если флаг выключен (бета/тест) — кредит не тратится.
 *
 * НЕ принимает `recipeId`: юзер генерит обложку из данных формы напрямую.
 * Сама генерация и загрузка — `lib/cover-image.ts` (общая с админ-роутом).
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getEntitlements, isMonetizationEnabled } from "@/lib/entitlements";
import {
  buildCoverPrompt,
  generateCoverImage,
  uploadCoverToStorage,
  type RecipeKind,
} from "@/lib/cover-image";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // 1. Аутентификация.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Гейт по плану: только premium/lifetime.
  const { aiEnabled, plan } = await getEntitlements(user.id);
  if (!aiEnabled) {
    return NextResponse.json(
      { error: "AI cover generation is available on Premium and Lifetime plans.", plan },
      { status: 403 },
    );
  }

  // 3. Гейт по кредитам (только если монетизация включена).
  if (isMonetizationEnabled()) {
    const admin = createServiceRoleClient();
    const { data: spent, error: spendError } = await admin
      .rpc("spend_cover_credit", { p_user_id: user.id });

    if (spendError) {
      console.error("[recipes/generate-image] spend_cover_credit error:", spendError.message);
      return NextResponse.json({ error: "Ошибка списания кредита." }, { status: 500 });
    }

    if (!spent) {
      return NextResponse.json(
        { error: "NO_CREDITS", message: "Кредиты на обложки закончились. Купите пакет на странице тарифов." },
        { status: 402 },
      );
    }
  }

  // 4. Парсинг тела.
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

  // 5. Промпт → генерация → загрузка.
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
