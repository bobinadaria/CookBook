"use client";

import { useLocale } from "next-intl";
import { localizedField } from "@/lib/localized-content";
import type { LocaleCode } from "@/types";

/**
 * Returns a helper function that resolves the correct locale variant of any
 * string field from a DB record (e.g. `title`, `description`, `note`).
 *
 * @example
 * const localize = useLocalizedContent();
 * const title = localize(recipe, "title"); // → recipe.title_en ?? recipe.title
 */
export function useLocalizedContent() {
  const locale = useLocale() as LocaleCode;

  return function localize(
    record: Record<string, unknown>,
    field: string
  ): string | null {
    return localizedField(record, field, locale);
  };
}

/**
 * Convenience hook: returns a localized title string for a recipe/category/step.
 *
 * @example
 * const title = useLocalizedTitle(recipe); // → recipe.title_en ?? recipe.title
 */
export function useLocalizedTitle(
  item: { title: string; title_en?: string | null }
): string {
  const locale = useLocale() as LocaleCode;
  if (locale === "en" && item.title_en) return item.title_en;
  return item.title;
}
