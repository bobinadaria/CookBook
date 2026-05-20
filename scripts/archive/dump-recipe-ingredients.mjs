import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve("/sessions/epic-charming-knuth/mnt/CookBook", ".env.local") });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data, error } = await supabase
  .from("recipes")
  .select("title, slug, ingredients, published");
if (error) { console.error(error); process.exit(1); }

console.log(JSON.stringify(data, null, 2));
console.error(`RECIPES: ${data.length}`);
