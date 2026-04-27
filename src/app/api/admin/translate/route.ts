import { createClient } from "@/lib/supabase/server";
import { isAdmin, isValidUUID } from "@/lib/supabase/admin";
import { translateRecipe } from "@/lib/translate";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

// Allow up to 60s — Gemini translation of a long recipe can take 15-30s
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // 1. Verify authentication
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Verify admin role using service role key (bypasses RLS)
  const adminCheck = await isAdmin(user.id);
  if (!adminCheck) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 3. Get and validate recipe ID from body
  const { recipeId } = await req.json();
  if (!recipeId || !isValidUUID(recipeId)) {
    return NextResponse.json({ error: "Missing or invalid recipeId" }, { status: 400 });
  }

  // 4. Fetch recipe with steps (also fetch slug for cache revalidation)
  const { data: recipe, error: fetchError } = await supabase
    .from("recipes")
    .select("slug, title, description, note, ingredients, steps(order, title, description)")
    .eq("id", recipeId)
    .single();

  if (fetchError || !recipe) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  const steps = (recipe.steps as { order: number; title: string | null; description: string }[])
    .sort((a, b) => a.order - b.order);

  // 5. Translate via Gemini
  try {
    const translations = await translateRecipe({
      title: recipe.title,
      description: recipe.description,
      note: recipe.note,
      ingredients: (recipe as unknown as { ingredients: string | null }).ingredients ?? null,
      steps,
    });

    // 6. Save core fields; try with ingredients_en, fall back without if column missing
    const coreUpdate = {
      title_en: translations.en.title,
      description_en: translations.en.description,
      note_en: translations.en.note,
    };

    const withIngredients = { ...coreUpdate, ingredients_en: translations.en.ingredients ?? null };

    const { error: updateError } = await supabase
      .from("recipes")
      .update(withIngredients)
      .eq("id", recipeId);

    if (updateError) {
      // If ingredients_en column doesn't exist yet in DB, retry without it
      if (updateError.message?.includes("ingredients_en")) {
        const { error: retryError } = await supabase
          .from("recipes")
          .update(coreUpdate)
          .eq("id", recipeId);
        if (retryError) throw retryError;
      } else {
        throw updateError;
      }
    }

    // 7. Update step translations
    const { data: dbSteps } = await supabase
      .from("steps")
      .select("id, order")
      .eq("recipe_id", recipeId)
      .order("order");

    if (dbSteps) {
      for (const dbStep of dbSteps) {
        const enStep = translations.en.steps.find((s) => s.order === dbStep.order);
        if (enStep) {
          const updatePayload = {
            title_en: enStep.title ?? null,
            description_en: enStep.description ?? null,
          };
          console.log(`[translate] updating step ${dbStep.id} with:`, JSON.stringify(updatePayload).slice(0, 120));
          const { data: stepData, error: stepError } = await supabase
            .from("steps")
            .update(updatePayload)
            .eq("id", dbStep.id)
            .select("id, title_en, description_en");
          console.log(`[translate] step update result — data:`, stepData, "error:", stepError?.message ?? "none");

          if (stepError) {
            console.error("[translate] step update error:", stepError.message);
            // If _en columns are missing in the steps table, surface a clear message
            if (stepError.message?.includes("title_en") || stepError.message?.includes("description_en")) {
              throw new Error(
                "Steps table is missing title_en / description_en columns. " +
                "Run in Supabase SQL editor:\n" +
                "ALTER TABLE steps ADD COLUMN IF NOT EXISTS title_en text;\n" +
                "ALTER TABLE steps ADD COLUMN IF NOT EXISTS description_en text;"
              );
            }
            throw stepError;
          }
        }
      }
    }

    // Revalidate the public recipe page so it reflects the new translations
    revalidatePath(`/recipes/${recipe.slug}`);

    return NextResponse.json({ success: true, translations });
  } catch (err) {
    console.error("[translate] error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message || "Translation failed" }, { status: 500 });
  }
}
