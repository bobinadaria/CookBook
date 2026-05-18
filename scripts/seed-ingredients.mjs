/**
 * Seed ingredients_base with ~50 base products from USDA FoodData Central.
 *
 * Стратегия:
 *   - Каждый ингредиент имеет name_ru (как пишем в рецептах) + search term для USDA.
 *   - Дёргаем USDA /foods/search с фильтром dataType=Foundation,SR Legacy
 *     (без брендов — это curated reference data на 100г).
 *   - Берём первый результат, извлекаем foodNutrients:
 *       1008 = Energy (kcal)
 *       1003 = Protein (g)
 *       1004 = Total lipid (fat) (g)
 *       1005 = Carbohydrate, by difference (g)
 *   - UPSERT по name_ru (можно перезапускать, перетрёт значения).
 *   - Если что-то выглядит странно в логе — поправь руками в Supabase Dashboard.
 *
 * Run: node scripts/seed-ingredients.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

let SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const USDA_API_KEY = process.env.USDA_API_KEY;

if (SUPABASE_URL && !SUPABASE_URL.startsWith("http")) {
  SUPABASE_URL = `https://${SUPABASE_URL}.supabase.co`;
}

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!USDA_API_KEY) {
  console.error("Missing USDA_API_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ── Ingredient list ─────────────────────────────────────────────────────────
// Категории: meat | fish | dairy | egg | grain | vegetable | fruit | nut |
//            seed | fat | sweet | spice | other
//
// Правило для name_ru: значения хранятся в СЫРОМ виде (мясо/рыба),
// СУХОМ (крупы, мука, семена, специи), либо СВЕЖЕМ (овощи, фрукты, зелень).
// Жирные молочные продукты и сыры — как продаются (готовый продукт).

const INGREDIENTS = [
  // Зерновые / мука
  { name_ru: "рис",              search: "white rice raw",                   category: "grain" },
  { name_ru: "гречка",           search: "buckwheat groats",                 category: "grain" },
  { name_ru: "овсянка",          search: "rolled oats",                      category: "grain" },
  { name_ru: "мука пшеничная",   search: "all-purpose wheat flour",          category: "grain" },

  // Молочка
  { name_ru: "молоко",           search: "whole milk",                       category: "dairy" },
  { name_ru: "кефир",            search: "kefir",                            category: "dairy" },
  { name_ru: "сметана",          search: "sour cream",                       category: "dairy" },
  { name_ru: "творог",           search: "cottage cheese lowfat",            category: "dairy" },
  { name_ru: "маскарпоне",       search: "mascarpone",                       category: "dairy" },
  { name_ru: "рикотта",          search: "ricotta whole milk",               category: "dairy" },
  { name_ru: "сыр твёрдый",      search: "cheddar cheese",                   category: "dairy" },
  { name_ru: "фета",             search: "feta cheese",                      category: "dairy" },
  { name_ru: "сливки 30%",       search: "heavy whipping cream",             category: "dairy" },
  { name_ru: "сливки 10%",       search: "light cream",                      category: "dairy" },
  { name_ru: "сгущёнка",         search: "sweetened condensed milk",         category: "dairy" },

  // Мясо / рыба / яйца
  { name_ru: "говядина",         search: "ground beef raw",                  category: "meat" },
  { name_ru: "курица грудка",    search: "chicken breast raw",               category: "meat" },
  { name_ru: "лосось",           search: "atlantic salmon raw",              category: "fish" },
  { name_ru: "яйцо",             search: "egg whole raw",                    category: "egg" },

  // Масла / жиры
  { name_ru: "масло оливковое",  search: "olive oil",                        category: "fat" },
  { name_ru: "масло подсолнечное", search: "sunflower oil",                  category: "fat" },
  { name_ru: "масло растительное", search: "vegetable oil",                  category: "fat" },
  { name_ru: "масло сливочное",  search: "salted butter",                    category: "fat" },

  // Сладкое / выпечка
  { name_ru: "сахар",            search: "granulated sugar",                 category: "sweet" },
  { name_ru: "мёд",              search: "honey",                            category: "sweet" },
  { name_ru: "какао",            search: "unsweetened cocoa powder",         category: "sweet" },
  { name_ru: "разрыхлитель",     search: "baking powder",                    category: "spice" },

  // Овощи
  { name_ru: "картофель",        search: "raw potato",                       category: "vegetable" },
  { name_ru: "помидор",          search: "raw tomato",                       category: "vegetable" },
  { name_ru: "цукини",           search: "raw zucchini",                     category: "vegetable" },
  { name_ru: "тыква",            search: "raw pumpkin",                      category: "vegetable" },
  { name_ru: "перец болгарский", search: "red sweet pepper",                 category: "vegetable" },
  { name_ru: "лук",              search: "raw onion",                        category: "vegetable" },
  { name_ru: "чеснок",           search: "raw garlic",                       category: "vegetable" },
  { name_ru: "морковь",          search: "raw carrot",                       category: "vegetable" },
  { name_ru: "петрушка",         search: "fresh parsley",                    category: "vegetable" },
  { name_ru: "укроп",            search: "fresh dill",                       category: "vegetable" },
  { name_ru: "авокадо",          search: "raw avocado",                      category: "vegetable" },

  // Фрукты / ягоды
  { name_ru: "апельсин",         search: "raw orange",                       category: "fruit" },
  { name_ru: "лимон",            search: "raw lemon",                        category: "fruit" },
  { name_ru: "яблоко",           search: "raw apple",                        category: "fruit" },
  { name_ru: "банан",            search: "raw banana",                       category: "fruit" },
  { name_ru: "инжир",             search: "raw figs",                        category: "fruit" },
  { name_ru: "вишня",             search: "sweet cherries raw",              category: "fruit" },
  { name_ru: "гранат",            search: "raw pomegranate",                 category: "fruit" },
  { name_ru: "клюква сушёная",    search: "dried cranberries",               category: "fruit" },

  // Орехи / семена
  { name_ru: "грецкий орех",     search: "walnuts english",                  category: "nut" },
  { name_ru: "миндаль",          search: "almonds raw",                      category: "nut" },
  { name_ru: "кунжут",           search: "sesame seeds whole dried",         category: "seed" },
  { name_ru: "тыквенные семечки", search: "pumpkin seeds dried kernels",     category: "seed" },

  // Прочее
  { name_ru: "фасоль чёрная",    search: "beans black mature raw",           category: "other" },

  // ── Дополнительные позиции для покрытия существующих рецептов ───────────

  // Молочка / сыры
  { name_ru: "творожный сыр",      search: "cream cheese",                       category: "dairy" },
  { name_ru: "пармезан",           search: "parmesan cheese hard grated",        category: "dairy" },
  { name_ru: "камамбер",           search: "camembert cheese",                   category: "dairy" },
  { name_ru: "йогурт натуральный", search: "plain yogurt whole milk",            category: "dairy" },

  // Мясо / рыба / морепродукты
  { name_ru: "куриная печень",     search: "chicken liver raw",                  category: "meat" },
  { name_ru: "креветки",           search: "raw shrimp mixed species",           category: "fish" },
  { name_ru: "мидии",              search: "mussels blue raw",                   category: "fish" },
  { name_ru: "анчоусы",            search: "anchovy canned oil drained",         category: "fish" },

  // Зелень / овощи (свежие)
  { name_ru: "кинза",              search: "cilantro coriander leaves raw",      category: "vegetable" },
  { name_ru: "зелёный лук",        search: "scallions green onion raw",          category: "vegetable" },
  { name_ru: "базилик свежий",     search: "basil fresh",                        category: "vegetable" },
  { name_ru: "шпинат",             search: "raw spinach",                        category: "vegetable" },
  { name_ru: "огурец",             search: "raw cucumber with peel",             category: "vegetable" },
  { name_ru: "шалот",              search: "raw shallots",                       category: "vegetable" },
  { name_ru: "имбирь свежий",      search: "raw ginger root",                    category: "vegetable" },

  // Зерновые / мука / хлеб
  { name_ru: "рисовая мука",       search: "white rice flour",                   category: "grain" },
  { name_ru: "кукурузная мука",    search: "corn flour whole grain yellow",      category: "grain" },
  { name_ru: "хлеб белый",         search: "white bread commercially prepared",  category: "grain" },

  // Сладкое / выпечка
  { name_ru: "сахарная пудра",     search: "powdered sugar",                     category: "sweet" },
  { name_ru: "шоколад тёмный",     search: "dark chocolate 70 cocoa cacao solids", category: "sweet" },
  { name_ru: "изюм",               search: "raisins seedless",                   category: "fruit" },

  // Орехи / семена (доп.)
  { name_ru: "мак",                search: "poppy seeds dried",                  category: "seed" },
  { name_ru: "фисташки",           search: "pistachios raw",                     category: "nut" },

  // Третий проход — выявлено тестом calculate-nutrition на Цезаре/Паштете
  { name_ru: "майонез",            search: "mayonnaise regular",                 category: "fat" },
  { name_ru: "романо",             search: "lettuce romaine raw",                category: "vegetable" },
  { name_ru: "горчица дижонская",  search: "dijon mustard",                      category: "other" },
  { name_ru: "сливки 20%",         search: "light cream",                        category: "dairy" },
];

// ── USDA helpers ────────────────────────────────────────────────────────────

// Energy: 1008 = kcal (label nutrient), 2047/2048 = Atwater general/specific kcal.
// В Foundation foods 1008 часто отсутствует, есть только 2047 — поэтому пробуем все три.
const NUTRIENT_IDS = {
  kcal:    [1008, 2047, 2048],
  protein: [1003],
  fat:     [1004],
  carbs:   [1005],
};

// Ранжирование dataType: чем меньше — тем выше качество.
const DATA_TYPE_RANK = {
  "Foundation": 0,
  "SR Legacy": 1,
  "Survey (FNDDS)": 2,
  "Branded": 3,
};

// Резервные значения на 100г для позиций, где USDA стабильно даёт мусор.
// Источник: USDA FoodData Central / Скурихин / ГОСТ для русских продуктов.
// override: true → всегда используется этот fallback, даже если USDA ответил.
const HARDCODED_FALLBACKS = {
  // === Базовые override-позиции (стабильно даёт мусор / неоднозначный продукт) ===
  "курица грудка":     { kcal: 120, protein: 22.5, fat: 2.62, carbs: 0,    en: "Chicken breast, raw, skinless, boneless", override: true },
  "рис":               { kcal: 365, protein: 7.1,  fat: 0.66, carbs: 80.0, en: "White rice, long-grain, raw",             override: true },
  "говядина":          { kcal: 215, protein: 18.6, fat: 15.1, carbs: 0,    en: "Beef, ground, 15% fat, raw",               override: true },
  "фасоль чёрная":     { kcal: 341, protein: 21.6, fat: 1.42, carbs: 62.36, en: "Beans, black, mature seeds, raw",         override: true },

  // === Фрукты / овощи — USDA выдал не тот продукт ===
  "яблоко":            { kcal: 52,  protein: 0.26, fat: 0.17, carbs: 13.8,  en: "Apple, raw, with skin",                   override: true },
  "банан":             { kcal: 89,  protein: 1.09, fat: 0.33, carbs: 22.84, en: "Banana, raw",                             override: true },
  "лимон":             { kcal: 29,  protein: 1.1,  fat: 0.3,  carbs: 9.32,  en: "Lemon, raw, without peel",                override: true },
  "апельсин":          { kcal: 47,  protein: 0.94, fat: 0.12, carbs: 11.75, en: "Orange, raw",                             override: true },
  "цукини":            { kcal: 17,  protein: 1.21, fat: 0.32, carbs: 3.11,  en: "Zucchini, raw, includes skin",            override: true },
  "картофель":         { kcal: 77,  protein: 2.05, fat: 0.09, carbs: 17.49, en: "Potato, raw, with skin",                  override: true },
  "лук":               { kcal: 40,  protein: 1.1,  fat: 0.1,  carbs: 9.34,  en: "Onion, raw",                              override: true },
  "клюква сушёная":    { kcal: 308, protein: 0.2,  fat: 1.4,  carbs: 82.4,  en: "Cranberries, dried, sweetened" },

  // === Крупы / зерно ===
  "гречка":            { kcal: 346, protein: 11.73, fat: 3.4, carbs: 74.95, en: "Buckwheat groats, roasted, dry",          override: true },
  "овсянка":           { kcal: 389, protein: 16.89, fat: 6.9, carbs: 66.27, en: "Oats, rolled, dry",                       override: true },

  // === Молочка / сыры ===
  "маскарпоне":        { kcal: 429, protein: 4.8,  fat: 44.0, carbs: 4.8,   en: "Mascarpone cheese (Italian, full-fat)",   override: true },
  "сливки 10%":        { kcal: 120, protein: 3.0,  fat: 10.0, carbs: 4.0,   en: "Cream, 10% fat (Russian GOST 31451-2013)", override: true },
  "сливки 30%":        { kcal: 292, protein: 2.17, fat: 30.91, carbs: 2.95, en: "Cream, fluid, whipping, light (~30% fat)", override: true },
  "сгущёнка":          { kcal: 321, protein: 7.9,  fat: 8.7,  carbs: 54.4,  en: "Sweetened condensed milk" },
  "творожный сыр":     { kcal: 342, protein: 5.9,  fat: 34.4, carbs: 5.5,   en: "Cream cheese",                            override: true },

  // === Масла ===
  "масло оливковое":   { kcal: 884, protein: 0,    fat: 100,  carbs: 0,     en: "Olive oil, extra virgin",                 override: true },
  "масло подсолнечное": { kcal: 884, protein: 0,    fat: 100,  carbs: 0,    en: "Sunflower oil" },

  // === Орехи / семена ===
  "миндаль":           { kcal: 579, protein: 21.2, fat: 49.9, carbs: 21.6,  en: "Almonds, raw" },
  "тыквенные семечки": { kcal: 559, protein: 30.2, fat: 49.05, carbs: 10.71, en: "Pumpkin seed kernels, dried (no salt)",  override: true },
  "мак":               { kcal: 525, protein: 17.99, fat: 41.56, carbs: 28.13, en: "Poppy seeds, dried" },
  "кунжут":            { kcal: 573, protein: 17.73, fat: 49.67, carbs: 23.45, en: "Sesame seeds, whole, dried" },

  // === Сладкое / выпечка ===
  "сахар":             { kcal: 387, protein: 0,    fat: 0,    carbs: 99.98, en: "Sugars, granulated",                      override: true },
  "сахарная пудра":    { kcal: 389, protein: 0,    fat: 0,    carbs: 99.77, en: "Sugars, powdered",                        override: true },
  "какао":             { kcal: 228, protein: 19.6, fat: 13.7, carbs: 57.9,  en: "Cocoa, dry powder, unsweetened" },
  "шоколад тёмный":    { kcal: 598, protein: 7.79, fat: 42.63, carbs: 45.9, en: "Chocolate, dark, 70-85% cacao solids",    override: true },
  "разрыхлитель":      { kcal: 53,  protein: 0,    fat: 0,    carbs: 27.7,  en: "Baking powder, double-acting",            override: true },

  // === Рыба / морепродукты — USDA для непонятных запросов даёт мусор или ничего ===
  "анчоусы":           { kcal: 210, protein: 28.89, fat: 9.71, carbs: 0,    en: "Anchovy, european, canned in oil, drained", override: true },
  "креветки":          { kcal: 99,  protein: 20.31, fat: 0.51, carbs: 0.91, en: "Shrimp, mixed species, raw",              override: true },

  // === Зелень / овощи — USDA выдал HTML 404 / неверный продукт ===
  "базилик свежий":    { kcal: 23,  protein: 3.15, fat: 0.64, carbs: 2.65,  en: "Basil, fresh",                            override: true },
  "шпинат":            { kcal: 23,  protein: 2.86, fat: 0.39, carbs: 3.63,  en: "Spinach, raw",                            override: true },
  "шалот":             { kcal: 72,  protein: 2.5,  fat: 0.1,  carbs: 16.8,  en: "Shallots, raw",                           override: true },
  "имбирь свежий":     { kcal: 80,  protein: 1.82, fat: 0.75, carbs: 17.77, en: "Ginger root, raw (fresh, not pickled)",   override: true },

  // === Молочка / сыры — USDA подсунул не тот сыр ===
  "камамбер":          { kcal: 300, protein: 19.8, fat: 24.3, carbs: 0.46,  en: "Cheese, camembert",                       override: true },
  "пармезан":          { kcal: 392, protein: 35.75, fat: 25.83, carbs: 3.22, en: "Cheese, parmesan, hard",                 override: true },

  // === Мясо — USDA выдал готовый продукт вместо сырого ===
  "куриная печень":    { kcal: 119, protein: 16.92, fat: 4.83, carbs: 0.73, en: "Chicken liver, all classes, raw",         override: true },

  // === Зерновые — USDA отдал не тот продукт ===
  "кукурузная мука":   { kcal: 361, protein: 6.93, fat: 3.86, carbs: 76.85, en: "Corn flour, whole-grain, yellow",         override: true },
  "хлеб белый":        { kcal: 242, protein: 7.6,  fat: 2.9,  carbs: 49.0,  en: "White bread, Russian baton (GOST)",       override: true },

  // === Орехи / семена — USDA отдал заправку для салата / NFS ===
  "мак":               { kcal: 525, protein: 17.99, fat: 41.56, carbs: 28.13, en: "Poppy seeds, dried",                    override: true },
  "фисташки":          { kcal: 560, protein: 20.16, fat: 45.32, carbs: 27.17, en: "Pistachio nuts, raw",                   override: true },

  // === Третий проход — открылись после теста на Цезаре/Паштете ===
  "майонез":           { kcal: 680, protein: 0.96, fat: 74.85, carbs: 0.57,  en: "Mayonnaise, regular",                    override: true },
  "романо":            { kcal: 17,  protein: 1.23, fat: 0.30,  carbs: 3.29,  en: "Lettuce, cos or romaine, raw",            override: true },
  "горчица дижонская": { kcal: 150, protein: 6.0,  fat: 12.0,  carbs: 5.0,   en: "Mustard, Dijon",                          override: true },
  "сливки 20%":        { kcal: 205, protein: 2.8,  fat: 20.0,  carbs: 3.5,   en: "Cream, 20% fat (Russian GOST 31451-2013)", override: true },
};

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const ct = res.headers.get("content-type") ?? "";
  if (!res.ok || !ct.includes("application/json")) {
    return { ok: false, status: res.status };
  }
  return { ok: true, data: await res.json() };
}

async function searchUsda(query, dataType) {
  const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
  url.searchParams.set("api_key", USDA_API_KEY);
  url.searchParams.set("query", query);
  if (dataType) url.searchParams.set("dataType", dataType);
  url.searchParams.set("pageSize", "10");

  const res = await fetchJson(url);
  if (!res.ok) return [];
  return res.data.foods ?? [];
}

async function fetchFoodDetail(fdcId) {
  const url = new URL(`https://api.nal.usda.gov/fdc/v1/food/${fdcId}`);
  url.searchParams.set("api_key", USDA_API_KEY);
  const res = await fetchJson(url);
  return res.ok ? res.data : null;
}

// Последовательно расширяем поиск: качественные → общие → любые
async function findBestFood(query) {
  const tries = ["Foundation,SR Legacy", "Survey (FNDDS)", null];
  for (const dt of tries) {
    const foods = await searchUsda(query, dt);
    if (foods.length === 0) continue;
    // Сортируем по качеству dataType
    foods.sort(
      (a, b) =>
        (DATA_TYPE_RANK[a.dataType] ?? 9) - (DATA_TYPE_RANK[b.dataType] ?? 9),
    );
    return foods[0];
  }
  return null;
}

function extractNutrients(food) {
  const out = { kcal: null, protein: null, fat: null, carbs: null };
  for (const n of food.foodNutrients ?? []) {
    // search-формат: { nutrientId, value }; detail-формат: { nutrient: {id}, amount }
    const id = n.nutrientId ?? n.nutrient?.id;
    const value = n.value ?? n.amount;
    if (id == null || value == null) continue;
    for (const key of Object.keys(NUTRIENT_IDS)) {
      if (out[key] == null && NUTRIENT_IDS[key].includes(id)) {
        out[key] = value;
      }
    }
  }
  return out;
}

// ── Upsert ──────────────────────────────────────────────────────────────────

function isComplete(n) {
  return n.kcal != null && n.protein != null && n.fat != null && n.carbs != null;
}

async function resolveNutrition({ name_ru, search }) {
  // 0. Force-override: для известно-проблемных позиций USDA не используем вовсе.
  const forced = HARDCODED_FALLBACKS[name_ru];
  if (forced?.override) {
    return {
      source: "fallback",
      nutri: { kcal: forced.kcal, protein: forced.protein, fat: forced.fat, carbs: forced.carbs },
      description: forced.en,
      fdcId: null,
    };
  }

  // 1. Ищем лучший food по нашему запросу
  const food = await findBestFood(search);
  if (food) {
    let nutri = extractNutrients(food);
    let description = food.description;
    let fdcId = food.fdcId;

    // 2. Если в search-ответе не хватает чего-то — добираем из /food/{fdcId}
    if (!isComplete(nutri) && food.fdcId) {
      const detail = await fetchFoodDetail(food.fdcId);
      if (detail) {
        const detailNutri = extractNutrients(detail);
        // мерджим: detail побеждает там, где search дал null
        for (const k of Object.keys(nutri)) {
          if (nutri[k] == null && detailNutri[k] != null) nutri[k] = detailNutri[k];
        }
        description = detail.description ?? description;
      }
    }

    if (isComplete(nutri)) {
      return { source: "usda", nutri, description, fdcId };
    }
  }

  // 3. Hardcoded-фолбэк
  const fb = HARDCODED_FALLBACKS[name_ru];
  if (fb) {
    return {
      source: "fallback",
      nutri: { kcal: fb.kcal, protein: fb.protein, fat: fb.fat, carbs: fb.carbs },
      description: fb.en,
      fdcId: null,
    };
  }

  return null;
}

async function upsertIngredient({ name_ru, search, category }) {
  const resolved = await resolveNutrition({ name_ru, search });
  if (!resolved) {
    console.warn(`  ✗ "${name_ru}": не нашли подходящих данных (запрос "${search}")`);
    return { ok: false };
  }

  const { nutri, description, fdcId, source } = resolved;
  const row = {
    name_ru,
    name_en: description,
    kcal_100g:    Number(nutri.kcal.toFixed(2)),
    protein_100g: Number(nutri.protein.toFixed(2)),
    fat_100g:     Number(nutri.fat.toFixed(2)),
    carbs_100g:   Number(nutri.carbs.toFixed(2)),
    usda_fdc_id:  fdcId,
    category,
  };

  const { error } = await supabase
    .from("ingredients_base")
    .upsert(row, { onConflict: "name_ru" });

  if (error) {
    console.error(`  ✗ "${name_ru}": Supabase ${error.message}`);
    return { ok: false };
  }

  const tag = source === "fallback" ? "★" : "✓";
  console.log(
    `  ${tag} ${name_ru.padEnd(22)} → ${row.kcal_100g.toString().padStart(4)} kcal | ` +
      `P ${row.protein_100g.toString().padStart(5)} | F ${row.fat_100g.toString().padStart(5)} | ` +
      `C ${row.carbs_100g.toString().padStart(5)}   « ${description}`,
  );
  return { ok: true };
}

// ── Main ────────────────────────────────────────────────────────────────────

async function getSeededNames() {
  const { data, error } = await supabase
    .from("ingredients_base")
    .select("name_ru");
  if (error) throw new Error(`Cannot read ingredients_base: ${error.message}`);
  return new Set((data ?? []).map((r) => r.name_ru));
}

async function main() {
  const already = await getSeededNames();
  // Override-позиции прогоняем всегда — чтобы перетереть мусор от USDA.
  const todo = INGREDIENTS.filter(
    (i) => !already.has(i.name_ru) || HARDCODED_FALLBACKS[i.name_ru]?.override,
  );
  const overrideCount = todo.filter((i) => HARDCODED_FALLBACKS[i.name_ru]?.override).length;
  console.log(
    `\nВ ingredients_base уже есть: ${already.size}. ` +
      `Будем обрабатывать: ${todo.length} (из них ${overrideCount} — force-override).\n`,
  );

  let ok = 0;
  let fail = 0;
  const failed = [];
  for (const ing of todo) {
    try {
      const res = await upsertIngredient(ing);
      if (res.ok) ok++;
      else {
        fail++;
        failed.push(ing.name_ru);
      }
    } catch (err) {
      console.error(`  ✗ "${ing.name_ru}": ${err.message}`);
      fail++;
      failed.push(ing.name_ru);
    }
    // USDA free tier: 1000 req/hour, мягкий троттлинг
    await new Promise((r) => setTimeout(r, 250));
  }

  console.log(`\nГотово: ${ok} успешно, ${fail} с ошибками.`);
  if (fail > 0) {
    console.log("Не получилось: " + failed.join(", "));
    console.log("Запусти ещё раз — повторно дёрнутся только эти.");
  }
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
