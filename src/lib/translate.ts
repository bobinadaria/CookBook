import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

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

/** Extract retryDelay seconds from a Gemini 429 error message, e.g. "retryDelay\":\"55s\"" */
function parseRetryDelay(message: string): number {
  const match = message.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/);
  if (match) return Math.ceil(parseFloat(match[1])) * 1000;
  return 0;
}

export async function translateRecipe(input: TranslateInput): Promise<TranslateOutput> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are a professional translator for a personal recipe book website.
Translate the following recipe from Russian to English.

IMPORTANT RULES:
- Keep the tone warm, personal, and cozy — this is a personal recipe book
- Preserve any cultural references or dish names that don't have direct translations (transliterate them)
- For cooking steps, be precise and clear
- For ingredients: translate ingredient names but keep measurements/quantities as-is (e.g. "2 ст.л." stays, just translate the ingredient name)
- The ingredients field uses "—" as section header delimiters (e.g. "— Для теста —"), translate those headers too
- Return ONLY valid JSON, no markdown, no code blocks

Input recipe (JSON):
${JSON.stringify(input, null, 2)}

Return JSON in this exact format:
{
  "en": {
    "title": "...",
    "description": "..." or null,
    "note": "..." or null,
    "ingredients": "..." or null,
    "steps": [{ "order": 1, "title": "..." or null, "description": "..." }]
  }
}`;

  const maxRetries = 4;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      // Strip potential markdown code fences
      const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      return JSON.parse(cleaned) as TranslateOutput;
    } catch (err: unknown) {
      const isQuota =
        err instanceof Error &&
        (err.message.includes("429") || err.message.includes("RESOURCE_EXHAUSTED"));
      if (!isQuota || attempt === maxRetries) throw err;

      // Respect the retryDelay Google gives us; fall back to exponential backoff
      const googleDelay = err instanceof Error ? parseRetryDelay(err.message) : 0;
      const backoff = Math.pow(2, attempt + 1) * 1000 + Math.random() * 1000;
      const delay = Math.max(googleDelay, backoff);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw new Error("Translation failed after retries");
}
