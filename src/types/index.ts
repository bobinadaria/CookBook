// ── Locale ───────────────────────────────────────────────────────────────────

/** Supported UI locales. Mirrors next-intl routing config. */
export type LocaleCode = "ru" | "en";

// ── Core domain types ────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  role: "user" | "admin";
  /** Тарифный план (каркас монетизации). По умолчанию 'free'. */
  plan?: "free" | "premium" | "lifetime";
  created_at: string;
}

export type CategoryType =
  | "country"
  | "category"
  | "meal_type"
  | "meal_time"
  | "ingredient"
  | "season"
  | "drink_type";

export interface Category {
  id: string;
  name: string;
  name_en?: string | null;
  slug: string;
  type: CategoryType;
}

/**
 * KБЖУ для одной порции или для всего рецепта.
 * Все значения в граммах, kcal — в килокалориях.
 */
export interface NutritionValues {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
}

/**
 * Информация о том, как один ингредиент рецепта был сматчен в ingredients_base.
 * Хранится в nutrition для прозрачности — можно увидеть «100 г муки» = 366 kcal.
 */
export interface NutritionMatch {
  /** Сырая строка из рецепта, как написала Дарья: «1 яйцо», «100 г муки». */
  input: string;
  /** Нормализованное название из ingredients_base. Null если не сматчен. */
  matched: string | null;
  /** Сколько грамм OpenAI оценил из строки рецепта. */
  grams: number;
  /** Калории этого ингредиента в этой порции (для дебага). Null если не сматчен. */
  kcal: number | null;
  /** Тип матча: точный, fuzzy через pg_trgm, или не нашёлся. */
  match_type: "exact" | "fuzzy" | "unknown";
  /** Similarity score для fuzzy-матча (0..1). Null для exact и unknown. */
  similarity: number | null;
}

/**
 * Nutrition values for a recipe — рассчитываются через /api/admin/calculate-nutrition.
 * Хранится как JSONB в `recipes.nutrition`. Null до первого расчёта.
 * Источник: ingredients_base (USDA FoodData Central + русские справочники).
 */
export interface NutritionData {
  /** КБЖУ на одну порцию. Если servings null — равно total. */
  per_serving: NutritionValues;
  /**
   * КБЖУ на весь рецепт + общий вес всех ингредиентов в граммах.
   * weight_g полезен для расчёта плотности калорий (kcal на 100 г блюда).
   */
  total: NutritionValues & { weight_g: number };
  /** Сколько порций в рецепте (копия recipes.servings на момент расчёта). */
  servings: number;
  /**
   * Confidence в расчёте, 0..1. Рассчитывается как доля грамм,
   * приходящихся на сматченные ингредиенты, от общего веса рецепта.
   * >= 0.85 — высокая, 0.5..0.85 — средняя, < 0.5 — низкая.
   */
  confidence: number;
  /**
   * Человеко-читаемые предупреждения для админ-UI.
   * Например: «Не найдено в базе: рикотта, кетчуп».
   */
  warnings: string[];
  /** Детальный разбор по ингредиентам — для отладки и UI «как считалось». */
  ingredients: NutritionMatch[];
  /** ISO-timestamp момента расчёта. */
  calculated_at: string;
  /** Модель OpenAI, которая парсила. Полезно если решим поменять. */
  model: string;
  /**
   * Хеш текста ingredients на момент расчёта. Кеш: если состав не менялся
   * (хеш совпал) — пропускаем повторный вызов OpenAI. Кнопка «Пересчитать»
   * форсит расчёт игнорируя хеш. Undefined у старых записей → пересчитаются.
   */
  ingredients_hash?: string;
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
  /** 'food' (по умолчанию) | 'drink'. У напитков нет КБЖУ/времени/порций. */
  recipe_type: "food" | "drink";
  /** null = авторский/админский рецепт каталога; задан = личный рецепт пользователя. */
  owner_id?: string | null;
  /** 'public' = каталог автора; 'private' = личная книга пользователя; 'unlisted' — на будущее. */
  visibility?: "public" | "private" | "unlisted";
  cook_time: number | null;  // total minutes
  servings: number | null;   // number of portions
  // Translated fields stored in DB (English variant)
  title_en?: string | null;
  description_en?: string | null;
  note_en?: string | null;
  ingredients_en?: string | null;
  created_at: string;
  updated_at: string;
  // KBJU calculated by /api/admin/calculate-nutrition. Null when not yet computed.
  nutrition?: NutritionData | null;
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
> & {
  /** Optional — present when the query selects it (magazine card meta row). */
  cook_time?: number | null;
  /** Optional — 'drink' показывает на карточке метку «Напиток» вместо категории. */
  recipe_type?: "food" | "drink";
  /** Optional primary categories — used for the card's category eyebrow. */
  categories?: Pick<Category, "id" | "name" | "name_en" | "type">[];
};

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
  /** English variants (двуязычное редактирование). */
  title_en?: string;
  description_en?: string;
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
  /** English variants (двуязычное редактирование). Пусто → null при сохранении. */
  title_en?: string;
  description_en?: string;
  note_en?: string;
  ingredients_en?: string;
  published: boolean;
  featured: boolean;
  /** 'food' (по умолчанию) | 'drink'. У напитков нет КБЖУ/времени/порций. */
  recipe_type: "food" | "drink";
  cook_time: number | null;  // total minutes
  servings: number | null;   // number of portions
  categoryIds: string[];
  steps: StepInput[];
  /** New cover file selected by the user — uploaded on save. */
  coverFile?: File;
  /** Existing cover URL (kept when no new file is selected). */
  cover_image?: string;
}
