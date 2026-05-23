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

/** Body expected by POST /api/admin/translate */
export const TranslateRequestSchema = z.object({
  recipeId: uuid,
});

/** Body expected by POST /api/admin/generate-image */
export const GenerateImageRequestSchema = z.object({
  prompt: z.string().min(10, "Prompt too short").max(1000),
  recipeId: uuid.optional(),
});

/** Body expected by POST /api/admin/calculate-nutrition */
export const CalculateNutritionRequestSchema = z.object({
  recipeId: uuid,
  /** Игнорировать кеш по хешу состава и пересчитать принудительно (кнопка «Пересчитать»). */
  force: z.boolean().optional().default(false),
});

/** Body expected by POST /api/recipes/calculate-nutrition (расчёт по тексту состава, без сохранения). */
export const UserNutritionCalcSchema = z.object({
  ingredients: z.string().min(1, "Empty ingredients").max(5000),
  servings: z.number().int().positive().nullable().optional().default(null),
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
