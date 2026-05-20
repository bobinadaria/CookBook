import type { LocaleCode } from "@/types";

/**
 * Reads a localized string field from a DB record.
 *
 * Convention: the primary (Russian) value lives at `field`,
 * the English translation lives at `field_en`.
 *
 * Falls back to the primary value when a translation is absent.
 *
 * @example
 * localizedField(recipe, "title", "en") // → recipe.title_en ?? recipe.title
 * localizedField(recipe, "title", "ru") // → recipe.title
 */
export function localizedField<T extends object>(
  record: T,
  field: string,
  locale: LocaleCode
): string | null {
  // Один внутренний каст вместо каста на каждом call-site (Category/Step/Recipe
  // — интерфейсы без index-signature, поэтому передаются как object).
  const rec = record as Record<string, unknown>;
  if (locale === "ru") return (rec[field] as string) ?? null;
  const translated = rec[`${field}_${locale}`] as string | undefined;
  return translated || ((rec[field] as string) ?? null);
}

// Re-export LocaleCode so existing imports of `Locale` from this file
// can be migrated incrementally.
export type { LocaleCode };
/** @deprecated Import `LocaleCode` from `@/types` instead. */
export type Locale = LocaleCode;
