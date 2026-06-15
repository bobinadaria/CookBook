/**
 * seed-recipe-klyukvennyy-sous.mjs — «Клюквенный соус к утке».
 *
 * Происхождение: мамин рецепт (тот самый ягодный соус, который подаётся к
 * запечённой утке). Связан перекрёстной ссылкой с рецептом
 * «Утка с яблоками, черносливом и чесноком» (slug utka-s-yablokami-i-chernoslivom):
 *   • здесь, в note и финальном шаге — ссылка ВПЕРЁД на утку;
 *   • в рецепте утки (отдельный патч-скрипт) — ссылка НАЗАД на этот соус.
 *
 * ⚠ КБЖУ — «мягкий» кейс. Соус уваривается (уходит вода) и процеживается
 *   (часть клюквенной мякоти/кожуры остаётся в сите), плюс сахар «по вкусу».
 *   Детерминированный движок считает сумму сырья / порции — это близко к правде
 *   по калориям (их дают в основном сахар и вино, они растворяются и остаются),
 *   но это НЕ обещание ±5%, а ориентир. Порции = 6 (соус-приправа, ~2 ст. л.).
 *
 * Предпосылки: node scripts/seed-sous-prereqs.mjs --write   (категория + ингредиенты)
 *
 * Запуск:
 *   node scripts/seed-recipe-klyukvennyy-sous.mjs           # dry-run
 *   node scripts/seed-recipe-klyukvennyy-sous.mjs --write   # реальная вставка
 *
 * После вставки:
 *   - Обложка: node scripts/gen-cover.mjs --title "Клюквенный соус" --recipe-id <id>
 *   - КБЖУ:    node scripts/calc-nutrition-one.mjs --slug klyukvennyy-sous --write
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(".env.local") });

const apply = process.argv.includes("--write");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("✗ Supabase env missing");
  process.exit(1);
}
let URL = SUPABASE_URL;
if (URL && !URL.startsWith("http")) URL = `https://${URL}.supabase.co`;
const supabase = createClient(URL, SERVICE_KEY);

// ── Рецепт ───────────────────────────────────────────────────────────────────

const SLUG = "klyukvennyy-sous";
const DUCK_SLUG = "utka-s-yablokami-i-chernoslivom";

const ingredientsRu = [
  "Клюква (можно замороженную) — 300 г",
  "Красное сухое вино — 0,5 стакана (~120 г)",
  "Апельсиновый сок — с 1 апельсина (~75 г)",
  "Коричневый сахар — 6 ст. л. (~90 г), по вкусу",
].join("\n");

const ingredientsEn = [
  "Cranberries (frozen are fine) — 300 g",
  "Dry red wine — 1/2 cup (~120 g)",
  "Orange juice — from 1 orange (~75 g)",
  "Brown sugar — 6 tbsp (~90 g), to taste",
].join("\n");

const recipeData = {
  title: "Клюквенный соус к утке",
  title_en: "Cranberry Sauce for Duck",
  slug: SLUG,
  // Сенсорное короткое описание — публично скрыто (под заголовком стоит note),
  // но индексируется поиском/SEO.
  description:
    "Густой кисло-сладкий клюквенный соус на красном сухом вине с апельсиновым соком и коричневым сахаром: клюкву протирают, уваривают 30–40 минут и процеживают до бархатистой гладкости. Подаётся тёплым к утке и другой запечённой птице.",
  description_en:
    "A thick sweet-and-sour cranberry sauce on dry red wine with orange juice and brown sugar: the berries are mashed, simmered for 30–40 minutes and strained until velvety smooth. Served warm with duck and other roast poultry.",
  // История — главный текст под заголовком на странице рецепта (с ссылкой на утку).
  note:
    "Это мамин соус — тот самый ягодный соус, без которого у нас не обходится " +
    "[утка, запечённая с яблоками, черносливом и чесноком](/recipes/" +
    DUCK_SLUG +
    "). Клюква, красное вино и апельсин увариваются вместе до густоты и тёмного " +
    "рубинового цвета, а коричневый сахар добавляется по вкусу — соус должен " +
    "получиться кисло-сладким, чтобы оттенять жирную птицу. Хочешь гуще — увари " +
    "подольше. Готовый соус процеживают через сито, и он становится гладким, как бархат.",
  note_en:
    "This is Mum's sauce — the very berry sauce we can't serve our " +
    "[duck baked with apples, prunes and garlic](/recipes/" +
    DUCK_SLUG +
    ") without. Cranberries, red wine and orange simmer together until thick and " +
    "deep ruby, with brown sugar added to taste — the sauce should be sweet-and-sour " +
    "to cut through the rich bird. Want it thicker? Simmer it longer. The finished " +
    "sauce is strained through a sieve until it turns smooth as velvet.",
  ingredients: ingredientsRu,
  ingredients_en: ingredientsEn,
  cover_image: null, // обложку поставим отдельно через gen-cover.mjs
  published: true,
  featured: false,
  recipe_type: "food",
  owner_id: null, // авторский каталожный рецепт
  visibility: "public",
  cook_time: 45, // ~5–10 мин преп + 30–40 мин уваривания
  servings: 6, // соус-приправа, ~2 ст. л. на порцию
};

// ── Шаги (мамин тёплый тон) ───────────────────────────────────────────────────

const steps = [
  {
    order: 1,
    title: "Протереть клюкву",
    title_en: "Mash the cranberries",
    description:
      "Протри 300 г клюквы — подойдёт и замороженная, дай ей сначала немного оттаять. Так ягода легче отдаст сок и мякоть.",
    description_en:
      "Mash 300 g of cranberries — frozen ones work too, just let them thaw a little first. This way the berries release their juice and pulp more easily.",
  },
  {
    order: 2,
    title: "Соединить в кастрюле",
    title_en: "Combine in a saucepan",
    description:
      "Переложи клюкву в кастрюлю. Добавь полстакана красного сухого вина, сок одного апельсина и коричневый сахар — около 6 столовых ложек, но клади по вкусу.",
    description_en:
      "Transfer the cranberries to a saucepan. Add half a cup of dry red wine, the juice of one orange and the brown sugar — about 6 tablespoons, but add it to taste.",
  },
  {
    order: 3,
    title: "Уваривать 30–40 минут",
    title_en: "Simmer for 30–40 minutes",
    description:
      "Увари соус на тихом огне от 30 до 40 минут, помешивая. Если хочешь, чтобы он был гуще, держи на плите дольше — он сам загустеет по мере выпаривания.",
    description_en:
      "Simmer the sauce over low heat for 30 to 40 minutes, stirring now and then. If you want it thicker, keep it on the stove longer — it will thicken on its own as the liquid reduces.",
  },
  {
    order: 4,
    title: "Процедить — и готово",
    title_en: "Strain — and it's ready",
    description:
      "Процеди готовый соус через сито, чтобы он стал гладким и бархатистым. Подавай тёплым к " +
      "[запечённой утке](/recipes/" +
      DUCK_SLUG +
      ") или другой птице. Соус готов!",
    description_en:
      "Strain the finished sauce through a sieve so it turns smooth and velvety. Serve it warm with " +
      "[roast duck](/recipes/" +
      DUCK_SLUG +
      ") or other poultry. The sauce is ready!",
  },
];

// ── Категории (по slug — id резолвим из БД) ───────────────────────────────────

const categorySlugs = [
  "sousy", // meal_type: Соусы (создаётся в seed-sous-prereqs.mjs)
  "russkaya", // country: Русская
  "frukty", // ingredient: Фрукты (клюква-ягода)
  "prazdnik", // season: Праздник (праздничный стол к утке)
];

async function resolveCategoryIds(slugs) {
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name, type")
    .in("slug", slugs);
  if (error) throw new Error(`categories lookup: ${error.message}`);
  const found = new Map(data.map((c) => [c.slug, c]));
  const missing = slugs.filter((sl) => !found.has(sl));
  if (missing.length) {
    console.error(`✗ не найдены категории по slug: ${missing.join(", ")} — прогони seed-sous-prereqs.mjs --write`);
    process.exit(1);
  }
  return slugs.map((sl) => found.get(sl));
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
