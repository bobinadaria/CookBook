"use server";

/**
 * Server actions for user-owned ("My cookbook") recipes.
 *
 * Why server actions (not a client insert): the server is the only place we
 * trust to force `owner_id = auth.uid()`, `visibility = 'private'` and
 * `published = false`, and to enforce the Free plan recipe limit. A client could
 * otherwise try to publish into the public catalog or exceed its quota.
 *
 * Defense in depth: RLS on `recipes` independently enforces the same invariants
 * (insert `with check (owner_id = auth.uid() AND visibility='private' AND
 * published=false)`), so even a bug here cannot leak a private recipe into the
 * catalog. File uploads happen client-side via /api/upload before these run, so
 * actions receive plain serializable data (URLs), never File objects.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canCreateRecipe } from "@/lib/entitlements";
import { toSlug } from "@/lib/slug";
import type {
  UserRecipeInput,
  UserRecipeResult,
  UserRecipeStepInput,
} from "./types";

/** Build a globally-unique slug for a private recipe (catalog slug is unique). */
function buildPrivateSlug(title: string): string {
  const base = toSlug(title) || "recipe";
  const rand = Math.random().toString(36).slice(2, 8);
  return `${base}-${rand}`;
}

/** Minimal server-side validation shared by create/update. */
function validate(input: UserRecipeInput): string | null {
  if (!input.title.trim()) return "validation";
  if (input.steps.some((s) => !s.description.trim())) return "validation";
  return null;
}

/** Error envelope for relation writes (null = success). */
type RelError = { message: string } | null;

/** Insert categories for a recipe (no-op when empty). Returns an error if any. */
async function insertCategories(
  supabase: Awaited<ReturnType<typeof createClient>>,
  recipeId: string,
  categoryIds: string[],
): Promise<RelError> {
  if (categoryIds.length === 0) return null;
  const { error } = await supabase
    .from("recipe_categories")
    .insert(categoryIds.map((category_id) => ({ recipe_id: recipeId, category_id })));
  return error ? { message: error.message } : null;
}

/** Insert all steps fresh (used on create). Returns an error if any. */
async function insertSteps(
  supabase: Awaited<ReturnType<typeof createClient>>,
  recipeId: string,
  steps: UserRecipeStepInput[],
): Promise<RelError> {
  if (steps.length === 0) return null;
  const { error } = await supabase.from("steps").insert(
    steps.map((step) => ({
      recipe_id: recipeId,
      order: step.order,
      title: step.title.trim() || null,
      description: step.description,
      photo_url: step.photo_url,
    })),
  );
  return error ? { message: error.message } : null;
}

// ── Create ───────────────────────────────────────────────────────────────────

export async function createUserRecipe(
  input: UserRecipeInput,
): Promise<UserRecipeResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated", code: "auth" };

  if (validate(input)) {
    return { ok: false, error: "Invalid recipe", code: "validation" };
  }

  // Count current private recipes and enforce the plan limit (no-op while the
  // MONETIZATION_ENABLED flag is off — limit comes back as null = unlimited).
  const { count } = await supabase
    .from("recipes")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id);
  const { allowed, limit } = await canCreateRecipe(user.id, count ?? 0);
  if (!allowed) {
    return { ok: false, error: `limit:${limit ?? ""}`, code: "limit" };
  }

  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .insert({
      title: input.title.trim(),
      slug: buildPrivateSlug(input.title),
      description: input.description.trim() || null,
      note: input.note.trim() || null,
      ingredients: input.ingredients.trim() || null,
      recipe_type: input.recipe_type === "drink" ? "drink" : "food",
      cover_image: input.cover_image,
      // У напитков нет времени/порций/КБЖУ — форма уже шлёт null, подстрахуемся.
      cook_time: input.recipe_type === "drink" ? null : input.cook_time,
      servings: input.recipe_type === "drink" ? null : input.servings,
      nutrition: input.recipe_type === "drink" ? null : (input.nutrition ?? null),
      // Server-forced invariants (RLS also enforces these on insert):
      owner_id: user.id,
      visibility: "private",
      published: false,
      featured: false,
    })
    .select("id")
    .single();

  if (recipeError || !recipe) {
    return { ok: false, error: recipeError?.message ?? "Insert failed", code: "db" };
  }

  // If a relation write fails, roll back the just-created recipe so we never
  // leave a half-saved record (recipe with missing categories/steps).
  const relError =
    (await insertCategories(supabase, recipe.id, input.categoryIds)) ??
    (await insertSteps(supabase, recipe.id, input.steps));
  if (relError) {
    await supabase.from("recipes").delete().eq("id", recipe.id).eq("owner_id", user.id);
    return { ok: false, error: relError.message, code: "db" };
  }

  revalidatePath("/dashboard/recipes");
  return { ok: true, id: recipe.id };
}

