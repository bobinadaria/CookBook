/**
 * calc-nutrition-one.mjs — точечный расчёт КБЖУ для одного рецепта
 * (по slug или id). Логика 1:1 повторяет recalc-all-nutrition.mjs /
 * src/lib/nutrition/{parse,match,calculate}.ts, но не молотит весь каталог.
 *
 *   node scripts/calc-nutrition-one.mjs --slug ikra-kabachkovaya            # dry-run
 *   node scripts/calc-nutrition-one.mjs --slug ikra-kabachkovaya --write    # запись
 *   node scripts/calc-nutrition-one.mjs --id <uuid> --write
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
const idx = (k) => process.argv.indexOf(k);
const slug = idx("--slug") !== -1 ? process.argv[idx("--slug") + 1] : null;
const id = idx("--id") !== -1 ? process.argv[idx("--id") + 1] : null;
if (!slug && !id) { console.error("✗ передай --slug <slug> или --id <uuid>"); process.exit(1); }

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const round = (n, d = 1) => { const m = 10 ** d; return Math.round(n * m) / m; };
const normalizeKey = (s) => s.toLowerCase().trim().replace(/ё/g, "е");

async function parseIngredients(text) {
  const r = await openai.chat.completions.create({
    model: NUTRITION_MODEL,
    messages: [
      { role: "system", content: NUTRITION_SYSTEM_PROMPT },
      { role: "user", content: text },
    ],
    response_format: { type: "json_schema", json_schema: { name: "parsed", strict: true, schema: NUTRITION_SCHEMA } },
    temperature: 0,
  });
  return JSON.parse(r.choices[0].message.content).ingredients;
}

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
    per_serving: { kcal: round(totals.kcal / portions), protein: round(totals.protein / portions), fat: round(totals.fat / portions), carbs: round(totals.carbs / portions) },
    total: { kcal: round(totals.kcal), protein: round(totals.protein), fat: round(totals.fat), carbs: round(totals.carbs), weight_g: round(totals.weight_g) },
    servings: portions,
    confidence: round(confidence, 2),
    warnings,
    ingredients: matches,
    calculated_at: new Date().toISOString(),
    model: NUTRITION_MODEL,
    ingredients_hash: ingredientsHash(text),
  };
}

const q = supabase.from("recipes").select("id, slug, title, ingredients, servings");
const { data: recipe, error } = await (id ? q.eq("id", id) : q.eq("slug", slug)).single();
if (error || !recipe) { console.error("✗ рецепт не найден:", error?.message); process.exit(1); }

console.log(`\n«${recipe.title}» (${recipe.slug}, ${recipe.servings} порц)\n`);
console.log("── ingredients ──");
console.log(recipe.ingredients);
console.log("\n── расчёт ──");

const n = await calculate(recipe.ingredients, recipe.servings);
console.log(`per serving: ${n.per_serving.kcal} ккал · Б ${n.per_serving.protein}г · Ж ${n.per_serving.fat}г · У ${n.per_serving.carbs}г`);
console.log(`total:       ${n.total.kcal} ккал · Б ${n.total.protein}г · Ж ${n.total.fat}г · У ${n.total.carbs}г  (вес ~${n.total.weight_g}г, ${n.servings} порц)`);
console.log(`confidence:  ${Math.round(n.confidence * 100)}%`);

console.log("\n── разбор ингредиентов ──");
for (const m of n.ingredients) {
  const flag = m.match_type === "exact" ? "✓" : m.match_type === "fuzzy" ? "~" : "✗";
  const sim = m.similarity != null ? ` (sim ${m.similarity})` : "";
  console.log(`  ${flag} ${(m.input || "").padEnd(48)} → ${m.matched ?? "—"}${sim}  ${m.grams}г`);
}
if (n.warnings.length) {
  console.log("\n── warnings ──");
  for (const w of n.warnings) console.log(`  ⚠ ${w}`);
}

if (!apply) {
  console.log("\nDRY-RUN. Перезапусти с --write, чтобы записать nutrition в БД.");
} else {
  const { error: upd } = await supabase
    .from("recipes")
    .update({ nutrition: n, updated_at: new Date().toISOString() })
    .eq("id", recipe.id);
  if (upd) { console.error("✗ DB write:", upd.message); process.exit(1); }
  console.log("\n✅ recipes.nutrition обновлён");
}
