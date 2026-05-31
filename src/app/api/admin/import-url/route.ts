/**
 * POST /api/admin/import-url
 *
 * Админский импорт рецепта по ссылке. На пользовательской форме та же фича
 * закрыта под premium-гейтом (см. /api/recipes/import-url), но админу гейт
 * не нужен — он наполняет книгу и должен иметь возможность подтащить рецепт
 * из любой страницы. Защита — только admin-роль.
 *
 * Логика извлечения одна и та же (см. lib/recipe-import): сначала JSON-LD
 * schema.org/Recipe (БЕЗ AI, токены не тратятся), при отсутствии — фолбэк
 * через gpt-4o-mini. Источник возвращаем в ответе ("source").
 *
 * Body: { url: string }
 * Возвращает: { recipe, source } | { error, code }
 */
import { requireAdmin, isAuthSuccess } from "@/lib/api-auth";
import { ImportUrlSchema } from "@/lib/validations";
import { importRecipeFromUrl, RecipeImportError } from "@/lib/recipe-import";
import { NextRequest, NextResponse } from "next/server";

// Загрузка страницы + (возможно) OpenAI-парсинг — даём запас по времени.
export const maxDuration = 60;

/**
 * Грубый per-user rate-limit (импорт может дёргать сеть и AI). In-memory,
 * живёт в пределах тёплого инстанса — защита от циклов, не жёсткая квота.
 */
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 20; // админу даём чуть больше окно, чем юзеру
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
  // 1. Только admin.
  const authResult = await requireAdmin();
  if (!isAuthSuccess(authResult)) return authResult;
  const { userId } = authResult;

  // 2. Грубый rate-limit.
  if (isRateLimited(userId)) {
    return NextResponse.json(
      { error: "Слишком часто. Подождите немного и попробуйте снова." },
      { status: 429 },
    );
  }

  // 3. Валидация тела.
  const body = await req.json().catch(() => ({}));
  const parsed = ImportUrlSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректная ссылка.", code: "bad_url" },
      { status: 400 },
    );
  }

  // 4. Импорт: страница → JSON-LD или AI-фолбэк.
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
    console.error("[admin/import-url] failed:", msg);
    return NextResponse.json(
      { error: "Не удалось импортировать рецепт. Попробуйте другую ссылку.", code: "ai_failed" },
      { status: 500 },
    );
  }
}
