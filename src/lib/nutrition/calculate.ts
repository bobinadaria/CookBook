/**
 * Оркестратор расчёта КБЖУ рецепта.
 *
 *   ingredients (text) → OpenAI parse →
 *     per-line: alias → exact → fuzzy → unmatched (с suggestions) →
 *     sum kcal/protein/fat/carbs → divide by servings → NutritionData
 *
 * Используется в /api/admin/calculate-nutrition и /api/recipes/calculate-nutrition.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  NutritionData,
  NutritionMatch,
  UnmatchedIngredient,
  SkippedIngredient,
  IngredientSuggestion,
} from "@/types";
import { parseIngredients } from "./parse";
import {
  loadAllIngredients,
  loadUserAliases,
  resolveAlias,
  exactMatch,
  fuzzyMatch,
  getTopSuggestions,
  type IngredientRow,
  type AliasResolution,
} from "./match";
import { estimateMacros, type EstimateResult } from "./estimate";
import { ingredientsHash } from "./ingredients-hash.mjs";

interface CalculateInput {
  ingredientsText: string;
  servings: number | null;
  supabase: SupabaseClient;
  /**
   * ID пользователя, для которого считаем — нужен чтобы подтянуть его
   * personal-алиасы. Null = только глобальные алиасы (например, при
   * пакетном recalc из админ-скрипта).
   */
  userId?: string | null;
  /**
   * Делать AI-оценку макросов для ненайденных ингредиентов (для UI-подсказки
   * «±N%»). Дефолт true; в скриптах массового recalc можно отключить, чтобы
   * не тратить OpenAI-запросы.
   */
  estimateUnmatched?: boolean;
}

