/**
 * Оркестратор расчёта КБЖУ рецепта.
 *
 *   ingredients (text) → OpenAI parse → match against ingredients_base →
 *     sum kcal/protein/fat/carbs → divide by servings → NutritionData
 *
 * Используется в /api/admin/calculate-nutrition.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { NutritionData, NutritionMatch } from "@/types";
import { parseIngredients } from "./parse";
import { loadAllIngredients, matchIngredient } from "./match";

interface CalculateInput {
  ingredientsText: string;
  servings: number | null;
  supabase: SupabaseClient;
}

export async function calculateNutrition({
  ingredientsText,
  servings,
  supabase,
}: CalculateInput): Promise<NutritionData> {
  // 1. Парсим текст через OpenAI
  const { ingredients: parsed, model } = await parseIngredients(ingredientsText);

  // 2. Загружаем ingredients_base один раз
  const index = await loadAllIngredients(supabase);

  // 3. Для каждой строки — матчим и считаем вклад в total
  const totals = { kcal: 0, protein: 0, fat: 0, carbs: 0, weight_g: 0 };
  const matched_weight_g = { value: 0 }; // только сматченные — для confidence
  const matches: NutritionMatch[] = [];

  for (const p of parsed) {
    // Пропущенные строки (заголовки, «по вкусу») всё равно показываем в UI
    if (p.skipped || !p.name || p.grams == null) {
      matches.push({
        input: p.input,
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

    const m = await matchIngredient(supabase, p.name, index);
    if (!m) {
      matches.push({
        input: p.input,
        matched: null,
        grams,
        kcal: null,
        match_type: "unknown",
        similarity: null,
      });
      continue;
    }

    const factor = grams / 100; // values хранятся per-100g
    const kcal = Number(m.row.kcal_100g) * factor;
    const protein = Number(m.row.protein_100g) * factor;
    const fat = Number(m.row.fat_100g) * factor;
    const carbs = Number(m.row.carbs_100g) * factor;

    totals.kcal += kcal;
    totals.protein += protein;
    totals.fat += fat;
    totals.carbs += carbs;
    matched_weight_g.value += grams;

    matches.push({
      input: p.input,
      matched: m.row.name_ru,
      grams,
      kcal: round(kcal),
      match_type: m.match_type,
      similarity: m.similarity,
    });
  }

  // 4. Confidence = доля сматченных грамм от всего рецепта.
  //    Если рецепт состоит из одних «по вкусу» (totals.weight_g == 0) — 0.
  const confidence =
    totals.weight_g > 0 ? matched_weight_g.value / totals.weight_g : 0;

  // 5. Делим на servings, если есть. Иначе per_serving == total.
  const portions = servings && servings > 0 ? servings : 1;
  const per_serving = {
    kcal: round(totals.kcal / portions),
    protein: round(totals.protein / portions),
    fat: round(totals.fat / portions),
    carbs: round(totals.carbs / portions),
  };

  // 6. Warnings для UI
  const warnings = buildWarnings(matches, confidence, servings);

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
    calculated_at: new Date().toISOString(),
    model,
  };
}

function round(n: number, digits = 1): number {
  const m = 10 ** digits;
  return Math.round(n * m) / m;
}

function buildWarnings(
  matches: NutritionMatch[],
  confidence: number,
  servings: number | null,
): string[] {
  const w: string[] = [];

  const unknown = matches
    .filter((m) => m.match_type === "unknown" && m.grams > 0)
    .map((m) => m.input);
  if (unknown.length > 0) {
    w.push(
      `Не найдено в ingredients_base (${unknown.length}): ${unknown.join("; ")}`,
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
