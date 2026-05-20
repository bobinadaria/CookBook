/**
 * One-off script: insert Куриный паштет (Chicken Liver Pâté) recipe.
 * Run: node scripts/add-pashtet.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

let SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (SUPABASE_URL && !SUPABASE_URL.startsWith("http")) {
  SUPABASE_URL = `https://${SUPABASE_URL}.supabase.co`;
}

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ── Helpers ───────────────────────────────────────────────────────────────────

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

const TITLE = "Куриный паштет";
const SLUG = toSlug(TITLE);

const DESCRIPTION =
  "Нежный домашний паштет из куриной печени со сливками, морковью и ароматными специями. " +
  "Получается шелковистым, богатым по вкусу и совершенно непохожим на магазинный аналог. " +
  "Идеален на завтрак — с хрустящим хлебом, вафлями или как часть лёгкого ужина.";

const NOTE =
  "Этот паштет стал одним из моих любимых блюд для заготовок. Я часто делаю большую порцию, " +
  "раскладываю по порционным кусочкам, заворачиваю каждый в фольгу плотным блоком и убираю в морозилку. " +
  "Потом достаю по одному, размораживаю в холодильнике за ночь — и готово: быстрый завтрак " +
  "или лёгкий перекус. Особенно хорошо подавать с бельгийскими вафлями, ржаным хлебом или свежим " +
  "салатом. Специи играют большую роль — не жалейте кориандра, он идеально дружит с печенью.";

const INGREDIENTS = `500 г куриной печени
1 морковь
1 большая луковица (или 2 маленьких)
50 г сливочного масла
150–200 г жирных сливок (от 20% жирности)
2–3 зубчика чеснока
кориандр, паприка, чили — по вкусу
соль, перец — по вкусу`;

const STEPS = [
  {
    order: 1,
    title: "Подготовка печени",
    description:
      "Промойте куриную печень под холодной водой. Удалите видимые плёнки, жёлчные протоки " +
      "и любые зеленоватые участки — они дают горечь. Нарежьте крупные кусочки пополам. " +
      "По желанию замочите печень в холодном молоке или воде на 20–30 минут — это смягчит вкус.",
  },
  {
    order: 2,
    title: "Нарезка овощей",
    description:
      "Морковь и лук нарежьте мелким кубиком. Чеснок измельчите ножом или пропустите через пресс.",
  },
  {
    order: 3,
    title: "Обсушивание и подготовка масла",
    description:
      "Обсушите печень бумажными полотенцами — это важно для хорошей обжарки. " +
      "Разделите сливочное масло на три примерно равные части: одна пойдёт на первый этап жарки, " +
      "вторая — вместе с печенью, третья — в конце, перед измельчением.",
  },
  {
    order: 4,
    title: "Обжарка овощей",
    description:
      "Разогрейте сковороду на среднем огне. Растопите треть сливочного масла и обжарьте морковь " +
      "и лук, помешивая, до мягкости и лёгкой золотистости — около 5–7 минут.",
  },
  {
    order: 5,
    title: "Добавление печени",
    description:
      "Добавьте подготовленную печень к овощам и жарьте всё вместе на среднем огне, " +
      "помешивая, до исчезновения крови — около 5–7 минут. Печень не должна быть сырой внутри, " +
      "но пересушивать её тоже не стоит: внутри она должна оставаться чуть розоватой.",
  },
  {
    order: 6,
    title: "Сливки и тушение",
    description:
      "Добавьте измельчённый чеснок, специи (кориандр, паприку, чили) и посолите. " +
      "Влейте сливки, перемешайте. Накройте сковороду крышкой и тушите на слабом огне 15 минут.",
  },
  {
    order: 7,
    title: "Измельчение в блендере",
    description:
      "Снимите с огня. Добавьте оставшееся сливочное масло — оно придаст паштету шелковистость. " +
      "Переложите всё содержимое в блендер и измельчите до абсолютно однородной, гладкой массы. " +
      "Попробуйте и при необходимости добавьте соль или специи.",
  },
  {
    order: 8,
    title: "Запекание",
    description:
      "Переложите паштет в форму для запекания (или порционные формочки). " +
      "Отправьте в разогретую до 150–170 °C духовку на 20–30 минут. " +
      "Готовый паштет немного поднимется по краям и приобретёт плотную, " +
      "нарезаемую текстуру. Дайте полностью остыть перед подачей или заморозкой.",
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("── Step 1: categories ──────────────────────────");
  const zakuskiId   = await upsertCategory("Закуски", "Appetizers", "category");
  const zavtrakiId  = await upsertCategory("Завтраки", "Breakfasts", "meal_time");

  console.log("\n── Step 2: insert recipe ───────────────────────");

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
      cook_time: 80,
      servings: 6,
    })
    .select("id, slug")
    .single();

  if (recipeErr) throw new Error(`Recipe insert failed: ${recipeErr.message}`);
  console.log(`  + created recipe "${TITLE}" (${recipe.id})`);
  console.log(`    slug: ${recipe.slug}`);

  console.log("\n── Step 3: link categories ─────────────────────");
  const { error: catErr } = await supabase.from("recipe_categories").insert([
    { recipe_id: recipe.id, category_id: zakuskiId },
    { recipe_id: recipe.id, category_id: zavtrakiId },
  ]);
  if (catErr) throw new Error(`Category link failed: ${catErr.message}`);
  console.log("  + linked Закуски + Завтраки");

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
