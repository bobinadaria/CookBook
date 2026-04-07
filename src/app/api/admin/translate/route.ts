import { createClient } from "@/lib/supabase/server";
import { isAdmin, isValidUUID } from "@/lib/supabase/admin";
import { translateRecipe } from "@/lib/translate";
import { NextRequest, NextResponse } from "next/server";

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

  // 4. Fetch recipe with steps
  const { data: recipe, error: fetchError } = await supabase
    .from("recipes")
    .select("title, description, note, ingredients, steps(order, title, description)")
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
          await supabase
            .from("steps")
            .update({
              title_en: enStep.title ?? null,
              description_en: enStep.description ?? null,
            })
            .eq("id", dbStep.id);
        }
      }
    }

    return NextResponse.json({ success: true, translations });
  } catch (err) {
    console.error("[translate] error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message || "Translation failed" }, { status: 500 });
  }
}
