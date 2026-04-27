// Translation via Google Gemini API (Google AI Studio)
// Key from: https://aistudio.google.com/app/apikey

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

export async function translateRecipe(input: TranslateInput): Promise<TranslateOutput> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_AI_API_KEY is not set");

  // Build a single prompt with all content to translate in one API call
  const payload = {
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

  const prompt = `You are a professional culinary translator. Translate the following recipe JSON from Russian to English.
Return ONLY valid JSON with the exact same structure. Do not add explanations. Preserve formatting (newlines, dashes).
If a field is empty string "", keep it as "".

Input JSON:
${JSON.stringify(payload, null, 2)}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json() as {
    candidates: { content: { parts: { text: string }[] } }[];
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned empty response");

  let translated: typeof payload;
  try {
    translated = JSON.parse(text);
  } catch {
    throw new Error(`Gemini returned invalid JSON: ${text.slice(0, 200)}`);
  }

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
