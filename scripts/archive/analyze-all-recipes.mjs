/**
 * Диагностика КБЖУ-калькулятора по ВСЕМ опубликованным рецептам.
 *
 * Для каждого рецепта: парсит ингредиенты (OpenAI) → матчит с ingredients_base
 * (exact + pg_trgm). Собирает:
 *   - unknown: что вообще не нашлось (с граммами — чтобы видеть вес-импакт)
 *   - fuzzy: матчи через trigram (особенно подозрительные с low similarity)
 * Ранжирует по частоте, чтобы понять что добавить в базу в первую очередь.
 *
 * Read-only — ничего не пишет. Run: node scripts/analyze-all-recipes.mjs
 */
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `Ты — парсер ингредиентов из русских кулинарных рецептов.
Для каждой строки верни JSON: input (исходная строка), name (нормализованное название в им.падеже ед.ч. lowercase без прилагательных), grams (число грамм, конвертируй ст.л/ч.л/шт/пучки/зубчики сам), skipped (true для заголовков секций и «соль/перец по вкусу»), skip_reason.
Пропускай заголовки «— Для X —» и «соль/перец по вкусу» без количества. Если у соли указано количество — name="соль", не пропускай.`;

async function parse(text) {
  const r = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: text },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "parsed",
        strict: true,
        schema: {
          type: "object",
          properties: {
            ingredients: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  input: { type: "string" },
                  name: { type: ["string", "null"] },
                  grams: { type: ["number", "null"] },
                  skipped: { type: "boolean" },
                  skip_reason: { type: ["string", "null"] },
                },
                required: ["input", "name", "grams", "skipped", "skip_reason"],
                additionalProperties: false,
              },
            },
          },
          required: ["ingredients"],
          additionalProperties: false,
        },
      },
    },
    temperature: 0,
  });
  return JSON.parse(r.choices[0].message.content).ingredients;
}

async function loadIndex() {
  const { data } = await supabase.from("ingredients_base").select("name_ru");
  return new Set(data.map((r) => r.name_ru.toLowerCase().trim()));
}

async function fuzzy(query) {
  const { data } = await supabase.rpc("match_ingredient", { query, threshold: 0.3 });
  return data && data.length ? data[0] : null;
}

const index = await loadIndex();
const { data: recipes } = await supabase
  .from("recipes")
  .select("slug, title, ingredients, servings")
  .eq("published", true)
  .not("ingredients", "is", null);

const unknownFreq = new Map();   // name → { count, recipes:Set, grams:[] }
const fuzzyFreq = new Map();     // "name→matched" → { count, sim, recipes:Set }
const lowConf = [];              // рецепты с низкой уверенностью

console.log(`\nАнализирую ${recipes.length} рецептов...\n`);

for (const r of recipes) {
  const parsed = await parse(r.ingredients);
  let totalG = 0, matchedG = 0;
  const recUnknown = [];

  for (const p of parsed) {
    if (p.skipped || !p.name || p.grams == null) continue;
    totalG += p.grams;
    const key = p.name.toLowerCase().trim();

    if (index.has(key)) { matchedG += p.grams; continue; }

    const f = await fuzzy(p.name);
    if (f) {
      matchedG += p.grams;
      const fk = `${p.name} → ${f.name_ru}`;
      const e = fuzzyFreq.get(fk) ?? { count: 0, sim: f.similarity, recipes: new Set() };
      e.count++; e.recipes.add(r.slug); e.sim = f.similarity;
      fuzzyFreq.set(fk, e);
    } else {
      recUnknown.push(`${p.input} (~${p.grams}г)`);
      const e = unknownFreq.get(key) ?? { count: 0, recipes: new Set(), grams: 0 };
      e.count++; e.recipes.add(r.slug); e.grams += p.grams;
      unknownFreq.set(key, e);
    }
  }

  const conf = totalG > 0 ? matchedG / totalG : 0;
  if (conf < 0.85) lowConf.push({ slug: r.slug, conf, unknown: recUnknown });
}

console.log("═".repeat(70));
console.log("UNKNOWN — не нашлось вообще (ранжир по частоте):");
console.log("═".repeat(70));
[...unknownFreq.entries()].sort((a, b) => b[1].count - a[1].count).forEach(([name, e]) => {
  console.log(`  ${String(e.count).padStart(2)}× «${name}»  (${Math.round(e.grams)}г суммарно, рецепты: ${e.recipes.size})`);
});

console.log("\n" + "═".repeat(70));
console.log("FUZZY — матчи через trigram (проверь подозрительные!):");
console.log("═".repeat(70));
[...fuzzyFreq.entries()].sort((a, b) => a[1].sim - b[1].sim).forEach(([k, e]) => {
  const flag = e.sim < 0.45 ? " ⚠️ low" : "";
  console.log(`  sim ${e.sim.toFixed(2)}${flag}  ${e.count}× «${k}»`);
});

console.log("\n" + "═".repeat(70));
console.log(`РЕЦЕПТЫ С УВЕРЕННОСТЬЮ < 85%: ${lowConf.length} из ${recipes.length}`);
console.log("═".repeat(70));
lowConf.sort((a, b) => a.conf - b.conf).forEach((r) => {
  console.log(`  ${Math.round(r.conf * 100)}%  ${r.slug}`);
  r.unknown.forEach((u) => console.log(`        ✗ ${u}`));
});
