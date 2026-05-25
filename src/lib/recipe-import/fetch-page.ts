/**
 * Безопасная загрузка HTML страницы по пользовательскому URL.
 *
 * Это серверный код (route handler) — пользователь присылает произвольную
 * ссылку, поэтому защищаемся от очевидных злоупотреблений:
 *  - только http/https;
 *  - резолвим хост и режем приватные/loopback/link-local адреса (грубая защита
 *    от SSRF — чтобы нельзя было заставить сервер ходить во внутреннюю сеть);
 *  - таймаут и потолок по размеру ответа;
 *  - проверка content-type (нужен HTML).
 *
 * Guard — best-effort (редиректы по цепочке повторно не валидируются), но фича
 * доступна только premium/приглашённым аккаунтам, так что риск низкий.
 */
import dns from "node:dns/promises";
import net from "node:net";
import { RecipeImportError } from "./types";

const FETCH_TIMEOUT_MS = 12_000;
const MAX_BYTES = 2_000_000; // 2 МБ — страницы рецептов с лихвой укладываются

/** Приватный/непубличный IP (v4 и v6), который сервер не должен дёргать. */
function ipIsPrivate(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true; // private
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // ULA
  if (lower.startsWith("fe80")) return true; // link-local
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return ipIsPrivate(mapped[1]);
  return false;
}

/** Загружает HTML по URL с SSRF-guard, таймаутом и лимитом размера. */
export async function safeFetchHtml(rawUrl: string): Promise<string> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new RecipeImportError("bad_url", "Некорректная ссылка.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new RecipeImportError("bad_url", "Поддерживаются только http и https ссылки.");
  }

  // SSRF-guard: режем приватные адреса.
  const host = url.hostname;
  if (net.isIP(host)) {
    if (ipIsPrivate(host)) {
      throw new RecipeImportError("blocked", "Этот адрес недоступен.");
    }
  } else {
    let addrs: { address: string }[];
    try {
      addrs = await dns.lookup(host, { all: true });
    } catch {
      throw new RecipeImportError("unreachable", "Не удалось найти сайт по этой ссылке.");
    }
    if (addrs.length === 0 || addrs.some((a) => ipIsPrivate(a.address))) {
      throw new RecipeImportError("blocked", "Этот адрес недоступен.");
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        // Некоторые сайты режут запросы без «браузерного» User-Agent.
        "User-Agent":
          "Mozilla/5.0 (compatible; SlowTableBot/1.0; +https://bydaria.kitchen)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ru,en;q=0.8",
      },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new RecipeImportError("timeout", "Сайт слишком долго не отвечал.");
    }
    throw new RecipeImportError("unreachable", "Не удалось открыть ссылку.");
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    throw new RecipeImportError("unreachable", `Сайт вернул ошибку (${res.status}).`);
  }

  const contentType = (res.headers.get("content-type") ?? "").toLowerCase();
  if (contentType && !contentType.includes("html") && !contentType.includes("xml")) {
    throw new RecipeImportError("unreachable", "По ссылке не страница рецепта.");
  }

  // Читаем тело как БАЙТЫ (с потолком по размеру), затем декодируем с учётом
  // кодировки страницы. Многие сайты (особенно рунет — russianfood.com и т.п.)
  // отдают Windows-1251, а не UTF-8; если декодировать cp1251 как UTF-8, вся
  // кириллица превращается в «кракозябры» (�), и парсер/AI получают мусор.
  const bytes = await readBytesCapped(res, MAX_BYTES);
  return decodeHtmlBytes(bytes, contentType);
}

/** Читает тело ответа в Uint8Array с потолком по размеру. */
async function readBytesCapped(res: Response, maxBytes: number): Promise<Uint8Array> {
  const reader = res.body?.getReader();
  if (!reader) {
    const u8 = new Uint8Array(await res.arrayBuffer());
    return u8.byteLength > maxBytes ? u8.subarray(0, maxBytes) : u8;
  }
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      received += value.byteLength;
      if (received > maxBytes) {
        try {
          await reader.cancel();
        } catch {
          /* ignore */
        }
        break;
      }
    }
  }
  const out = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

const CHARSET_ALIASES: Record<string, string> = {
  cp1251: "windows-1251",
  "win-1251": "windows-1251",
  windows1251: "windows-1251",
  cp1252: "windows-1252",
  utf8: "utf-8",
};

/**
 * Определяет кодировку страницы: сначала из заголовка Content-Type, затем из
 * <meta charset> / <meta http-equiv> в начале HTML. Фолбэк — utf-8.
 * Экспортируется для юнит-тестов.
 */
export function detectCharset(contentType: string, headHtml: string): string {
  let label: string | undefined;

  const fromHeader = /charset\s*=\s*["']?([\w-]+)/i.exec(contentType || "");
  if (fromHeader) label = fromHeader[1];

  if (!label) {
    const metaCharset = /<meta[^>]+charset\s*=\s*["']?([\w-]+)/i.exec(headHtml);
    const metaHttpEquiv = /<meta[^>]+content\s*=\s*["'][^"']*charset=([\w-]+)/i.exec(headHtml);
    label = metaCharset?.[1] ?? metaHttpEquiv?.[1];
  }

  if (!label) return "utf-8";
  label = label.toLowerCase().trim();
  label = CHARSET_ALIASES[label] ?? label;

  try {
    // Неизвестная метка бросит RangeError — тогда безопасно падаем на utf-8.
    new TextDecoder(label);
    return label;
  } catch {
    return "utf-8";
  }
}

/** Декодирует байты HTML с учётом кодировки (Content-Type + meta-сниффинг). */
export function decodeHtmlBytes(bytes: Uint8Array, contentType: string): string {
  // Начало страницы читаем как latin1 (байт-в-символ), чтобы найти <meta> ДО
  // того, как узнали настоящую кодировку (ASCII-теги при этом не искажаются).
  const head = new TextDecoder("latin1").decode(bytes.subarray(0, 4096));
  const charset = detectCharset(contentType, head);
  try {
    return new TextDecoder(charset).decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
}
