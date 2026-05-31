/**
 * POST /api/recipes/import-url
 *
 * Premium-фича «Импорт рецепта по ссылке». Пользователь присылает URL страницы
 * рецепта — возвращаем нормализованные поля, которыми форма заполняет себя сама.
 *
 * Два пути извлечения (см. lib/recipe-import): сначала микроразметка
 * schema.org/Recipe (БЕЗ AI, токены не тратятся), при её отсутствии — фолбэк
 * через gpt-4o-mini (тратит токены). Источник возвращаем в ответе ("source").
 *
 * Доступ (гейт): залогиненный пользователь с планом, дающим AI
 * (entitlements.aiEnabled → premium/lifetime). Free → 403. Тот же приём, что в
 * /api/recipes/calculate-nutrition.
 *
 * Body: { url: string }
 * Возвращает: { recipe, source } | { error, code }
 */
import { createClient } from "@/lib/supabase/server";
import { getEntitlements } from "@/lib/entitlements";
import { ImportUrlSchema } from "@/lib/validations";
import { importRecipeFromUrl, RecipeImportError } from "@/lib/recipe-import";
import { NextRequest, NextResponse } from "next/server";

// Загрузка страницы + (возможно) OpenAI-парсинг — даём запас по времени.
export const maxDuration = 60;

/**
 * Грубый per-user rate-limit (импорт может дёргать сеть и AI). In-memory, живёт
 * в пределах тёплого инстанса — защита от циклов, не жёсткая квота.
 */
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 10; // импортов в минуту на пользователя
const hits = new Map<string, number[]>();
function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const recent = (hits.get(userId) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    hits.set(userId, recent);
    return true;
  }
  recent.push(now);
  hits.set(userId, recent);
  return false;
}

export async function POST(req: NextRequest) {
  // 1. Требуется аутентифицированная сессия.
  const supabaseAuth = await createClient();
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
      { error: "Импорт по ссылке доступен на платном плане." },
      { status: 403 },
    );
  }

  // 3. Грубый rate-limit.
  if (isRateLimited(user.id)) {
    return NextResponse.json(
      { error: "Слишком часто. Подождите немного и попробуйте снова." },
      { status: 429 },
    );
  }

  // 4. Валидация тела.
  const body = await req.json().catch(() => ({}));
  const parsed = ImportUrlSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректная ссылка.", code: "bad_url" },
      { status: 400 },
    );
  }

  // 5. Импорт: страница → JSON-LD или AI-фолбэк.
  try {
    const { recipe, source } = await importRecipeFromUrl(parsed.data.url);
    return NextResponse.json({ recipe, source });
  } catch (err) {
    if (err instanceof RecipeImportError) {
      // not_recipe — это «не нашли», остальное — проблема доступа к странице.
      const status = err.code === "not_recipe" ? 422 : 400;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[import-url] failed:", msg);
    return NextResponse.json(
      { error: "Не удалось импортировать рецепт. Попробуйте другую ссылку.", code: "ai_failed" },
      { status: 500 },
    );
  }
}
