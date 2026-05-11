/**
 * Central re-export for all server-side Supabase query helpers.
 *
 * Import from here in Server Components and Route Handlers:
 *   import { fetchFeaturedRecipes, fetchAllCategories } from "@/lib/supabase/queries";
 */
export * from "./recipes";
export * from "./categories";
