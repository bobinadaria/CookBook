/**
 * Матч названия ингредиента (как его выдал OpenAI-парсер) против ingredients_base.
 *
 * Стратегия:
 *   1. Точный матч по lowercase(name_ru) — O(1) через Map.
 *   2. Если не нашли — pg_trgm-функция match_ingredient() в Postgres
 *      (см. scripts/migration-nutrition-fuzzy-match.sql).
 *
 * Используется в calculate.ts.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export interface IngredientRow {
  id: string;
  name_ru: string;
  name_en: string;
  kcal_100g: number;
  protein_100g: number;
  fat_100g: number;
  carbs_100g: number;
  category: string | null;
}

export interface MatchResult {
  row: IngredientRow;
  match_type: "exact" | "fuzzy";
  similarity: number | null;
}

/**
 * Нормализация ключа для exact-матча: lowercase + trim + ё→е.
 * Юзеры (и OpenAI) часто пишут «мед» вместо «мёд», «свекла» вместо «свёкла».
 * Без ё→е такие 3-буквенные слова не ловятся даже fuzzy (similarity < 0.3).
 */
function normalizeKey(s: string): string {
  return s.toLowerCase().trim().replace(/ё/g, "е");
}

/** Загружает все строки ingredients_base. Кэшировать в RAM на время одного запроса. */
export async function loadAllIngredients(
  supabase: SupabaseClient,
): Promise<Map<string, IngredientRow>> {
  const { data, error } = await supabase
    .from("ingredients_base")
    .select(
      "id, name_ru, name_en, kcal_100g, protein_100g, fat_100g, carbs_100g, category",
    );
  if (error) {
    throw new Error(`Не удалось загрузить ingredients_base: ${error.message}`);
  }

  const map = new Map<string, IngredientRow>();
  for (const row of data ?? []) {
    map.set(normalizeKey(row.name_ru as string), row as IngredientRow);
  }
  return map;
}

/**
 * Точный матч по нормализованному ключу (lowercase + ё→е). Null если не нашли.
 * Pure-function, не дёргает БД.
 */
export function exactMatch(
  query: string,
  index: Map<string, IngredientRow>,
): IngredientRow | null {
  return index.get(normalizeKey(query)) ?? null;
}

/**
 * Fuzzy-матч через PG-функцию match_ingredient (pg_trgm).
 * Возвращает null если similarity < threshold.
 */
export async function fuzzyMatch(
  supabase: SupabaseClient,
  query: string,
  threshold = 0.3,
): Promise<{ row: IngredientRow; similarity: number } | null> {
  const { data, error } = await supabase.rpc("match_ingredient", {
    query,
    threshold,
  });
  if (error) {
    throw new Error(`match_ingredient RPC failed: ${error.message}`);
  }
  if (!data || data.length === 0) return null;

  const r = data[0] as IngredientRow & { similarity: number };
  return {
    row: {
      id: r.id,
      name_ru: r.name_ru,
      name_en: r.name_en,
      kcal_100g: r.kcal_100g,
      protein_100g: r.protein_100g,
      fat_100g: r.fat_100g,
      carbs_100g: r.carbs_100g,
      category: r.category ?? null,
    },
    similarity: r.similarity,
  };
}

/**
 * Точка входа: exact → fuzzy → null.
 */
export async function matchIngredient(
  supabase: SupabaseClient,
  query: string,
  index: Map<string, IngredientRow>,
): Promise<MatchResult | null> {
  const exact = exactMatch(query, index);
  if (exact) {
    return { row: exact, match_type: "exact", similarity: null };
  }
  const fuzzy = await fuzzyMatch(supabase, query);
  if (fuzzy) {
    return { row: fuzzy.row, match_type: "fuzzy", similarity: fuzzy.similarity };
  }
  return null;
}
