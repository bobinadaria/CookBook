/**
 * AI-фолбэк извлечения рецепта (когда на странице нет JSON-LD-разметки).
 *
 * Берём очищенный текст страницы и просим gpt-4o-mini вернуть строго
 * структурированный JSON (тот же приём, что в lib/nutrition/parse.ts:
 * chat.completions с response_format=json_schema, strict). Тут тратятся токены —
 * одна страница ≈ доли цента. Язык рецепта сохраняем как на странице.
 */
import OpenAI from "openai";
import type { ImportedRecipe } from "./types";
import { RecipeImportError } from "./types";

const MODEL = "gpt-4o-mini";

const SYSTEM_PROMPT = `Ты извлекаешь ОДИН рецепт из текста веб-страницы.

Верни строго JSON по схеме. Правила:
- Сохраняй язык оригинала (не переводи).
- "is_recipe": true только если на странице действительно есть рецепт (состав и/или шаги). Если это не рецепт (статья, список, главная) — false и остальные поля пустые/null.
- НИКОГДА не выдумывай рецепт. Бери только то, что есть в тексте. Если текст нечитаемый, в «кракозябрах» (символы �) или это явно сбой кодировки — верни is_recipe=false и пустые поля, НЕ сочиняй блюдо.
- "title": название блюда без лишнего («Рецепт …», названий сайта).
- "description": 1–2 предложения сути, без маркетинга. Если нет — "".
- "ingredients": массив строк, по одному ингредиенту на элемент, с количеством как в оригинале («100 г муки»). Без нумерации и маркеров списка.
- "steps": массив шагов в порядке приготовления. У каждого "description" — текст шага; "title" — короткий заголовок, если он явно есть, иначе "".
- "cook_time_minutes": общее время в минутах (число) или null.
- "servings": число порций или null.
- "recipe_type": "drink" если это напиток/коктейль/смузи, иначе "food".
Никакого текста вне JSON.`;

const SCHEMA = {
  type: "object",
  properties: {
    is_recipe: { type: "boolean" },
    title: { type: ["string", "null"] },
    description: { type: ["string", "null"] },
    ingredients: { type: "array", items: { type: "string" } },
    steps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: ["string", "null"] },
          description: { type: "string" },
        },
        required: ["title", "description"],
        additionalProperties: false,
      },
    },
    cook_time_minutes: { type: ["number", "null"] },
    servings: { type: ["number", "null"] },
    recipe_type: { type: ["string", "null"], enum: ["food", "drink", null] },
  },
  required: [
    "is_recipe",
    "title",
    "description",
    "ingredients",
    "steps",
    "cook_time_minutes",
    "servings",
    "recipe_type",
  ],
  additionalProperties: false,
} as const;

interface LlmRecipe {
  is_recipe: boolean;
  title: string | null;
  description: string | null;
  ingredients: string[];
  steps: { title: string | null; description: string }[];
  cook_time_minutes: number | null;
  servings: number | null;
  recipe_type: "food" | "drink" | null;
}

/**
 * Просит модель извлечь рецепт из читаемого текста страницы.
 * Бросает RecipeImportError("not_recipe") если рецепта нет,
 * и RecipeImportError("ai_failed") при сбое модели/ключа.
 */
export async function extractRecipeWithLlm(pageText: string): Promise<ImportedRecipe> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "YOUR_OPENAI_API_KEY_HERE") {
    throw new RecipeImportError("ai_failed", "OPENAI_API_KEY не настроен.");
  }

  const client = new OpenAI({ apiKey });

  let content: string | null = null;
  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: pageText },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "imported_recipe", strict: true, schema: SCHEMA },
      },
      temperature: 0,
    });
    content = response.choices[0]?.message.content ?? null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new RecipeImportError("ai_failed", `OpenAI error: ${msg}`);
  }

  if (!content) {
    throw new RecipeImportError("ai_failed", "OpenAI вернул пустой ответ.");
  }

  let parsed: LlmRecipe;
  try {
    parsed = JSON.parse(content) as LlmRecipe;
  } catch {
    throw new RecipeImportError("ai_failed", "OpenAI вернул невалидный JSON.");
  }

  const title = (parsed.title ?? "").trim();
  const ingredients = (parsed.ingredients ?? [])
    .map((s) => s.trim())
    .filter(Boolean);
  const steps = (parsed.steps ?? [])
    .map((s) => ({ title: (s.title ?? "").trim(), description: (s.description ?? "").trim() }))
    .filter((s) => s.description.length > 0);

  if (!parsed.is_recipe || !title || (ingredients.length === 0 && steps.length === 0)) {
    throw new RecipeImportError("not_recipe", "На странице не нашёлся рецепт.");
  }

  return {
    title,
    description: (parsed.description ?? "").trim(),
    ingredients,
    steps,
    cook_time: typeof parsed.cook_time_minutes === "number" ? parsed.cook_time_minutes : null,
    servings: typeof parsed.servings === "number" ? parsed.servings : null,
    recipe_type: parsed.recipe_type === "drink" ? "drink" : "food",
  };
}
