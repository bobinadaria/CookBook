import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

interface TranslateInput {
  title: string;
  description: string | null;
  note: string | null;
  steps: { order: number; title: string | null; description: string }[];
}

interface TranslationResult {
  title: string;
  description: string | null;
  note: string | null;
  steps: { order: number; title: string | null; description: string }[];
}

interface TranslateOutput {
  en: TranslationResult;
  cs: TranslationResult;
}

export async function translateRecipe(input: TranslateInput): Promise<TranslateOutput> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are a professional translator for a personal recipe book website.
Translate the following recipe from Russian to English and Czech.

IMPORTANT RULES:
- Keep the tone warm, personal, and cozy — this is a personal recipe book
- Preserve any cultural references or dish names that don't have direct translations (transliterate them)
- For cooking steps, be precise and clear
- Return ONLY valid JSON, no markdown, no code blocks

Input recipe (JSON):
${JSON.stringify(input, null, 2)}

Return JSON in this exact format:
{
  "en": {
    "title": "...",
    "description": "..." or null,
    "note": "..." or null,
    "steps": [{ "order": 1, "title": "..." or null, "description": "..." }]
  },
  "cs": {
    "title": "...",
    "description": "..." or null,
    "note": "..." or null,
    "steps": [{ "order": 1, "title": "..." or null, "description": "..." }]
  }
}`;

  const maxRetries = 3;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      // Strip potential markdown code fences
      const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      return JSON.parse(cleaned) as TranslateOutput;
    } catch (err: unknown) {
      const is429 = err instanceof Error && (err.message.includes("429") || err.message.includes("RESOURCE_EXHAUSTED"));
      if (!is429 || attempt === maxRetries) throw err;
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw new Error("Translation failed after retries");
}
