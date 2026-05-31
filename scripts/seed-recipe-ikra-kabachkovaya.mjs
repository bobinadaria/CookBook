/**
 * seed-recipe-ikra-kabachkovaya.mjs — добавляет «Икра кабачковая» в каталог.
 *
 * Происхождение: рецепт от маминой подруги (рукописная бумажка с
 * восклицательными знаками «пальчики оближешь!!!!!»). В составе изменено
 * количество томатной пасты: вместо 1 стакана — 1/3 стакана (так кабачок и
 * морковь звучат громче).
 *
 * Что делает:
 *   1. Создаёт запись в `recipes` (owner_id=null → каталожный рецепт).
 *   2. Создаёт шаги в `steps`.
 *   3. Привязывает категории (meal_type, country, ingredient, season).
 *
 * Идемпотентен по slug: если рецепт с этим slug уже есть — НЕ создаёт второй.
 *
 * Запуск:
 *   node scripts/seed-recipe-ikra-kabachkovaya.mjs           # dry-run
 *   node scripts/seed-recipe-ikra-kabachkovaya.mjs --write   # реальная вставка
 *
 * После вставки:
 *   - Обложка:
 *       node scripts/gen-cover.mjs --title "Икра кабачковая" --recipe-id <id>
 *   - КБЖУ:
 *       node scripts/recalc-all-nutrition.mjs --write
 *     (или /admin → рецепт → «Рассчитать»).
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

const SLUG = "ikra-kabachkovaya";

const ingredientsRu = [
  "Кабачки очищенные — 2 кг",
  "Морковь — 1 кг",
  "Лук репчатый — 0,5 кг",
  "Томатная паста — ⅓ стакана",
  "Растительное масло — 1 стакан (½ для лука, ½ для моркови)",
  "Соль — 1 ст. л. с горкой",
  "Сахар — 2 ст. л. с горкой",
  "Уксусная эссенция — 1 десертная ложка",
].join("\n");

const ingredientsEn = [
  "Peeled zucchini — 2 kg",
  "Carrots — 1 kg",
  "Yellow onion — 0.5 kg",
  "Tomato paste — ⅓ cup",
  "Vegetable oil — 1 cup (½ for the onion, ½ for the carrots)",
  "Salt — 1 heaping tbsp",
  "Sugar — 2 heaping tbsp",
  "Vinegar essence (70%) — 1 dessert spoon",
].join("\n");

const recipeData = {
  title: "Икра кабачковая",
  title_en: "Zucchini Caviar",
  slug: SLUG,
  // Сенсорное короткое описание — публично скрыто (под заголовком теперь note),
  // но индексируется поиском/SEO. Держим коротко.
  description:
    "Густая домашняя икра из тушёных кабачков, моркови и лука с томатной пастой и щепоткой сахара — летняя классика, которую можно разложить горячей по банкам.",
  description_en:
    "A thick homemade spread of slow-stewed zucchini, carrots and onion with tomato paste and a touch of sugar — a summer classic you can ladle hot into jars.",
  // История — главный текст под заголовком на странице рецепта.
  note:
    "Это рецепт от маминой подруги — рукописная бумажка с восклицательными знаками: «пальчики оближешь!!!!!». В августе, когда кабачки на даче растут быстрее, чем мы успеваем их съесть, я возвращаюсь к этой бумажке. Она спасала маму, теперь спасает меня. На вкус — не магазинная икра из банки, а домашняя, с медовой сладостью моркови и густым ароматом лета. Томатной пасты я кладу в три раза меньше, чем в оригинале: чтобы кабачок и морковь звучали в полный голос.",
  note_en:
    "This recipe came from my mum's friend — a handwritten note covered in exclamation marks: \"finger-licking good!!!!!\". In August, when the zucchini at the dacha grows faster than we can eat it, I come back to that scrap of paper. It used to rescue my mum, now it rescues me. The taste is nothing like the jarred caviar from the store — it's homemade, with the honeyed sweetness of stewed carrots and the deep aroma of summer. I use a third of the tomato paste the original calls for, so the zucchini and carrots can speak in their full voice.",
  ingredients: ingredientsRu,
  ingredients_en: ingredientsEn,
  cover_image: null, // обложку поставим отдельно через gen-cover.mjs
  published: true,
  featured: false,
  recipe_type: "food",
  owner_id: null, // авторский каталожный рецепт
  visibility: "public",
  cook_time: 90, // ~25 мин кабачки + ~15 лук + ~20 морковь + 30-40 финиш
  servings: 12, // ~2,2 кг готовой икры, по ~180 г на порцию
};

// ── Шаги (порядок важен) ─────────────────────────────────────────────────────

const steps = [
  {
    order: 1,
    title: "Кабачки — в кастрюле",
    title_en: "Zucchini — in the pot",
    description:
      "Очищенные кабачки нарезать кубиками и потушить на среднем огне в кастрюле до мягкости — без масла, в собственном соку. Помешивать, чтобы не пригорело снизу. Около 25 минут.",
    description_en:
      "Dice the peeled zucchini and stew it over medium heat in a pot until soft — no oil, just its own juices. Stir occasionally so the bottom doesn't catch. About 25 minutes.",
  },
  {
    order: 2,
    title: "Лук — на сковороде с маслом",
    title_en: "Onion — in a pan with oil",
    description:
      "Лук нарезать мелко и отправить на сковороду с ½ стакана растительного масла. Тушить на среднем огне до мягкости и лёгкой золотинки, около 10–15 минут.",
    description_en:
      "Chop the onion finely and add it to a pan with ½ cup of vegetable oil. Stew over medium heat until soft and lightly golden, about 10–15 minutes.",
  },
  {
    order: 3,
    title: "Морковь — на сковороде с маслом",
    title_en: "Carrots — in a pan with oil",
    description:
      "Морковь натереть на крупной тёрке или нарезать тонкими брусочками. На второй сковороде с ½ стакана масла тушить до мягкости — морковь должна стать сладкой и податливой, около 15–20 минут.",
    description_en:
      "Coarsely grate the carrots or cut them into thin sticks. In a second pan with ½ cup of oil, stew until soft — the carrots should turn sweet and tender, about 15–20 minutes.",
  },
  {
    order: 4,
    title: "Пюрировать и соединить",
    title_en: "Purée and combine",
    description:
      "Готовые кабачки, лук и морковь соединить. Перемолоть блендером частями до однородной густой массы (или оставить лёгкую текстуру — на свой вкус) и вернуть в большую кастрюлю.",
    description_en:
      "Combine the cooked zucchini, onion and carrots. Blend in batches until smooth and thick (or leave a little texture if you like) and return everything to the large pot.",
  },
  {
    order: 5,
    title: "Томатная паста, соль, сахар — тушить",
    title_en: "Tomato paste, salt, sugar — keep stewing",
    description:
      "Добавить ⅓ стакана томатной пасты, 1 столовую ложку соли с горкой и 2 столовые ложки сахара с горкой. Перемешать. Тушить на медленном огне ещё 30–40 минут, периодически помешивая, чтобы не пригорело.",
    description_en:
      "Add ⅓ cup of tomato paste, 1 heaping tablespoon of salt and 2 heaping tablespoons of sugar. Stir. Simmer over low heat for another 30–40 minutes, stirring from time to time so it doesn't catch.",
  },
  {
    order: 6,
    title: "Уксусная эссенция и банки",
    title_en: "Vinegar essence and jars",
    description:
      "В самом конце влить десертную ложку уксусной эссенции, аккуратно перемешать. Разложить икру горячей по чистым банкам и плотно закрыть — на зиму. Или дать остыть и подавать сразу с тёплым хлебом.",
    description_en:
      "Right at the end, pour in a dessert spoon of vinegar essence and stir gently. Ladle the caviar hot into clean jars and seal tightly — for winter. Or let it cool and serve straight away with warm bread.",
  },
];

// ── Категории (по id) ────────────────────────────────────────────────────────

const categoryIds = [
  "bdf6da69-9c1f-4039-8f70-c01bc9e98ab0", // meal_type: Заготовки (Preserves & Larder)
  "2f59e03c-8a0c-4cce-9098-8bccf738bb3c", // country:   Русская (Russian)
  "d31bd46b-c703-499e-8b36-65eac567e825", // ingredient: Овощи (Vegetables)
  "807ddee6-a16f-4622-9ddc-7477568c5746", // season:    Лето (Summer)
];

// ── Run ──────────────────────────────────────────────────────────────────────

async function main() {
  // 0. Проверка дубля по slug
  const { data: existing } = await supabase
    .from("recipes")
    .select("id, title")
    .eq("slug", SLUG)
    .maybeSingle();

  if (existing) {
    console.log(`ℹ️  Рецепт с slug «${SLUG}» уже существует:`);
    console.log(`   id:    ${existing.id}`);
    console.log(`   title: ${existing.title}`);
    console.log("   ничего не делаю. Удали запись вручную или поменяй SLUG в скрипте.");
    return;
  }

  // 1. Препросмотр
  console.log("──────────── РЕЦЕПТ ────────────");
  console.log(`title:     ${recipeData.title}`);
  console.log(`title_en:  ${recipeData.title_en}`);
  console.log(`slug:      ${recipeData.slug}`);
  console.log(`cook_time: ${recipeData.cook_time} мин`);
  console.log(`servings:  ${recipeData.servings}`);
  console.log(`published: ${recipeData.published}`);
  console.log("\n── note (история) ──");
  console.log(recipeData.note);
  console.log("\n── description (сенсорное) ──");
  console.log(recipeData.description);
  console.log("\n── ingredients ──");
  console.log(recipeData.ingredients);
  console.log("\n── steps ──");
  for (const s of steps) {
    console.log(`  ${s.order}. ${s.title}`);
    console.log(`     ${s.description}`);
  }
  console.log(`\n── categories (${categoryIds.length}) ──`);
  console.log(categoryIds.join(", "));
  console.log("──────────────────────────────────\n");

  if (!apply) {
    console.log("dry-run. Перезапусти с --write, чтобы реально записать в БД.");
    return;
  }

  // 2. Insert recipe
  const { data: inserted, error: recipeErr } = await supabase
    .from("recipes")
    .insert(recipeData)
    .select("id, slug, title")
    .single();
  if (recipeErr || !inserted) {
    console.error("✗ не удалось вставить рецепт:", recipeErr);
    process.exit(1);
  }
  console.log(`✅ recipe inserted: ${inserted.id}  /recipes/${inserted.slug}`);

  // 3. Insert steps
  const stepsPayload = steps.map((s) => ({ ...s, recipe_id: inserted.id, photo_url: null }));
  const { error: stepsErr } = await supabase.from("steps").insert(stepsPayload);
  if (stepsErr) {
    console.error("✗ не удалось вставить шаги:", stepsErr);
    process.exit(1);
  }
  console.log(`✅ steps inserted: ${stepsPayload.length}`);

  // 4. Insert recipe_categories
  const rcPayload = categoryIds.map((category_id) => ({
    recipe_id: inserted.id,
    category_id,
  }));
  const { error: rcErr } = await supabase.from("recipe_categories").insert(rcPayload);
  if (rcErr) {
    console.error("✗ не удалось привязать категории:", rcErr);
    process.exit(1);
  }
  console.log(`✅ categories linked: ${rcPayload.length}`);

  console.log("\n────────────────────────────────");
  console.log(`Готово. ID нового рецепта: ${inserted.id}`);
  console.log("Что дальше:");
  console.log(`  • Обложка: node scripts/gen-cover.mjs --title "${recipeData.title}" --recipe-id ${inserted.id}`);
  console.log(`  • КБЖУ:    node scripts/recalc-all-nutrition.mjs --write`);
}

main().catch((e) => {
  console.error("✗ unexpected:", e);
  process.exit(1);
});
