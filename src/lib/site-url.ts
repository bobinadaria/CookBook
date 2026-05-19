/**
 * Нормализация base-URL сайта.
 *
 * `NEXT_PUBLIC_SITE_URL` иногда забывают писать с протоколом — `bydaria.kitchen`
 * вместо `https://bydaria.kitchen`. Из-за этого `new URL(...)` в metadata
 * валит весь production-билд на этапе `_not-found`-страницы.
 *
 * Эта функция терпима: если префикса нет — подставляет `https://`.
 * Возвращает абсолютный URL без trailing slash.
 */
const DEFAULT_SITE_URL = "https://bydaria.kitchen";

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return DEFAULT_SITE_URL;
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return withProtocol.replace(/\/+$/, "");
}
