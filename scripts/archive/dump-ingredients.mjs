import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve("/sessions/epic-charming-knuth/mnt/CookBook", ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, KEY);

const { data, error } = await supabase
  .from("ingredients_base")
  .select("name_ru, name_en, kcal_100g, protein_100g, fat_100g, carbs_100g, usda_fdc_id, category")
  .order("category", { ascending: true })
  .order("name_ru", { ascending: true });

if (error) { console.error(error); process.exit(1); }
console.log(JSON.stringify(data, null, 2));
console.error(`ROWS: ${data.length}`);
