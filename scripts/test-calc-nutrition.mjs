/**
 * Локальный тест калькулятора КБЖУ — БЕЗ записи в БД, БЕЗ Next.js-роута.
 * Делает то же самое, что /api/admin/calculate-nutrition: парсит, матчит, считает.
 * Печатает разбор, чтобы можно было глазами проверить разумность цифр перед
 * подключением UI-кнопки.
 *
 * Use:
 *   node scripts/test-calc-nutrition.mjs                       — Чашушули
 *   node scripts/test-calc-nutrition.mjs <recipe-slug>         — любой рецепт
 *   node scripts/test-calc-nutrition.mjs <slug> --write        — записать в БД
 */
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("✗ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing");
  process.exit(1);
}
if (!OPENAI_KEY) {
  console.error("✗ OPENAI_API_KEY missing in .env.local — добавь ключ и перезапусти");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_KEY });

const args = process.argv.slice(2);
const writeFlag = args.includes("--write");
const slug = args.find((a) => !a.startsWith("--")) ?? "chashushuli-po-gruzinski";

// ── Парсер ──────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Ты — парсер ингредиентов из русских кулинарных рецептов.

На вход получаешь текст рецепта, где каждая строка — один ингредиент либо служебная информация. Возвращаешь JSON-массив объектов в указанной схеме.

Правила:

1. Для каждой строки извлеки:
   - "input": исходную строку как есть
   - "name": название в именительном падеже, ед.ч., lowercase, БЕЗ прилагательных-описаний (например «отварной», «свежий», «крупный» — убираем). Примеры:
       «100 г пшеничной муки» → "мука пшеничная"
       «2 яйца» → "яйцо"
       «500 г куриной грудки» → "курица грудка"
       «1 средняя луковица» → "лук"
       «50 г сухой чёрной фасоли» → "фасоль чёрная"
       «пучок укропа» → "укроп"
   - "grams": количество в граммах (число). Конвертируй сам исходя из общеизвестных оценок плотности:
       1 ст. л. муки ≈ 10 г, сахара ≈ 25 г, масла ≈ 14 г, мёда ≈ 21 г, какао ≈ 7 г
       1 ч. л. ≈ 5 г для большинства сыпучих
       1 стакан (250 мл) муки ≈ 130 г, сахара ≈ 200 г
       1 яйцо ≈ 50 г, 1 средняя луковица ≈ 150 г, 1 морковка ≈ 80 г,
       1 помидор ≈ 120 г, 1 ломтик хлеба ≈ 30 г, 1 зубчик чеснока ≈ 5 г,
       пучок зелени ≈ 30 г, щепотка ≈ 1 г
       Для жидкостей: 1 мл ≈ 1 г (для воды/молока/кефира/сливок), 1 мл масла ≈ 0.92 г
   - "skipped": true если строку нужно пропустить
   - "skip_reason": почему пропустили (если skipped)

2. Пропускай (skipped: true):
   - Заголовки секций: «— Для крема —», «=== Соус ===», «# Подача»
   - Соль и перец «по вкусу» (вклад в КБЖУ копеечный)
   - «специи по вкусу», «травы по вкусу»
   - Воду (0 калорий)
   - Чисто декоративные подачи без указания количества: «зелень для украшения»
   - Пустые строки
   ВНИМАНИЕ: если у соли/перца указано количество (например, «2 ст.л. соли») — НЕ пропускай, но name="соль".

3. Если в строке указан «или» — выбирай первый вариант. «Персик или слива» → name="персик".

4. Если строка непонятна — skipped:true, skip_reason="unparseable: <причина>".

