/**
 * seed-sous-prereqs.mjs — предпосылки для рецепта «Клюквенный соус к утке».
 *
 * 1) Категория meal_type «Соусы» (slug=sousy) — в каталоге её ещё не было
 *    (решение Дарьи: завести отдельную категорию под соусы).
 * 2) Четыре ингредиента в ingredients_base, без которых не считается КБЖУ соуса:
 *    клюква, апельсиновый сок, красное сухое вино, коричневый сахар.
 *    Значения — USDA, на 100 г, в «как есть» виде (сырьё). Соус уваривается и
 *    процеживается — это осознанно «мягкий» КБЖУ-кейс (см. ниже в рецепте).
 *
 * Запуск:
 *   node scripts/seed-sous-prereqs.mjs            # dry-run (только показать)
 *   node scripts/seed-sous-prereqs.mjs --write    # реальная запись
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const apply = process.argv.includes("--write");

let URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (URL && !URL.startsWith("http")) URL = `https://${URL}.supabase.co`;
if (!URL || !KEY) {
  console.error("✗ Supabase env missing");
  process.exit(1);
}
const s = createClient(URL, KEY);

// ── Категория ────────────────────────────────────────────────────────────────

const CATEGORY = {
  name: "Соусы",
  name_en: "Sauces",
  slug: "sousy",
  type: "meal_type",
};

// ── Ингредиенты (USDA, на 100 г, сырьё) ──────────────────────────────────────

const INGREDIENTS = [
  // Cranberries, raw — FDC 171722
  { name_ru: "клюква",            category: "fruit",     kcal: 46,  P: 0.46, F: 0.13, C: 11.97, name_en: "Cranberries, raw" },
  // Orange juice, raw — FDC 169098
  { name_ru: "апельсиновый сок",  category: "fruit",     kcal: 45,  P: 0.70, F: 0.20, C: 10.40, name_en: "Orange juice, raw" },
  // Wine, table, red — FDC 174837 (углеводы ~2.61; алкоголь при уваривании частично уходит)
  { name_ru: "красное сухое вино", category: "other",    kcal: 85,  P: 0.07, F: 0.00, C: 2.61,  name_en: "Wine, table, red" },
  // Sugars, brown — FDC 168833
  { name_ru: "коричневый сахар",  category: "sweet",     kcal: 380, P: 0.12, F: 0.00, C: 98.09, name_en: "Sugars, brown" },
];

async function upsertCategory() {
  const { data: existing } = await s
    .from("categories")
    .select("id, slug")
    .eq("slug", CATEGORY.slug)
    .maybeSingle();
  if (existing) {
    console.log(`  = категория «${CATEGORY.name}» уже есть (id=${existing.id})`);
    return;
  }
  if (!apply) {
    console.log(`  + категория «${CATEGORY.name}» (slug=${CATEGORY.slug}, type=${CATEGORY.type}) [dry-run]`);
    return;
  }
  const { data, error } = await s.from("categories").insert(CATEGORY).select("id").single();
  if (error) {
    console.error(`  ✗ категория: ${error.message}`);
    process.exit(1);
  }
  console.log(`  ✓ категория «${CATEGORY.name}» создана (id=${data.id})`);
}

async function upsertIngredient(e) {
  const row = {
    name_ru: e.name_ru,
    name_en: e.name_en,
    kcal_100g: Number(e.kcal.toFixed(2)),
    protein_100g: Number(e.P.toFixed(2)),
    fat_100g: Number(e.F.toFixed(2)),
    carbs_100g: Number(e.C.toFixed(2)),
    usda_fdc_id: null,
    category: e.category,
  };
  if (!apply) {
    console.log(`  + ${e.name_ru.padEnd(18)} ${e.kcal} ккал | Б${e.P} Ж${e.F} У${e.C} [dry-run]`);
    return;
  }
  const { error } = await s.from("ingredients_base").upsert(row, { onConflict: "name_ru" });
  if (error) console.error(`  ✗ ${e.name_ru}: ${error.message}`);
  else console.log(`  ✓ ${e.name_ru.padEnd(18)} ${e.kcal} ккал | Б${e.P} Ж${e.F} У${e.C}  « ${e.name_en}`);
}

async function main() {
  console.log(apply ? "── WRITE ──" : "── DRY-RUN ──");
  await upsertCategory();
  for (const e of INGREDIENTS) await upsertIngredient(e);
  console.log("DONE");
}
main().catch((err) => { console.error("FATAL:", err); process.exit(1); });