export async function calculateNutrition({
  ingredientsText,
  servings,
  supabase,
  userId = null,
  estimateUnmatched = true,
}: CalculateInput): Promise<NutritionData> {
  // 1. Парсим текст через OpenAI
  const { ingredients: parsed, model } = await parseIngredients(ingredientsText);

  // 2. Загружаем ingredients_base + алиасы пользователя один раз
  const [index, aliases] = await Promise.all([
    loadAllIngredients(supabase),
    loadUserAliases(supabase, userId),
  ]);

  // 3. Для каждой строки — алиас → exact → fuzzy → unmatched
  const totals = { kcal: 0, protein: 0, fat: 0, carbs: 0, weight_g: 0 };
  const matched_weight_g = { value: 0 };
  const matches: NutritionMatch[] = [];
  const unmatchedRaw: Array<{
    original_text: string;
    parsed_name: string;
    quantity_g: number;
  }> = [];
  const skipped: SkippedIngredient[] = [];

  /** Записать сматченный ингредиент: суммируем макросы + пушим в matches. */
  const recordIngredient = (
    row: IngredientRow,
    grams: number,
    match_type: NutritionMatch["match_type"],
    similarity: number | null,
    parsed_name: string,
    input: string,
  ) => {
    const factor = grams / 100;
    const kcal = Number(row.kcal_100g) * factor;
    totals.kcal += kcal;
    totals.protein += Number(row.protein_100g) * factor;
    totals.fat += Number(row.fat_100g) * factor;
    totals.carbs += Number(row.carbs_100g) * factor;
    matched_weight_g.value += grams;
    matches.push({
      input,
      parsed_name,
      matched: row.name_ru,
      matched_id: row.id,
      grams,
      kcal: round(kcal),
      match_type,
      similarity,
    });
  };

  for (const p of parsed) {
    // Пропущенные парсером строки (заголовки, «по вкусу») — как и раньше.
    if (p.skipped || !p.name || p.grams == null) {
      matches.push({
        input: p.input,
        parsed_name: p.name,
        matched: null,
        grams: 0,
        kcal: null,
        match_type: "unknown",
        similarity: null,
      });
      continue;
    }

    const grams = p.grams;
    totals.weight_g += grams;

    // Кандидаты для матчинга: основное имя + «или»-альтернативы. Берём тот, что
    // реально находится в базе (приоритет: алиас → exact → лучший fuzzy по всем).
    // Пример: «100 г шиитаке или шампиньонов» → шиитаке нет, шампиньоны есть → берём их.
    const candidates = [p.name, ...(p.alternatives ?? [])].filter(
      (c): c is string => !!c && c.trim().length > 0,
    );

    // 3a. Алиас (explicit-решение) — самый ранний кандидат с алиасом побеждает.
    let aliasHit: { res: AliasResolution; name: string } | null = null;
    for (const c of candidates) {
      const a = resolveAlias(c, aliases, index);
      if (a) {
        aliasHit = { res: a, name: c };
        break;
      }
    }
    if (aliasHit?.res.type === "skip") {
      matches.push({
        input: p.input,
        parsed_name: aliasHit.name,
        matched: null,
        grams,
        kcal: null,
        match_type: "skipped",
        similarity: null,
      });
      skipped.push({ original_text: p.input, parsed_name: aliasHit.name, quantity_g: grams });
      continue;
    }
    if (aliasHit?.res.type === "ingredient") {
      recordIngredient(aliasHit.res.row, grams, "alias", null, aliasHit.name, p.input);
      continue;
    }
    if (aliasHit?.res.type === "ai_estimate") {
      const mm = aliasHit.res.macros;
      const factor = grams / 100;
      totals.kcal += mm.kcal_100g * factor;
      totals.protein += mm.protein_100g * factor;
      totals.fat += mm.fat_100g * factor;
      totals.carbs += mm.carbs_100g * factor;
      matched_weight_g.value += grams;
      matches.push({
        input: p.input,
        parsed_name: aliasHit.name,
        matched: aliasHit.res.name,
        grams,
        kcal: round(mm.kcal_100g * factor),
        match_type: "ai_estimate",
        similarity: null,
      });
      continue;
    }

    // 3b. Точный матч — самый ранний кандидат с exact.
    let exactHit: { row: IngredientRow; name: string } | null = null;
    for (const c of candidates) {
      const ex = exactMatch(c, index);
      if (ex) {
        exactHit = { row: ex, name: c };
        break;
      }
    }
    if (exactHit) {
      recordIngredient(exactHit.row, grams, "exact", null, exactHit.name, p.input);
      continue;
    }

    // 3c. Fuzzy — лучший по similarity среди ВСЕХ кандидатов (exact уже не нашёлся).
    let fuzzyHit: { row: IngredientRow; similarity: number; name: string } | null = null;
    for (const c of candidates) {
      const f = await fuzzyMatch(supabase, c);
      if (f && (!fuzzyHit || f.similarity > fuzzyHit.similarity)) {
        fuzzyHit = { row: f.row, similarity: f.similarity, name: c };
      }
    }
    if (fuzzyHit) {
      recordIngredient(fuzzyHit.row, grams, "fuzzy", fuzzyHit.similarity, fuzzyHit.name, p.input);
      continue;
    }

    // 3d. Совсем не нашли — unmatched (по основному имени).
    matches.push({
      input: p.input,
      parsed_name: p.name,
      matched: null,
      grams,
      kcal: null,
      match_type: "unknown",
      similarity: null,
    });
    unmatchedRaw.push({ original_text: p.input, parsed_name: p.name, quantity_g: grams });
  }

  // 4. Для unmatched — собираем top-3 кандидата и (опционально) AI-оценку макросов.
  const unmatched: UnmatchedIngredient[] = [];
  if (unmatchedRaw.length > 0) {
    // 4a. Top-3 кандидата для каждого имени (через одну RPC на каждое).
    const suggestionsForName = new Map<string, IngredientSuggestion[]>();
    for (const u of unmatchedRaw) {
      const candidates = await getTopSuggestions(supabase, u.parsed_name, 3, 0.2);
      suggestionsForName.set(
        u.parsed_name,
        candidates.map((c) => ({
          ingredient_id: c.id,
          name_ru: c.name_ru,
          name_en: c.name_en,
          category: c.category,
          similarity: c.similarity,
          kcal_100g: Number(c.kcal_100g),
          protein_100g: Number(c.protein_100g),
          fat_100g: Number(c.fat_100g),
          carbs_100g: Number(c.carbs_100g),
        })),
      );
    }

    // 4b. AI-оценка макросов всех ненайденных одним батчем — только для UI «±N%».
    const estimates: Map<string, EstimateResult> = estimateUnmatched
      ? await estimateMacros(unmatchedRaw.map((u) => u.parsed_name))
      : new Map();

    for (const u of unmatchedRaw) {
      const est = estimates.get(u.parsed_name);
      unmatched.push({
        original_text: u.original_text,
        parsed_name: u.parsed_name,
        quantity_g: u.quantity_g,
        suggestions: suggestionsForName.get(u.parsed_name) ?? [],
        estimate: est
          ? {
              kcal_100g: est.kcal_100g,
              protein_100g: est.protein_100g,
              fat_100g: est.fat_100g,
              carbs_100g: est.carbs_100g,
              source: "ai",
            }
          : undefined,
      });
    }
  }

  // 5. Confidence = доля сматченных грамм от всего рецепта.
  //    skipped тоже учитывается «как сматченное» — юзер сознательно решил.
  const totalAccounted =
    matched_weight_g.value +
    skipped.reduce((acc, s) => acc + s.quantity_g, 0);
  const confidence =
    totals.weight_g > 0 ? totalAccounted / totals.weight_g : 0;

  // 6. Делим на servings.
  const portions = servings && servings > 0 ? servings : 1;
  const per_serving = {
    kcal: round(totals.kcal / portions),
    protein: round(totals.protein / portions),
    fat: round(totals.fat / portions),
    carbs: round(totals.carbs / portions),
  };

  // 7. Warnings — старые для админ-UI + новый шорткат «осталось N ненайденных»
  const warnings = buildWarnings(matches, unmatched.length, confidence, servings);

  return {
    per_serving,
    total: {
      kcal: round(totals.kcal),
      protein: round(totals.protein),
      fat: round(totals.fat),
      carbs: round(totals.carbs),
      weight_g: round(totals.weight_g),
    },
    servings: portions,
    confidence: round(confidence, 2),
    warnings,
    ingredients: matches,
    unmatched: unmatched.length > 0 ? unmatched : undefined,
    skipped: skipped.length > 0 ? skipped : undefined,
    calculated_at: new Date().toISOString(),
    model,
    ingredients_hash: ingredientsHash(ingredientsText),
  };
}

