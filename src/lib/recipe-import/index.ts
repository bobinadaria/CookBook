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
import { ingredientsLookBare, mergeStructuredWithAi } from "./enrich";

export type { ImportedRecipe, ImportSource } from "./types";
export { RecipeImportError } from "./types";
export type { ImportErrorCode } from "./types";

export interface ImportResult {
  recipe: ImportedRecipe;
  source: ImportSource;
}

/**
 * Похоже ли это на анти-бот «бот»-заглушку «включите JavaScript».
 *
 * Проверяем по СЫРОМУ html (а не по очищенному тексту): фраза часто лежит в
 * <noscript>, который вычищается при htmlToReadableText. Признак заглушки —
 * крошечная страница (настоящие рецепты — десятки КБ), упоминающая JS вместе
 * с характерным словом-триггером. Пример (andychef): 950 байт с
 * «<noscript>Вам нужно включить поддержку js…</noscript>».
 */
function looksLikeJsGate(html: string): boolean {
  if (html.length > 5000) return false; // настоящая страница рецепта крупнее
  const s = html.toLowerCase();
  const mentionsJs = /javascript|\bjs\b/.test(s);
  const gateWord = /включ|enable|поддержк|requires?|noscript/.test(s);
  return mentionsJs && gateWord;
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

/**
 * Догон количеств для «голого» состава из микроразметки: прогоняет видимый
 * текст страницы через AI и сливает результат со «скелетом» разметки.
 * Возвращает null (а не бросает), если добор не удался — вызывающий код тогда
 * оставит надёжный «скелет» с именами без количеств.
 */
async function tryEnrichIngredients(
  structured: ImportedRecipe,
  html: string,
): Promise<ImportedRecipe | null> {
  const text = htmlToReadableText(html);
  if (!text || text.length < 40) return null;
  try {
    const ai = await extractRecipeWithLlm(text);
    // Берём состав от AI только если он реально добыл количества — иначе смысла
    // в подмене нет (и не выдаём source="ai" зря).
    if (ingredientsLookBare(ai.ingredients)) return null;
    return mergeStructuredWithAi(structured, ai);
  } catch {
    return null;
  }
}

export async function importRecipeFromUrl(url: string): Promise<ImportResult> {
  const html = await safeFetchHtml(url);

  // Защита от галлюцинаций: если в тексте слишком много символов-замен (U+FFFD),
  // значит декодирование не удалось (битая/неизвестная кодировка). НЕ парсим и
  // НЕ зовём AI — иначе модель «додумает» рецепт по мусору. Лучше честно сказать.
  assertReadable(html);

  // Анти-бот JS/cookie-заслонка (напр. andychef): сервер без выполнения JS
  // получает крошечную заглушку «включите JS» (часто внутри <noscript>). Это НЕ
  // «рецепт не найден» — сайт в принципе не отдаётся автоимпорту. Проверяем по
  // СЫРОМУ html и раньше всего, чтобы дать честное отдельное сообщение.
  if (looksLikeJsGate(html)) {
    throw new RecipeImportError(
      "js_blocked",
      "Сайт защищён от автоимпорта (требует JavaScript) — рецепт не получить автоматически.",
    );
  }

  // 1. Бесплатный путь — микроразметка.
  const structured = extractRecipeFromJsonLd(html);
  if (structured) {
    // Слепое пятно: часть сайтов (gastronom.ru и др.) кладёт в JSON-LD только
    // НАЗВАНИЯ ингредиентов, без количеств. Тогда добираем граммовку из видимого
    // текста через AI и сливаем со «скелетом» разметки. Если AI недоступен или
    // тоже не нашёл количеств — деградируем к именам (лучше частично, чем ошибка).
    if (ingredientsLookBare(structured.ingredients)) {
      const enriched = await tryEnrichIngredients(structured, html);
      if (enriched) return { recipe: enriched, source: "ai" };
    }
    return { recipe: structured, source: "structured" };
  }

  // 2. AI-фолбэк — текст страницы → gpt-4o-mini.
  const text = htmlToReadableText(html);
  if (!text || text.length < 40) {
    // Пустая / без читаемого текста страница — извлекать нечего.
    throw new RecipeImportError(
      "not_recipe",
      "Страница пустая или подгружает контент скриптами — рецепт не найден.",
    );
  }
  const recipe = await extractRecipeWithLlm(text);
  return { recipe, source: "ai" };
}
