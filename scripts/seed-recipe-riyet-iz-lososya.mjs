/**
 * seed-recipe-riyet-iz-lososya.mjs — добавляет «Рийет из лосося» в каталог.
 *
 * Происхождение: подсмотренный рецепт нежной рыбной закуски (французские
 * rillettes). Текст полностью переписан под авторский тон Дарьи — это НЕ
 * копия чужого рецепта, а собственная подача (история + переформулированные
 * шаги), чтобы не было проблем с авторскими правами.
 *
 * Параметры:
 *   - 200 г филе сырого лосося → запекается; для КБЖУ берём «лосось» (сырой,
 *     208 ккал/100 г) — потеря воды при запекании не уносит калории, поэтому
 *     сумма по сырым ингредиентам корректна для итоговой массы блюда.
 *   - servings = 4 (закуска-намазка, едят понемногу). КБЖУ — на порцию.
 *   - Огурец солёный матчится fuzzy на «огурец» (свежий) — на макросы влияет
 *     пренебрежимо (≈16 ккал на весь огурец, и он опционален).
 *   - Сок лимона / соль / перец — без граммов, парсер их пропускает.
 *
 * Категории (по slug, уже есть в БД — НЕ создаём):
 *   - zakuski      (meal_type:  Закуски)
 *   - ryba         (ingredient: Рыба)
 *   - frantsuzskaya(country:    Французская)
 *
 * Идемпотентен по slug. Запуск:
 *   node scripts/seed-recipe-riyet-iz-lososya.mjs           # dry-run
 *   node scripts/seed-recipe-riyet-iz-lososya.mjs --write   # реальная вставка
 *
 * После вставки:
 *   - Обложка: node scripts/gen-cover.mjs --title "Рийет из лосося" --recipe-id <id>
 *   - КБЖУ:    node scripts/calc-nutrition-one.mjs --slug riyet-iz-lososya --write
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

const SLUG = "riyet-iz-lososya";

// Состав для КБЖУ: названия подобраны под ingredients_base (лосось / творожный
// сыр / лук / огурец / масло сливочное / масло растительное — матчатся точно
// или fuzzy). Лук и огурец — со средним весом в граммах, чтобы парсер посчитал.
const ingredientsRu = [
  "Филе лосося — 200 г",
  "Творожный сыр — 150 г",
  "Лук репчатый — 1 средняя луковица (~120 г)",
  "Солёный огурец — 1 средний (~100 г)",
  "Масло сливочное — 1 ст. л. (~15 г)",
  "Масло растительное — 1 ч. л. (~5 г)",
  "Сок четвертинки лимона — по вкусу",
  "Соль, перец — по вкусу",
].join("\n");

const ingredientsEn = [
  "Salmon fillet — 200 g",
  "Cream cheese — 150 g",
  "Onion — 1 medium (~120 g)",
  "Pickled cucumber — 1 medium (~100 g)",
  "Butter — 1 tbsp (~15 g)",
  "Vegetable oil — 1 tsp (~5 g)",
  "Juice of a quarter lemon — to taste",
  "Salt, pepper — to taste",
].join("\n");

const recipeData = {
  title: "Рийет из лосося",
  title_en: "Salmon Rillette",
  slug: SLUG,
  // Сенсорное короткое описание — публично скрыто (под заголовком note),
  // но индексируется поиском/SEO.
  description:
    "Нежная закуска-намазка из запечённого лосося, карамелизованного лука и творожного сыра с секретным ингредиентом — натёртым солёным огурцом. Кремовая текстура, мягкая сливочно-рыбная нота; намазывается на хлеб и тосты, готовится заранее.",
  description_en:
    "A delicate spread of baked salmon, caramelised onion and cream cheese with a secret ingredient — grated pickled cucumber. Creamy texture, gentle salmon-and-cream note; spreads onto bread and toast, made ahead.",
  // История — главный текст под заголовком. Тёплый авторский тон.
  note:
    "Рийет из лосося я открыла для себя как идеальную закуску для тех вечеров, когда хочется чего-то нежного и чуть праздничного, но без долгих хлопот. По сути это паштет: запечённый лосось, медленно карамелизованный лук и творожный сыр растираются в мягкую кремовую массу, которую так приятно намазать на свежий хлеб или подсушенный тост. У французов такие закуски называют rillettes — их делают заранее и дают настояться в холодильнике, чтобы вкус собрался воедино. Мой маленький секрет здесь — натёртый солёный огурец: его почти не видно, но он делает рийет сочнее и интереснее. Готовлю на неспешный завтрак, к бокалу вина или когда внезапно появляются гости.",
  note_en:
    "I discovered salmon rillette as the perfect starter for those evenings when you want something tender and a little festive, but without the fuss. It's essentially a pâté: baked salmon, slowly caramelised onion and cream cheese mashed into a soft, creamy spread that's lovely on fresh bread or a toasted slice. The French call these starters rillettes — they're made ahead and left to rest in the fridge so the flavour comes together. My little secret here is grated pickled cucumber: you barely see it, but it makes the rillette juicier and more interesting. I make it for a slow breakfast, with a glass of wine, or when guests turn up unannounced.",
  ingredients: ingredientsRu,
  ingredients_en: ingredientsEn,
  cover_image: null, // обложку поставим отдельно через gen-cover.mjs
  published: true,
  featured: false,
  recipe_type: "food",
  owner_id: null, // авторский каталожный рецепт
  visibility: "public",
  cook_time: 45, // запекание 30 мин + лук 15 мин (параллельно) + сборка; без учёта остывания
  servings: 4,
};

// ── Шаги (порядок важен; тёплый, но понятный тон; переформулированы) ───────────

const steps = [
  {
    order: 1,
    title: "Подготовить лосось",
    title_en: "Prep the salmon",
    description:
      "Филе сбрызните соком лимона, посолите и поперчите, смажьте каплей масла и плотно заверните в фольгу — рыба должна готовиться в собственном пару и остаться сочной.",
    description_en:
      "Sprinkle the fillet with lemon juice, season with salt and pepper, brush with a little oil and wrap it tightly in foil — the fish should cook in its own steam and stay juicy.",
  },
  {
    order: 2,
    title: "Запечь и остудить",
    title_en: "Bake, then cool",
    description:
      "Запекайте лосось в разогретой до 200 °C духовке около 20 минут. Затем разверните фольгу сверху и подержите ещё минут 10, чтобы рыба слегка подрумянилась. Дайте ей полностью остыть — горячий лосось расплавит сыр, а нам нужна плотная кремовая текстура.",
    description_en:
      "Bake the salmon in an oven preheated to 200 °C for about 20 minutes. Then open the foil on top and give it another 10 minutes so the fish browns a little. Let it cool completely — hot salmon would melt the cheese, and we want a firm, creamy texture.",
  },
  {
    order: 3,
    title: "Карамелизовать лук",
    title_en: "Caramelise the onion",
    description:
      "Пока рыба в духовке, мелко нарежьте луковицу и томите на сливочном масле на самом тихом огне минут 15, время от времени помешивая. Лук не должен поджариться — он должен стать прозрачным, золотистым и сладким. Снимите с огня и остудите.",
    description_en:
      "While the fish is in the oven, finely chop the onion and let it sweat in butter over the lowest heat for about 15 minutes, stirring now and then. The onion shouldn't fry — it should turn translucent, golden and sweet. Take it off the heat and let it cool.",
  },
  {
    order: 4,
    title: "Соединить основу",
    title_en: "Bring the base together",
    description:
      "Остывший лосось разберите на хлопья и смешайте с остывшим луком и творожным сыром. Я делаю это вилкой или прямо руками — так лучше чувствуешь текстуру и можно оставить рийет чуть крупнее, не превращая его в однородную пасту.",
    description_en:
      "Flake the cooled salmon and mix it with the cooled onion and cream cheese. I do this with a fork or straight with my hands — that way you feel the texture better and can keep the rillette a little coarser rather than a smooth paste.",
  },
  {
    order: 5,
    title: "Добавить секретный ингредиент",
    title_en: "Add the secret ingredient",
    description:
      "Огурец здесь — необязательный, но именно он даёт изюминку. Натрите солёный огурец на мелкой тёрке и вмешайте в рийет. Если он водянистый — отожмите лишний рассол; если очень солёный — положите поменьше. В идеале огурец не должен чувствоваться кусочками, но рийет станет заметно сочнее. Дайте закуске постоять в холодильнике хотя бы полчаса перед подачей.",
    description_en:
      "The cucumber is optional, but it's what gives this its twist. Grate the pickled cucumber on the fine side and fold it into the rillette. If it's watery, squeeze out the excess brine; if it's very salty, use a little less. Ideally you shouldn't feel cucumber pieces, but the rillette will turn noticeably juicier. Let it rest in the fridge for at least half an hour before serving.",
  },
];

// ── Категории (по slug — id резолвим из БД) ───────────────────────────────────

const categorySlugs = [
  "zakuski", // meal_type: Закуски
  "ryba", // ingredient: Рыба
  "frantsuzskaya", // country: Французская
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
