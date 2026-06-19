/**
 * fetch с таймаутом через AbortController.
 *
 * Зачем: AI-роуты (расчёт КБЖУ, resolve-alias, импорт) могут зависнуть, если
 * OpenAI/Google тормозят. Без таймаута на клиенте спиннер в форме крутится
 * вечно. Эта обёртка прерывает запрос и бросает ошибку с флагом `isTimeout`,
 * чтобы UI показал понятное сообщение вместо бесконечной загрузки.
 */

export class FetchTimeoutError extends Error {
  readonly isTimeout = true;
  constructor(message = "Request timed out") {
    super(message);
    this.name = "FetchTimeoutError";
  }
}

/** True, если ошибка — это наш таймаут или abort. */
export function isTimeoutError(err: unknown): boolean {
  return (
    err instanceof FetchTimeoutError ||
    (err instanceof DOMException && err.name === "AbortError")
  );
}

/**
 * Как обычный fetch, но прерывается через `timeoutMs` (по умолчанию 50с —
 * чуть меньше серверного maxDuration=60, чтобы клиент сдался первым с понятной
 * ошибкой). Бросает FetchTimeoutError при истечении времени.
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 50_000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new FetchTimeoutError();
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
