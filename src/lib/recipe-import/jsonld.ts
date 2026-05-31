/**
 * Извлечение рецепта из микроразметки schema.org/Recipe (JSON-LD).
 *
 * Это «бесплатный» путь импорта: большинство кулинарных сайтов встраивают в
 * страницу блок <script type="application/ld+json"> с уже структурированным
 * рецептом. Если он есть — раскладываем поля без обращения к AI (токены не
 * тратятся). Парсер устойчив к типичным формам: массивы, @graph, вложенность,
 * recipeInstructions как строка / массив строк / HowToStep / HowToSection.
 */
import type { ImportedRecipe, ImportStep } from "./types";
import { cleanText, stripTags, decodeEntities } from "./html-text";

/* eslint-disable @typescript-eslint/no-explicit-any */
type JsonLdNode = Record<string, any>;

/** Достаёт и парсит все блоки <script type="application/ld+json">. */
function extractJsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = [];
  const re =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const raw = match[1].trim();
    if (!raw) continue;
    try {
      blocks.push(JSON.parse(raw));
    } catch {
      // Частые болячки: висящие запятые. Пробуем мягкую чистку.
      try {
        blocks.push(JSON.parse(raw.replace(/,\s*([\]}])/g, "$1")));
      } catch {
        /* пропускаем битый блок */
      }
    }
  }
  return blocks;
}

/** Содержит ли @type значение "Recipe" (регистронезависимо). */
function isRecipeType(type: unknown): boolean {
  const types = Array.isArray(type) ? type : [type];
  return types.some((t) => typeof t === "string" && t.toLowerCase() === "recipe");
}

/** Рекурсивно ищет первый узел с @type=Recipe (в т.ч. внутри @graph/массивов). */
function findRecipeNode(node: unknown, seen = new Set<unknown>()): JsonLdNode | null {
  if (!node || typeof node !== "object" || seen.has(node)) return null;
  seen.add(node);

  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findRecipeNode(item, seen);
      if (found) return found;
    }
    return null;
  }

  const obj = node as JsonLdNode;
  if (isRecipeType(obj["@type"])) return obj;

  for (const key of Object.keys(obj)) {
    const found = findRecipeNode(obj[key], seen);
    if (found) return found;
  }
  return null;
}

/** ISO 8601 duration (PT1H30M) → минуты. */
function parseIsoDurationToMinutes(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const m = value
    .trim()
    .match(/^P(?:\d+W)?(?:\d+D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:\d+S)?$/i);
  if (!m) return null;
  const hours = m[1] ? parseInt(m[1], 10) : 0;
  const minutes = m[2] ? parseInt(m[2], 10) : 0;
  // День тоже учтём, если вдруг есть (редко для рецептов).
  const dayMatch = value.match(/(\d+)D/i);
  const days = dayMatch ? parseInt(dayMatch[1], 10) : 0;
  const total = days * 24 * 60 + hours * 60 + minutes;
  return total > 0 ? total : null;
}

/**
 * «Человеческое» время в минуты: «2 ч 30 мин», «1 час», «90 минут»,
 * «1 hour 30 minutes», «45 min». Фолбэк, когда totalTime/cookTime — не ISO, а
 * обычный текст (часть сайтов кладёт именно так — иначе время молча теряется).
 * (\b после кириллицы в JS-regex не работает, поэтому единицы матчим стемами.)
 */
function parseHumanDurationToMinutes(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const s = value.toLowerCase();
  let total = 0;
  let found = false;
  // Часы: «ч / час / часа / часов / h / hour(s) / hr».
  const hourMatch = s.match(/(\d+(?:[.,]\d+)?)\s*(?:час[а-я]*|ч|hours?|hrs?|h)/);
  if (hourMatch) {
    total += parseFloat(hourMatch[1].replace(",", ".")) * 60;
    found = true;
  }
  // Минуты: «мин / минут / м / min / minute(s) / m».
  const minMatch = s.match(/(\d+)\s*(?:мин[а-я]*|м|minutes?|mins?|m)/);
  if (minMatch) {
    total += parseInt(minMatch[1], 10);
    found = true;
  }
  if (!found) return null;
  total = Math.round(total);
  return total > 0 ? total : null;
}

/** ISO → человеческий текст. Любой из totalTime/cookTime/prepTime. */
function parseDurationToMinutes(value: unknown): number | null {
  return parseIsoDurationToMinutes(value) ?? parseHumanDurationToMinutes(value);
}

/** recipeYield → число порций (берём первое целое). */
function parseYield(value: unknown): number | null {
  const candidates = Array.isArray(value) ? value : [value];
  for (const c of candidates) {
    if (typeof c === "number" && Number.isFinite(c)) return Math.round(c);
    if (typeof c === "string") {
      const m = c.match(/\d+/);
      if (m) return parseInt(m[0], 10);
    }
  }
  return null;
}

