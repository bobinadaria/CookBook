/**
 * Утилиты HTML→текст для импорта рецептов.
 *
 *  - decodeEntities / stripTags / cleanText — чистят короткие строки из JSON-LD
 *    (они иногда содержат HTML-сущности и теги).
 *  - htmlToReadableText — грубо превращает целую страницу в читаемый текст для
 *    AI-фолбэка (выкидывает script/style/nav/footer, схлопывает пробелы, режет
 *    по длине), чтобы не слать модели мегабайты разметки.
 */

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  laquo: "«",
  raquo: "»",
  mdash: "—",
  ndash: "–",
  hellip: "…",
  deg: "°",
  frac12: "½",
  frac14: "¼",
  frac34: "¾",
};

/** Декодирует именованные и числовые HTML-сущности. */
export function decodeEntities(input: string): string {
  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, body: string) => {
    if (body[0] === "#") {
      const isHex = body[1] === "x" || body[1] === "X";
      const code = parseInt(body.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      if (Number.isFinite(code) && code > 0) {
        try {
          return String.fromCodePoint(code);
        } catch {
          return match;
        }
      }
      return match;
    }
    const named = NAMED_ENTITIES[body.toLowerCase()];
    return named ?? match;
  });
}

/** Убирает HTML-теги (оставляя текст). */
export function stripTags(input: string): string {
  return input.replace(/<[^>]*>/g, " ");
}

/** Полная чистка короткой строки: теги → пробел, сущности → символы, trim. */
export function cleanText(input: string | null | undefined): string {
  if (!input) return "";
  return decodeEntities(stripTags(input)).replace(/\s+/g, " ").trim();
}

/**
 * Грубое превращение страницы в читаемый текст для AI-фолбэка.
 * Не идеальный ридер, но модель устойчива к шуму — главное снять явный мусор и
 * уложиться в разумный объём токенов.
 */
export function htmlToReadableText(html: string, maxChars = 14_000): string {
  let text = html;
  // Выкидываем целиком неинформативные блоки вместе с содержимым.
  text = text.replace(
    /<(script|style|noscript|template|svg|head|nav|footer|form|iframe)[\s\S]*?<\/\1>/gi,
    " ",
  );
  // Переносы на границах блоков, чтобы строки/шаги не слипались.
  text = text.replace(/<\/(p|div|li|h[1-6]|tr|section|article|br)\s*>/gi, "\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = stripTags(text);
  text = decodeEntities(text);
  // Схлопываем пробелы, но сохраняем переносы строк.
  text = text
    .replace(/[ \t\f\v ]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .replace(/^\s+|\s+$/gm, "")
    .trim();
  if (text.length > maxChars) text = text.slice(0, maxChars);
  return text;
}
