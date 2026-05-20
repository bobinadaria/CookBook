/**
 * Детерминированный хеш текста ingredients для кеша КБЖУ.
 *
 * Нормализует (trim, схлопывает пробелы, lowercase) и считает djb2 → base36.
 * Цель — НЕ криптостойкость, а быстрый стабильный отпечаток: «изменился ли
 * состав с прошлого расчёта». Если хеш совпал — повторный вызов OpenAI не нужен.
 *
 * Формат .mjs — чтобы импортировалось и из TS (parse/calculate/route),
 * и из node-скриптов (recalc-all-nutrition).
 */
export function ingredientsHash(text) {
  const s = (text ?? "").trim().replace(/\s+/g, " ").toLowerCase();
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; // h * 33 + c, unsigned
  }
  return h.toString(36);
}