// ── Update ───────────────────────────────────────────────────────────────────

export async function updateUserRecipe(
  recipeId: string,
  input: UserRecipeInput,
): Promise<UserRecipeResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated", code: "auth" };

  if (validate(input)) {
    return { ok: false, error: "Invalid recipe", code: "validation" };
  }

  // Update is scoped to the owner both here (.eq owner_id) and by RLS. We do NOT
  // touch slug/visibility/published — a user can't republish or rename the URL.
  const { data: updated, error: updateError } = await supabase
    .from("recipes")
    .update({
      title: input.title.trim(),
      description: input.description.trim() || null,
      note: input.note.trim() || null,
      ingredients: input.ingredients.trim() || null,
      recipe_type: input.recipe_type === "drink" ? "drink" : "food",
      cover_image: input.cover_image,
      cook_time: input.recipe_type === "drink" ? null : input.cook_time,
      servings: input.recipe_type === "drink" ? null : input.servings,
      nutrition: input.recipe_type === "drink" ? null : (input.nutrition ?? null),
      updated_at: new Date().toISOString(),
    })
    .eq("id", recipeId)
    .eq("owner_id", user.id)
    .select("id")
    .single();

  if (updateError || !updated) {
    return { ok: false, error: updateError?.message ?? "Not found", code: "db" };
  }

  // Replace categories (surface any failure instead of silently dropping them).
  const delCat = await supabase.from("recipe_categories").delete().eq("recipe_id", recipeId);
  if (delCat.error) return { ok: false, error: delCat.error.message, code: "db" };
  const catErr = await insertCategories(supabase, recipeId, input.categoryIds);
  if (catErr) return { ok: false, error: catErr.message, code: "db" };

  // Заменяем шаги целиком: удаляем все по recipe_id и вставляем заново.
  // Почему не точечный upsert по order: колонка "order" совпадает с
  // зарезервированным параметром PostgREST — фильтр `.not("order", in, …)`
  // падает с PGRST100 ("failed to parse order") на КАЖДОМ сохранении. Плюс форма
  // перенумеровывает order при удалении шага, поэтому «удалить по старому order»
  // логически неверно. Delete-all + insert чисто и не зависит от id/order.
  const delSteps = await supabase.from("steps").delete().eq("recipe_id", recipeId);
  if (delSteps.error) return { ok: false, error: delSteps.error.message, code: "db" };
  const stepErr = await insertSteps(supabase, recipeId, input.steps);
  if (stepErr) return { ok: false, error: stepErr.message, code: "db" };

  revalidatePath("/dashboard/recipes");
  revalidatePath(`/dashboard/recipes/${recipeId}`);
  return { ok: true, id: recipeId };
}

// ── Delete ───────────────────────────────────────────────────────────────────

export async function deleteUserRecipe(recipeId: string): Promise<UserRecipeResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated", code: "auth" };

  // Scoped to owner here and by RLS. Steps/recipe_categories cascade on delete.
  const { error } = await supabase
    .from("recipes")
    .delete()
    .eq("id", recipeId)
    .eq("owner_id", user.id);

  if (error) return { ok: false, error: error.message, code: "db" };

  revalidatePath("/dashboard/recipes");
  return { ok: true, id: recipeId };
}
