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
export function localizedField(
  record: Record<string, unknown>,
  field: string,
  locale: LocaleCode
): string | null {
  if (locale === "ru") return (record[field] as string) ?? null;
  const translated = record[`${field}_${locale}`] as string | undefined;
  return translated || ((record[field] as string) ?? null);
}

// Re-export LocaleCode so existing imports of `Locale` from this file
// can be migrated incrementally.
export type { LocaleCode };
/** @deprecated Import `LocaleCode` from `@/types` instead. */
export type Locale = LocaleCode;
