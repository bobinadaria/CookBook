/**
 * seed-recipe-rebra-frank.mjs — добавляет «Свиные рёбра как во Frank by Basta»
 * в каталог (раздел «Горячее»).
 *
 * Происхождение: личная история. Дарью впервые привела во Frank by Basta её
 * подружка Маша; как ценитель свиных рёбер — Дарья влюбилась в рецепт и
 * воспроизводит его дома. Тон note — тёплый, личный.
 *
 * Параметры (подтверждены Дарьей):
 *   - ~1 кг свиных рёбер, servings = 2 (сытная порция «рёбра как главное блюдо»).
 *   - Категории: «Горячее» (goryachee, meal_type) + «Мясо» (myaso, ingredient).
 *     Обе уже есть в БД — НЕ заводим заново. Country «американская» в таксономии
 *     нет, поэтому страну не вешаем.
 *
 *   ⚠️ КБЖУ-нюанс: блюдо запекается 4 часа (жир вытапливается) + соус уваривается.
 *   Это «составное» блюдо — точный ±5% недостижим. КБЖУ считаем как ОРИЕНТИР
 *   (как у клюквенного соуса). Решение по публикации цифры — за Дарьей.
 *
 * Что делает:
 *   1. Создаёт запись в `recipes` (owner_id=null → каталожный рецепт).
 *   2. Создаёт шаги в `steps`.
 *   3. Привязывает категории ПО SLUG (резолвит id из БД на лету).
 *
 * Идемпотентен по slug: если рецепт с этим slug уже есть — НЕ создаёт второй.
 *
 * Запуск:
 *   node scripts/seed-recipe-rebra-frank.mjs           # dry-run
 *   node scripts/seed-recipe-rebra-frank.mjs --write   # реальная вставка
 *
 * После вставки:
 *   - Обложка: node scripts/gen-cover.mjs --title "Свиные рёбра как во Frank by Basta" --recipe-id <id>
 *   - КБЖУ:    node scripts/calc-nutrition-one.mjs --slug rebra-frank --write
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

const SLUG = "rebra-frank";

// Состав для КБЖУ: имена подобраны под ingredients_base (рёбра / лук красный /
// коричневый сахар / томатный соус / вустерский / рыбный соус матчатся точно или
// fuzzy). Специи «по вкусу» парсер пропускает (нет граммов) — на расчёт не влияют.
const ingredientsRu = [
  "Свиные рёбра — ≈620 г мяса (полоса ~1 кг с костью)",
  "Лук красный — 1 шт (~150 г)",
  "Сахар тростниковый — 1 ст. л. (~12 г)",
  "Томаты в собственном соку — 200 г",
  "Соус вустерский — 1 ст. л. (~17 г)",
  "Рыбный соус — 1–2 ч. л. (~7 г)",
  "Соль — по вкусу",
  "Паприка копчёная — по вкусу",
  "Чеснок сушёный — по вкусу",
  "Перец чёрный молотый — по вкусу",
].join("\n");

const ingredientsEn = [
  "Pork ribs — ≈620 g meat (a ~1 kg rack with the bone)",
  "Red onion — 1 (~150 g)",
  "Cane sugar — 1 tbsp (~12 g)",
  "Canned tomatoes in their own juice — 200 g",
  "Worcestershire sauce — 1 tbsp (~17 g)",
  "Fish sauce — 1–2 tsp (~7 g)",
  "Salt — to taste",
  "Smoked paprika — to taste",
  "Dried garlic — to taste",
  "Black pepper, ground — to taste",
].join("\n");

const recipeData = {
  title: "Свиные рёбра как во Frank by Basta",
  title_en: "Pork Ribs Like at Frank by Basta",
  slug: SLUG,
  // Сенсорное короткое описание — публично скрыто (под заголовком now note),
  // но индексируется поиском/SEO.
  description:
    "Свиные рёбра, томлённые под фольгой 4 часа до мягкости «мясо отходит от кости», а затем глазированные домашним томатно-карамельным соусом с вустерским и рыбным соусом и копчёной паприкой. Липкая блестящая корочка, дымный сладко-солёный соус — рёбра как в стейк-хаусе, но дома.",
  description_en:
    "Pork ribs slow-baked under foil for four hours until the meat pulls away from the bone, then glazed with a homemade tomato-caramel sauce built on Worcestershire, fish sauce and smoked paprika. A sticky, glossy crust and a smoky sweet-salty glaze — steakhouse ribs, made at home.",
  // История — главный текст под заголовком. Тёплый личный тон.
  note:
    "В первый раз меня привела во Frank by Basta моя подружка Маша — и именно там я, давний ценитель свиных рёбер, влюбилась в них окончательно. Те самые рёбра: мясо буквально сползает с кости, сверху блестящая липкая глазурь, а вкус — дымный, сладкий и солёный одновременно. Дома весь секрет в терпении: рёбра четыре часа томятся под фольгой на низкой температуре, и только потом я смазываю их густым томатно-карамельным соусом и отправляю под верхний жар, чтобы корочка слегка карамелизовалась. Соус можно сделать заранее и пробить блендером до гладкости. Это рёбра «на выходные» — те, ради которых стоит затопить духовку на полдня.\n\nПро КБЖУ: здесь это ориентир. Считаю по съедобному мясу без кости (≈620 г с килограммовой полосы) — кость в тарелку не идёт. За долгое томление часть жира ещё вытапливается, так что реальная цифра может выйти чуть ниже.",
  note_en:
    "The first time I was taken to Frank by Basta was by my friend Masha — and that's where I, a long-time lover of pork ribs, fell for them completely. Those ribs: the meat slides right off the bone, a glossy sticky glaze on top, and a flavour that's smoky, sweet and salty all at once. At home the whole secret is patience — the ribs slow-bake under foil at a low temperature for four hours, and only then do I brush them with a thick tomato-caramel sauce and slip them under high heat so the crust just caramelises. The sauce can be made ahead and blitzed smooth with a blender. These are weekend ribs — the kind worth firing up the oven for half a day.\n\nA note on the numbers: this is a guideline. I count the edible meat off the bone (≈620 g from a one-kilo rack) — the bone doesn't reach your plate. Some fat also renders out over the long bake, so the real figure may come out a touch lower.",
  ingredients: ingredientsRu,
  ingredients_en: ingredientsEn,
  cover_image: null, // обложку поставим отдельно через gen-cover.mjs
  published: true,
  featured: false,
  recipe_type: "food",
  owner_id: null, // авторский каталожный рецепт
  visibility: "public",
  cook_time: 265, // ~4 ч духовка + ~15 мин соус + ~10 мин глазирование
  servings: 2,
};

// ── Шаги (порядок важен; тёплый, но инструктивный тон) ────────────────────────

const steps = [
  {
    order: 1,
    title: "Подготовить и поставить рёбра томиться",
    title_en: "Prep the ribs and start the slow bake",
    description:
      "Зачистить обратную сторону рёбер от плёнок — так мясо лучше пропечётся и будет нежнее. Хорошо посолить и поперчить со всех сторон. Выложить рёбра в форму, плотно затянуть фольгой и отправить в разогретую до 160 °C духовку на 4 часа. Низкая температура и долгое время — именно то, благодаря чему мясо потом буквально отходит от кости.",
    description_en:
      "Remove the membrane from the back of the ribs — the meat cooks through more evenly and turns out more tender. Season generously with salt and pepper on all sides. Place the ribs in a baking dish, cover tightly with foil and put them in an oven preheated to 160 °C for 4 hours. Low heat and long time are exactly what makes the meat fall off the bone later.",
  },
  {
    order: 2,
    title: "Сварить и пробить соус",
    title_en: "Cook and blend the sauce",
    description:
      "Пока томятся рёбра, готовим соус. Обжарить нарезанный красный лук, добавить сахар и карамелизовать лук до мягкости и лёгкой золотистости. Влить томаты в собственном соку, вустерский соус, рыбный соус, добавить соль, копчёную паприку, сушёный чеснок и чёрный перец по вкусу. Прогреть пару минут, чтобы вкусы соединились, и пробить готовый соус блендером до гладкости. Вместо вустерского соуса можно взять немного соуса барбекю.",
    description_en:
      "While the ribs bake, make the sauce. Sauté the chopped red onion, add the sugar and caramelise the onion until soft and lightly golden. Pour in the canned tomatoes, Worcestershire sauce and fish sauce, then add salt, smoked paprika, dried garlic and black pepper to taste. Warm for a couple of minutes so the flavours come together, then blitz the sauce smooth with a blender. You can use a little barbecue sauce in place of the Worcestershire.",
  },
  {
    order: 3,
    title: "Глазировать под верхним жаром",
    title_en: "Glaze under high heat",
    description:
      "Достать готовые рёбра и щедро смазать их горячими соусом со всех сторон. Вернуть в духовку, но уже в режиме конвекции при 200 °C на 7–10 минут — пока соус слегка не схватится и не поджарится, образуя ту самую липкую блестящую корочку. Следить, чтобы соус не подгорел. Подавать сразу, горячими.",
    description_en:
      "Take out the cooked ribs and brush them generously with the sauce on all sides while they're still hot. Return them to the oven, now on convection at 200 °C for 7–10 minutes — until the sauce just sets and crisps up, forming that signature sticky, glossy crust. Keep an eye on it so the sauce doesn't burn. Serve right away, hot.",
  },
];

// ── Категории (по slug — id резолвим из БД) ───────────────────────────────────

const categorySlugs = [
  "goryachee", // meal_type: Горячее
  "myaso", // ingredient: Мясо
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
