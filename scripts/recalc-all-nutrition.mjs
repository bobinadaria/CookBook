/**
 * Массовый пересчёт КБЖУ для ВСЕХ опубликованных рецептов + запись в БД.
 *
 * Делает ровно то же, что кнопка «Рассчитать КБЖУ» в админке (тот же промпт,
 * та же логика матчинга и confidence, тот же формат NutritionData), но разом
 * по всем рецептам — чтобы не кликать вручную 22 раза.
 *
 * Логика синхронизирована с src/lib/nutrition/{parse,match,calculate}.ts.
 *
 * Use:
 *   node scripts/recalc-all-nutrition.mjs              # dry-run, только покажет
 *   node scripts/recalc-all-nutrition.mjs --write      # реально записать в БД
 *   node scripts/recalc-all-nutrition.mjs --write --limit 3   # первые 3 (для теста)
 */
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { config } from "dotenv";
import { resolve } from "path";
import {
  NUTRITION_SYSTEM_PROMPT,
  NUTRITION_SCHEMA,
  NUTRITION_MODEL,
} from "../src/lib/nutrition/prompt.mjs";
import { ingredientsHash } from "../src/lib/nutrition/ingredients-hash.mjs";

config({ path: resolve(".env.local") });

const apply = process.argv.includes("--write");
const limitArg = process.argv.indexOf("--limit");
const limit = limitArg !== -1 ? parseInt(process.argv[limitArg + 1], 10) : Infinity;
const offsetArg = process.argv.indexOf("--offset");
const offset = offsetArg !== -1 ? parseInt(process.argv[offsetArg + 1], 10) : 0;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) { console.error("✗ Supabase env missing"); process.exit(1); }
if (!OPENAI_KEY) { console.error("✗ OPENAI_API_KEY missing"); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_KEY });
const MODEL = NUTRITION_MODEL;

async function parseIngredients(text) {
  const r = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: NUTRITION_SYSTEM_PROMPT },
      { role: "user", content: text },
    ],
    response_format: { type: "json_schema", json_schema: { name: "parsed", strict: true, schema: NUTRITION_SCHEMA } },
    temperature: 0,
  });
  return JSON.parse(r.choices[0].message.content).ingredients;
}

// ── Матчинг (exact Map + pg_trgm RPC) ─────────────────────────────────────────
const normalizeKey = (s) => s.toLowerCase().trim().replace(/ё/g, "е");

async function loadIndex() {
  const { data, error } = await supabase
    .from("ingredients_base")
    .select("id, name_ru, name_en, kcal_100g, protein_100g, fat_100g, carbs_100g, category");
  if (error) throw error;
  const map = new Map();
  for (const r of data) map.set(normalizeKey(r.name_ru), r);
  return map;
}
async function fuzzyMatch(query) {
  const { data, error } = await supabase.rpc("match_ingredient", { query, threshold: 0.3 });
  if (error) throw new Error(`match_ingredient RPC: ${error.message}`);
  return data && data.length ? data[0] : null;
}
async function matchIngredient(query, index) {
  const exact = index.get(normalizeKey(query));
  if (exact) return { row: exact, match_type: "exact", similarity: null };
  const f = await fuzzyMatch(query);
  if (f) return { row: f, match_type: "fuzzy", similarity: f.similarity };
  return null;
}

const round = (n, d = 1) => { const m = 10 ** d; return Math.round(n * m) / m; };

