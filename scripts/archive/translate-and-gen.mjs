/**
 * translate-and-gen.mjs
 *
 * For every slug in RECIPE_SLUGS:
 *  1. Sets cook_time = 20, servings = 2
 *  2. Translates RU → EN via Gemini
 *  3. Generates a cover image via gpt-image-1 (DALL-E 3 fallback)
 *  4. Uploads the image to Supabase Storage (recipe-covers bucket)
 *  5. Updates cover_image on the recipe row
 *
 * Run: node scripts/translate-and-gen.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";
import OpenAI from "openai";

config({ path: resolve(process.cwd(), ".env.local") });

// ── Env ───────────────────────────────────────────────────────────────────────
let SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
if (SUPABASE_URL && !SUPABASE_URL.startsWith("http"))
  SUPABASE_URL = `https://${SUPABASE_URL}.supabase.co`;

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const GOOGLE_AI_KEY    = process.env.GOOGLE_AI_API_KEY ?? "";
const OPENAI_KEY       = process.env.OPENAI_API_KEY ?? "";

for (const [k, v] of [
  ["NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL],
  ["SUPABASE_SERVICE_ROLE_KEY", SERVICE_ROLE_KEY],
  ["GOOGLE_AI_API_KEY", GOOGLE_AI_KEY],
  ["OPENAI_API_KEY", OPENAI_KEY],
]) {
  if (!v) { console.error(`Missing env: ${k}`); process.exit(1); }
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const openai   = new OpenAI({ apiKey: OPENAI_KEY });

// ── Recipes to process ────────────────────────────────────────────────────────
const RECIPE_SLUGS = [
  "slabosolyonyy-losos-s-aromatom-rozhdestva",
  "vyalenye-tomaty",
  "ovsyanye-vafli-s-tykvennym-kremom",
  "ovsyano-syrnye-vafli-s-pashtetom-i-pomidorami",
  "kartofelno-syrnye-vafli-s-dzadzyki",
  "tykvenno-apelsinovye-vafli-s-maskarpone-i-sushyonoy-klyukvoy",
  "vafli-iz-tsukini-s-syrom-feta-i-smetanoy",
  "vafli-iz-rikotty-so-slivochno-tvorozhnym-kremom-i-inzhirom",
  "tvorozhno-syrnye-vafli-s-namazkoy-iz-zapechyonnogo-pertsa-s-avokado-i-slabosolyonym-lososem",
  "shokoladnye-vafli-iz-fasoli-s-vanilnym-morozhenym-i-vishney",
  "vafli-s-zelenyu-syrom-i-chesnochnym-sousom",
];

// ── Gemini translate ──────────────────────────────────────────────────────────
async function translateRecipe(recipe, steps) {
  const payload = {
    title:       recipe.title,
    description: recipe.description ?? "",
    note:        recipe.note ?? "",
    ingredients: recipe.ingredients ?? "",
    steps: steps.map((s) => ({
      order:       s.order,
      title:       s.title ?? "",
      description: s.description,
    })),
  };

  const prompt =
    `You are a professional culinary translator. Translate the following recipe JSON from Russian to English.\n` +
    `Return ONLY valid JSON with the exact same structure. Do not add explanations. Preserve formatting (newlines, dashes).\n` +
    `If a field is empty string "", keep it as "".\n\nInput JSON:\n${JSON.stringify(payload, null, 2)}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error ${res.status}: ${err.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned empty response");

  return JSON.parse(text);
}

// ── DALL-E / gpt-image-1 ──────────────────────────────────────────────────────
function buildPrompt(title, description, ingredients) {
  const parts = [title];
  if (description) parts.push(description);

  let ingredientHint = "";
  if (ingredients) {
    const lines = ingredients
      .split(/\n|,|;/)
      .map((s) => s.replace(/^\s*[-•*\d.—]+\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 6);
    if (lines.length) ingredientHint = ` Key visible ingredients: ${lines.join(", ")}.`;
  }

  return (
    `Award-winning editorial food photograph of "${parts.join(". ")}".${ingredientHint} ` +
    `The dish must look exactly as the name implies — accurate textures, real sauce, real food. ` +
    `Shot on Sony A7R IV with 85mm f/1.8 lens. Natural window light from the left, soft diffused, no harsh studio flash. ` +
    `Angle: 40–50 degrees, close crop on the plate. Slightly shallow depth of field — foreground sharp, background softly out of focus. ` +
    `Background: simple dark linen or weathered dark oak wood. ` +
    `Props: ONLY items directly from the recipe — nothing else. No candles, no cinnamon, no random objects. ` +
    `The food looks freshly made: natural imperfections, slight moisture, realistic textures — not CGI, not 3D render, not advertising photo. ` +
    `Color grading: warm, slightly desaturated, natural film tones. Subtle grain. ` +
    `No text, no watermarks.`
  );
}

async function generateAndUpload(recipe) {
  const title       = recipe.title_en       ?? recipe.title;
  const description = recipe.description_en ?? recipe.description;
  const ingredients = recipe.ingredients_en ?? recipe.ingredients;

  const prompt = buildPrompt(title, description, ingredients);
  console.log(`    prompt (first 120): ${prompt.slice(0, 120)}…`);

  let imageBuffer;
  let modelUsed = "gpt-image-1";

  try {
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "medium",
    });
    const b64 = response.data?.[0]?.b64_json;
    if (!b64) throw new Error("OpenAI returned empty b64_json");
    imageBuffer = Buffer.from(b64, "base64");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isBilling = /billing|quota|limit/i.test(msg);
    if (!isBilling) throw err;

    console.warn("    gpt-image-1 billing limit, falling back to dall-e-3…");
    modelUsed = "dall-e-3";
    const fb = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "url",
    });
    const url = fb.data?.[0]?.url;
    if (!url) throw new Error("DALL-E 3 returned empty URL");
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Fetch image HTTP ${r.status}`);
    imageBuffer = Buffer.from(await r.arrayBuffer());
  }

  // Upload to Supabase Storage
  const fileName   = `ai-${Date.now()}.webp`;
  const storagePath = `covers/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("recipe-covers")
    .upload(storagePath, imageBuffer, { contentType: "image/webp", upsert: true });

  if (uploadError) throw new Error(`Storage upload: ${uploadError.message}`);

  const { data: pub } = supabase.storage
    .from("recipe-covers")
    .getPublicUrl(storagePath);

  console.log(`    model: ${modelUsed} | uploaded: ${storagePath}`);
  return pub.publicUrl;
}

// ── sleep helper ──────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const total = RECIPE_SLUGS.length;

  for (let i = 0; i < RECIPE_SLUGS.length; i++) {
    const slug = RECIPE_SLUGS[i];
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(` [${i + 1}/${total}] ${slug}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // 1. Fetch recipe + steps
    const { data: recipe, error: fetchErr } = await supabase
      .from("recipes")
      .select("id, title, description, note, ingredients")
      .eq("slug", slug)
      .single();

    if (fetchErr || !recipe) {
      console.error(`  ✗ Recipe not found: ${slug}`);
      continue;
    }
    console.log(`  title: ${recipe.title}`);

    const { data: steps } = await supabase
      .from("steps")
      .select("id, order, title, description")
      .eq("recipe_id", recipe.id)
      .order("order");

    // ── Step 1: update cook_time + servings ───────────────────────────────
    console.log(`  [1/3] Updating cook_time=20, servings=2…`);
    const { error: updateErr } = await supabase
      .from("recipes")
      .update({ cook_time: 20, servings: 2 })
      .eq("id", recipe.id);
    if (updateErr) { console.error(`  ✗ Update error: ${updateErr.message}`); continue; }
    console.log(`  ✓ cook_time=20, servings=2 set`);

    // ── Step 2: translate ─────────────────────────────────────────────────
    console.log(`  [2/3] Translating via Gemini…`);
    let translated;
    try {
      translated = await translateRecipe(recipe, steps ?? []);
    } catch (err) {
      console.error(`  ✗ Translation failed: ${err.message}`);
      continue;
    }

    // Save translations to recipes table
    const recipeUpdate = {
      title_en:       translated.title       || null,
      description_en: translated.description || null,
      note_en:        translated.note        || null,
      ingredients_en: translated.ingredients || null,
    };
    const { error: transRecipeErr } = await supabase
      .from("recipes")
      .update(recipeUpdate)
      .eq("id", recipe.id);
    if (transRecipeErr) console.warn(`  ⚠ Recipe translation save: ${transRecipeErr.message}`);

    // Save step translations
    if (steps && translated.steps) {
      for (const dbStep of steps) {
        const enStep = translated.steps.find((s) => s.order === dbStep.order);
        if (!enStep) continue;
        const { error: stepErr } = await supabase
          .from("steps")
          .update({ title_en: enStep.title || null, description_en: enStep.description || null })
          .eq("id", dbStep.id);
        if (stepErr) console.warn(`    ⚠ Step ${dbStep.order} save: ${stepErr.message}`);
      }
    }
    console.log(`  ✓ Translated`);

    // ── Step 3: generate + upload image ───────────────────────────────────
    console.log(`  [3/3] Generating cover image…`);

    // Build a richer recipe object with the fresh EN translations
    const recipeWithEn = {
      ...recipe,
      title_en:       translated.title       || null,
      description_en: translated.description || null,
      ingredients_en: translated.ingredients || null,
    };

    let coverUrl;
    try {
      coverUrl = await generateAndUpload(recipeWithEn);
    } catch (err) {
      console.error(`  ✗ Image generation failed: ${err.message}`);
      continue;
    }

    // Save cover_image URL
    const { error: coverErr } = await supabase
      .from("recipes")
      .update({ cover_image: coverUrl })
      .eq("id", recipe.id);
    if (coverErr) { console.error(`  ✗ Cover save: ${coverErr.message}`); continue; }

    console.log(`  ✓ Cover saved: ${coverUrl.slice(0, 80)}…`);

    // Small delay between recipes to avoid rate limiting
    if (i < RECIPE_SLUGS.length - 1) {
      console.log(`  … waiting 3s before next recipe…`);
      await sleep(3000);
    }
  }

  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║  ✅  All ${total} recipes processed!          ║`);
  console.log(`╚══════════════════════════════════════════╝`);
}

main().catch((err) => {
  console.error("\n❌ Fatal:", err.message);
  process.exit(1);
});