/** recipeIngredient → массив строк. */
function parseIngredients(value: unknown): string[] {
  const arr = Array.isArray(value) ? value : value ? [value] : [];
  return arr
    .map((x) => cleanText(typeof x === "string" ? x : (x?.name ?? x?.text ?? "")))
    .filter((s) => s.length > 0);
}

/** Один элемент recipeInstructions → шаги (рекурсивно для HowToSection). */
function instructionToSteps(item: unknown): ImportStep[] {
  if (typeof item === "string") {
    const text = cleanText(item);
    return text ? [{ title: "", description: text }] : [];
  }
  if (!item || typeof item !== "object") return [];

  const obj = item as JsonLdNode;
  const type = obj["@type"];
  const typeStr = (Array.isArray(type) ? type[0] : type)?.toString().toLowerCase();

  // Секция шагов — разворачиваем вложенный список.
  if (typeStr === "howtosection" || Array.isArray(obj.itemListElement)) {
    const inner = obj.itemListElement;
    const list = Array.isArray(inner) ? inner : inner ? [inner] : [];
    return list.flatMap(instructionToSteps);
  }

  // Обычный шаг (HowToStep / HowToDirection / просто {text}).
  const description = cleanText(obj.text ?? obj.description ?? "");
  if (!description) return [];
  const rawName = cleanText(obj.name ?? "");
  // name часто дублирует начало text — не используем его как заголовок в таком случае.
  const title =
    rawName && !description.toLowerCase().startsWith(rawName.toLowerCase()) ? rawName : "";
  return [{ title, description }];
}

/** Режет текстовый блок на строки по переносам/HTML-разделителям (br, p, li). */
function splitTextBlock(value: string): string[] {
  const withBreaks = value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr)\s*>/gi, "\n");
  return decodeEntities(stripTags(withBreaks))
    .split(/\r?\n+/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

/** recipeInstructions → массив шагов. */
function parseInstructions(value: unknown): ImportStep[] {
  if (typeof value === "string") {
    // Иногда инструкции — один большой текст; режем по переносам/HTML-блокам.
    return splitTextBlock(value).map((p) => ({ title: "", description: p }));
  }
  const arr = Array.isArray(value) ? value : value ? [value] : [];
  return arr.flatMap(instructionToSteps);
}

/** Простейшая эвристика «напиток»: по @type, ключевым словам и категории. */
function detectRecipeType(obj: JsonLdNode): "food" | "drink" {
  const haystack = [
    obj.recipeCategory,
    obj.keywords,
    obj.name,
  ]
    .flat()
    .filter((x) => typeof x === "string")
    .join(" ")
    .toLowerCase();
  // Только высоконадёжные «напиточные» стемы: ложное срабатывание стоит дорого
  // (у напитков сознательно нет КБЖУ — еду нельзя по ошибке записать в напитки).
  // Поэтому без коллизионных «сок/чай/морс» (морс⊂морской и т.п.).
  const drinkWords =
    /(коктейл|напит|drink|cocktail|smoothie|смузи|лимонад|lemonade|beverage|латте|latte|глинтвейн|mulled wine|mocktail|компот|кисел|узвар|сбитень|пунш|punch|сидр|cider|какао|cocoa|глёг|gl(o|ö)gg)/;
  if (drinkWords.test(haystack)) return "drink";
  return "food";
}

/**
 * Возвращает нормализованный рецепт из JSON-LD страницы или null, если рецепта
 * нет / в нём нет ни состава, ни шагов (тогда вызывающий код пойдёт в AI-фолбэк).
 */
export function extractRecipeFromJsonLd(html: string): ImportedRecipe | null {
  const blocks = extractJsonLdBlocks(html);
  let node: JsonLdNode | null = null;
  for (const block of blocks) {
    node = findRecipeNode(block);
    if (node) break;
  }
  if (!node) return null;

  const title = cleanText(node.name);
  const ingredients = parseIngredients(node.recipeIngredient ?? node.ingredients);
  const steps = parseInstructions(node.recipeInstructions);

  // Нужен хотя бы заголовок + (состав или шаги), иначе разметка бесполезна.
  if (!title || (ingredients.length === 0 && steps.length === 0)) return null;

  const cookTime =
    parseDurationToMinutes(node.totalTime) ??
    parseDurationToMinutes(node.cookTime) ??
    parseDurationToMinutes(node.prepTime);

  return {
    title,
    description: cleanText(node.description),
    ingredients,
    steps,
    cook_time: cookTime,
    servings: parseYield(node.recipeYield),
    recipe_type: detectRecipeType(node),
  };
}
