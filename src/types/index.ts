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
  title_en?: string | null;
  title_cs?: string | null;
  description_en?: string | null;
  description_cs?: string | null;
  note_en?: string | null;
  note_cs?: string | null;
  created_at: string;
  updated_at: string;
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
  title_en?: string | null;
  title_cs?: string | null;
  description_en?: string | null;
  description_cs?: string | null;
}

export interface Favorite {
  id: string;
  user_id: string;
  recipe_id: string;
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