function round(n: number, digits = 1): number {
  const m = 10 ** digits;
  return Math.round(n * m) / m;
}

function buildWarnings(
  matches: NutritionMatch[],
  unmatchedCount: number,
  confidence: number,
  servings: number | null,
): string[] {
  const w: string[] = [];

  if (unmatchedCount > 0) {
    const samples = matches
      .filter((m) => m.match_type === "unknown" && m.grams > 0)
      .map((m) => m.input)
      .slice(0, 3)
      .join("; ");
    w.push(
      `Не найдено в ingredients_base (${unmatchedCount}): ${samples}${
        unmatchedCount > 3 ? "…" : ""
      }`,
    );
  }

  const fuzzy = matches.filter((m) => m.match_type === "fuzzy");
  if (fuzzy.length > 0) {
    const sample = fuzzy
      .map((m) => `«${m.input}» → «${m.matched}»`)
      .slice(0, 3)
      .join(", ");
    w.push(`Fuzzy-матчей: ${fuzzy.length} (${sample}${fuzzy.length > 3 ? "…" : ""})`);
  }

  if (!servings || servings <= 0) {
    w.push("В рецепте не указано число порций (servings) — per_serving = total.");
  }

  if (confidence < 0.5) {
    w.push(
      `Низкая уверенность (${Math.round(confidence * 100)}%): большая часть рецепта не сматчена. Цифры могут быть сильно занижены.`,
    );
  } else if (confidence < 0.85) {
    w.push(
      `Средняя уверенность (${Math.round(confidence * 100)}%): часть ингредиентов не сматчена.`,
    );
  }

  return w;
}
