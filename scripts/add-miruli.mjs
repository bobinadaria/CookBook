/**
 * One-off script: insert Miruli (Georgian Chicken in Cream Sauce) recipe.
 * Run: node scripts/add-miruli.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

let SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// If only the project ID was stored, construct the full URL
if (SUPABASE_URL && !SUPABASE_URL.startsWith("http")) {
  SUPABASE_URL = `https://${SUPABASE_URL}.supabase.co`;
}

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ── Category helpers ──────────────────────────────────────────────────────────

function toSlug(title) {
  const CYRILLIC_MAP = {
    а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"yo",ж:"zh",з:"z",и:"i",й:"y",
    к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",
    х:"kh",ц:"ts",ч:"ch",ш:"sh",щ:"shch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya",
  };
  return title.toLowerCase().split("").map((ch) => CYRILLIC_MAP[ch] ?? ch).join("")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
}

async function upsertCategory(name, nameEn, type) {
  const slug = toSlug(name);
  const { data: existing } = await supabase
    .from("categories").select("id").eq("slug", slug).maybeSingle();

  if (existing) {
    console.log(`  ✓ category "${name}" already exists (${existing.id})`);
    return existing.id;
  }

  const { data, error } = await supabase
    .from("categories")
    .insert({ name, name_en: nameEn, slug, type })
    .select("id").single();

  if (error) throw new Error(`Category insert failed: ${error.message}`);
  console.log(`  + created category "${name}" (${data.id})`);
  return data.id;
}

// ── Recipe data ───────────────────────────────────────────────────────────────

const TITLE = "Мирули — курица в сливочном соусе";
const SLUG = toSlug(TITLE);

const DESCRIPTION =
  "Нежная курица в густом сливочном соусе с ароматом хмели-сунели, кинзы и щедрой порцией чеснока. " +
  "Классическое грузинское блюдо, которое готовится просто, а вкус оставляет надолго.";

const NOTE =
  "Это рецептчик Мирули — мой любимый грузинский рецепт, который я часто готовлю, когда хочется чего-то " +
  "сливочного с прекрасным ароматом по всей кухне, с этим волшебным запахом кориандра. " +
  "Я очень люблю большое количество чеснока в этом соусе и жирных сливок. " +
  "В общем, курица получается просто… божественной.";

const INGREDIENTS = `4 куриных ножки (окорочка)
500 мл сливок от 20% (чем жирнее, тем вкуснее, но меньше 15% не берите)
1 головка чеснока (не зубчик, а именно головка — чем больше чеснока, тем лучше)
1 ч. л. с горкой хмели-сунели
1 ст. л. растительного масла
пучок кинзы (можно заменить петрушкой или смешать)
соль, перец по вкусу`;

const STEPS = [
  {
    order: 1,
    title: "Подготовка курицы и чеснока",
    description:
      "Разрежьте куриную ножку на две части: голень и бедро (можно сразу купить эти части или использовать любые другие). " +
      "Очистите чеснок, придавите каждый зубчик плоской стороной ножа и крупно порежьте на 2–3 части.",
  },
  {
    order: 2,
    title: "Маринование",
    description:
      "Посыпьте курицу хмели-сунели, поперчите, посолите, добавьте масло и хорошо перемешайте. " +
      "Оставьте мариноваться на несколько часов. Если нет времени — можно жарить сразу, " +
      "но с маринованием вкус будет богаче.",
  },
  {
    order: 3,
    title: "Обжарка",
    description:
      "Разогрейте сковороду и обжарьте курицу до золотистой корочки с каждой стороны — " +
      "примерно по 5 минут на среднем огне. Когда курица обжарилась, добавьте чеснок и уберите с огня.",
  },
  {
    order: 4,
    title: "Добавление сливок",
    description:
      "Дайте сковороде немного остыть, а чесноку — раскрыть аромат, затем влейте сливки. " +
      "Это важно: если добавить их сразу на горячую сковороду, из-за перепада температур сливки могут свернуться. " +
      "Количество сливок зависит от размера сковороды — главное, чтобы курица была погружена в соус на две трети.",
  },
  {
    order: 5,
    title: "Тушение",
    description:
      "Верните сковороду на огонь, накройте крышкой и тушите на медленном огне 30–40 минут. " +
      "Если соус сильно выкипает, добавьте немного воды.",
  },
  {
    order: 6,
    title: "Финальный штрих",
    description:
      "За 10 минут до окончания добавьте порезанную зелень (кинзу и/или петрушку).",
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("── Step 1: categories ──────────────────────────");
  const georgiaId = await upsertCategory("Грузия", "Georgia", "country");
  const dinnerTypeId = await upsertCategory("Ужины", "Dinners", "meal_time");

  console.log("\n── Step 2: insert recipe ───────────────────────");

  // Check for duplicates
  const { data: existing } = await supabase
    .from("recipes").select("id").eq("slug", SLUG).maybeSingle();

  if (existing) {
    console.log(`Recipe already exists: ${existing.id}`);
    process.exit(0);
  }

  const { data: recipe, error: recipeErr } = await supabase
    .from("recipes")
    .insert({
      title: TITLE,
      slug: SLUG,
      description: DESCRIPTION,
      note: NOTE,
      ingredients: INGREDIENTS,
      published: true,
      featured: false,
    })
    .select("id, slug")
    .single();

  if (recipeErr) throw new Error(`Recipe insert failed: ${recipeErr.message}`);
  console.log(`  + created recipe "${TITLE}" (${recipe.id})`);
  console.log(`    slug: ${recipe.slug}`);

  console.log("\n── Step 3: link categories ─────────────────────");
  const { error: catErr } = await supabase.from("recipe_categories").insert([
    { recipe_id: recipe.id, category_id: georgiaId },
    { recipe_id: recipe.id, category_id: dinnerTypeId },
  ]);
  if (catErr) throw new Error(`Category link failed: ${catErr.message}`);
  console.log("  + linked Грузия + Ужины");

  console.log("\n── Step 4: insert steps ────────────────────────");
  const { error: stepsErr } = await supabase.from("steps").insert(
    STEPS.map((s) => ({ recipe_id: recipe.id, ...s }))
  );
  if (stepsErr) throw new Error(`Steps insert failed: ${stepsErr.message}`);
  console.log(`  + inserted ${STEPS.length} steps`);

  console.log("\n✅ Done!");
  console.log(`   Recipe ID : ${recipe.id}`);
  console.log(`   Slug      : ${recipe.slug}`);
  console.log(`   Next step : open the admin panel and click "Перевести" to generate English translations.`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
