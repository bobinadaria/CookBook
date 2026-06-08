/**
 * seed-recipe-utka-s-yablokami.mjs — добавляет «Утку с яблоками, черносливом и
 * чесноком» в каталог.
 *
 * Происхождение: рецепт мамы Димы. Она готовит утку так по субботним вечерам —
 * не спеша, для себя и мужа — и по праздникам. Шаги сохраняют её тёплый тон.
 *
 * Параметры (подтверждены Дарьей): целая средняя утка (~2 кг), 4 порции.
 * КБЖУ считаем НА ОДНУ ПОРЦИЮ. В состав КБЖУ идёт ~750 г запечённой мякоти с
 * кожей (реальный выход с тушки ~2 кг). Брусничный соус — СОЗНАТЕЛЬНО не в
 * составе (подаётся отдельно, у каждого своя порция; как макароны в «Курице
 * по-французски»).
 *
 * Перед этим скриптом прогнать: node scripts/seed-ingredient-duck.mjs
 *
 * Запуск:
 *   node scripts/seed-recipe-utka-s-yablokami.mjs           # dry-run
 *   node scripts/seed-recipe-utka-s-yablokami.mjs --write   # реальная вставка
 *
 * После вставки:
 *   - Обложка: node scripts/gen-cover.mjs --title "Утка с яблоками, черносливом и чесноком" --recipe-id <id>
 *   - КБЖУ:    node scripts/calc-nutrition-one.mjs --slug utka-s-yablokami-i-chernoslivom --write
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

const SLUG = "utka-s-yablokami-i-chernoslivom";

const ingredientsRu = [
  "Утка, запечённая мякоть с кожей — ~750 г (выход с одной средней тушки, на 4 порции)",
  "Яблоки зелёные, кислые — 2 шт., ~300 г",
  "Чернослив без косточки — ~80 г",
  "Чеснок — 1 головка, ~30 г (много, как любит мама)",
  "Масло растительное — 1–2 ст. л. (~15 г, для обжарки)",
  "Соль — по вкусу",
  "Перец чёрный молотый — по вкусу",
].join("\n");

const ingredientsEn = [
  "Duck, roasted meat with skin — ~750 g (yield from one medium bird, serves 4)",
  "Green tart apples — 2 pcs, ~300 g",
  "Pitted prunes — ~80 g",
  "Garlic — 1 head, ~30 g (a lot, the way Mum likes it)",
  "Vegetable oil — 1–2 tbsp (~15 g, for searing)",
  "Salt — to taste",
  "Black pepper, ground — to taste",
].join("\n");

const recipeData = {
  title: "Утка с яблоками, черносливом и чесноком",
  title_en: "Duck with Apples, Prunes and Garlic",
  slug: SLUG,
  // Сенсорное короткое описание — публично скрыто (под заголовком теперь note),
  // но индексируется поиском/SEO.
  description:
    "Утиные филейные части с хрустящей корочкой, томлёные под фольгой с чесноком, черносливом и половинками зелёных яблок. Нежное мясо, тёплый аромат и сладко-кислый баланс; подаётся с брусничным соусом.",
  description_en:
    "Duck fillets with a crisp skin, slowly baked under foil with garlic, prunes and halves of green apples. Tender meat, a warm aroma and a sweet-and-sour balance; served with lingonberry sauce.",
  // История — главный текст под заголовком на странице рецепта.
  note:
    "Этот рецепт — от мамы Димы. Она готовит утку так по субботним вечерам, не спеша, для себя и мужа, а ещё — по праздникам, когда хочется, чтобы дом пах чем-то тёплым и особенным. Уточка томится в духовке не один час: чеснока кладётся много, чернослив сначала чуть распаривается, а половинки зелёных яблок отдают мясу свою кислинку. Запах стоит такой, что в ожидании можно успеть и задремать — мама, кажется, однажды так и сделала, и ничего, всё получилось. А подавать всё это нужно обязательно с ягодным соусом — у нас был брусничный. Тёплый, домашний, субботний рецепт, который теперь живёт и в нашей книге.",
  note_en:
    "This recipe comes from Dima's mum. She makes duck like this on Saturday evenings — unhurried, for herself and her husband — and on holidays, when she wants the house to smell of something warm and special. The duck takes its time in the oven, hours of it: plenty of garlic goes in, the prunes are steamed a little first, and halves of green apples lend the meat their tartness. The smell is so good you could doze off while you wait — Mum, I think, once did exactly that, and it all turned out fine anyway. And it simply must be served with a berry sauce — ours was lingonberry. A warm, homey, Saturday-evening recipe that now lives in our book too.",
  ingredients: ingredientsRu,
  ingredients_en: ingredientsEn,
  cover_image: null, // обложку поставим отдельно через gen-cover.mjs
  published: true,
  featured: false,
  recipe_type: "food",
  owner_id: null, // авторский каталожный рецепт
  visibility: "public",
  cook_time: 200, // ~10 мин обжарка + 2,5–3 ч томление + 15–20 мин корочка + преп
  servings: 4,
};

// ── Шаги (порядок важен; сохраняем тёплый мамин тон) ──────────────────────────

const steps = [
  {
    order: 1,
    title: "Натереть солью и перцем",
    title_en: "Rub with salt and pepper",
    description:
      "Взяла среднюю утку (примерно 2 кг) и разобрала на филейные части. Натёрла их смесью соли и чёрного перца. Сторону, где шкура, надрезала крест-накрест в нескольких местах — так лишний жир вытопится, а корочка получится румяной.",
    description_en:
      "Take a medium duck (about 2 kg) and cut it into fillet pieces. Rub them all over with a mix of salt and black pepper. On the skin side, score a crosshatch in a few places — this lets the excess fat render out and gives a nice crisp skin.",
  },
  {
    order: 2,
    title: "Обжарить до красивой корочки",
    title_en: "Sear until golden",
    description:
      "На сковороде разогрела немного растительного масла и обжарила утку с одной стороны — той, где кожа, — до красивой золотистой корочки.",
    description_en:
      "Heat a little vegetable oil in a pan and sear the duck on one side — the skin side — until it takes on a beautiful golden crust.",
  },
  {
    order: 3,
    title: "Переложить на противень",
    title_en: "Move to a baking tray",
    description:
      "Противень застелила двойным слоем фольги (он всё равно потом испачкается 🙂). Выложила утку, а сверху вылила со сковороды оставшееся масло вместе с вытопившимся утиным жиром — пусть всё пропитается.",
    description_en:
      "Line a baking tray with a double layer of foil (it'll get messy anyway 🙂). Lay the duck on it and pour over the oil left in the pan together with the rendered duck fat — let everything soak it up.",
  },
  {
    order: 4,
    title: "Добавить чеснок, чернослив и яблоки",
    title_en: "Add garlic, prunes and apples",
    description:
      "Разложила вокруг утки много очищенных зубчиков чеснока, немного заранее распаренного чернослива и половинки зелёных яблок без семенных коробочек.",
    description_en:
      "Scatter plenty of peeled garlic cloves around the duck, a little of the prunes (steamed beforehand), and halves of green apples with the cores removed.",
  },
  {
    order: 5,
    title: "Запекать под фольгой 2,5–3 часа",
    title_en: "Bake under foil for 2.5–3 hours",
    description:
      "Прикрыла всё сверху ещё одним слоем фольги и отправила в духовку при 150 °C на 2,5–3 часа. Утка томится так долго и спокойно, что за это время можно и задремать — мама однажды так и уснула, и ничего, всё получилось.",
    description_en:
      "Cover everything with another layer of foil and put it in the oven at 150 °C for 2.5–3 hours. The duck braises so slowly and calmly that you could nap in the meantime — Mum once fell asleep just like that, and it all turned out fine.",
  },
  {
    order: 6,
    title: "Снять фольгу и подрумянить",
    title_en: "Uncover and brown",
    description:
      "Сняла верхнюю фольгу, прибавила температуру до 200 °C и подержала ещё 15–20 минут — чтобы кожа стала румяной. Готовую утку с яблоками, черносливом и чесноком подавала горячей, обязательно с ягодным соусом — у нас был брусничный.",
    description_en:
      "Remove the top layer of foil, turn the heat up to 200 °C and give it another 15–20 minutes — so the skin turns golden. Serve the finished duck with the apples, prunes and garlic hot, and always with a berry sauce — ours was lingonberry.",
  },
];

// ── Категории (по slug — id резолвим из БД) ───────────────────────────────────

const categorySlugs = [
  "goryachee", // meal_type: Горячее
  "russkaya", // country: Русская
  "myaso", // ingredient: Мясо
  "prazdnik", // season: Праздник (субботний/праздничный стол)
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
