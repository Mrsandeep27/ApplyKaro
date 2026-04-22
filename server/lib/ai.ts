import { GoogleGenerativeAI } from '@google/generative-ai';

const key = process.env.GEMINI_API_KEY ?? process.env.VITE_GEMINI_API_KEY;
let client: GoogleGenerativeAI | null = null;

export function getGemini() {
  if (!key) return null;
  if (!client) client = new GoogleGenerativeAI(key);
  return client;
}

export const geminiReady = Boolean(key);

export async function geminiJSON<T>(prompt: string, model = 'gemini-1.5-flash-latest'): Promise<T | null> {
  const g = getGemini();
  if (!g) return null;
  try {
    const m = g.getGenerativeModel({
      model,
      generationConfig: { responseMimeType: 'application/json' },
    });
    const res = await m.generateContent(prompt);
    const text = res.response.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      return match ? (JSON.parse(match[0]) as T) : null;
    }
  } catch (err) {
    console.warn('[ai] gemini error:', err instanceof Error ? err.message : err);
    return null;
  }
}

export async function geminiText(prompt: string, model = 'gemini-1.5-flash-latest'): Promise<string | null> {
  const g = getGemini();
  if (!g) return null;
  try {
    const m = g.getGenerativeModel({ model });
    const res = await m.generateContent(prompt);
    return res.response.text();
  } catch (err) {
    console.warn('[ai] gemini text error:', err instanceof Error ? err.message : err);
    return null;
  }
}
