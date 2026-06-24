import { z } from "zod";

// ── Shared primitives ────────────────────────────────────────────────────────

const uuid = z.string().uuid("Invalid UUID");
const slug = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers and hyphens");

// ── Step ─────────────────────────────────────────────────────────────────────

export const StepSchema = z.object({
  id: uuid.optional(),
  order: z.number().int().positive(),
  title: z.string().max(200).optional().default(""),
  description: z.string().min(1, "Step description is required"),
  photo_url: z.string().url("Must be a valid URL").nullable().optional().default(null),
});

export type StepFormValues = z.infer<typeof StepSchema>;

// ── Recipe form (admin create / edit) ────────────────────────────────────────

export const RecipeFormSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(200),
  slug,
  description: z.string().max(2000).optional().default(""),
  note: z.string().max(5000).optional().default(""),
  ingredients: z.string().max(5000).optional().default(""),
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
  categoryIds: z.array(uuid).default([]),
  steps: z.array(StepSchema).default([]),
});

export type RecipeFormValues = z.infer<typeof RecipeFormSchema>;

// ── API route bodies ─────────────────────────────────────────────────────────

/** Body expected by POST /api/admin/translate.
 *  Принимает ЛИБО recipeId (перевод сохранённого рецепта в БД), ЛИБО content
 *  (перевод «на лету» для ещё не сохранённого рецепта — результат возвращается
 *  в ответе, в БД не пишется). */
const TranslateContentSchema = z.object({
  title: z.string(),
  description: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  ingredients: z.string().nullable().optional(),
  steps: z
    .array(
      z.object({
        order: z.number().int(),
        title: z.string().nullable().optional(),
        description: z.string(),
      }),
    )
    .optional()
    .default([]),
});

export const TranslateRequestSchema = z
  .object({
    recipeId: uuid.optional(),
    content: TranslateContentSchema.optional(),
  })
  .refine((d) => d.recipeId || d.content, {
    message: "Either recipeId or content is required",
  });

/** Body expected by POST /api/admin/generate-image */
export const GenerateImageRequestSchema = z.object({
  prompt: z.string().min(10, "Prompt too short").max(1000),
  recipeId: uuid.optional(),
});

/** Body expected by POST /api/admin/ingredients — добавление в ingredients_base
 *  со страницы «Запросы ингредиентов» (зеркалит upsert из scripts/seed-*.mjs). */
export const NewIngredientSchema = z.object({
  name_ru: z.string().min(1, "Название обязательно").max(200),
  name_en: z.string().max(200).optional().default(""),
  category: z.enum([
    "grain", "dairy", "meat", "fish", "egg", "fat",
    "sweet", "spice", "vegetable", "fruit", "nut", "seed", "other",
  ]),
  kcal_100g: z.number().min(0).max(1000),
  protein_100g: z.number().min(0).max(100),
  fat_100g: z.number().min(0).max(100),
  carbs_100g: z.number().min(0).max(100),
  usda_fdc_id: z.string().max(50).optional().default(""),
  /** parsed_name запросов, которые нужно удалить из очереди после добавления. */
  resolvedRequestNames: z.array(z.string()).default([]),
});

export type NewIngredientValues = z.infer<typeof NewIngredientSchema>;

/** Body expected by POST /api/admin/calculate-nutrition.
 *  Два режима (как в пользовательской форме):
 *   - { recipeId } — посчитать сохранённый рецепт и записать nutrition в БД (+кеш по хешу);
 *   - { ingredients, servings } — посчитать ПО ТЕКСТУ состава, без сохранения,
 *     вернуть результат форме (она сохранит вместе с рецептом). */
export const CalculateNutritionRequestSchema = z
  .object({
    recipeId: uuid.optional(),
    /** Игнорировать кеш по хешу состава и пересчитать принудительно (режим recipeId). */
    force: z.boolean().optional().default(false),
    ingredients: z.string().max(5000).optional(),
    servings: z.number().int().positive().nullable().optional().default(null),
  })
  .refine((d) => !!d.recipeId || !!d.ingredients?.trim(), {
    message: "Either recipeId or ingredients is required",
  });

/** Body expected by POST /api/recipes/calculate-nutrition (расчёт по тексту состава, без сохранения). */
export const UserNutritionCalcSchema = z.object({
  ingredients: z.string().min(1, "Empty ingredients").max(5000),
  servings: z.number().int().positive().nullable().optional().default(null),
});

/** Body expected by POST /api/recipes/import-url (импорт рецепта по ссылке, premium). */
export const ImportUrlSchema = z.object({
  url: z.string().url("Некорректная ссылка").max(2000),
});

/** Body expected by POST /api/admin/revalidate-recipe */
export const RevalidateRecipeRequestSchema = z.object({
  slug,
});

/** Allowed upload buckets */
export const ALLOWED_BUCKETS = ["recipe-covers", "step-photos"] as const;
export type UploadBucket = (typeof ALLOWED_BUCKETS)[number];

/** Allowed image MIME types for upload */
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

/** Max upload file size: 5 MB */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
