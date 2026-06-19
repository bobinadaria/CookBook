/**
 * Импорт рецепта по ссылке — общие типы.
 *
 * Premium-фича: пользователь вставляет URL страницы рецепта, и форма создания
 * заполняется автоматически. Два пути извлечения (см. ./index.ts):
 *  - "structured" — из микроразметки schema.org/Recipe (JSON-LD). БЕЗ обращения
 *    к AI, токены НЕ тратятся.
 *  - "ai" — фолбэк через gpt-4o-mini, когда разметки на странице нет. Тратит
 *    токены (одна страница ≈ доли цента).
 *
 * Нормализованный результат `ImportedRecipe` совместим по форме с
 * `UserRecipeFormDefaults` (см. components/dashboard/UserRecipeForm.tsx): форма
 * раскладывает его поля по состоянию. Обложка/фото шагов НЕ импортируются
 * (next/image отдаёт только разрешённые домены, плюс копирайт на чужие фото) —
 * их пользователь добавляет вручную.
 */

/** Один шаг приготовления из импортированного рецепта. */
export interface ImportStep {
  /** Заголовок шага (если у источника он есть; иначе пусто). */
  title: string;
  /** Текст шага. */
  description: string;
}

/** Нормализованный рецепт, готовый к подстановке в форму создания. */
export interface ImportedRecipe {
  title: string;
  description: string;
  /** Каждый ингредиент — отдельная строка (форма ждёт «один на строку»). */
  ingredients: string[];
  steps: ImportStep[];
  /** Время приготовления в минутах (или null). */
  cook_time: number | null;
  /** Число порций (или null). */
  servings: number | null;
  /** «Еда» по умолчанию; «напиток» — если источник явно про напиток. */
  recipe_type: "food" | "drink";
}

/** Откуда удалось извлечь рецепт. */
export type ImportSource = "structured" | "ai";

/** Коды ошибок импорта — форма мапит их в локализованные сообщения. */
export type ImportErrorCode =
  | "bad_url" // некорректная/неподдерживаемая ссылка
  | "blocked" // адрес заблокирован (приватная сеть / SSRF-guard)
  | "unreachable" // не удалось открыть сайт (DNS/сеть/HTTP-ошибка/не HTML)
  | "timeout" // сайт слишком долго отвечал
  | "js_blocked" // анти-бот JS/cookie-заслонка: сайт не отдаётся серверному запросу
  | "not_recipe" // страницу открыли, но рецепт не нашли
  | "ai_failed"; // фолбэк-извлечение через AI упало

/** Ошибка импорта с машиночитаемым кодом (для локализации в UI). */
export class RecipeImportError extends Error {
  code: ImportErrorCode;
  constructor(code: ImportErrorCode, message: string) {
    super(message);
    this.name = "RecipeImportError";
    this.code = code;
  }
}
