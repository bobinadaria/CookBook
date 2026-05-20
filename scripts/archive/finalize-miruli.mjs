/**
 * Finalize Miruli recipe:
 *  1. Upload cover image to Supabase Storage
 *  2. Save EN translations for recipe + steps
 * Run: node scripts/finalize-miruli.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";
import { readFileSync } from "fs";

config({ path: resolve(process.cwd(), ".env.local") });

let SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (SUPABASE_URL && !SUPABASE_URL.startsWith("http")) {
  SUPABASE_URL = `https://${SUPABASE_URL}.supabase.co`;
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const RECIPE_SLUG = "miruli-kuritsa-v-slivochnom-souse";
const IMAGE_PATH = `${process.env.HOME}/Downloads/chkmerulli.png`;

// ── English translations ──────────────────────────────────────────────────────

const EN = {
  title_en: "Miruli — Chicken in Creamy Sauce",
  description_en:
    "Tender chicken braised in a rich creamy sauce with khmeli-suneli spices, " +
    "fragrant cilantro, and a generous amount of garlic. " +
    "A classic Georgian dish that is simple to make yet unforgettable in flavour.",
  note_en:
    "This is Miruli's recipe — my favourite Georgian dish that I make whenever I crave something " +
    "creamy with a wonderful aroma filling the entire kitchen, with that beautiful scent of coriander. " +
    "I love the generous amount of garlic in this sauce and the rich heavy cream. " +
    "The chicken in all of this just… turns out to be absolutely divine.",
  ingredients_en:
    "4 chicken legs (quarters)\n" +
    "500 ml heavy cream, 20%+ fat (the fattier the better, but no less than 15%)\n" +
    "1 whole head of garlic (not a clove — a whole head; the more garlic the better)\n" +
    "1 heaping tsp khmeli-suneli\n" +
    "1 tbsp vegetable oil\n" +
    "a bunch of cilantro (can substitute parsley, or use both)\n" +
    "salt and pepper to taste",
};

const STEPS_EN = [
  {
    order: 1,
    title_en: "Prepare the chicken and garlic",
    description_en:
      "Cut each chicken leg into two pieces: drumstick and thigh " +
      "(or buy them separately, or use any other chicken parts). " +
      "Peel the garlic, crush each clove with the flat side of a knife, " +
      "and roughly chop into 2–3 pieces.",
  },
  {
    order: 2,
    title_en: "Marinate",
    description_en:
      "Season the chicken with khmeli-suneli, salt, and pepper. Add the oil and mix well. " +
      "Let marinate for a few hours. If pressed for time, you can fry immediately — " +
      "it will still be delicious, but marinating makes it even better.",
  },
  {
    order: 3,
    title_en: "Sear the chicken",
    description_en:
      "Heat a skillet over medium heat and sear the chicken until golden on both sides, " +
      "about 5 minutes per side. Once browned, add the garlic and remove from heat.",
  },
  {
    order: 4,
    title_en: "Add the cream",
    description_en:
      "Let the pan cool slightly so the garlic can release its aroma, then pour in the cream. " +
      "This prevents the cream from curdling — adding it to a very hot pan can cause it to separate. " +
      "The amount of cream depends on your pan size; " +
      "the key is that the chicken should be submerged two-thirds in the sauce.",
  },
  {
    order: 5,
    title_en: "Simmer",
    description_en:
      "Return the pan to the heat, cover with a lid, and simmer on low for 30–40 minutes. " +
      "If the sauce reduces too much, add a splash of water.",
  },
  {
    order: 6,
    title_en: "Finishing touch",
    description_en:
      "Add the chopped herbs (cilantro and/or parsley) 10 minutes before the end of cooking.",
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Fetch recipe ID
  const { data: recipe, error: fetchErr } = await supabase
    .from("recipes")
    .select("id")
    .eq("slug", RECIPE_SLUG)
    .single();

  if (fetchErr || !recipe) throw new Error(`Recipe not found: ${fetchErr?.message}`);
  const recipeId = recipe.id;
  console.log(`Recipe ID: ${recipeId}`);

  // 2. Upload cover image
  console.log("\n── Uploading cover image ───────────────────────");
  const imageBytes = readFileSync(IMAGE_PATH);
  const fileName = `miruli-${Date.now()}.png`;

  const { error: uploadErr } = await supabase.storage
    .from("recipe-covers")
    .upload(fileName, imageBytes, { contentType: "image/png", upsert: false });

  if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

  const { data: urlData } = supabase.storage.from("recipe-covers").getPublicUrl(fileName);
  const coverUrl = urlData.publicUrl;
  console.log(`  + uploaded: ${coverUrl}`);

  // 3. Update recipe: cover + EN translations
  console.log("\n── Saving EN translations ──────────────────────");
  const { error: updateErr } = await supabase
    .from("recipes")
    .update({ cover_image: coverUrl, ...EN })
    .eq("id", recipeId);

  if (updateErr) throw new Error(`Recipe update failed: ${updateErr.message}`);
  console.log("  + title_en, description_en, note_en, ingredients_en saved");

  // 4. Update steps EN
  const { data: dbSteps, error: stepsErr } = await supabase
    .from("steps")
    .select("id, order")
    .eq("recipe_id", recipeId)
    .order("order");

  if (stepsErr) throw new Error(`Steps fetch failed: ${stepsErr.message}`);

  for (const dbStep of dbSteps) {
    const en = STEPS_EN.find((s) => s.order === dbStep.order);
    if (!en) continue;
    const { error: stepUpErr } = await supabase
      .from("steps")
      .update({ title_en: en.title_en, description_en: en.description_en })
      .eq("id", dbStep.id);
    if (stepUpErr) throw new Error(`Step ${dbStep.order} update failed: ${stepUpErr.message}`);
  }
  console.log(`  + ${dbSteps.length} steps translated`);

  console.log("\n✅ All done!");
  console.log(`   Cover : ${coverUrl}`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
