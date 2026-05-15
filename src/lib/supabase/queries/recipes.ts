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

/**
 * Fetch related recipes based on shared categories.
 *
 * Algorithm:
 *  1. Find all recipe_ids that share at least one category with the current recipe.
 *  2. Count how many categories each candidate shares (more = more similar).
 *  3. Return the top `limit` recipes sorted by overlap count, excluding the current recipe.
 */
export async function fetchRelatedRecipes(
  recipeId: string,
  categoryIds: string[],
  limit = 3
): Promise<RecipeCardData[]> {
  if (categoryIds.length === 0) return [];

  const supabase = createClient();

  // Step 1 — find all recipe_ids that share at least one category.
  const { data: matches, error } = await supabase
    .from("recipe_categories")
    .select("recipe_id")
    .in("category_id", categoryIds)
    .neq("recipe_id", recipeId);

  if (error || !matches?.length) return [];

  // Step 2 — count category overlaps per recipe_id.
  const overlapCount = matches.reduce<Record<string, number>>(
    (acc, { recipe_id }) => {
      acc[recipe_id] = (acc[recipe_id] ?? 0) + 1;
      return acc;
    },
    {}
  );

  // Step 3 — sort by overlap (descending), take top N ids.
  const topIds = Object.entries(overlapCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([id]) => id);

  // Step 4 — fetch the actual recipe rows (only published ones).
  const { data: recipes } = await supabase
    .from("recipes")
    .select("id, title, title_en, slug, cover_image")
    .in("id", topIds)
    .eq("published", true);

  // Restore the overlap-based order (Supabase .in() doesn't guarantee order).
  const byId = Object.fromEntries((recipes ?? []).map((r) => [r.id, r]));
  return topIds.map((id) => byId[id]).filter(Boolean) as RecipeCardData[];
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