5. Возвращай СТРОГО валидный JSON в схеме, ничего больше.`;

async function parseIngredients(text) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: text },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "parsed_ingredients",
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
  return JSON.parse(response.choices[0].message.content).ingredients;
}

// ── Матчер ──────────────────────────────────────────────────────────────────

async function loadIndex() {
  const { data, error } = await supabase
    .from("ingredients_base")
    .select("id, name_ru, name_en, kcal_100g, protein_100g, fat_100g, carbs_100g, category");
  if (error) throw error;
  const map = new Map();
  for (const r of data) map.set(r.name_ru.toLowerCase().trim(), r);
  return map;
}

async function matchOne(query, index) {
  const exact = index.get(query.toLowerCase().trim());
  if (exact) return { row: exact, match_type: "exact", similarity: null };

  const { data, error } = await supabase.rpc("match_ingredient", { query, threshold: 0.3 });
  if (error) {
    if (error.message?.includes("function") && error.message?.includes("does not exist")) {
      throw new Error(
        "RPC match_ingredient не существует. Запусти SQL-миграцию: " +
          "scripts/migration-nutrition-fuzzy-match.sql в Supabase Dashboard → SQL Editor.",
      );
    }
    throw error;
  }
  if (!data || data.length === 0) return null;
  const r = data[0];
  return { row: r, match_type: "fuzzy", similarity: r.similarity };
}

// ── Калькулятор ─────────────────────────────────────────────────────────────

function round(n, d = 1) {
  const m = 10 ** d;
  return Math.round(n * m) / m;
}

async function calculate(text, servings) {
  const parsed = await parseIngredients(text);
  const index = await loadIndex();

  const totals = { kcal: 0, protein: 0, fat: 0, carbs: 0, weight_g: 0 };
  let matched_weight = 0;
  const matches = [];

  for (const p of parsed) {
    if (p.skipped || !p.name || p.grams == null) {
      matches.push({ ...p, matched: null, kcal: null, match_type: "unknown", similarity: null });
      continue;
    }
    totals.weight_g += p.grams;
    const m = await matchOne(p.name, index);
    if (!m) {
      matches.push({ ...p, matched: null, kcal: null, match_type: "unknown", similarity: null });
      continue;
    }
    const f = p.grams / 100;
    const kcal = +m.row.kcal_100g * f;
    totals.kcal += kcal;
    totals.protein += +m.row.protein_100g * f;
    totals.fat += +m.row.fat_100g * f;
    totals.carbs += +m.row.carbs_100g * f;
    matched_weight += p.grams;
    matches.push({
      ...p,
      matched: m.row.name_ru,
      kcal: round(kcal),
      match_type: m.match_type,
      similarity: m.similarity,
    });
  }

  const portions = servings && servings > 0 ? servings : 1;
  const confidence = totals.weight_g > 0 ? matched_weight / totals.weight_g : 0;

  return {
    per_serving: {
      kcal: round(totals.kcal / portions),
      protein: round(totals.protein / portions),
      fat: round(totals.fat / portions),
      carbs: round(totals.carbs / portions),
    },
    total: {
      kcal: round(totals.kcal),
      protein: round(totals.protein),
      fat: round(totals.fat),
      carbs: round(totals.carbs),
      weight_g: round(totals.weight_g),
    },
    servings: portions,
    confidence: round(confidence, 2),
    matches,
  };
}

// ── Main ────────────────────────────────────────────────────────────────────

const { data: recipe, error } = await supabase
  .from("recipes")
  .select("id, slug, title, ingredients, servings, nutrition")
  .eq("slug", slug)
  .single();

if (error || !recipe) {
  console.error(`✗ Recipe not found: ${slug}`);
  console.error(error?.message);
  process.exit(1);
}

console.log(`\n=== ${recipe.title} ===`);
console.log(`slug: ${recipe.slug} | servings: ${recipe.servings ?? "—"}\n`);
console.log("--- INGREDIENTS (raw) ---");
console.log(recipe.ingredients);
console.log("");

const t0 = Date.now();
const result = await calculate(recipe.ingredients, recipe.servings);
const dt = Date.now() - t0;

console.log(`--- PARSED & MATCHED (${dt}ms) ---`);
for (const m of result.matches) {
  const tag = m.skipped
    ? "─"
    : m.match_type === "exact"
    ? "✓"
    : m.match_type === "fuzzy"
    ? `~${m.similarity?.toFixed(2) ?? ""}`
    : "✗";
  const right = m.skipped
    ? `skip: ${m.skip_reason}`
    : m.matched
    ? `${m.grams}г → ${m.matched} = ${m.kcal} kcal`
    : `${m.grams}г → НЕ НАЙДЕНО («${m.name}»)`;
  console.log(`  ${tag.padEnd(6)} ${m.input.padEnd(60)} ${right}`);
}

console.log("\n--- TOTAL ---");
console.log(`  Вес блюда:  ${result.total.weight_g} г`);
console.log(`  На рецепт:  ${result.total.kcal} kcal | P ${result.total.protein} | F ${result.total.fat} | C ${result.total.carbs}`);
console.log(`  На порцию:  ${result.per_serving.kcal} kcal | P ${result.per_serving.protein} | F ${result.per_serving.fat} | C ${result.per_serving.carbs}   (порций: ${result.servings})`);
console.log(`  Confidence: ${(result.confidence * 100).toFixed(0)}%`);

if (writeFlag) {
  console.log("\n--- WRITING TO DB ---");
  const nutrition = {
    per_serving: result.per_serving,
    total: result.total,
    servings: result.servings,
    confidence: result.confidence,
    warnings: [],
    ingredients: result.matches.map((m) => ({
      input: m.input,
      matched: m.matched,
      grams: m.grams ?? 0,
      kcal: m.kcal,
      match_type: m.match_type ?? "unknown",
      similarity: m.similarity ?? null,
    })),
    calculated_at: new Date().toISOString(),
    model: "gpt-4o-mini",
  };
  const { error: upd } = await supabase
    .from("recipes")
    .update({ nutrition, updated_at: new Date().toISOString() })
    .eq("id", recipe.id);
  if (upd) {
    console.error("  ✗", upd.message);
    process.exit(1);
  }
  console.log("  ✓ recipes.nutrition обновлён");
} else {
  console.log("\n(dry run — для записи добавь флаг --write)");
}
