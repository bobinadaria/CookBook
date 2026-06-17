/**
 * seed-recipe-shvedskie-frikadelki.mjs — добавляет «Шведские фрикадельки с пюре и горошком».
 *
 * Происхождение: рецепт фуд-блогера Алёны Рождествиной. История и шаги
 * переформулированы под авторский тон Дарьи, с явной ссылкой на Алёну (по просьбе
 * автора — это её рецепт, уважаем авторство).
 *
 * КБЖУ: ОРИЕНТИР (решение Дарьи). Это полная тарелка (фрикадельки + пюре + горошек
 * + соус); часть ингредиентов без точного веса («сливки/молоко для пюре»,
 * «немного масла»), поэтому в `ingredients` для них даны разумные оценки, а в note
 * стоит явная оговорка «КБЖУ — ориентир». Фарш — классическая смесь свинина+говядина.
 *   - servings = 4 (500 г фарша + гарнир на 4 порции). КБЖУ — на порцию.
 *   - Фарш свино-говяжий матчится fuzzy на свиной/говяжий фарш (~239 ккал/100 г смесь).
 *   - Молоко ~150 мл и масло для обжарки ~15 г — оценки для ориентира.
 *
 * Категории (по slug, уже есть в БД — НЕ создаём):
 *   - goryachee  (meal_type:  Горячее)
 *   - myaso      (ingredient: Мясо)
 *   - zagotovki  (meal_type:  Заготовки — отварные фрикадельки отлично морозятся)
 *
 * Идемпотентен по slug. Запуск:
 *   node scripts/seed-recipe-shvedskie-frikadelki.mjs           # dry-run
 *   node scripts/seed-recipe-shvedskie-frikadelki.mjs --write   # реальная вставка
 *
 * После вставки:
 *   - Обложка: node scripts/gen-cover.mjs --title "Шведские фрикадельки с пюре и горошком" --recipe-id <id>
 *   - КБЖУ:    node scripts/calc-nutrition-one.mjs --slug shvedskie-frikadelki --write
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(".env.local") });

const apply = process.argv.includes("--write");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("✗ Supabase env missing (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  process.exit(1);
}
let URL = SUPABASE_URL;
if (URL && !URL.startsWith("http")) URL = `https://${URL}.supabase.co`;
const supabase = createClient(URL, SERVICE_KEY);

// ── Рецепт ───────────────────────────────────────────────────────────────────

const SLUG = "shvedskie-frikadelki";

// Состав = источник и для отображения, и для КБЖУ-ориентира. У каждой реальной
// строки есть вес/объём; строки-заголовки секций парсер КБЖУ пропускает.
const ingredientsRu = [
  "Для фрикаделек:",
  "Фарш свино-говяжий — 500 г",
  "Яйцо — 1 шт",
  "Лук репчатый — 1 средняя луковица (~120 г)",
  "Чеснок — 1 зубчик",
  "Горчица — 1 ст. л. (~15 г)",
  "Панировочные сухари — 5 ст. л. (~50 г)",
  "Соль — по вкусу",
  "Для гарнира:",
  "Картофель — 7 средних (~840 г)",
  "Масло сливочное — 1 ст. л. (~15 г)",
  "Молоко или сливки для пюре — ~150 мл",
  "Овощная часть:",
  "Зелёный горошек замороженный — 300 г",
  "Для соуса:",
  "Сливки 20% — 200 г",
  "Соевый соус — 2 ст. л. (~30 г)",
  "Масло для обжарки фрикаделек — ~1 ст. л. (~15 г)",
].join("\n");

const ingredientsEn = [
  "For the meatballs:",
  "Pork & beef mince — 500 g",
  "Egg — 1",
  "Onion — 1 medium (~120 g)",
  "Garlic — 1 clove",
  "Mustard — 1 tbsp (~15 g)",
  "Breadcrumbs — 5 tbsp (~50 g)",
  "Salt — to taste",
  "For the side:",
  "Potatoes — 7 medium (~840 g)",
  "Butter — 1 tbsp (~15 g)",
  "Milk or cream for the mash — ~150 ml",
  "Vegetables:",
  "Frozen green peas — 300 g",
  "For the sauce:",
  "Cream 20% — 200 g",
  "Soy sauce — 2 tbsp (~30 g)",
  "Oil for frying the meatballs — ~1 tbsp (~15 g)",
].join("\n");

const recipeData = {
  title: "Шведские фрикадельки с пюре и горошком",
  title_en: "Swedish Meatballs with Mashed Potato & Peas",
  slug: SLUG,
  // Сенсорное короткое описание — публично скрыто (под заголовком note), но в поиске/SEO.
  description:
    "Сочные мясные фрикадельки, отваренные и обжаренные до золотистой корочки, в нежном сливочно-соевом соусе — с воздушным картофельным пюре, зелёным горошком и брусничным джемом. Уютный шведский ужин в домашней версии.",
  description_en:
    "Juicy meatballs, boiled and then fried to a golden crust, in a gentle cream-and-soy sauce — with fluffy mashed potato, green peas and lingonberry jam. A cosy Swedish dinner, the homemade way.",
  // История — главный текст под заголовком. Тёплый авторский тон, ссылка на Алёну,
  // совет про заморозку и честная оговорка про «ориентир» КБЖУ.
  note:
    "Шведские фрикадельки — те самые, «икеевские» — для меня вкус уютного выходного: маленькие нежные шарики в сливочном соусе, гора воздушного пюре, зелёный горошек и обязательно ложка брусничного джема сбоку. Рецепт я взяла у фуд-блогера Алёны Рождествиной и чуть переложила под себя. Главный секрет нежности — лук, чеснок и яйцо пробиваются блендером в гладкую массу, а панировочные сухари дают фаршу настояться и стать упругим. В Швеции эти фрикадельки всегда подают с брусничным или клюквенным джемом: кисло-сладкая ягода неожиданно идеально оттеняет сливочный соус. И ещё один Аленкин совет, который я обожаю: фрикадельки — отличная заготовка. Сделай двойную порцию, отвари и заморозь именно отварные (не обжаренные) — получится своя «палочка-выручалочка», как пельмени, только готовить ещё легче. КБЖУ здесь — ориентир: это полная тарелка с пюре и соусом, где часть ингредиентов идёт «на глаз», так что цифры приблизительные.",
  note_en:
    "Swedish meatballs — the IKEA kind — taste like a cosy weekend to me: little tender balls in a creamy sauce, a mound of fluffy mash, green peas and, without fail, a spoon of lingonberry jam on the side. I took the recipe from food blogger Alyona Rozhdestvina and adapted it a little. The key to their tenderness: onion, garlic and egg are blitzed smooth in a blender, while breadcrumbs let the mince rest and firm up. In Sweden these meatballs are always served with lingonberry or cranberry jam — the sweet-tart berry sets off the creamy sauce perfectly. And one of Alyona's tips I love: meatballs make a brilliant freezer stash. Make a double batch, boil and freeze them boiled (not fried) — you get your own little lifesaver, like dumplings, only easier to cook. The nutrition here is a guideline: it's a full plate with mash and sauce, where some ingredients go in by eye, so the numbers are approximate.",
  ingredients: ingredientsRu,
  ingredients_en: ingredientsEn,
  cover_image: null, // обложку поставим отдельно через gen-cover.mjs
  published: true,
  featured: false,
  recipe_type: "food",
  owner_id: null, // авторский каталожный рецепт
  visibility: "public",
  cook_time: 60, // фарш 15 мин настой + варка картофеля/фрикаделек + соус + сборка
  servings: 4,
};

// ── Шаги (порядок важен; тёплый, но понятный тон; переформулированы) ───────────

const steps = [
  {
    order: 1,
    title: "Лук и чеснок",
    title_en: "Onion and garlic",
    description:
      "Очистите лук и чеснок. Лук нарежьте кубиком.",
    description_en:
      "Peel the onion and garlic. Cut the onion into cubes.",
  },
  {
    order: 2,
    title: "Пробить блендером",
    title_en: "Blitz the base",
    description:
      "Измельчите блендером лук, чеснок и яйцо до однородной массы — так фрикадельки получатся нежными, без кусочков лука.",
    description_en:
      "Blitz the onion, garlic and egg in a blender until smooth — this keeps the meatballs tender, with no chunks of onion.",
  },
  {
    order: 3,
    title: "Замесить фарш",
    title_en: "Mix the mince",
    description:
      "Смешайте луково-яичную смесь с фаршем, панировочными сухарями и горчицей, посолите. Вымесите до однородности и оставьте минут на 15 — за это время сухари разбухнут, а фарш станет упругим, и лепить будет легко.",
    description_en:
      "Combine the onion-egg mixture with the mince, breadcrumbs and mustard, then season with salt. Knead until even and leave for about 15 minutes — the breadcrumbs swell, the mince firms up, and shaping becomes easy.",
  },
  {
    order: 4,
    title: "Поставить картофель",
    title_en: "Start the potatoes",
    description:
      "Пока фарш отдыхает, почистите и нарежьте картофель, залейте водой, посолите и поставьте вариться.",
    description_en:
      "While the mince rests, peel and cut the potatoes, cover with water, salt them and set to boil.",
  },
  {
    order: 5,
    title: "Сформировать фрикадельки",
    title_en: "Shape the meatballs",
    description:
      "Поставьте закипать вторую кастрюлю с водой. Пока она греется, скатайте из фарша некрупные фрикадельки.",
    description_en:
      "Put a second pot of water on to boil. While it heats, roll the mince into small meatballs.",
  },
  {
    order: 6,
    title: "Отварить",
    title_en: "Boil them",
    description:
      "В кипящую воду опускайте фрикадельки порционно, не горкой. Как только всплыли — доставайте. Так отварите все.",
    description_en:
      "Lower the meatballs into the boiling water in batches, not all in a heap. As soon as they float up, take them out. Boil them all this way.",
  },
  {
    order: 7,
    title: "Обжарить",
    title_en: "Fry them",
    description:
      "Разогрейте сковороду с небольшим количеством масла, убавьте огонь до среднего и выложите отварные фрикадельки — столько, сколько нужно на подачу (остальные можно заморозить, см. историю выше).",
    description_en:
      "Heat a pan with a little oil, lower the heat to medium and add the boiled meatballs — as many as you need to serve (the rest can be frozen, see the story above).",
  },
  {
    order: 8,
    title: "До золотистой корочки",
    title_en: "Golden crust",
    description:
      "Обжарьте фрикадельки до золотистой корочки и снимите сковороду с огня.",
    description_en:
      "Fry the meatballs until golden, then take the pan off the heat.",
  },
  {
    order: 9,
    title: "Сливочно-соевый соус",
    title_en: "Cream-and-soy sauce",
    description:
      "Сливки слегка подогрейте, смешайте с соевым соусом и влейте в сковороду. Верните на огонь и потомите всё вместе, пока соус не загустеет до нужной консистенции.",
    description_en:
      "Warm the cream slightly, mix it with the soy sauce and pour it into the pan. Return to the heat and simmer everything together until the sauce thickens to the consistency you like.",
  },
  {
    order: 10,
    title: "Горошек",
    title_en: "The peas",
    description:
      "Горошек залейте кипятком; как оттает — слейте воду. Он готов.",
    description_en:
      "Cover the peas with boiling water; once thawed, drain. They're done.",
  },
  {
    order: 11,
    title: "Пюре",
    title_en: "The mash",
    description:
      "Слейте воду с картофеля, добавьте сливочное масло и молоко (или сливки) и взбейте в пюре.",
    description_en:
      "Drain the potatoes, add the butter and milk (or cream) and mash until smooth.",
  },
  {
    order: 12,
    title: "Подать",
    title_en: "Serve",
    description:
      "Подавайте фрикадельки с пюре, горошком и — обязательно — ложкой брусничного или клюквенного джема: так делают в Швеции.",
    description_en:
      "Serve the meatballs with the mash, the peas and — always — a spoon of lingonberry or cranberry jam: the way it's done in Sweden.",
  },
];

// ── Категории (по slug — id резолвим из БД) ───────────────────────────────────

const categorySlugs = [
  "goryachee", // meal_type:  Горячее
  "myaso", // ingredient: Мясо
  "zagotovki", // meal_type: Заготовки (отварные фрикадельки морозятся впрок)
];

async function resolveCategoryIds(slugs) {
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name, type")
    .in("slug", slugs);
  if (error) throw new Error(`categories lookup: ${error.message}`);
  const found = new Map(data.map((c) => [c.slug, c]));
  const missing = slugs.filter((s) => !found.has(s));
  if (missing.length) {
    console.error(`✗ не найдены категории по slug: ${missing.join(", ")}`);
    process.exit(1);
  }
  return slugs.map((s) => found.get(s));
}

// ── Run ──────────────────────────────────────────────────────────────────────

async function main() {
  const { data: existing } = await supabase
    .from("recipes")
    .select("id, title")
    .eq("slug", SLUG)
    .maybeSingle();

  if (existing) {
    console.log(`EXISTS id=${existing.id}`);
    return;
  }

  const cats = await resolveCategoryIds(categorySlugs);
  console.log("CATS_OK " + cats.map((c) => `${c.type}:${c.slug}`).join(","));

  if (!apply) {
    console.log("DRY_RUN_OK");
    return;
  }

  const { data: inserted, error: recipeErr } = await supabase
    .from("recipes")
    .insert(recipeData)
    .select("id, slug, title")
    .single();
  if (recipeErr || !inserted) {
    console.error("✗ insert recipe:", recipeErr?.message);
    process.exit(1);
  }
  console.log(`RECIPE_ID=${inserted.id}`);

  const stepsPayload = steps.map((st) => ({ ...st, recipe_id: inserted.id, photo_url: null }));
  const { error: stepsErr } = await supabase.from("steps").insert(stepsPayload);
  if (stepsErr) {
    console.error("✗ insert steps:", stepsErr.message);
    process.exit(1);
  }
  console.log(`STEPS_OK=${stepsPayload.length}`);

  const rcPayload = cats.map((c) => ({ recipe_id: inserted.id, category_id: c.id }));
  const { error: rcErr } = await supabase.from("recipe_categories").insert(rcPayload);
  if (rcErr) {
    console.error("✗ link categories:", rcErr.message);
    process.exit(1);
  }
  console.log(`CATS_LINKED=${rcPayload.length}`);
  console.log("DONE");
}

main().catch((e) => {
  console.error("✗ unexpected:", e.message);
  process.exit(1);
});