// ── Расчёт (зеркало src/lib/nutrition/calculate.ts) ───────────────────────────
async function calculate(text, servings) {
  const parsed = await parseIngredients(text);
  const index = await loadIndex();

  const totals = { kcal: 0, protein: 0, fat: 0, carbs: 0, weight_g: 0 };
  let matchedWeight = 0;
  const matches = [];

  for (const p of parsed) {
    if (p.skipped || !p.name || p.grams == null) {
      matches.push({ input: p.input, matched: null, grams: 0, kcal: null, match_type: "unknown", similarity: null });
      continue;
    }
    totals.weight_g += p.grams;
    const m = await matchIngredient(p.name, index);
    if (!m) {
      matches.push({ input: p.input, matched: null, grams: p.grams, kcal: null, match_type: "unknown", similarity: null });
      continue;
    }
    const f = p.grams / 100;
    const kcal = +m.row.kcal_100g * f;
    totals.kcal += kcal;
    totals.protein += +m.row.protein_100g * f;
    totals.fat += +m.row.fat_100g * f;
    totals.carbs += +m.row.carbs_100g * f;
    matchedWeight += p.grams;
    matches.push({ input: p.input, matched: m.row.name_ru, grams: p.grams, kcal: round(kcal), match_type: m.match_type, similarity: m.similarity });
  }

  const portions = servings && servings > 0 ? servings : 1;
  const confidence = totals.weight_g > 0 ? matchedWeight / totals.weight_g : 0;

  // warnings (как в calculate.ts)
  const warnings = [];
  const unknown = matches.filter((m) => m.match_type === "unknown" && m.grams > 0).map((m) => m.input);
  if (unknown.length) warnings.push(`Не найдено в ingredients_base (${unknown.length}): ${unknown.join("; ")}`);
  const fuzzy = matches.filter((m) => m.match_type === "fuzzy");
  if (fuzzy.length) {
    const sample = fuzzy.map((m) => `«${m.input}» → «${m.matched}»`).slice(0, 3).join(", ");
    warnings.push(`Fuzzy-матчей: ${fuzzy.length} (${sample}${fuzzy.length > 3 ? "…" : ""})`);
  }
  if (!servings || servings <= 0) warnings.push("В рецепте не указано число порций (servings) — per_serving = total.");
  if (confidence < 0.5) warnings.push(`Низкая уверенность (${Math.round(confidence * 100)}%): большая часть рецепта не сматчена.`);
  else if (confidence < 0.85) warnings.push(`Средняя уверенность (${Math.round(confidence * 100)}%): часть ингредиентов не сматчена.`);

  return {
    per_serving: {
      kcal: round(totals.kcal / portions),
      protein: round(totals.protein / portions),
      fat: round(totals.fat / portions),
      carbs: round(totals.carbs / portions),
    },
    total: {
      kcal: round(totals.kcal), protein: round(totals.protein),
      fat: round(totals.fat), carbs: round(totals.carbs), weight_g: round(totals.weight_g),
    },
    servings: portions,
    confidence: round(confidence, 2),
    warnings,
    ingredients: matches,
    calculated_at: new Date().toISOString(),
    model: MODEL,
    ingredients_hash: ingredientsHash(text),
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
const { data: recipes, error } = await supabase
  .from("recipes")
  .select("id, slug, title, ingredients, servings")
  .eq("published", true)
  .not("ingredients", "is", null)
  .order("title");
if (error) { console.error(error); process.exit(1); }

const todo = recipes.slice(offset, offset === 0 && limit === Infinity ? undefined : offset + limit);
console.log(`\nMode: ${apply ? "WRITE (запись в БД)" : "DRY-RUN"}  |  рецептов: ${todo.length} (offset ${offset})\n`);

let ok = 0, failed = 0;
const lowConf = [];

for (const r of todo) {
  try {
    const n = await calculate(r.ingredients, r.servings);
    const pct = Math.round(n.confidence * 100);
    const flag = pct >= 85 ? "✓" : pct >= 50 ? "~" : "✗";
    console.log(
      `  ${flag} ${pct.toString().padStart(3)}%  ${r.title.slice(0, 48).padEnd(50)} ` +
        `${n.per_serving.kcal} ккал/порц (${n.servings}п)`,
    );
    if (n.warnings.some((w) => w.startsWith("Не найдено"))) {
      const wn = n.warnings.find((w) => w.startsWith("Не найдено"));
      console.log(`        ${wn}`);
    }
    if (pct < 85) lowConf.push({ title: r.title, pct });

    if (apply) {
      const { error: upd } = await supabase
        .from("recipes")
        .update({ nutrition: n, updated_at: new Date().toISOString() })
        .eq("id", r.id);
      if (upd) throw new Error(`DB write: ${upd.message}`);
    }
    ok++;
  } catch (err) {
    console.log(`  ✗ ERR  ${r.title}: ${err.message}`);
    failed++;
  }
}

console.log(`\nГотово: ${ok} успешно, ${failed} с ошибками.`);
if (lowConf.length) {
  console.log(`\nС уверенностью < 85% (${lowConf.length}):`);
  lowConf.sort((a, b) => a.pct - b.pct).forEach((r) => console.log(`  ${r.pct}%  ${r.title}`));
}
if (!apply) console.log(`\nЭто DRY-RUN. Для записи в БД добавь флаг --write\n`);
else console.log(`\n✓ Все nutrition записаны в recipes.nutrition\n`);
