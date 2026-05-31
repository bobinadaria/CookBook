/**
 * Server-side category queries.
 */
import { createClient } from "@/lib/supabase/server";
import type { Category, CategoryType } from "@/types";

/** Fetch all categories ordered by type then name. */
export async function fetchAllCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("type")
    .order("name");

  if (error) throw error;
  return (data ?? []) as Category[];
}

/** Fetch categories filtered by type. */
export async function fetchCategoriesByType(type: CategoryType): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("type", type)
    .order("name");

  if (error) throw error;
  return (data ?? []) as Category[];
}
