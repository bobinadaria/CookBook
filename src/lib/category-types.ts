/**
 * Единый источник: какие типы категорий используются как фильтры и в каком порядке.
 *
 * Используется и публичным каталогом (recipes/page.tsx), и админ-пикером
 * категорий (CategoriesSection), чтобы таксономия не разъезжалась.
 *
 * Намеренно НЕ включены:
 *   - `meal_time` (Завтрак/Ужин) — дублировал «Тип блюда», убран из продукта
 *   - `category` (старый) — его пункты Вафли/Закуски/Заготовки перенесены в `meal_type`
 *
 * Если добавляешь новый тип фильтра — добавь его сюда (одно место).
 */
export const DISPLAYED_CATEGORY_TYPES = [
  "meal_type",
  "drink_type",
  "country",
  "season",
  "ingredient",
] as const;

export type DisplayedCategoryType = (typeof DISPLAYED_CATEGORY_TYPES)[number];

/** Типы категорий только для напитков (у еды скрыты). */
const DRINK_ONLY_CATEGORY_TYPES: readonly string[] = ["drink_type"];
/** Типы категорий только для еды (у напитков скрыты). */
const FOOD_ONLY_CATEGORY_TYPES: readonly string[] = ["meal_type"];

/**
 * Какие типы категорий показывать в админ-пикере для конкретного рецепта.
 * Напиток не видит «Тип блюда» (салаты/супы), еда не видит «Тип напитка».
 * Каталог НЕ использует этот фильтр — там видны все типы сразу.
 */
export function categoryTypesForRecipe(isDrink: boolean): readonly string[] {
  return DISPLAYED_CATEGORY_TYPES.filter((t) =>
    isDrink ? !FOOD_ONLY_CATEGORY_TYPES.includes(t) : !DRINK_ONLY_CATEGORY_TYPES.includes(t),
  );
}
