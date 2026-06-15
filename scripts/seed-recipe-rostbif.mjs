/**
 * seed-recipe-rostbif.mjs — добавляет «Ростбиф» в каталог (раздел «Заготовки»).
 *
 * Происхождение: подсмотренный рецепт мясной заготовки. Тон — нейтральный
 * (не личная история): ростбиф готовится один раз, тонко режется и неделю
 * выручает на завтрак / в бутерброд / холодной нарезкой. Экономит время.
 *
 * Параметры (подтверждены Дарьей):
 *   - 800 г говяжьей вырезки → ~600 г готового ростбифа.
 *   - servings = 6 (≈100 г готового на порцию; заготовка, едят понемногу).
 *     КБЖУ показывается на одну порцию (на одного человека).
 *   - Категория «Заготовки» (zagotovki, тип meal_type) уже есть в БД —
 *     НЕ заводим заново. Дополнительно вешаем «Мясо» (myaso, ingredient).
 *
 * Что делает:
 *   1. Создаёт запись в `recipes` (owner_id=null → каталожный рецепт).
 *   2. Создаёт шаги в `steps`.
 *   3. Привязывает категории ПО SLUG (резолвит id из БД на лету).
 *
 * Идемпотентен по slug: если рецепт с этим slug уже есть — НЕ создаёт второй.
 *
 * Запуск:
 *   node scripts/seed-recipe-rostbif.mjs           # dry-run
 *   node scripts/seed-recipe-rostbif.mjs --write   # реальная вставка
 *
 * После вставки:
 *   - Обложка: node scripts/gen-cover.mjs --title "Ростбиф" --recipe-id <id>
 *   - КБЖУ:    node scripts/calc-nutrition-one.mjs --slug rostbif --write
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

const SLUG = "rostbif";

// Состав для КБЖУ: имена подобраны под ingredients_base (вырезка / масло /
// горчица матчатся точно или fuzzy). Специи «по вкусу» парсер пропускает
// (нет граммов) — на расчёт не влияют.
const ingredientsRu = [
  "Говяжья вырезка — 800 г",
  "Масло растительное — 1 ст. л. (~15 г, втереть в мясо)",
  "Горчица — 1 ст. л. (~15 г)",
  "Соль — по вкусу",
  "Перец чёрный молотый — по вкусу",
  "Лимонный перец — по вкусу",
  "Паприка сладкая (хлопья) — по вкусу",
].join("\n");

const ingredientsEn = [
  "Beef tenderloin — 800 g",
  "Vegetable oil — 1 tbsp (~15 g, rubbed into the meat)",
  "Mustard — 1 tbsp (~15 g)",
  "Salt — to taste",
  "Black pepper, ground — to taste",
  "Lemon pepper — to taste",
  "Sweet paprika (flakes) — to taste",
].join("\n");

const recipeData = {
  title: "Ростбиф",
  title_en: "Roast Beef",
  slug: SLUG,
  // Сенсорное короткое описание — публично скрыто (под заголовком теперь note),
  // но индексируется поиском/SEO.
  description:
    "Говяжья вырезка, обжаренная до корочки и запечённая до средней прожарки (57 °C), тонко нарезанная мясная заготовка. Нежное мясо, лёгкая горчично-перечная корочка; хранится в контейнере, годится для бутербродов и холодной нарезки.",
  description_en:
    "Beef tenderloin seared to a crust and roasted to medium (57 °C), then thinly sliced — a make-ahead meat staple. Tender meat with a light mustard-and-pepper crust; keeps in a container, perfect for sandwiches and a cold cut.",
  // История — главный текст под заголовком. Нейтральный тон (по выбору Дарьи).
  note:
    "Ростбиф — идеальная мясная заготовка. Запекаешь один кусок вырезки до нежной средней прожарки, даёшь ему отдохнуть и остыть, тонко нарезаешь — и на неделю вперёд есть что положить в бутерброд, добавить к завтраку или подать к столу холодной нарезкой. Готовится просто, а выглядит и звучит по-ресторанному. Главный секрет — не резать мясо сразу: дать ему полностью отдохнуть, чтобы соки разошлись по куску и срез получился ровным и сочным.",
  note_en:
    "Roast beef is the perfect make-ahead meat. You roast a single piece of tenderloin to a tender medium, let it rest and cool, slice it thin — and for a week ahead you have something to tuck into a sandwich, add to breakfast or lay out as a cold cut. Simple to make, yet it looks and sounds restaurant-worthy. The key is not to cut the meat right away: let it rest fully so the juices settle through the piece and every slice comes out even and moist.",
  ingredients: ingredientsRu,
  ingredients_en: ingredientsEn,
  cover_image: null, // обложку поставим отдельно через gen-cover.mjs
  published: true,
  featured: false,
  recipe_type: "food",
  owner_id: null, // авторский каталожный рецепт
  visibility: "public",
  cook_time: 70, // преп + обжарка ~10 мин + ~25 мин духовка + ~30 мин отдых
  servings: 6,
};

// ── Шаги (порядок важен; нейтральный, инструктивный тон) ──────────────────────

const steps = [
  {
    order: 1,
    title: "Зачистить и перевязать мясо",
    title_en: "Trim and tie the meat",
    description:
      "У говядины убрать лишние жилы и плёнку — нужен чистый кусок мяса. Перевязать его кулинарной нитью, чтобы при готовке вырезка держала форму. Посолить, поперчить, добавить немного масла и хорошо втереть всё в мясо со всех сторон.",
    description_en:
      "Trim the beef of any sinew and silver skin — you want a clean piece of meat. Tie it with kitchen twine so the tenderloin holds its shape while cooking. Season with salt and pepper, add a little oil and rub everything well into the meat on all sides.",
  },
  {
    order: 2,
    title: "Запечатать на сковороде",
    title_en: "Sear in a pan",
    description:
      "Разогреть сковороду и на сильном огне обжарить говядину со всех сторон, включая бока, примерно по минуте на каждую — так мы «запечатываем» мясо и сохраняем сочность.",
    description_en:
      "Heat a pan and sear the beef over high heat on all sides, including the edges, about a minute each — this seals the meat and keeps it juicy.",
  },
  {
    order: 3,
    title: "Смазать горчицей и запечь",
    title_en: "Brush with mustard and roast",
    description:
      "Переложить мясо в форму, смазать тонким слоем горчицы, сверху можно добавить ещё немного перца. Запекать в разогретой до 190 °C духовке около 25 минут. Точное время зависит от размера куска и желаемой прожарки — лучше ориентироваться на термощуп в середине мяса: 57 °C для идеальной средней прожарки.",
    description_en:
      "Move the meat to a baking dish, brush with a thin layer of mustard and add a little more pepper on top if you like. Roast in an oven preheated to 190 °C for about 25 minutes. The exact time depends on the size of the piece and the doneness you want — go by a thermometer in the centre of the meat: 57 °C for a perfect medium.",
  },
  {
    order: 4,
    title: "Дать отдохнуть и нарезать",
    title_en: "Rest, then slice",
    description:
      "Важно: не резать мясо сразу. Переложить его в фольгу и дать постоять минут 30 или до полного остывания — так соки разойдутся по куску. Затем нарезать острым ножом тонкими ломтиками. Хранить в контейнере; при желании ростбиф можно заморозить.",
    description_en:
      "Important: don't cut the meat straight away. Wrap it in foil and let it sit for about 30 minutes, or until fully cooled — this lets the juices settle through the piece. Then slice thinly with a sharp knife. Store in a container; if you like, the roast beef can also be frozen.",
  },
];

// ── Категории (по slug — id резолвим из БД) ───────────────────────────────────
// «Заготовки» (zagotovki) уже есть в таксономии (тип meal_type) — не создаём.

const categorySlugs = [
  "zagotovki", // meal_type: Заготовки
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
