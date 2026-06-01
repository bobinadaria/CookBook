/**
 * seed-recipe-kuritsa-po-frantsuzski.mjs — добавляет «Курица по-французски» в каталог.
 *
 * Происхождение: рецепт от парня Дарьи. Он приготовил его на втором свидании
 * в 2018 году — с тех пор они вместе. Личный, дорогой рецепт.
 *
 * Параметры (подтверждены Дарьей): 4 куриные ножки на 2 порции, белое сухое
 * вино, чеснок добавляем. Макароны — гарнир, СОЗНАТЕЛЬНО не входят в состав и
 * не считаются в КБЖУ (у каждого своя порция).
 *
 * Что делает:
 *   1. Создаёт запись в `recipes` (owner_id=null → каталожный рецепт).
 *   2. Создаёт шаги в `steps`.
 *   3. Привязывает категории ПО SLUG (резолвит id из БД на лету).
 *      Реальные slug в БД — транслитерация: goryachee / frantsuzskaya / myaso / osen.
 *
 * Идемпотентен по slug: если рецепт с этим slug уже есть — НЕ создаёт второй.
 *
 * Запуск:
 *   node scripts/seed-recipe-kuritsa-po-frantsuzski.mjs           # dry-run
 *   node scripts/seed-recipe-kuritsa-po-frantsuzski.mjs --write   # реальная вставка
 *
 * После вставки:
 *   - Обложка: node scripts/gen-cover.mjs --title "Курица по-французски" --recipe-id <id>
 *   - КБЖУ:    node scripts/calc-nutrition-one.mjs --slug kuritsa-po-frantsuzski --write
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

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ── Рецепт ───────────────────────────────────────────────────────────────────

const SLUG = "kuritsa-po-frantsuzski";

const ingredientsRu = [
  "Куриные ножки (голени) — 4 шт., ~500 г",
  "Мука пшеничная — 2 ст. л. (~30 г, для обвалки)",
  "Сливочное масло — 20 г (для жарки)",
  "Белое сухое вино — 150 мл",
  "Вода — 450 мл",
  "Корень петрушки — 1 шт. (~50 г)",
  "Чеснок — 2–3 зубчика (~10 г)",
  "Соль — по вкусу",
  "Перец чёрный молотый — по вкусу",
  "Паприка сладкая молотая — по вкусу",
].join("\n");

const ingredientsEn = [
  "Chicken legs (drumsticks) — 4 pcs, ~500 g",
  "Wheat flour — 2 tbsp (~30 g, for dredging)",
  "Butter — 20 g (for frying)",
  "Dry white wine — 150 ml",
  "Water — 450 ml",
  "Parsley root — 1 pc (~50 g)",
  "Garlic — 2–3 cloves (~10 g)",
  "Salt — to taste",
  "Black pepper, ground — to taste",
  "Sweet paprika, ground — to taste",
].join("\n");

const recipeData = {
  title: "Курица по-французски",
  title_en: "Chicken French-Style",
  slug: SLUG,
  // Сенсорное короткое описание — публично скрыто (под заголовком теперь note),
  // но индексируется поиском/SEO. Держим коротко.
  description:
    "Куриные ножки, обжаренные до золотой корочки и томлёные в белом вине с корнем петрушки и чесноком. Нежное мясо, ароматный соус, подаётся с макаронами.",
  description_en:
    "Chicken legs fried to a golden crust and braised in white wine with parsley root and garlic. Tender meat, a fragrant sauce, served with pasta.",
  // История — главный текст под заголовком на странице рецепта.
  note:
    "Этот рецепт мне приготовил мой парень — на втором свидании, в 2018 году. Курица тихо томилась в вине на медленном огне, и пахло так, что я, кажется, влюбилась ещё до того, как попробовала. А когда попробовала — всё, пропала: это было безумно вкусно. С того вечера мы вместе. Теперь я готовлю её сама, и каждый раз, пока ножки булькают в белом вине с корнем петрушки и чесноком, на кухню возвращается тот самый вечер. Подаём с макарошками — просто, по-домашнему, и оттого ещё дороже.",
  note_en:
    "My boyfriend cooked this for me on our second date, back in 2018. The chicken was slowly braising in wine, and the smell alone — I think I fell for him before I'd even tasted it. And once I did, that was it: it was unbelievably good. We've been together ever since. Now I make it myself, and every time the legs are bubbling away in white wine with parsley root and garlic, that evening comes back to the kitchen. We serve it with pasta — simple, homey, and all the more precious for it.",
  ingredients: ingredientsRu,
  ingredients_en: ingredientsEn,
  cover_image: null, // обложку поставим отдельно через gen-cover.mjs
  published: true,
  featured: false,
  recipe_type: "food",
  owner_id: null, // авторский каталожный рецепт
  visibility: "public",
  cook_time: 60, // ~10 мин обжарка + 40 мин томление + преп
  servings: 2,
};

// ── Шаги (порядок важен) ─────────────────────────────────────────────────────

const steps = [
  {
    order: 1,
    title: "Обвалять ножки",
    title_en: "Dredge the legs",
    description:
      "Куриные ножки обсушить. Смешать муку с солью, чёрным перцем и сладкой паприкой и обвалять в этой смеси ножки со всех сторон.",
    description_en:
      "Pat the chicken legs dry. Mix the flour with salt, black pepper and sweet paprika, then dredge the legs all over in the mixture.",
  },
  {
    order: 2,
    title: "Обжарить до золотой корочки",
    title_en: "Fry until golden",
    description:
      "В сковороде растопить немного сливочного масла. Обжарить ножки на среднем огне со всех сторон до румяной золотой корочки.",
    description_en:
      "Melt a little butter in a pan. Fry the legs over medium heat on all sides until they take on a golden crust.",
  },
  {
    order: 3,
    title: "Влить вино и воду",
    title_en: "Add wine and water",
    description:
      "Залить обжаренные ножки белым вином и водой в пропорции примерно 1 часть вина к 3 частям воды — жидкость должна почти покрывать мясо.",
    description_en:
      "Pour white wine and water over the fried legs in a ratio of roughly 1 part wine to 3 parts water — the liquid should almost cover the meat.",
  },
  {
    order: 4,
    title: "Корень петрушки и чеснок",
    title_en: "Parsley root and garlic",
    description:
      "Добавить нарезанный корень петрушки и пару зубчиков чеснока. Они отдадут соусу мягкий, тёплый аромат.",
    description_en:
      "Add the chopped parsley root and a couple of garlic cloves. They give the sauce a soft, warm aroma.",
  },
  {
    order: 5,
    title: "Томить 40 минут",
    title_en: "Braise for 40 minutes",
    description:
      "Накрыть крышкой и тушить на медленном огне около 40 минут, пока мясо не станет мягким и не начнёт отходить от кости, а соус слегка не загустеет.",
    description_en:
      "Cover and simmer over low heat for about 40 minutes, until the meat is tender and starts to fall off the bone and the sauce has thickened slightly.",
  },
  {
    order: 6,
    title: "Подавать с макарошками",
    title_en: "Serve with pasta",
    description:
      "Подавать горячей с отварными макаронами, щедро полив их соусом из сковороды.",
    description_en:
      "Serve hot with boiled pasta, spooning the pan sauce generously over the top.",
  },
];

// ── Категории (по slug — id резолвим из БД). Реальные slug = транслит. ────────

const categorySlugs = [
  "goryachee", // meal_type: Горячее (основное блюдо)
  "frantsuzskaya", // country: Французская
  "myaso", // ingredient: Мясо (категории «птица» в БД нет)
  "osen", // season: Осень (уютное винное томление)
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

  const stepsPayload = steps.map((s) => ({ ...s, recipe_id: inserted.id, photo_url: null }));
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
