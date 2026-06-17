/**
 * seed-recipe-tort-spartak.mjs — добавляет торт «Спартак» в каталог.
 *
 * Происхождение: рецепт прислала мама (она его пекла, говорит — получился
 * невероятно вкусным). Текст-источник — распечатка из группы ВКонтакте; ссылки
 * и «подпишись на нас» из оригинала выброшены, рецепт переписан под наш тон.
 * Тон note — тёплый, личный (мамин торт), с мягкой оговоркой про КБЖУ.
 *
 * Параметры:
 *   - servings = 12 (торт ~19 см в диаметре и ~12 см высотой, 10 коржей →
 *     ~12 щедрых кусков рич-торта). КБЖУ на порцию зависит от размера куска —
 *     это ориентир (оговорено в note). Калории на порцию при выпечке
 *     сохраняются (уходит только вода) → расчёт честный.
 *   - Категории по slug (резолвим из БД): desert, vypechka, russkaya, prazdnik.
 *
 * Идемпотентен по slug. Запуск:
 *   node scripts/seed-recipe-tort-spartak.mjs           # dry-run
 *   node scripts/seed-recipe-tort-spartak.mjs --write   # реальная вставка
 *
 * После вставки:
 *   - Обложка: node scripts/gen-cover.mjs --title "Торт «Спартак»" --recipe-id <id>
 *   - КБЖУ:    node scripts/calc-nutrition-one.mjs --slug tort-spartak --write
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

const SLUG = "tort-spartak";

// Состав для КБЖУ. Имена под ingredients_base (мука пшеничная / какао / мёд /
// сахар / масло сливочное / яйцо / сметана / крахмал кукурузный / молоко —
// матчатся точно или fuzzy). «Ванильный сахар» парсер трактует как сахар.
// Строки-заголовки секций парсер пропускает (нет граммов).
const ingredientsRu = [
  "Тесто:",
  "Мука пшеничная — 350 г",
  "Какао — 30 г",
  "Сахар — 150 г",
  "Мёд — 70 г",
  "Масло сливочное — 100 г",
  "Яйца — 2 шт.",
  "Сода — 5 г",
  "Разрыхлитель — 5 г",
  "",
  "Крем:",
  "Сметана 20–25% — 515 г",
  "Масло сливочное — 300 г",
  "Сахар — 200 г",
  "Ванильный сахар — 15 г",
  "Крахмал кукурузный — 30 г",
  "Яйца — 2 шт.",
  "",
  "Глазурь:",
  "Сахар — 100 г",
  "Какао — 30 г",
  "Молоко — 50 г",
  "Масло сливочное — 50 г",
].join("\n");

const ingredientsEn = [
  "Dough:",
  "Wheat flour — 350 g",
  "Cocoa powder — 30 g",
  "Sugar — 150 g",
  "Honey — 70 g",
  "Butter — 100 g",
  "Eggs — 2",
  "Baking soda — 5 g",
  "Baking powder — 5 g",
  "",
  "Cream:",
  "Sour cream 20–25% — 515 g",
  "Butter — 300 g",
  "Sugar — 200 g",
  "Vanilla sugar — 15 g",
  "Cornstarch — 30 g",
  "Eggs — 2",
  "",
  "Glaze:",
  "Sugar — 100 g",
  "Cocoa powder — 30 g",
  "Milk — 50 g",
  "Butter — 50 g",
].join("\n");

const recipeData = {
  title: "Торт «Спартак»",
  title_en: "Spartak Cake",
  slug: SLUG,
  // Сенсорное короткое описание — публично скрыто (под заголовком note), но
  // индексируется поиском/SEO.
  description:
    "Классический торт «Спартак» — высокий многослойный шоколадный торт из тонких медово-какао коржей, прослоенных нежным заварным сметанно-масляным кремом и покрытых блестящей шоколадной глазурью. Тёмный ровный срез, мягкая пропитанная текстура, насыщенный шоколадно-медовый вкус.",
  description_en:
    "The classic Spartak cake — a tall, many-layered chocolate cake of thin honey-and-cocoa sponges, layered with a delicate custard-style sour-cream-and-butter cream and finished with a glossy chocolate glaze. A dark, even cross-section, a soft soaked crumb and a rich chocolate-honey flavour.",
  // История — главный текст под заголовком. Тёплый, личный тон (мамин торт).
  note:
    "«Спартак» печёт моя мама — и говорит, что получается невероятно вкусным. И вкус, и красивый тёмный разрез — в нём правда всё хорошо: тонкие медово-шоколадные коржи, мягкий сметанно-масляный крем между ними и блестящая шоколадная глазурь сверху. Главный секрет такого торта — терпение. Собранному торту нужно дать постоять почти сутки: коржи неспешно пропитываются кремом, становятся мягкими, и торт превращается в единое целое с ровным, аккуратным срезом. Тогда он и раскрывается по-настоящему. КБЖУ здесь — ориентир: цифры зависят от того, на сколько кусков вы разрежете торт.",
  note_en:
    "My mum bakes this Spartak cake — and she says it turns out incredibly good. Both the taste and that beautiful dark cross-section: thin honey-and-chocolate layers, a soft sour-cream-and-butter filling between them and a glossy chocolate glaze on top. The real secret to a cake like this is patience. Once assembled it needs to rest for almost a full day: the layers slowly soak up the cream, turn soft, and the cake becomes one whole thing with a clean, even slice. That's when it truly comes into its own. The nutrition here is a guide — the per-serving figures depend on how many pieces you cut the cake into.",
  ingredients: ingredientsRu,
  ingredients_en: ingredientsEn,
  cover_image: null, // обложку поставим отдельно через gen-cover.mjs
  published: true,
  featured: false,
  recipe_type: "food",
  owner_id: null, // авторский каталожный рецепт
  visibility: "public",
  cook_time: 120, // активное время: коржи + крем + глазурь + сборка (пропитка 6–8 ч сверх)
  servings: 12,
};

// ── Шаги (порядок важен) ──────────────────────────────────────────────────────

const steps = [
  {
    order: 1,
    title: "Замесить медово-шоколадное тесто",
    title_en: "Make the honey-chocolate dough",
    description:
      "В кастрюле соедините сливочное масло, мёд и сахар и поставьте на водяную баню, периодически помешивая. Когда сахар разойдётся, вмешайте взбитые яйца. Добавьте соду и проварите смесь, помешивая, ещё около 10 минут. Отдельно просейте муку, смешайте её с какао и разрыхлителем. Влейте тёплую медово-масляную смесь в муку и замесите тесто. Сначала оно будет липким, но по мере остывания станет плотнее — муку больше не добавляйте.",
    description_en:
      "In a saucepan combine the butter, honey and sugar and set over a water bath, stirring now and then. Once the sugar has dissolved, stir in the beaten eggs. Add the baking soda and cook the mixture, stirring, for about 10 more minutes. Separately sift the flour and mix it with the cocoa and baking powder. Pour the warm honey-butter mixture into the flour and knead a dough. It will be sticky at first, but firms up as it cools — don't add any more flour.",
  },
  {
    order: 2,
    title: "Охладить и разделить тесто",
    title_en: "Chill and divide the dough",
    description:
      "Дайте тесту полежать 15–20 минут. Затем разделите его на 8–9 частей, прикройте плёнкой и уберите в холодильник примерно на 30 минут — с охлаждённым тестом удобнее работать.",
    description_en:
      "Let the dough rest for 15–20 minutes. Then divide it into 8–9 pieces, cover with film and refrigerate for about 30 minutes — chilled dough is much easier to work with.",
  },
  {
    order: 3,
    title: "Раскатать и испечь коржи",
    title_en: "Roll out and bake the layers",
    description:
      "Каждый кусок теста раскатывайте на пергаменте, присыпанном мукой, толщиной 2–3 мм. Сразу вырежьте круг (удобно по тарелке), а обрезки отложите — из них выйдет ещё один корж или несколько печений к чаю. Наколите корж вилкой и выпекайте при 180 °C буквально 4–5 минут, не пересушивая. Так испеките все коржи; удобно работать на двух листах пергамента — пока один корж печётся, на втором раскатываете следующий.",
    description_en:
      "Roll each piece of dough on flour-dusted parchment to a thickness of 2–3 mm. Cut out a circle straight away (a plate works well as a guide) and set the trimmings aside — they'll make one more layer or a few cookies for tea. Prick the layer with a fork and bake at 180 °C for literally 4–5 minutes, without over-drying it. Bake all the layers this way; it's handy to use two sheets of parchment — while one layer bakes, you roll out the next on the other.",
  },
  {
    order: 4,
    title: "Сварить заварную основу крема",
    title_en: "Cook the custard base for the cream",
    description:
      "Соедините сметану с сахаром, ванильным сахаром, яйцами и крахмалом и поставьте на водяную баню. Помешивая, проварите смесь до загустения — примерно 15 минут. Переложите крем в миску и полностью остудите.",
    description_en:
      "Combine the sour cream with the sugar, vanilla sugar, eggs and cornstarch and set over a water bath. Stirring, cook the mixture until thickened — about 15 minutes. Transfer the cream to a bowl and cool it completely.",
  },
  {
    order: 5,
    title: "Взбить масло и собрать крем",
    title_en: "Whip the butter and finish the cream",
    description:
      "Мягкое сливочное масло взбейте 5–7 минут, пока оно не станет светлым и воздушным. Затем по одной ложке добавляйте остывшую сметанную основу, каждый раз тщательно взбивая, — крем получится гладким и стабильным.",
    description_en:
      "Whip the softened butter for 5–7 minutes until it is pale and airy. Then add the cooled sour-cream base a spoonful at a time, whisking thoroughly after each addition — the cream will come out smooth and stable.",
  },
  {
    order: 6,
    title: "Сварить шоколадную глазурь",
    title_en: "Cook the chocolate glaze",
    description:
      "В ковшике смешайте какао с сахаром, добавьте молоко и поставьте на медленный огонь. Постоянно помешивая, доведите смесь до появления пузырьков и проварите 2–3 минуты. Снимите с огня, добавьте сливочное масло и размешайте до гладкости.",
    description_en:
      "In a small pan mix the cocoa with the sugar, add the milk and set over low heat. Stirring constantly, bring the mixture to a bubble and cook for 2–3 minutes. Remove from the heat, add the butter and stir until smooth.",
  },
  {
    order: 7,
    title: "Собрать торт и дать пропитаться",
    title_en: "Assemble the cake and let it soak",
    description:
      "Собирайте торт, чередуя слои: корж — крем — корж — крем. Верх и бока промажьте тонким слоем крема, дайте ему чуть впитаться, а затем покройте торт шоколадной глазурью. Самое важное — дать торту пропитаться 6–8 часов, а лучше почти сутки: коржи станут мягкими, и торт будет идеальным.",
    description_en:
      "Assemble the cake in alternating layers: sponge — cream — sponge — cream. Spread a thin layer of cream over the top and sides, let it soak in a little, then cover the cake with the chocolate glaze. The most important part — let the cake rest and soak for 6–8 hours, ideally almost a full day: the layers turn soft and the cake becomes perfect.",
  },
];

// ── Категории (по slug — id резолвим из БД) ───────────────────────────────────

const categorySlugs = [
  "desert", // meal_type: Десерт
  "vypechka", // meal_type: Выпечка
  "russkaya", // country: Русская (классический советский торт)
  "prazdnik", // season: Праздник
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
