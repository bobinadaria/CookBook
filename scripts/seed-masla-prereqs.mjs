/**
 * seed-masla-prereqs.mjs — предпосылки для рецептов «Ароматные масла».
 *
 * Категория meal_type «Заготовки» (slug=zagotovki) уже есть в каталоге —
 * масла кладём туда (решение Дарьи), новую категорию не заводим.
 *
 * Единственный недостающий ингредиент для КБЖУ — смородина (для масла №3).
 * Остальное (масло сливочное, оливки, лимон, пармезан, чеснок, укроп, тимьян,
 * соль) уже есть в ingredients_base.
 *
 * Значение — USDA, на 100 г, сырьё. Смородина в масле №3 протирается через сито
 * (часть кожуры/семян уходит) — это осознанно «мягкий» КБЖУ-кейс, см. рецепт.
 *
 * Запуск:
 *   node scripts/seed-masla-prereqs.mjs            # dry-run
 *   node scripts/seed-masla-prereqs.mjs --write    # реальная запись
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

// ── Ингредиент (USDA, на 100 г, сырьё) ───────────────────────────────────────
// Currants, european black, raw — FDC 173956
const INGREDIENTS = [
  { name_ru: "смородина", category: "fruit", kcal: 63, P: 1.4, F: 0.41, C: 15.38, name_en: "Currants, european black, raw" },
];

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
    console.log(`  + ${e.name_ru.padEnd(12)} ${e.kcal} ккал | Б${e.P} Ж${e.F} У${e.C} [dry-run]`);
    return;
  }
  const { error } = await s.from("ingredients_base").upsert(row, { onConflict: "name_ru" });
  if (error) console.error(`  ✗ ${e.name_ru}: ${error.message}`);
  else console.log(`  ✓ ${e.name_ru.padEnd(12)} ${e.kcal} ккал | Б${e.P} Ж${e.F} У${e.C}  « ${e.name_en}`);
}

async function main() {
  console.log(apply ? "── WRITE ──" : "── DRY-RUN ──");
  for (const e of INGREDIENTS) await upsertIngredient(e);
  console.log("DONE");
}
main().catch((err) => { console.error("FATAL:", err); process.exit(1); });
