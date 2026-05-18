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

const SYSTEM_PROMPT = `Ты — парсер ингредиентов из русских кулинарных рецептов.

На вход получаешь текст рецепта, где каждая строка — один ингредиент либо служебная информация. Возвращаешь JSON-массив объектов в указанной схеме.

Правила:

1. Для каждой строки извлеки:
   - "input": исходную строку как есть
   - "name": название в именительном падеже, ед.ч., lowercase, БЕЗ прилагательных-описаний (например «отварной», «свежий», «крупный» — убираем). Примеры:
       «100 г пшеничной муки» → "мука пшеничная"
       «2 яйца» → "яйцо"
       «500 г куриной грудки» → "курица грудка"
       «1 средняя луковица» → "лук"
       «50 г сухой чёрной фасоли» → "фасоль чёрная"
       «пучок укропа» → "укроп"
   - "grams": количество в граммах (число). Конвертируй сам исходя из общеизвестных оценок плотности:
       1 ст. л. муки ≈ 10 г, сахара ≈ 25 г, масла ≈ 14 г, мёда ≈ 21 г, какао ≈ 7 г
       1 ч. л. ≈ 5 г для большинства сыпучих
       1 стакан (250 мл) муки ≈ 130 г, сахара ≈ 200 г
       1 яйцо ≈ 50 г, 1 средняя луковица ≈ 150 г, 1 морковка ≈ 80 г,
       1 помидор ≈ 120 г, 1 ломтик хлеба ≈ 30 г, 1 зубчик чеснока ≈ 5 г,
       пучок зелени ≈ 30 г, щепотка ≈ 1 г
       Для жидкостей: 1 мл ≈ 1 г (для воды/молока/кефира/сливок), 1 мл масла ≈ 0.92 г
   - "skipped": true если строку нужно пропустить
   - "skip_reason": почему пропустили (если skipped)

2. Пропускай (skipped: true):
   - Заголовки секций: «— Для крема —», «=== Соус ===», «# Подача»
   - Соль и перец «по вкусу» (вклад в КБЖУ копеечный)
   - «специи по вкусу», «травы по вкусу»
   - Воду (0 калорий)
   - Чисто декоративные подачи без указания количества: «зелень для украшения»
   - Пустые строки
   ВНИМАНИЕ: если у соли/перца указано количество (например, «2 ст.л. соли») — НЕ пропускай, но name="соль".

3. Если в строке указан «или» — выбирай первый вариант. «Персик или слива» → name="персик".

4. Если строка непонятна — skipped:true, skip_reason="unparseable: <причина>".

5. Возвращай СТРОГО валидный JSON в схеме, ничего больше.`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    ingredients: {
      type: "array",
      items: {
        type: "object",
        properties: {
          input: { type: "string" },
          name: { type: ["string", "null"] },
          grams: { type: ["number", "null"] },
          skipped: { type: "boolean" },
          skip_reason: { type: ["string", "null"] },
        },
        required: ["input", "name", "grams", "skipped", "skip_reason"],
        additionalProperties: false,
      },
    },
  },
  required: ["ingredients"],
  additionalProperties: false,
} as const;

export async function parseIngredients(rawText: string): Promise<ParseResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "YOUR_OPENAI_API_KEY_HERE") {
    throw new Error(
      "OPENAI_API_KEY не настроен в .env.local — без него парсер не работает",
    );
  }

  const client = new OpenAI({ apiKey });
  const model = "gpt-4o-mini";

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: rawText },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "parsed_ingredients",
        strict: true,
        schema: RESPONSE_SCHEMA,
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
