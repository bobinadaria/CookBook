/**
 * AI-оценка макросов неизвестного ингредиента.
 *
 * Только для показа «±N% относительно предложенной замены» на UI. НЕ участвует
 * в расчёте КБЖУ рецепта — там используются только проверенные значения из
 * ingredients_base. Эта функция помогает пользователю осознанно решить, считать
 * ли стрэчателлу как моцареллу.
 *
 * Один батч-вызов на весь список ненайденных. Если AI вернул мусор — функция
 * не падает, просто возвращает пустую Map (UI покажет абсолютные значения замены).
 */
import OpenAI from "openai";

const MODEL = "gpt-4o-mini";

const SYSTEM_PROMPT = `Ты — пищевой эксперт. На вход получаешь список названий продуктов
(могут быть на русском или иностранном языке, могут быть редкими). Для каждого
ОЦЕНИ макросы на 100 г сырого продукта по своим знаниям: kcal, белки (P), жиры (F),
углеводы (C). Цифры — твоя БЫСТРАЯ оценка, не нужно идеальной точности. Если
продукт совсем неизвестен или это очевидно НЕ еда — поставь null для всех значений.`;

const SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          kcal: { type: ["number", "null"] },
          protein: { type: ["number", "null"] },
          fat: { type: ["number", "null"] },
          carbs: { type: ["number", "null"] },
        },
        required: ["name", "kcal", "protein", "fat", "carbs"],
        additionalProperties: false,
      },
    },
  },
  required: ["items"],
  additionalProperties: false,
} as const;

export interface EstimateResult {
  kcal_100g: number;
  protein_100g: number;
  fat_100g: number;
  carbs_100g: number;
}

/**
 * Получить оценку макросов для списка имён. Возвращает Map(name → estimate).
 * Если AI отказался / упал / вернул мусор — соответствующие ключи отсутствуют.
 *
 * Безопасна для прода: ошибки логируются, не пробрасываются.
 */
export async function estimateMacros(
  names: string[],
): Promise<Map<string, EstimateResult>> {
  const result = new Map<string, EstimateResult>();
  if (names.length === 0) return result;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("[estimateMacros] OPENAI_API_KEY missing — skip");
    return result;
  }

  const client = new OpenAI({ apiKey });
  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Оцени макросы (на 100 г сырого продукта) для:\n${names
            .map((n) => `- ${n}`)
            .join("\n")}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "estimate_batch",
          strict: true,
          schema: SCHEMA,
        },
      },
      temperature: 0,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return result;

    const parsed = JSON.parse(content) as {
      items?: Array<{
        name?: string;
        kcal?: number | null;
        protein?: number | null;
        fat?: number | null;
        carbs?: number | null;
      }>;
    };

    for (const item of parsed.items ?? []) {
      if (
        !item.name ||
        item.kcal == null ||
        item.protein == null ||
        item.fat == null ||
        item.carbs == null
      ) {
        continue;
      }
      result.set(item.name, {
        kcal_100g: round(item.kcal),
        protein_100g: round(item.protein),
        fat_100g: round(item.fat),
        carbs_100g: round(item.carbs),
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[estimateMacros] failed (non-fatal):", msg);
  }

  return result;
}

function round(n: number, digits = 2): number {
  const m = 10 ** digits;
  return Math.round(n * m) / m;
}
