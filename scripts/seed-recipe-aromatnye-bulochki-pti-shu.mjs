/**
 * seed-recipe-aromatnye-bulochki-pti-shu.mjs — «Ароматные булочки пти-шу».
 *
 * Происхождение: кулинарная книга (тот же спиральный сборник, что и профитроли
 * с соусом тоффи, рецепт 104). Несладкие заварные булочки (pâte à choux) с
 * выбором из нескольких начинок — закуска для застолья.
 *
 * ВАЖНО — КБЖУ НЕ СЧИТАЕМ. Начинки в рецепте — НА ВЫБОР (лосось ИЛИ креветки
 * ИЛИ яично-анчоусная ИЛИ икра ИЛИ икорный крем). Суммировать все начинки =
 * абсурдная калорийность; единая цифра на «рецепт» вводила бы в заблуждение
 * (см. плов — составные/вариативные блюда мимо). Поэтому nutrition оставляем
 * null, публичный блок КБЖУ не показывается. Это сознательно и честно.
 *
 * Тесто — заварное (как для профитролей, рецепт 349). На странице 104 даны
 * ингредиенты теста (вода/масло/мука/яйца); сам способ — стандартное pâte à
 * choux (выписан в шагах). Когда придёт фото стр. 349, можно будет сверить
 * точную формулировку теста и для этого рецепта, и для профитролей.
 *
 * servings = 10 информативно (выход 30–40 булочек на компанию); на КБЖУ не
 * влияет, т.к. расчёт не делаем.
 *
 * Идемпотентен по slug. Запуск:
 *   node scripts/seed-recipe-aromatnye-bulochki-pti-shu.mjs           # dry-run
 *   node scripts/seed-recipe-aromatnye-bulochki-pti-shu.mjs --write   # вставка
 *
 * После вставки (КБЖУ НЕ запускать):
 *   - Обложка: node scripts/gen-cover.mjs --title "Ароматные булочки пти-шу" --recipe-id <id>
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

const SLUG = "aromatnye-bulochki-pti-shu";

const ingredientsRu = [
  "Тесто (заварное — то же, что для профитролей, рецепт 349):",
  "Вода — 200 мл",
  "Масло сливочное — 100 г",
  "Мука пшеничная — 150 г",
  "Яйца — 4 шт.",
  "",
  "Начинки даны на выбор — приготовьте одну или несколько.",
  "",
  "Лососёвая начинка:",
  "Лосось копчёный — 150 г",
  "Яйца варёные, измельчённые — 3–4 шт.",
  "Майонез — 100 г",
  "Сметана — 50 г",
  "Укроп, тонко измельчённый — 2 ст. л.",
  "Перец белый свежемолотый — по вкусу",
  "",
  "Креветочная начинка:",
  "Майонез — 100 г",
  "Сливки взбитые — 100 г",
  "Креветки отварные, измельчённые — 75–100 г",
  "Укроп, тонко измельчённый — 3 ст. л.",
  "",
  "Яично-анчоусная начинка:",
  "Яйца, сваренные вкрутую и измельчённые — 3 шт.",
  "Майонез — 100 г и ещё 3 ст. л.",
  "Анчоусное филе, измельчённое — 6–8 кусочков",
  "Паприка — 1/4 ч. л.",
  "Лук, тонко измельчённый — 1 ст. л.",
  "Перец белый свежемолотый — по вкусу",
  "",
  "Икорная начинка:",
  "Икра чёрная — 1 упаковка (60 г)",
  "Сливки густые, взбитые — 200 г",
  "",
  "Икорный крем:",
  "Сливки густые, взбитые — 250 г",
  "Сыр сливочный — 60 г",
  "Икра лососевая — 60 г",
  "Лук, тонко измельчённый — 1–2 ст. л.",
].join("\n");

const ingredientsEn = [
  "Dough (choux — the same as for the profiteroles, recipe 349):",
  "Water — 200 ml",
  "Butter — 100 g",
  "Wheat flour — 150 g",
  "Eggs — 4",
  "",
  "The fillings below are alternatives — make one or several.",
  "",
  "Salmon filling:",
  "Smoked salmon — 150 g",
  "Boiled eggs, chopped — 3–4",
  "Mayonnaise — 100 g",
  "Sour cream — 50 g",
  "Dill, finely chopped — 2 tbsp",
  "Freshly ground white pepper — to taste",
  "",
  "Shrimp filling:",
  "Mayonnaise — 100 g",
  "Whipped cream — 100 g",
  "Cooked shrimp, chopped — 75–100 g",
  "Dill, finely chopped — 3 tbsp",
  "",
  "Egg-and-anchovy filling:",
  "Hard-boiled eggs, chopped — 3",
  "Mayonnaise — 100 g plus 3 tbsp",
  "Anchovy fillets, chopped — 6–8 pieces",
  "Paprika — 1/4 tsp",
  "Onion, finely chopped — 1 tbsp",
  "Freshly ground white pepper — to taste",
  "",
  "Caviar filling:",
  "Black caviar — 1 pack (60 g)",
  "Thick cream, whipped — 200 g",
  "",
  "Caviar cream:",
  "Thick cream, whipped — 250 g",
  "Cream cheese — 60 g",
  "Salmon roe — 60 g",
  "Onion, finely chopped — 1–2 tbsp",
].join("\n");

const recipeData = {
  title: "Ароматные булочки пти-шу",
  title_en: "Aromatic Petit-Chou Puffs",
  slug: SLUG,
  description:
    "Маленькие несладкие заварные булочки (пти-шу) с воздушной хрустящей корочкой и пустой серединкой, которую заполняют нежной начинкой. На выбор — копчёный лосось, креветки, яично-анчоусная масса, чёрная икра со сливками или икорный крем. Изящная закуска на праздничный стол.",
  description_en:
    "Little savoury choux puffs (petit chou) with an airy, crisp shell and a hollow centre to fill with a delicate spread. Choose from smoked salmon, shrimp, an egg-and-anchovy mix, black caviar with cream, or a caviar cream. An elegant appetiser for a festive table.",
  note:
    "Эти крохотные заварные булочки — из той самой кулинарной книги, по которой у нас в семье готовят. Тесто заварное, как для профитролей: булочки выпекаются пустыми внутри, а потом их наполняют — и из простой основы получается нарядная закуска к празднику. Начинки здесь на выбор, от копчёного лосося и креветок до чёрной икры со сливками; можно сделать сразу несколько и собрать целое блюдо разных вкусов. Поэтому единого КБЖУ у рецепта нет — всё зависит от того, какую начинку вы выберете.",
  note_en:
    "These tiny choux puffs come from the very cookbook our family cooks from. The dough is choux pastry, just like for profiteroles: the puffs bake up hollow and are then filled — and a simple base turns into an elegant party appetiser. The fillings here are a matter of choice, from smoked salmon and shrimp to black caviar with cream; you can make several at once and put together a whole platter of different flavours. That's why the recipe has no single nutrition figure — it all depends on the filling you choose.",
  ingredients: ingredientsRu,
  ingredients_en: ingredientsEn,
  cover_image: null,
  published: true,
  featured: false,
  recipe_type: "food",
  owner_id: null,
  visibility: "public",
  cook_time: 60, // по книге: время приготовления ~1 час
  servings: 10, // выход 30–40 булочек; информативно (КБЖУ не считаем)
};

const steps = [
  {
    order: 1,
    title: "Заварить тесто",
    title_en: "Make the choux dough",
    description:
      "В сотейнике доведите воду со сливочным маслом до кипения. Всыпьте сразу всю муку и быстро вымешивайте прямо на огне, пока тесто не соберётся в гладкий комок и не начнёт отставать от стенок и дна. Снимите с огня, дайте немного остыть и по одному вмешайте яйца, каждый раз тщательно вымешивая, — тесто должно стать гладким и блестящим. Это то же заварное тесто, что и для профитролей (рецепт 349).",
    description_en:
      "In a saucepan bring the water and butter to a boil. Tip in all the flour at once and beat quickly over the heat until the dough comes together into a smooth ball and pulls away from the sides and bottom. Remove from the heat, let it cool a little, then beat in the eggs one at a time, mixing thoroughly each time — the dough should turn smooth and glossy. This is the same choux dough as for the profiteroles (recipe 349).",
  },
  {
    order: 2,
    title: "Отсадить и испечь булочки",
    title_en: "Pipe and bake the puffs",
    description:
      "Разогрейте духовку до 200 °C. Скатайте тесто в небольшие шарики (или отсадите из кондитерского мешка) на смазанный жиром противень, оставляя место между ними. Выпекайте, пока булочки не подрумянятся и не увеличатся почти вдвое — ориентировочно от 10 минут. Во время выпечки дверцу духовки лучше не открывать, чтобы булочки не опали. Готовые булочки полностью остудите. Получается около 30–40 штук.",
    description_en:
      "Preheat the oven to 200 °C. Roll the dough into small balls (or pipe them from a pastry bag) onto a greased baking tray, leaving space between them. Bake until the puffs are golden and have almost doubled in size — roughly from 10 minutes. It's best not to open the oven door while baking so the puffs don't collapse. Cool the baked puffs completely. This makes about 30–40 pieces.",
  },
  {
    order: 3,
    title: "Приготовить начинку (на выбор)",
    title_en: "Make a filling (your choice)",
    description:
      "Выберите одну или несколько начинок и соедините её ингредиенты до однородной кремовой массы: лососёвую (копчёный лосось, варёные яйца, майонез, сметана, укроп, белый перец), креветочную (майонез, взбитые сливки, отварные креветки, укроп), яично-анчоусную (рубленые варёные яйца, майонез, анчоусы, паприка, лук, белый перец) или икорный крем (взбитые густые сливки, сливочный сыр, лососевая икра, лук). Чёрную икру со взбитыми сливками просто соедините перед подачей.",
    description_en:
      "Choose one or several fillings and combine its ingredients into a smooth, creamy mixture: salmon (smoked salmon, boiled eggs, mayonnaise, sour cream, dill, white pepper), shrimp (mayonnaise, whipped cream, cooked shrimp, dill), egg-and-anchovy (chopped boiled eggs, mayonnaise, anchovies, paprika, onion, white pepper) or caviar cream (whipped thick cream, cream cheese, salmon roe, onion). For the black caviar simply fold it through the whipped cream just before serving.",
  },
  {
    order: 4,
    title: "Наполнить и подать",
    title_en: "Fill and serve",
    description:
      "У каждой остывшей булочки срежьте верхушку и сделайте в нижней половине небольшую выемку. Заполните её выбранной начинкой (или выложите икру), при желании накройте срезанной верхушкой. Выложите булочки на блюдо, украсьте зеленью и подавайте.",
    description_en:
      "Cut the top off each cooled puff and make a small hollow in the bottom half. Fill it with your chosen filling (or spoon in the caviar) and, if you like, replace the cut-off top. Arrange the puffs on a platter, garnish with herbs and serve.",
  },
];

const categorySlugs = [
  "zakuski", // meal_type: Закуски
  "frantsuzskaya", // country: Французская (pâte à choux / petit chou)
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
