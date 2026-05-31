/**
 * Догон состава, когда микроразметка отдала «голые» ингредиенты.
 *
 * Болезнь части сайтов (gastronom.ru и др.): в JSON-LD `recipeIngredient`
 * лежат ТОЛЬКО названия продуктов («Говядина на кости», «Картофель»), а
 * количества («1.5 кг», «800 г») живут отдельно — в интерактивном виджете
 * порций, которого в разметке нет. Путь structured «успешно» возвращает состав
 * без граммовки и не уступает место AI-фолбэку — количества теряются.
 *
 * Решение (гибрид): надёжный «скелет» (заголовок, шаги, время, порции, тип)
 * берём из микроразметки, а состав с количествами добираем из видимого текста
 * страницы через AI и сливаем. Эти функции — чистые (без сети/AI), чтобы их
 * можно было покрыть тестами; сам AI-вызов и фолбэк оркеструются в ./index.ts.
 */
import type { ImportedRecipe } from "./types";

/**
 * Эвристика «состав без количеств»: считаем долю строк, в которых есть цифра
 * (= указано количество). Если цифр почти нет — состав «голый» и его стоит
 * добрать через AI.
 *
 * Пороги подобраны так, чтобы НЕ дёргать AI зря:
 *  - меньше 3 ингредиентов — слишком мало данных, не трогаем;
 *  - «по вкусу»-строки без цифр («Соль», «Перец») допустимы — поэтому
 *    срабатываем только когда цифры есть менее чем у четверти строк.
 */
export function ingredientsLookBare(ingredients: string[]): boolean {
  if (ingredients.length < 3) return false;
  const withDigit = ingredients.filter((s) => /\d/.test(s)).length;
  return withDigit / ingredients.length < 0.25;
}

/**
 * Сливает «скелет» из микроразметки с составом, разобранным AI из текста.
 *
 * Состав берём от AI (там количества); всё остальное — приоритет надёжной
 * микроразметки, пробелы добиваем значениями от AI. Тип рецепта оставляем как
 * определила разметка (эвристика по @type/категориям точнее болтовни модели).
 */
export function mergeStructuredWithAi(
  structured: ImportedRecipe,
  ai: ImportedRecipe,
): ImportedRecipe {
  return {
    title: structured.title || ai.title,
    description: structured.description || ai.description,
    ingredients: ai.ingredients.length ? ai.ingredients : structured.ingredients,
    steps: structured.steps.length ? structured.steps : ai.steps,
    cook_time: structured.cook_time ?? ai.cook_time,
    servings: structured.servings ?? ai.servings,
    recipe_type: structured.recipe_type,
  };
}
