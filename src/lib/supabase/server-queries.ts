/**
 * @deprecated All server-side query helpers have moved to @/lib/supabase/queries.
 * This file re-exports them for backward compatibility.
 *
 * Update your imports:
 *   import { fetchFeaturedRecipes } from "@/lib/supabase/queries";
 */
export {
  fetchFeaturedRecipes,
  fetchPublishedRecipes,
  fetchRecipeBySlug,
  fetchAdminRecipeList,
  fetchRecipeById,
} from "@/lib/supabase/queries/recipes";

export {
  fetchAllCategories,
  fetchCategoriesByType,
} from "@/lib/supabase/queries/categories";
