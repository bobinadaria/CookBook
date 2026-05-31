// Перевод рецепта RU→EN.
//
// Основной путь — Google Gemini 2.5 Flash (Google AI Studio); фолбэк — OpenAI
// gpt-4o-mini. Симметрично генерации обложки (lib/cover-image.ts): оба сервиса
// Google сидят на одном GOOGLE_AI_API_KEY / одном проекте, поэтому месячный
// лимит трат (429 RESOURCE_EXHAUSTED) глушит и перевод, и Imagen разом. Запасной
// маршрут через OpenAI снимает эту единую точку отказа.
//
// Ключи: GOOGLE_AI_API_KEY (https://aistudio.google.com/app/apikey),
//        OPENAI_API_KEY  (фолбэк).
import OpenAI from "openai";

interface TranslateInput {
  title: string;
  description: string | null;
  note: string | null;
  ingredients: string | null;
  steps: { order: number; title: string | null; description: string }[];
}

interface TranslationResult {
  title: string;
  description: string | null;
  note: string | null;
  ingredients: string | null;
  steps: { order: number; title: string | null; description: string }[];
}

interface TranslateOutput {
  en: TranslationResult;
}

/** Плоский JSON, которым обмениваемся с моделью (и туда, и обратно). */
type TranslatePayload = {
  title: string;
  description: string;
  note: string;
  ingredients: string;
  steps: { order: number; title: string; description: string }[];
};

/** Готовит payload для модели (null → "", чтобы структура была стабильной). */
function buildPayload(input: TranslateInput): TranslatePayload {
  return {
    title: input.title,
    description: input.description ?? "",
    note: input.note ?? "",
    ingredients: input.ingredients ?? "",
    steps: input.steps.map((s) => ({
      order: s.order,
      title: s.title ?? "",
      description: s.description,
    })),
  };
}

/** Единый промпт для обеих моделей. */
function buildPrompt(payload: TranslatePayload): string {
  return `You are a professional culinary translator. Translate the following recipe JSON from Russian to English.
Return ONLY valid JSON with the exact same structure. Do not add explanations. Preserve formatting (newlines, dashes).
If a field is empty string "", keep it as "".

Input JSON:
${JSON.stringify(payload, null, 2)}`;
}

/** Раскладывает ответ модели обратно в TranslateOutput (с фолбэком на оригинал). */
function toOutput(translated: TranslatePayload, input: TranslateInput): TranslateOutput {
  return {
    en: {
      title: translated.title || input.title,
      description: translated.description || null,
      note: translated.note || null,
      ingredients: translated.ingredients || null,
      steps: translated.steps.map((s) => ({
        order: s.order,
        title: s.title || null,
        description: s.description,
      })),
    },
  };
}

/** Основной путь: Gemini 2.5 Flash. */
async function translateWithGemini(input: TranslateInput): Promise<TranslateOutput> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_AI_API_KEY is not set");

  const payload = buildPayload(input);
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(payload) }] }],
        generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
      }),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as {
    candidates: { content: { parts: { text: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned empty response");

  let translated: TranslatePayload;
  try {
    translated = JSON.parse(text);
  } catch {
    throw new Error(`Gemini returned invalid JSON: ${text.slice(0, 200)}`);
  }
  return toOutput(translated, input);
}

/** Фолбэк: OpenAI gpt-4o-mini (JSON-режим). */
async function translateWithOpenAi(input: TranslateInput): Promise<TranslateOutput> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "YOUR_OPENAI_API_KEY_HERE")
    throw new Error("OPENAI_API_KEY is not set");

  const payload = buildPayload(input);
  const openai = new OpenAI({ apiKey });
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a professional culinary translator. Return ONLY valid JSON with the exact same structure as the input. Preserve formatting (newlines, dashes). Keep empty strings empty.",
      },
      { role: "user", content: buildPrompt(payload) },
    ],
  });

  const text = response.choices[0]?.message.content;
  if (!text) throw new Error("OpenAI returned empty response");

  let translated: TranslatePayload;
  try {
    translated = JSON.parse(text);
  } catch {
    throw new Error(`OpenAI returned invalid JSON: ${text.slice(0, 200)}`);
  }
  // OpenAI в json_object может не вернуть steps — подстрахуемся оригиналом.
  if (!Array.isArray(translated.steps)) translated.steps = payload.steps;
  return toOutput(translated, input);
}

/**
 * Переводит рецепт RU→EN: Gemini → фолбэк gpt-4o-mini.
 * Бросает ошибку Gemini (исходную), только если упали оба пути.
 */
export async function translateRecipe(input: TranslateInput): Promise<TranslateOutput> {
  try {
    return await translateWithGemini(input);
  } catch (geminiErr) {
    console.warn("[translate] Gemini failed, fallback → gpt-4o-mini:", geminiErr);
    try {
      return await translateWithOpenAi(input);
    } catch (openaiErr) {
      const m1 = geminiErr instanceof Error ? geminiErr.message : String(geminiErr);
      const m2 = openaiErr instanceof Error ? openaiErr.message : String(openaiErr);
      console.error("[translate] оба переводчика упали:", m1, "|", m2);
      throw new Error(m1);
    }
  }
}
