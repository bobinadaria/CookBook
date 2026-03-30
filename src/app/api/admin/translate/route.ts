import { createClient } from "@/lib/supabase/server";
import { isAdmin, isValidUUID } from "@/lib/supabase/admin";
import { translateRecipe } from "@/lib/translate";
import { NextRequest, NextResponse } from "next/server";

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
  if (!(await isAdmin(user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 3. Get and validate recipe ID from body
  const { recipeId } = await req.json();
  if (!recipeId || !isValidUUID(recipeId)) {
    return NextResponse.json({ error: "Missing or invalid recipeId" }, { status: 400 });
  }

  // 3. Fetch recipe with steps
  const { data: recipe, error: fetchError } = await supabase
    .from("recipes")
    .select("title, description, note, steps(order, title, description)")
    .eq("id", recipeId)
    .single();

  if (fetchError || !recipe) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  const steps = (recipe.steps as { order: number; title: string | null; description: string }[])
    .sort((a, b) => a.order - b.order);

  // 4. Translate via Gemini
  try {
    const translations = await translateRecipe({
      title: recipe.title,
      description: recipe.description,
      note: recipe.note,
      steps,
    });

    // 5. Save translations to recipes table
    const { error: updateError } = await supabase
      .from("recipes")
      .update({
        title_en: translations.en.title,
        title_cs: translations.cs.title,
        description_en: translations.en.description,
        description_cs: translations.cs.description,
        note_en: translations.en.note,
        note_cs: translations.cs.note,
      })
      .eq("id", recipeId);

    if (updateError) throw updateError;

    // 6. Update step translations
    // Fetch steps with IDs to match by order
    const { data: dbSteps } = await supabase
      .from("steps")
      .select("id, order")
      .eq("recipe_id", recipeId)
      .order("order");

    if (dbSteps) {
      for (const dbStep of dbSteps) {
        const enStep = translations.en.steps.find((s) => s.order === dbStep.order);
        const csStep = translations.cs.steps.find((s) => s.order === dbStep.order);

        if (enStep || csStep) {
          await supabase
            .from("steps")
            .update({
              title_en: enStep?.title ?? null,
              title_cs: csStep?.title ?? null,
              description_en: enStep?.description ?? null,
              description_cs: csStep?.description ?? null,
            })
            .eq("id", dbStep.id);
        }
      }
    }

    return NextResponse.json({ success: true, translations });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Translation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
