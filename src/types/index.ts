// ── Locale ───────────────────────────────────────────────────────────────────

/** Supported UI locales. Mirrors next-intl routing config. */
export type LocaleCode = "ru" | "en";

// ── Core domain types ────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  role: "user" | "admin";
  created_at: string;
}

export type CategoryType =
  | "country"
  | "category"
  | "meal_type"
  | "meal_time"
  | "ingredient"
  | "season";

export interface Category {
  id: string;
  name: string;
  name_en?: string | null;
  slug: string;
  type: CategoryType;
}

export interface Recipe {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  note: string | null;
  ingredients: string | null;
  cover_image: string | null;
  published: boolean;
  featured: boolean;
  cook_time: number | null;  // total minutes
  servings: number | null;   // number of portions
  // Translated fields stored in DB (English variant)
  title_en?: string | null;
  description_en?: string | null;
  note_en?: string | null;
  created_at: string;
  updated_at: string;
  // Relations (joined when needed)
  categories?: Category[];
  steps?: Step[];
}

export interface Step {
  id: string;
  recipe_id: string;
  order: number;
  title: string | null;
  description: string;
  photo_url: string | null;
  // Translated fields stored in DB (English variant)
  title_en?: string | null;
  description_en?: string | null;
}

export interface Favorite {
  id: string;
  user_id: string;
  recipe_slug: string;
  created_at: string;
  recipe?: Recipe;
}

export interface UserNote {
  id: string;
  user_id: string;
  recipe_id: string;
  content: string;
  updated_at: string;
  recipe?: Recipe;
}

export interface RecipeCategory {
  recipe_id: string;
  category_id: string;
}

// ── Component-specific types (derived from domain types) ─────────────────────

/** Minimal recipe data required to render a RecipeCard. */
export type RecipeCardData = Pick<
  Recipe,
  "id" | "title" | "slug" | "cover_image" | "title_en"
>;

/** Recipe row shown in the admin recipe list. */
export type AdminRecipeListItem = Pick<
  Recipe,
  "id" | "title" | "slug" | "published" | "created_at" | "cover_image"
>;

// ── Form input types (used by admin RecipeForm) ───────────────────────────────

export interface StepInput {
  /** Existing step ID (present when editing, absent for new steps). */
  id?: string;
  order: number;
  title: string;
  description: string;
  photo_url: string | null;
  /** New local file selected by the user — uploaded on save. */
  photoFile?: File;
}

export interface RecipeInput {
  title: string;
  slug: string;
  description: string;
  note: string;
  ingredients: string;
  published: boolean;
  featured: boolean;
  cook_time: number | null;  // total minutes
  servings: number | null;   // number of portions
  categoryIds: string[];
  steps: StepInput[];
  /** New cover file selected by the user — uploaded on save. */
  coverFile?: File;
  /** Existing cover URL (kept when no new file is selected). */
  cover_image?: string;
}
