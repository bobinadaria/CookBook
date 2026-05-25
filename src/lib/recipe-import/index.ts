/**
 * Импорт рецепта по ссылке — оркестратор.
 *
 * Стратегия (дешевле → дороже):
 *  1. Скачиваем страницу (safeFetchHtml, SSRF-guard + лимиты).
 *  2. Пробуем schema.org/Recipe из JSON-LD — БЕЗ AI, токены не тратятся.
 *  3. Если разметки нет — фолбэк через gpt-4o-mini по очищенному тексту.
 *
 * Возвращает нормализованный рецепт и источник ("structured" | "ai"), чтобы
 * UI мог честно подсказать пользователю, насколько данным можно доверять.
 */
import type { ImportedRecipe, ImportSource } from "./types";
import { RecipeImportError } from "./types";
import { safeFetchHtml } from "./fetch-page";
import { extractRecipeFromJsonLd } from "./jsonld";
import { htmlToReadableText } from "./html-text";
import { extractRecipeWithLlm } from "./llm";

export type { ImportedRecipe, ImportSource } from "./types";
export { RecipeImportError } from "./types";
export type { ImportErrorCode } from "./types";

export interface ImportResult {
  recipe: ImportedRecipe;
  source: ImportSource;
}

/** Бросает ошибку, если HTML не удалось декодировать (много U+FFFD). */
function assertReadable(html: string): void {
  const replacements = (html.match(/�/g) || []).length;
  if (replacements > 50 || replacements > html.length * 0.02) {
    throw new RecipeImportError(
      "not_recipe",
      "Не удалось прочитать страницу — похоже, проблема кодировки сайта.",
    );
  }
}

export async function importRecipeFromUrl(url: string): Promise<ImportResult> {
  const html = await safeFetchHtml(url);

  // Защита от галлюцинаций: если в тексте слишком много символов-замен (U+FFFD),
  // значит декодирование не удалось (битая/неизвестная кодировка). НЕ парсим и
  // НЕ зовём AI — иначе модель «додумает» рецепт по мусору. Лучше честно сказать.
  assertReadable(html);

  // 1. Бесплатный путь — микроразметка.
  const structured = extractRecipeFromJsonLd(html);
  if (structured) {
    return { recipe: structured, source: "structured" };
  }

  // 2. AI-фолбэк — текст страницы → gpt-4o-mini.
  const text = htmlToReadableText(html);
  if (!text || text.length < 40) {
    // Пустая/JS-only страница — извлекать нечего.
    throw new RecipeImportError(
      "not_recipe",
      "Страница пустая или подгружает контент скриптами — рецепт не найден.",
    );
  }
  const recipe = await extractRecipeWithLlm(text);
  return { recipe, source: "ai" };
}
