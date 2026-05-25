/**
 * Shared input/result types for user-recipe server actions.
 *
 * Kept in a plain module (NOT the "use server" actions file) because a
 * "use server" file may only export async functions — exporting types from it
 * is fragile. Both the actions and the client form import these from here.
 */

import type { NutritionData } from "@/types";

export interface UserRecipeStepInput {
  /** Present when editing an existing step (preserves it in place). */
  id?: string;
  order: number;
  title: string;
  description: string;
  photo_url: string | null;
}

export interface UserRecipeInput {
  title: string;
  description: string;
  note: string;
  ingredients: string;
  /** «Еда» или «Напиток». У напитков нет КБЖУ/времени/порций. */
  recipe_type: "food" | "drink";
  cook_time: number | null;
  servings: number | null;
  categoryIds: string[];
  /** Already-uploaded cover URL (uploaded client-side via /api/upload) or null. */
  cover_image: string | null;
  steps: UserRecipeStepInput[];
  /** Рассчитанное КБЖУ (AI-нутрициолог) или null. Сохраняется вместе с рецептом. */
  nutrition?: NutritionData | null;
}

export type UserRecipeResult =
  | { ok: true; id: string }
  | { ok: false; error: string; code: "auth" | "limit" | "validation" | "db" };
