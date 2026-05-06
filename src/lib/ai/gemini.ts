import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

let client: GoogleGenerativeAI | null = null;

export function getGemini(): GoogleGenerativeAI | null {
  if (!apiKey) return null;
  if (!client) client = new GoogleGenerativeAI(apiKey);
  return client;
}

export const geminiConfigured = Boolean(apiKey);

// Models tried in order. Most-quota-friendly first.
const MODEL_CHAIN = [
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
  'gemini-2.5-flash',
];

const cooldowns = new Map<string, number>();

function isQuotaError(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  return /\b(429|503|quota|rate.?limit|too many requests|service unavailable|overload|high demand)\b/i.test(msg);
}

function nextAvailable(): string[] {
  const now = Date.now();
  return MODEL_CHAIN.filter((m) => (cooldowns.get(m) ?? 0) <= now);
}

export async function geminiJSON<T>(prompt: string, _model?: string): Promise<T | null> {
  const g = getGemini();
  if (!g) return null;
  const candidates = nextAvailable();
  if (candidates.length === 0) {
    const soonest = [...cooldowns.entries()].sort((a, b) => a[1] - b[1])[0]?.[0];
    if (soonest) candidates.push(soonest);
  }
  for (const m of candidates) {
    try {
      const model = g.getGenerativeModel({
        model: m,
        generationConfig: { responseMimeType: 'application/json' },
      });
      const res = await model.generateContent(prompt);
      const text = res.response.text();
      try {
        return JSON.parse(text) as T;
      } catch {
        const match = text.match(/\{[\s\S]*\}/);
        return match ? (JSON.parse(match[0]) as T) : null;
      }
    } catch (err) {
      if (isQuotaError(err)) {
        cooldowns.set(m, Date.now() + 60_000);
        console.warn(`[ai] ${m} hit quota — trying next model`);
        continue;
      }
      console.warn(`[ai] ${m} error:`, err instanceof Error ? err.message.slice(0, 120) : err);
    }
  }
  return null;
}
