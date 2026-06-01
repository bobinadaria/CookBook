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
  match_type: "exact" | "fuzzy" | "alias";
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
 * Запись из ingredient_aliases. Три варианта:
 *   - canonical_id задан → обычная замена на запись в ingredients_base
 *   - is_skip=true → пользователь явно сказал «не считать»
 *   - ai_estimate задан → AI-оценка макросов (приблизительно, без USDA)
 */
export interface AliasRow {
  alias_text: string;
  canonical_id: string | null;
  is_skip: boolean;
  ai_estimate?: {
    kcal_100g: number;
    protein_100g: number;
    fat_100g: number;
    carbs_100g: number;
  } | null;
}

/**
 * Resolved alias после поиска: либо ссылка на ingredients_base,
 * либо «пропустить», либо AI-оценка макросов.
 */
export type AliasResolution =
  | { type: "ingredient"; row: IngredientRow }
  | { type: "skip" }
  | { type: "ai_estimate"; macros: { kcal_100g: number; protein_100g: number; fat_100g: number; carbs_100g: number }; name: string };

/**
 * Загружает алиасы пользователя + глобальные в Map по нормализованному ключу.
 * При коллизии user-алиас побеждает глобальный (даём приоритет личному выбору).
 *
 * Если userId == null — грузим только глобальные (для админских пересчётов).
 */
export async function loadUserAliases(
  supabase: SupabaseClient,
  userId: string | null,
): Promise<Map<string, AliasRow>> {
  // 1. Глобальные алиасы
  const map = new Map<string, AliasRow>();
  const { data: globals, error: globalsError } = await supabase
    .from("ingredient_aliases")
    .select("alias_text, canonical_id, is_skip, ai_estimate")
    .is("user_id", null);
  if (globalsError) {
    // Таблицы может ещё не быть до миграции — не валим расчёт.
    console.warn(`[loadUserAliases] globals: ${globalsError.message}`);
    return map;
  }
  for (const row of globals ?? []) {
    map.set(normalizeKey(row.alias_text as string), row as AliasRow);
  }

  // 2. Личные алиасы пользователя (приоритет — перезаписывают глобальные).
  if (userId) {
    const { data: own, error: ownError } = await supabase
      .from("ingredient_aliases")
      .select("alias_text, canonical_id, is_skip, ai_estimate")
      .eq("user_id", userId);
    if (ownError) {
      console.warn(`[loadUserAliases] own: ${ownError.message}`);
    } else {
      for (const row of own ?? []) {
        map.set(normalizeKey(row.alias_text as string), row as AliasRow);
      }
    }
  }

  return map;
}

/**
 * Резолвит alias по запросу. Возвращает либо ссылку на ingredient row,
 * либо «skip», либо null (нет алиаса).
 */
export function resolveAlias(
  query: string,
  aliases: Map<string, AliasRow>,
  index: Map<string, IngredientRow>,
): AliasResolution | null {
  const alias = aliases.get(normalizeKey(query));
  if (!alias) return null;
  if (alias.is_skip) return { type: "skip" };

  // AI-оценка: canonical_id отсутствует, но есть ai_estimate с макросами.
  if (!alias.canonical_id && alias.ai_estimate) {
    return {
      type: "ai_estimate",
      name: alias.alias_text,
      macros: alias.ai_estimate,
    };
  }

  if (!alias.canonical_id) return null;
  // Найти ingredient row по id. Array.from вместо values() — совместимость с
  // tsconfig target (без --downlevelIteration).
  const rows = Array.from(index.values());
  for (const row of rows) {
    if (row.id === alias.canonical_id) {
      return { type: "ingredient", row };
    }
  }
  return null; // canonical_id указывает на удалённый ингредиент — игнорируем
}

/**
 * Top-N кандидатов по similarity. Используется для блока «не нашли в базе»
 * на UI — показываем юзеру 0..3 возможных замен.
 *
 * Дефолтный threshold ниже, чем в fuzzyMatch — мы намеренно показываем более
 * слабые варианты как подсказки (юзер сам решает, годится ли).
 */
export async function getTopSuggestions(
  supabase: SupabaseClient,
  query: string,
  topN = 3,
  threshold = 0.2,
): Promise<Array<IngredientRow & { similarity: number }>> {
  const { data, error } = await supabase.rpc("match_ingredient_top_n", {
    query,
    top_n: topN,
    threshold,
  });
  if (error) {
    console.warn(`[getTopSuggestions] ${error.message}`);
    return [];
  }
  return (data ?? []) as Array<IngredientRow & { similarity: number }>;
}

/**
 * Точка входа: exact → fuzzy → null. (Алиасы проверяются ОТДЕЛЬНО до этого
 * вызова в calculate.ts — там есть доступ к userId и aliases-Map.)
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
