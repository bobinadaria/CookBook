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
  "country",
  "season",
  "ingredient",
] as const;

export type DisplayedCategoryType = (typeof DISPLAYED_CATEGORY_TYPES)[number];
