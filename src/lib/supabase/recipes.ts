/**
 * Recipe CRUD helpers for admin.
 *
 * Required Supabase SQL (run once):
 *
 *   -- profiles table
 *   create table if not exists profiles (
 *     id         uuid references auth.users primary key,
 *     email      text,
 *     role       text default 'user',
 *     created_at timestamptz default now()
 *   );
 *   alter table profiles enable row level security;
 *   create policy "Public read" on profiles for select using (true);
 *   create policy "Own update" on profiles for update using (auth.uid() = id);
 *
 *   -- categories
 *   create table if not exists categories (
 *     id   uuid primary key default gen_random_uuid(),
 *     name text not null,
 *     slug text unique not null,
 *     type text not null
 *   );
 *   alter table categories enable row level security;
 *   create policy "Public read" on categories for select using (true);
 *   create policy "Admin write" on categories for all using (
 *     exists (select 1 from profiles where id = auth.uid() and role = 'admin')
 *   );
 *
 *   -- recipes
 *   create table if not exists recipes (
 *     id          uuid primary key default gen_random_uuid(),
 *     title       text not null,
 *     slug        text unique not null,
 *     description text,
 *     note        text,
 *     cover_image text,
 *     published   boolean default false,
 *     featured    boolean default false,
 *     created_at  timestamptz default now(),
 *     updated_at  timestamptz default now()
 *   );
 *   alter table recipes enable row level security;
 *   create policy "Public read published" on recipes for select using (published = true or exists (
 *     select 1 from profiles where id = auth.uid() and role = 'admin'
 *   ));
 *   create policy "Admin write" on recipes for all using (
 *     exists (select 1 from profiles where id = auth.uid() and role = 'admin')
 *   );
 *
 *   -- recipe_categories
 *   create table if not exists recipe_categories (
 *     recipe_id   uuid references recipes(id) on delete cascade,
 *     category_id uuid references categories(id) on delete cascade,
 *     primary key (recipe_id, category_id)
 *   );
 *   alter table recipe_categories enable row level security;
 *   create policy "Public read" on recipe_categories for select using (true);
 *   create policy "Admin write" on recipe_categories for all using (
 *     exists (select 1 from profiles where id = auth.uid() and role = 'admin')
 *   );
 *
 *   -- steps
 *   create table if not exists steps (
 *     id          uuid primary key default gen_random_uuid(),
 *     recipe_id   uuid references recipes(id) on delete cascade,
 *     "order"     integer not null,
 *     title       text,
 *     description text not null,
 *     photo_url   text
 *   );
 *   alter table steps enable row level security;
 *   create policy "Public read" on steps for select using (true);
 *   create policy "Admin write" on steps for all using (
 *     exists (select 1 from profiles where id = auth.uid() and role = 'admin')
 *   );
 *
 *   -- Storage buckets (create in Supabase dashboard → Storage)
 *   -- recipe-covers  (public)
 *   -- step-photos    (public)
 */

// StepInput and RecipeInput are defined in @/types and re-exported here
// for backward compatibility with existing admin component imports.
import type { StepInput, RecipeInput } from "@/types";
import { createClient } from "./client";
import { toSlug } from "@/lib/slug";

export type { StepInput, RecipeInput };

// ── Slug helper ─────────────────────────────────────────────────────────────
// Re-exported from the pure @/lib/slug module (used by both admin form and
// server-side user-recipe actions).
export { toSlug };

// ── Upload helpers ───────────────────────────────────────────────────────────

/** Generates a storage-safe ASCII filename (Supabase rejects non-ASCII keys) */
function safeFileName(file: File): string {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const rand = Math.random().toString(36).slice(2, 8);
  return `${Date.now()}-${rand}.${ext}`;
}

async function uploadFile(bucket: string, path: string, file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("bucket", bucket);
  formData.append("path", path);

  const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Upload failed");
  return json.url;
}

// ── Create draft recipe (title only) ────────────────────────────────────────
/** Creates a minimal draft recipe with just a title and returns its ID.
 *  Used by the quick-create modal so the admin is immediately taken to the
 *  full edit page rather than filling a long form from scratch. */
export async function createDraftRecipe(title: string): Promise<{ id: string; slug: string }> {
  const supabase = createClient();
  const slug = toSlug(title);

  const { data, error } = await supabase
    .from("recipes")
    .insert({ title, slug, published: false, featured: false })
    .select("id, slug")
    .single();

  if (error) throw error;
  return data;
}

