/**
 * seed-recipe-plov.mjs — добавляет «Папин плов в казане» в каталог.
 *
 * Что делает:
 *   1. Создаёт запись в `recipes` (owner_id=null → авторский каталожный рецепт).
 *   2. Создаёт шаги в `steps`.
 *   3. Привязывает категории в `recipe_categories` (meal_type, country,
 *      ingredient, season).
 *
 * Идемпотентен по slug: если рецепт с этим slug уже есть — НЕ создаёт второй,
 * а печатает существующий id и выходит. Чтобы пересоздать — удалить вручную
 * в Supabase или сменить slug ниже.
 *
 * Запуск:
 *   node scripts/seed-recipe-plov.mjs              # dry-run, просто покажет, что вставит
 *   node scripts/seed-recipe-plov.mjs --write      # реальная вставка
 *
 * После вставки (опционально):
 *   - Сгенерировать обложку:
 *       node scripts/gen-cover.mjs --title "Папин плов в казане" --recipe-id <id>
 *   - Пересчитать КБЖУ (либо открыть рецепт в /admin и нажать «Рассчитать», либо):
 *       node scripts/recalc-all-nutrition.mjs --write
 *     (для новых рецептов с пустой nutrition он посчитает; старые с тем же
 *     хешем состава он пропустит.)
 *   - В админке прожать «Перевести» для EN-полей.
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

const SLUG = "plov-v-kazane";

const recipeData = {
  title: "Папин плов в казане",
  slug: SLUG,
  // Сенсорное короткое описание — публично скрыто (под заголовком теперь note),
  // но индексируется поиском/SEO. Держим коротко.
  description:
    "Узбекский плов на дровах в казане: мясо с золотистой корочкой, сладкая морковь, рассыпчатый рис с зирой и барбарисом и целая головка чеснока в середине.",
  // История — главный текст под заголовком на странице рецепта.
  note:
    "Папин плов в казане — это про дачу и большой стол. Когда мы все собираемся, папа разводит огонь, подкладывает мелкие дровишки — и через час над двором стоит запах золотистой моркови, зиры и мяса. У меня большая семья, и часто папа готовит этот плов не только для нас, но и для своих друзей: казан рассчитан на всех, и за столом всегда хватает места.",
  ingredients: [
    "Мясо (баранина или говядина) — 1 кг",
    "Сало или подсолнечное масло — для жарки (масла не больше 0,5 стакана)",
    "Лук репчатый — 3 шт.",
    "Морковь крупная — 4–5 шт.",
    "Рис длиннозёрный — 1 кг",
    "Изюм — пара горстей",
    "Чеснок — 1 целая головка",
    "Барбарис — 1 ст. л.",
    "Зира — по вкусу",
    "Куркума — по вкусу",
    "Перец чёрный молотый — по вкусу",
    "Гвоздика — 3–4 шт.",
    "Соль — по вкусу",
    "Вода — около 3 л",
  ].join("\n"),
  cover_image: null, // обложку поставим отдельно через gen-cover.mjs
  published: true,
  featured: false,
  recipe_type: "food",
  owner_id: null, // авторский каталожный рецепт
  visibility: "public",
  cook_time: 90, // ~1,5 часа от первого огня до отдыха под крышкой
  servings: 10, // 1 кг риса + 1 кг мяса — большая семья + гости
};

// ── Шаги (порядок важен) ─────────────────────────────────────────────────────

const steps = [
  {
    order: 1,
    title: "Нагреть казан",
    description:
      "Поставить казан на сильный огонь и хорошо прогреть — стенки должны быть горячими ещё до того, как вы что-то в него положите.",
  },
  {
    order: 2,
    title: "Растопить жир",
    description:
      "Закинуть кусочки сала и вытопить его до светло-коричневого цвета — это даст плову вкус. Если без сала, налить подсолнечное масло (максимум 0,5 стакана) по стенке казана, чтобы оно стекало вниз.",
  },
  {
    order: 3,
    title: "Обжарить мясо",
    description:
      "Заложить мясо некрупными кусочками. Накрыть казан крышкой на пару минут, периодически перемешивая, пока мясо перестанет быть белым и появится золотистая корочка.",
  },
  {
    order: 4,
    title: "Подготовить овощи, рис и изюм",
    description:
      "Пока мясо обжаривается, нарезать 4–5 крупных морковок соломкой и 3 луковицы — полукольцами. Рис высыпать в чашку и полностью залить водой. Изюм залить холодной водой, потом ополоснуть чистой. Заранее приготовить мелкие дровишки, чтобы регулировать огонь во время приготовления.",
  },
  {
    order: 5,
    title: "Сделать зирвак",
    description:
      "К золотому мясу добавить лук — обжарить, но не сильно. Сразу же забросить морковь и довести её до слегка золотистого состояния.",
  },
  {
    order: 6,
    title: "Специи и рис",
    description:
      "Добавить в зирвак изюм, зиру, куркуму, чёрный перец, 3–4 гвоздички и барбарис. Сверху ровным слоем выложить промытый рис.",
  },
  {
    order: 7,
    title: "Залить воду и поставить чеснок",
    description:
      "Лить воду тонкой струйкой по стенке казана — около 3 литров, чтобы вода стояла на палец выше риса (максимум 1 см). В середину воткнуть целую головку чеснока. Огонь должен быть умеренный: чтобы не горело, но вода тихонько бурлила. Готовить под крышкой примерно 15 минут — точное время зависит от огня.",
  },
  {
    order: 8,
    title: "Проверить готовность и дать отдохнуть",
    description:
      "Когда воды сверху не видно — ложкой отгрести рис от стенки и посмотреть, сколько воды осталось внизу. Когда вода ушла полностью, убрать огонь, аккуратно перемешать ложкой и дать постоять под крышкой минут пять. Вытащить казан из подказанника или полностью убрать огонь. Подавать горячим.",
  },
];

// ── Категории (по id) ────────────────────────────────────────────────────────

const categoryIds = [
  "e9edebd8-b9e2-4c51-8c83-2a3f27554923", // meal_type: Горячее
  "6fcf2d01-1d2e-4092-aa57-44c51171010d", // country: Азиатская
  "7863e860-2dfd-47a7-8133-06c8476d04d5", // ingredient: Мясо
  "807ddee6-a16f-4622-9ddc-7477568c5746", // season: Лето
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
  console.log("Что дальше (по желанию):");
  console.log(`  • Обложка: node scripts/gen-cover.mjs --title "${recipeData.title}" --recipe-id ${inserted.id}`);
  console.log(`  • КБЖУ:    node scripts/recalc-all-nutrition.mjs --write`);
  console.log(`             (или в /admin → рецепт → «Рассчитать КБЖУ»)`);
  console.log(`  • EN:      в /admin прожать «Перевести» для title/note/description/ingredients и шагов`);
}

main().catch((e) => {
  console.error("✗ unexpected:", e);
  process.exit(1);
});
