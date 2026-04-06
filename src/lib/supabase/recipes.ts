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

import { createClient } from "./client";

export interface StepInput {
  id?: string;         // existing step id (for edits)
  order: number;
  title: string;
  description: string;
  photo_url: string | null;
  photoFile?: File;    // new local file to upload
}

export interface RecipeInput {
  title: string;
  slug: string;
  description: string;
  note: string;
  ingredients: string;
  published: boolean;
  featured: boolean;
  categoryIds: string[];
  steps: StepInput[];
  coverFile?: File;    // new local file
  cover_image?: string; // existing URL
}

// ── Slug helper ─────────────────────────────────────────────────────────────

const CYRILLIC_MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
  з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
  ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu",
  я: "ya",
};

export function toSlug(title: string) {
  return title
    .toLowerCase()
    .split("")
    .map((ch) => CYRILLIC_MAP[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

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
      cover_image,
      published: input.published,
      featured: input.featured,
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
      cover_image,
      published: input.published,
      featured: input.featured,
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

  // 4. Replace steps
  await supabase.from("steps").delete().eq("recipe_id", recipeId);
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
          photo_url,
        };
      })
    );
    await supabase.from("steps").insert(stepsToInsert);
  }
}

// ── Delete recipe ────────────────────────────────────────────────────────────
export async function deleteRecipe(recipeId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("recipes").delete().eq("id", recipeId);
  if (error) throw error;
}

// ── Fetch all recipes (admin) ────────────────────────────────────────────────
export async function fetchAdminRecipes() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("recipes")
    .select("id, title, slug, published, created_at, cover_image")
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
