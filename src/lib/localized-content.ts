export type Locale = "ru" | "en";

export function localizedField(
  record: Record<string, unknown>,
  field: string,
  locale: Locale
): string | null {
  if (locale === "ru") return (record[field] as string) ?? null;
  const localized = record[`${field}_${locale}`] as string | undefined;
  return localized || ((record[field] as string) ?? null);
}
