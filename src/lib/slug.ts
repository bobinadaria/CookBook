/**
 * Pure slug helper — transliterates Cyrillic → Latin and produces a URL-safe slug.
 *
 * Extracted into its own module (no Supabase/browser imports) so it can be used
 * safely from server actions and server components without pulling in the
 * browser Supabase client.
 */

const CYRILLIC_MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
  з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
  ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu",
  я: "ya",
};

export function toSlug(title: string): string {
  return title
    .toLowerCase()
    .split("")
    .map((ch) => CYRILLIC_MAP[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
