import { createClient } from "./server";

export async function fetchFeaturedRecipes() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("recipes")
    .select("id, title, slug, description, cover_image")
    .eq("published", true)
    .eq("featured", true)
    .order("created_at", { ascending: false })
    .limit(6);
  if (error) throw error;
  return data ?? [];
}
