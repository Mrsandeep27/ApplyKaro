import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

let client: GoogleGenerativeAI | null = null;

export function getGemini(): GoogleGenerativeAI | null {
  if (!apiKey) return null;
  if (!client) client = new GoogleGenerativeAI(apiKey);
  return client;
}

export const geminiConfigured = Boolean(apiKey);

export async function geminiJSON<T>(prompt: string, model = 'gemini-1.5-flash-latest'): Promise<T | null> {
  const g = getGemini();
  if (!g) return null;
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
}
