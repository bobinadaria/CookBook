/**
 * One-off script: analyse every recipe with Gemini and fill cook_time + servings.
 *
 * Prerequisites:
 *   1. Run the SQL migration first:
 *      scripts/migration-cook-time-servings.sql
 *
 * Usage:
 *   node scripts/fill-cook-time-servings.mjs
 *
 * Flags:
 *   --dry-run   Print estimates without writing to the database.
 *   --force     Re-analyse recipes that already have values (default: skip them).
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY ?? "";

const DRY_RUN = process.argv.includes("--dry-run");
const FORCE   = process.argv.includes("--force");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!GOOGLE_AI_API_KEY) {
  console.error("❌  Missing GOOGLE_AI_API_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ── Gemini helper ─────────────────────────────────────────────────────────────

async function estimateWithGemini(recipe) {
  const prompt = `You are a professional chef. Based on the recipe below, estimate:
1. Total cooking time in MINUTES (prep + active cooking + passive time like marinating is included only if the author explicitly mentions it as required; ignore optional overnight rests).
2. Number of servings as an integer.

Return ONLY valid JSON: {"cook_time": <number>, "servings": <number>}
Do not add any explanation.

Recipe title: ${recipe.title}
Description: ${recipe.description ?? ""}
Ingredients:
${recipe.ingredients ?? ""}
Steps:
${(recipe.steps ?? []).map((s, i) => `${i + 1}. ${s.title ? s.title + ": " : ""}${s.description}`).join("\n")}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_API_KEY}`,
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
    throw new Error(`Gemini error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned empty response");

  const parsed = JSON.parse(text);
  const cook_time = typeof parsed.cook_time === "number" ? Math.round(parsed.cook_time) : null;
  const servings  = typeof parsed.servings  === "number" ? Math.round(parsed.servings)  : null;
  return { cook_time, servings };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`🔍  Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE"} | force: ${FORCE}\n`);

  // Fetch all recipes with their steps
  const { data: recipes, error } = await supabase
    .from("recipes")
    .select("id, title, description, ingredients, cook_time, servings, steps(order, title, description)")
    .order("created_at", { ascending: true });

  if (error) { console.error("❌  Failed to fetch recipes:", error.message); process.exit(1); }
  if (!recipes?.length) { console.log("No recipes found."); return; }

  let updated = 0, skipped = 0, failed = 0;

  for (const recipe of recipes) {
    const alreadyFilled = recipe.cook_time != null && recipe.servings != null;

    if (alreadyFilled && !FORCE) {
      console.log(`  ⏭  "${recipe.title}" — already has values (cook_time: ${recipe.cook_time} min, servings: ${recipe.servings}), skipping`);
      skipped++;
      continue;
    }

    process.stdout.write(`  🤖  Analysing "${recipe.title}"… `);

    try {
      const { cook_time, servings } = await estimateWithGemini(recipe);
      console.log(`cook_time: ${cook_time} min, servings: ${servings}`);

      if (!DRY_RUN) {
        const { error: updateError } = await supabase
          .from("recipes")
          .update({ cook_time, servings })
          .eq("id", recipe.id);

        if (updateError) throw new Error(updateError.message);
      }
      updated++;
    } catch (err) {
      console.log(`❌  Error: ${err.message}`);
      failed++;
    }

    // Small delay to avoid hitting Gemini rate limits
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\n✅  Done — updated: ${updated}, skipped: ${skipped}, failed: ${failed}`);
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
