/**
 * Server-side recipe queries (use in Server Components and Route Handlers).
 * All functions create their own Supabase client — no shared state.
 */
import { createClient } from "@/lib/supabase/server";
import type { Recipe, RecipeCardData, AdminRecipeListItem } from "@/types";

// ── Public queries ───────────────────────────────────────────────────────────

/** Fetch featured published recipes for the home page hero. */
export async function fetchFeaturedRecipes(): Promise<RecipeCardData[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("recipes")
    .select("id, title, title_en, slug, cover_image")
    .eq("published", true)
    .eq("featured", true)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) throw error;
  return (data ?? []) as RecipeCardData[];
}

/** Fetch all published recipes for the catalog page. */
export async function fetchPublishedRecipes(): Promise<RecipeCardData[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("recipes")
    .select("id, title, title_en, slug, cover_image, description, note, created_at, updated_at, recipe_categories(category_id)")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as RecipeCardData[];
}

/** Fetch a single published recipe by slug (with steps and categories). */
export async function fetchRecipeBySlug(slug: string): Promise<Recipe | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("recipes")
    .select(`
      *,
      steps(*),
      recipe_categories(
        category_id,
        categories(*)
      )
    `)
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // not found
    throw error;
  }

  return data as Recipe;
}

// ── Admin queries ────────────────────────────────────────────────────────────

/** Fetch all recipes for the admin list (published + drafts). */
export async function fetchAdminRecipeList(): Promise<AdminRecipeListItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("recipes")
    .select("id, title, slug, published, created_at, cover_image")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as AdminRecipeListItem[];
}

/** Fetch a single recipe by ID for the admin edit form (all fields + steps). */
export async function fetchRecipeById(id: string): Promise<Recipe | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("recipes")
    .select(`*, steps(*), recipe_categories(category_id)`)
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data as Recipe;
}
