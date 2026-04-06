import { createServiceRoleClient } from "@/lib/supabase/admin";
import { toSlug } from "@/lib/supabase/recipes";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/admin/recipes
 *
 * Programmatic recipe creation endpoint.
 * Auth: requires SUPABASE_SERVICE_ROLE_KEY in the Authorization header.
 *
 * Body (JSON):
 * {
 *   title: string,               // required
 *   description?: string,
 *   note?: string,
 *   ingredients?: string,         // newline-separated list
 *   published?: boolean,          // default false
 *   featured?: boolean,           // default false
 *   categories?: string[],       // category names (will match or create)
 *   steps?: { title?: string, description: string }[]
 * }
 */
export async function POST(req: NextRequest) {
  // Auth: check service role key
  const authHeader = req.headers.get("authorization");
  const expectedKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!authHeader || !expectedKey || authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, description, note, ingredients, published, featured, categories, steps } = body;

  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const slug = toSlug(title);

  // 1. Insert recipe
  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .insert({
      title,
      slug,
      description: description || null,
      note: note || null,
      ingredients: ingredients || null,
      published: published ?? false,
      featured: featured ?? false,
    })
    .select("id, slug")
    .single();

  if (recipeError) {
    return NextResponse.json({ error: recipeError.message }, { status: 500 });
  }

  // 2. Match or create categories
  if (Array.isArray(categories) && categories.length > 0) {
    const categoryIds: string[] = [];

    for (const catName of categories) {
      if (typeof catName !== "string") continue;

      // Try to find existing category by name
      const { data: existing } = await supabase
        .from("categories")
        .select("id")
        .ilike("name", catName.trim())
        .maybeSingle();

      if (existing) {
        categoryIds.push(existing.id);
      }
      // Skip categories that don't exist — don't auto-create to avoid clutter
    }

    if (categoryIds.length > 0) {
      await supabase.from("recipe_categories").insert(
        categoryIds.map((category_id) => ({ recipe_id: recipe.id, category_id }))
      );
    }
  }

  // 3. Insert steps
  if (Array.isArray(steps) && steps.length > 0) {
    const stepsToInsert = steps
      .filter((s: { description?: string }) => s.description)
      .map((s: { title?: string; description: string }, i: number) => ({
        recipe_id: recipe.id,
        order: i + 1,
        title: s.title || null,
        description: s.description,
        photo_url: null,
      }));

    if (stepsToInsert.length > 0) {
      await supabase.from("steps").insert(stepsToInsert);
    }
  }

  return NextResponse.json({
    id: recipe.id,
    slug: recipe.slug,
    message: `Recipe "${title}" created successfully`,
  });
}
