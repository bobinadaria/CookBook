// Google Cloud Translation API v2 (Basic)
// Key from: Google Cloud Console → APIs & Services → Credentials
// This is different from Gemini/Generative AI — it's a pure translation REST API

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

/** Translate a single string via Google Cloud Translation API v2 */
async function translateText(text: string, apiKey: string): Promise<string> {
  if (!text) return text;
  const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: text, source: "ru", target: "en", format: "text" }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Translate API error ${res.status}: ${err}`);
  }
  const data = await res.json() as {
    data: { translations: { translatedText: string }[] };
  };
  return data.data.translations[0].translatedText;
}

/** Translate nullable string — returns null if input is null */
async function translateNullable(text: string | null, apiKey: string): Promise<string | null> {
  if (!text) return null;
  return translateText(text, apiKey);
}

export async function translateRecipe(input: TranslateInput): Promise<TranslateOutput> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_TRANSLATE_API_KEY is not set");

  // Translate all fields in parallel
  const [title, description, note, ingredients] = await Promise.all([
    translateText(input.title, apiKey),
    translateNullable(input.description, apiKey),
    translateNullable(input.note, apiKey),
    translateNullable(input.ingredients, apiKey),
  ]);

  // Translate steps in parallel
  const steps = await Promise.all(
    input.steps.map(async (step) => ({
      order: step.order,
      title: step.title ? await translateText(step.title, apiKey) : null,
      description: await translateText(step.description, apiKey),
    }))
  );

  return {
    en: { title, description, note, ingredients, steps },
  };
}
