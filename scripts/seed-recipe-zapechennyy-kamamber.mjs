/**
 * seed-recipe-zapechennyy-kamamber.mjs — добавляет «Запечённый камамбер к белому вину» в каталог.
 *
 * Происхождение: рецепт фуд-блогера Алёны Рождествиной. Текст истории и шаги
 * переформулированы под авторский тон Дарьи, с явной ссылкой на Алёну (по просьбе
 * автора — это её рецепт, уважаем авторство).
 *
 * КБЖУ: НЕ считаем — это закуска-сет к вину (багет без веса, масло «на глаз»,
 * оливки/джем/вино — по желанию). Точное КБЖУ ±5% тут невозможно, поэтому
 * nutrition остаётся null (как у напитков — сознательно).
 *
 * Категории (по slug, уже есть в БД — НЕ создаём):
 *   - zakuski       (meal_type:  Закуски)
 *   - syr           (ingredient: Сыр)
 *   - frantsuzskaya (country:    Французская)
 *   - vesna         (season:     Весна — мартовское настроение, мимоза)
 *
 * Идемпотентен по slug. Запуск:
 *   node scripts/seed-recipe-zapechennyy-kamamber.mjs           # dry-run
 *   node scripts/seed-recipe-zapechennyy-kamamber.mjs --write   # реальная вставка
 *
 * После вставки:
 *   - Обложка: node scripts/gen-cover.mjs --title "Запечённый камамбер к белому вину" --recipe-id <id>
 *   - КБЖУ:    не нужно (сет-закуска).
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

const SLUG = "zapechennyy-kamamber";

const ingredientsRu = [
  "Камамбер — 1 головка",
  "Чеснок — 1 зубчик",
  "Травы (розмарин, орегано, тимьян; если нет свежих — любые сухие) — по вкусу",
  "Багет — по желанию",
  "Оливковое масло — 4–5 ст. л.",
  "К подаче: оливки, брусничный или клюквенный джем, белое вино",
].join("\n");

const ingredientsEn = [
  "Camembert — 1 wheel",
  "Garlic — 1 clove",
  "Herbs (rosemary, oregano, thyme; dried if no fresh) — to taste",
  "Baguette — as you like",
  "Olive oil — 4–5 tbsp",
  "To serve: olives, lingonberry or cranberry jam, white wine",
].join("\n");

const recipeData = {
  title: "Запечённый камамбер к белому вину",
  title_en: "Baked Camembert with Garlic, Herbs & Crispy Baguette",
  slug: SLUG,
  // Сенсорное короткое описание — публично скрыто (под заголовком note), но в поиске/SEO.
  description:
    "Запечённый до мягкой тягучей сердцевины камамбер с чесноком и ароматными травами, поданный с хрустящим багетом, оливками и брусничным джемом — тёплая закуска к бокалу белого вина.",
  description_en:
    "Camembert baked to a soft, molten centre with garlic and fragrant herbs, served with a crisp baguette, olives and lingonberry jam — a warm starter for a glass of white wine.",
  // История — главный текст под заголовком. Тёплый авторский тон, ссылка на Алёну.
  note:
    "Этот запечённый камамбер я подсмотрела у фуд-блогера Алёны Рождествиной — и он сразу стал моим любимым «ленивым праздником». Пока сыр прогревается в духовке, его сердцевина становится тягучей и тёплой, а корочка чуть карамелизуется по краям; рядом — золотистый багет, который так приятно макать прямо в расплавленную середину. Я люблю собирать вокруг него маленький сет: горсть оливок, ложка брусничного или клюквенного джема, бокал холодного белого вина. Готовлю его, когда хочется весеннего, почти мартовского настроения — с веточкой мимозы на столе и Zaz из колонок. Минимум усилий, максимум уюта: пока духовка делает всю работу, успеваешь накрыть на стол и выдохнуть.",
  note_en:
    "I first saw this baked camembert from food blogger Alyona Rozhdestvina — and it instantly became my favourite \"lazy celebration\". As the cheese warms in the oven its centre turns soft and molten while the rind caramelises at the edges; alongside sits a golden baguette that's made for dipping straight into the melted middle. I love building a little spread around it: a handful of olives, a spoon of lingonberry or cranberry jam, a glass of cold white wine. I make it when I want a spring, almost-March mood — a sprig of mimosa on the table and Zaz playing. Minimum effort, maximum cosiness: while the oven does the work, you have just enough time to set the table and breathe out.",
  ingredients: ingredientsRu,
  ingredients_en: ingredientsEn,
  cover_image: null, // обложку поставим отдельно через gen-cover.mjs
  published: true,
  featured: false,
  recipe_type: "food",
  owner_id: null, // авторский каталожный рецепт
  visibility: "public",
  cook_time: 25, // ~5 мин сборка + 20 мин запекание
  servings: 4, // закуска-сет на компанию
  nutrition: null, // сознательно без КБЖУ (сет-закуска)
};

// ── Шаги (порядок важен; тёплый, но понятный тон; переформулированы) ───────────

const steps = [
  {
    order: 1,
    title: "Подготовить форму",
    title_en: "Prepare the dish",
    description:
      "Достаньте камамбер из упаковки и переложите в небольшую форму по размеру сыра. Если подходящей нет — сделайте бортики из сложенной фольги, чтобы расплавленный сыр держал форму.",
    description_en:
      "Take the camembert out of its packaging and place it in a small dish that fits the cheese. If you don't have one, shape a little mould from folded foil so the melting cheese holds its form.",
  },
  {
    order: 2,
    title: "Нарезать чеснок",
    title_en: "Slice the garlic",
    description:
      "Очистите зубчик чеснока и нарежьте его тонкими пластинками.",
    description_en:
      "Peel the clove of garlic and cut it into thin slices.",
  },
  {
    order: 3,
    title: "Нашпиговать сыр",
    title_en: "Stud the cheese",
    description:
      "Сделайте на поверхности сыра неглубокие надрезы крест-накрест и вложите в них пластинки чеснока — так он отдаст аромат прямо в сердцевину.",
    description_en:
      "Score a shallow criss-cross pattern on top of the cheese and tuck the garlic slices into the cuts — that way it releases its aroma straight into the centre.",
  },
  {
    order: 4,
    title: "Собрать и запечь",
    title_en: "Assemble and bake",
    description:
      "Нарежьте багет ломтиками и разложите вокруг сыра. Щедро полейте всё оливковым маслом, посыпьте травами и отправьте в разогретую до 200 °C духовку примерно на 20 минут. Время зависит от духовки: ориентируйтесь на багет — как только он стал золотистым, всё готово.",
    description_en:
      "Slice the baguette and arrange it around the cheese. Drizzle everything generously with olive oil, scatter over the herbs and bake in an oven preheated to 200 °C for about 20 minutes. The time depends on your oven: watch the baguette — once it turns golden, it's ready.",
  },
  {
    order: 5,
    title: "Подать",
    title_en: "Serve",
    description:
      "Подавайте сразу, пока сердцевина тягучая: рядом — оливки, брусничный или клюквенный джем и бокал холодного белого вина. И, конечно, музыка — включайте Zaz и наслаждайтесь.",
    description_en:
      "Serve straight away while the centre is still molten: with olives, lingonberry or cranberry jam and a glass of cold white wine alongside. And music, of course — put on Zaz and enjoy.",
  },
];

// ── Категории (по slug — id резолвим из БД) ───────────────────────────────────

const categorySlugs = [
  "zakuski", // meal_type:  Закуски
  "syr", // ingredient: Сыр
  "frantsuzskaya", // country: Французская
  "vesna", // season: Весна
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
