/**
 * OpenAI-based ингредиент-парсер.
 *
 * Принимает сырой текст из recipes.ingredients (одна строка = один ингредиент
 * в формате «100 г муки», «2 шт яйца», «по вкусу», или заголовок «— Для крема —»),
 * возвращает массив структурированных ингредиентов с количеством в граммах.
 *
 * Используется в /api/admin/calculate-nutrition.
 *
 * Модель: gpt-4o-mini (~$0.0004 на средний рецепт из 10-15 строк).
 */
import OpenAI from "openai";
import {
  NUTRITION_SYSTEM_PROMPT,
  NUTRITION_SCHEMA,
  NUTRITION_MODEL,
} from "./prompt.mjs";

export interface ParsedIngredient {
  /** Исходная строка из рецепта (для UI «вот эта строка не сматчилась»). */
  input: string;
  /**
   * Нормализованное название ингредиента в именительном падеже,
   * единственном числе, lowercase. Примеры: «мука», «яйцо», «куриная грудка».
   * Должно соответствовать формату name_ru в ingredients_base.
   * Null если строка — заголовок или «по вкусу» (пропускаем).
   */
  name: string | null;
  /**
   * Альтернативы из «или»-вариантов: «шиитаке или шампиньоны» → name="шиитаке",
   * alternatives=["шампиньоны"]. Матчер пробует name + все alternatives и берёт
   * первый, что реально есть в базе. Пустой массив, если «или» в строке не было.
   */
  alternatives: string[];
  /**
   * Сколько грамм считать. Конвертация из ст.л/ч.л/шт/пучков
   * делается LLM на основе общеизвестных оценок (1 яйцо ≈ 50г, 1 ст.л. муки ≈ 10г).
   * Null если skipped.
   */
  grams: number | null;
  /** True если строку нужно пропустить (заголовок, «соль по вкусу», украшение). */
  skipped: boolean;
  /** Почему пропустили. Для дебага и warnings. */
  skip_reason: string | null;
}

export interface ParseResult {
  ingredients: ParsedIngredient[];
  model: string;
}

export async function parseIngredients(rawText: string): Promise<ParseResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "YOUR_OPENAI_API_KEY_HERE") {
    throw new Error(
      "OPENAI_API_KEY не настроен в .env.local — без него парсер не работает",
    );
  }

  // timeout/maxRetries — чтобы запрос не висел бесконечно, если OpenAI тормозит
  // (иначе на фронте крутится вечный спиннер). 45с с запасом под maxDuration роутов.
  const client = new OpenAI({ apiKey, timeout: 45_000, maxRetries: 1 });
  const model = NUTRITION_MODEL;

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: NUTRITION_SYSTEM_PROMPT },
      { role: "user", content: rawText },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "parsed_ingredients",
        strict: true,
        schema: NUTRITION_SCHEMA,
      },
    },
    temperature: 0,
  });

  const content = response.choices[0]?.message.content;
  if (!content) {
    throw new Error("OpenAI вернул пустой ответ");
  }

  const parsed = JSON.parse(content) as { ingredients: ParsedIngredient[] };
  return { ingredients: parsed.ingredients, model };
}