// ── Create recipe ────────────────────────────────────────────────────────────
export async function createRecipe(input: RecipeInput): Promise<string> {
  const supabase = createClient();

  // 1. Upload cover if provided
  let cover_image = input.cover_image ?? null;
  if (input.coverFile) {
    cover_image = await uploadFile("recipe-covers", safeFileName(input.coverFile), input.coverFile);
  }

  // 2. Insert recipe
  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .insert({
      title: input.title,
      slug: input.slug,
      description: input.description || null,
      note: input.note || null,
      ingredients: input.ingredients || null,
      title_en: input.title_en?.trim() || null,
      description_en: input.description_en?.trim() || null,
      note_en: input.note_en?.trim() || null,
      ingredients_en: input.ingredients_en?.trim() || null,
      cover_image,
      published: input.published,
      featured: input.featured,
      recipe_type: input.recipe_type ?? "food",
      cook_time: input.cook_time ?? null,
      servings: input.servings ?? null,
      // КБЖУ считается в форме и сохраняется вместе с рецептом (как в
      // пользовательской форме) — без отдельного «сначала сохрани» шага.
      nutrition: input.nutrition ?? null,
    })
    .select("id")
    .single();

  if (recipeError) throw recipeError;
  const recipeId = recipe.id;

  // 3. Categories
  if (input.categoryIds.length > 0) {
    await supabase.from("recipe_categories").insert(
      input.categoryIds.map((category_id) => ({ recipe_id: recipeId, category_id }))
    );
  }

  // 4. Steps (with optional photo upload)
  if (input.steps.length > 0) {
    const stepsToInsert = await Promise.all(
      input.steps.map(async (step) => {
        let photo_url = step.photo_url;
        if (step.photoFile) {
          photo_url = await uploadFile(
            "step-photos",
            `${recipeId}/${safeFileName(step.photoFile)}`,
            step.photoFile
          );
        }
        return {
          recipe_id: recipeId,
          order: step.order,
          title: step.title || null,
          description: step.description,
          title_en: step.title_en?.trim() || null,
          description_en: step.description_en?.trim() || null,
          photo_url,
        };
      })
    );
    await supabase.from("steps").insert(stepsToInsert);
  }

  return recipeId;
}

// ── Update recipe ────────────────────────────────────────────────────────────
export async function updateRecipe(recipeId: string, input: RecipeInput): Promise<void> {
  const supabase = createClient();

  // 1. Upload new cover if provided
  let cover_image = input.cover_image ?? null;
  if (input.coverFile) {
    cover_image = await uploadFile("recipe-covers", safeFileName(input.coverFile), input.coverFile);
  }

  // 2. Update recipe row
  const { error } = await supabase
    .from("recipes")
    .update({
      title: input.title,
      slug: input.slug,
      description: input.description || null,
      note: input.note || null,
      ingredients: input.ingredients || null,
      title_en: input.title_en?.trim() || null,
      description_en: input.description_en?.trim() || null,
      note_en: input.note_en?.trim() || null,
      ingredients_en: input.ingredients_en?.trim() || null,
      cover_image,
      published: input.published,
      featured: input.featured,
      recipe_type: input.recipe_type ?? "food",
      cook_time: input.cook_time ?? null,
      servings: input.servings ?? null,
      // КБЖУ из формы (см. createRecipe). undefined → не трогаем существующее.
      ...(input.nutrition !== undefined ? { nutrition: input.nutrition } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", recipeId);

  if (error) throw error;

  // 3. Replace categories
  await supabase.from("recipe_categories").delete().eq("recipe_id", recipeId);
  if (input.categoryIds.length > 0) {
    await supabase.from("recipe_categories").insert(
      input.categoryIds.map((category_id) => ({ recipe_id: recipeId, category_id }))
    );
  }

  // 4. Заменяем шаги целиком: удаляем все по recipe_id и вставляем заново.
  //    Раньше удаление шло через `.not("order", in, …)`, но "order" совпадает с
  //    зарезервированным параметром PostgREST → запрос падал (ошибка молча
  //    игнорировалась, удалённые шаги НЕ убирались из БД). Плюс форма
  //    перенумеровывает order. Delete-all + insert надёжнее; _en-поля и фото
  //    сохраняются — форма передаёт их в input.steps.
  await supabase.from("steps").delete().eq("recipe_id", recipeId);

  for (const step of input.steps) {
    let photo_url = step.photo_url;
    if (step.photoFile) {
      photo_url = await uploadFile(
        "step-photos",
        `${recipeId}/${safeFileName(step.photoFile)}`,
        step.photoFile
      );
    }
    await supabase.from("steps").insert({
      recipe_id: recipeId,
      order: step.order,
      title: step.title || null,
      description: step.description,
      title_en: step.title_en?.trim() || null,
      description_en: step.description_en?.trim() || null,
      photo_url,
    });
  }
}

// ── Delete recipe ────────────────────────────────────────────────────────────
export async function deleteRecipe(recipeId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("recipes").delete().eq("id", recipeId);
  if (error) throw error;
}

// ── Toggle «featured» (показ в блоке «Шесть рецептов» на главной) ─────────────
export async function setRecipeFeatured(recipeId: string, featured: boolean): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("recipes").update({ featured }).eq("id", recipeId);
  if (error) throw error;
}

// ── Toggle «published» (опубликован / черновик) ───────────────────────────────
export async function setRecipePublished(recipeId: string, published: boolean): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("recipes").update({ published }).eq("id", recipeId);
  if (error) throw error;
}

// ── Fetch all recipes (admin) ────────────────────────────────────────────────
export async function fetchAdminRecipes() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("recipes")
    .select("id, title, slug, published, featured, created_at, cover_image")
    .is("owner_id", null)
    .eq("visibility", "public")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ── Fetch single recipe with steps + categories ──────────────────────────────
export async function fetchRecipeById(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("recipes")
    .select(`*, steps(*), recipe_categories(category_id)`)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

// ── Fetch featured recipes (for home page) ──────────────────────────────────
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


// ── Fetch all categories ─────────────────────────────────────────────────────
export async function fetchCategories() {
  const supabase = createClient();
  const { data, error } = await supabase.from("categories").select("*").order("type").order("name");
  if (error) throw error;
  return data ?? [];
}
