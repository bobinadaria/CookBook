/**
 * seed-recipe-keksy-dlya-lyubimogo.mjs — добавляет «Кексы „Для любимого"» в каталог.
 *
 * Происхождение: газетная вырезка (автор рецепта — Мария Копылова, г. Тула).
 * Личная история: Дарья пекла эти кексы школьницей (8–10 класс) и обожала их.
 * Тон note — тёплый, личный (детское воспоминание).
 *
 * Текст-источник (часть шага 1 была надорвана — восстановлено по смыслу):
 *   Понадобится: 3 яйца; 1,5 стак. сахара; 2,5 стак. муки; 100 г маргарина;
 *   200 г сметаны; 1 ч.л. соды (гашёной уксусом); сливочное масло и манная
 *   крупа для смазывания формочек; сахарная пудра для посыпки.
 *
 * Параметры:
 *   - servings = 12 (≈12 небольших кексов; КБЖУ показывается на один кекс).
 *     Калории при выпечке сохраняются (уходит вода) → per-serving честный.
 *   - Маргарин добавлен в ingredients_base (717 ккал) — матчится точно.
 *   - «для смазывания/посыпки» (масло, манка, пудра) — без граммов, парсер
 *     пропускает; на КБЖУ почти не влияют (это правильно).
 *   - Категории: desert, vypechka, russkaya.
 *
 * Идемпотентен по slug. Запуск:
 *   node scripts/seed-recipe-keksy-dlya-lyubimogo.mjs           # dry-run
 *   node scripts/seed-recipe-keksy-dlya-lyubimogo.mjs --write   # вставка
 *
 * После вставки:
 *   - Обложка: node scripts/gen-cover.mjs --title "Кексы «Для любимого»" --recipe-id <id>
 *   - КБЖУ:    node scripts/calc-nutrition-one.mjs --slug keksy-dlya-lyubimogo --write
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

const SLUG = "keksy-dlya-lyubimogo";

const ingredientsRu = [
  "Яйца — 3 шт.",
  "Сахар — 1,5 стакана (~300 г)",
  "Мука пшеничная — 2,5 стакана (~325 г)",
  "Маргарин — 100 г",
  "Сметана — 200 г",
  "Сода, гашённая уксусом — 1 ч. л.",
  "Сливочное масло — для смазывания формочек",
  "Манная крупа — для посыпки формочек",
  "Сахарная пудра — для посыпки",
].join("\n");

const ingredientsEn = [
  "Eggs — 3",
  "Sugar — 1.5 cups (~300 g)",
  "Wheat flour — 2.5 cups (~325 g)",
  "Margarine — 100 g",
  "Sour cream — 200 g",
  "Baking soda, slaked with vinegar — 1 tsp",
  "Butter — for greasing the moulds",
  "Semolina — for dusting the moulds",
  "Icing sugar — for dusting",
].join("\n");

const recipeData = {
  title: "Кексы «Для любимого»",
  title_en: "“For My Beloved” Cupcakes",
  slug: SLUG,
  description:
    "Простые домашние кексы на сметане и маргарине — пышные, мягкие, с нежным сливочным мякишем, выпеченные в формочках и присыпанные сахарной пудрой. Несложное тесто, знакомый вкус выпечки к чаю.",
  description_en:
    "Simple home-style cupcakes made with sour cream and margarine — fluffy and soft, with a tender buttery crumb, baked in moulds and dusted with icing sugar. An easy batter and the familiar taste of baking for tea.",
  // История — личное воспоминание Дарьи.
  note:
    "Эти кексы я пекла ещё школьницей, классе в восьмом-десятом, и просто обожала их. Рецепт из старой газетной вырезки — простой, понятный, без капризов: взбить, замесить, разложить по формочкам и в духовку. Получаются мягкими и пышными, с нежным сливочным мякишем, а сверху — лёгкое облачко сахарной пудры. Из тех рецептов, что готовишь по памяти и каждый раз будто возвращаешься немного назад.",
  note_en:
    "I used to bake these cupcakes back in school, around grades eight to ten, and I simply adored them. The recipe comes from an old newspaper clipping — simple and straightforward, no fuss: whisk, mix, spoon into moulds and into the oven. They turn out soft and fluffy, with a tender buttery crumb and a light cloud of icing sugar on top. One of those recipes you make from memory, and each time it takes you back a little.",
  ingredients: ingredientsRu,
  ingredients_en: ingredientsEn,
  cover_image: null,
  published: true,
  featured: false,
  recipe_type: "food",
  owner_id: null,
  visibility: "public",
  cook_time: 40, // замес ~15 мин + выпечка 20–25 мин
  servings: 12,
};

// ── Шаги ──────────────────────────────────────────────────────────────────────

const steps = [
  {
    order: 1,
    title: "Замесить тесто",
    title_en: "Make the batter",
    description:
      "Яйца взбейте с сахаром. Добавьте сметану, растопленный и слегка остывший маргарин, соду, гашённую уксусом, и муку. Замесите гладкое тесто.",
    description_en:
      "Whisk the eggs with the sugar. Add the sour cream, the melted and slightly cooled margarine, the soda slaked with vinegar, and the flour. Mix into a smooth batter.",
  },
  {
    order: 2,
    title: "Заполнить формочки",
    title_en: "Fill the moulds",
    description:
      "Формочки смажьте сливочным маслом и присыпьте манной крупой. Выложите тесто в формочки, заполняя примерно на 3/4 объёма — при выпечке кексы поднимутся.",
    description_en:
      "Grease the moulds with butter and dust them with semolina. Spoon the batter into the moulds, filling them about three-quarters full — the cupcakes will rise as they bake.",
  },
  {
    order: 3,
    title: "Выпекать",
    title_en: "Bake",
    description:
      "Выпекайте в разогретой до 180 °C духовке 20–25 минут, до сухой лучинки и румяной корочки.",
    description_en:
      "Bake in an oven preheated to 180 °C for 20–25 minutes, until a skewer comes out clean and the tops are golden.",
  },
  {
    order: 4,
    title: "Присыпать пудрой",
    title_en: "Dust with icing sugar",
    description:
      "Готовые кексы достаньте из формочек, дайте немного остыть и щедро присыпьте сахарной пудрой.",
    description_en:
      "Turn the finished cupcakes out of the moulds, let them cool a little and dust generously with icing sugar.",
  },
];

// ── Категории (по slug) ───────────────────────────────────────────────────────

const categorySlugs = [
  "desert", // meal_type: Десерт
  "vypechka", // meal_type: Выпечка
  "russkaya", // country: Русская (домашняя газетная выпечка)
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
