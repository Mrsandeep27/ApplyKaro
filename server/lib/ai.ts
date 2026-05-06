import { GoogleGenerativeAI } from '@google/generative-ai';

const key = process.env.GEMINI_API_KEY ?? process.env.VITE_GEMINI_API_KEY;
let client: GoogleGenerativeAI | null = null;

export function getGemini() {
  if (!key) return null;
  if (!client) client = new GoogleGenerativeAI(key);
  return client;
}

export const geminiReady = Boolean(key);

// Models tried in order. Cheapest/most-quota-friendly first; better quality if available.
// When a model 429s or 503s we cool it down for 60s before retrying.
const MODEL_CHAIN = [
  'gemini-2.5-flash-lite', // free tier: 15 RPM, 1000 RPD
  'gemini-flash-latest',   // alias, usually points to a healthy model
  'gemini-2.5-flash',      // free tier: 10 RPM, 250 RPD (better quality)
];

const cooldowns = new Map<string, number>(); // model -> timestamp until which it's "cool"

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
    // All models in cooldown — pick the one with the soonest expiry as a last attempt
    const soonest = [...cooldowns.entries()].sort((a, b) => a[1] - b[1])[0]?.[0];
    if (soonest) candidates.push(soonest);
  }

  let lastErr: unknown = null;
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
      lastErr = err;
      if (isQuotaError(err)) {
        cooldowns.set(m, Date.now() + 60_000);
        console.warn(`[ai] ${m} hit quota — cooling down 60s, trying next model`);
        continue;
      }
      // Non-quota error — try next model anyway, but don't cool down
      console.warn(`[ai] ${m} error:`, err instanceof Error ? err.message.slice(0, 120) : err);
    }
  }
  console.warn('[ai] all gemini models failed; falling back to heuristic. last error:',
    lastErr instanceof Error ? lastErr.message.slice(0, 120) : lastErr);
  return null;
}

export async function geminiText(prompt: string, _model?: string): Promise<string | null> {
  const g = getGemini();
  if (!g) return null;
  const candidates = nextAvailable();
  if (candidates.length === 0) {
    const soonest = [...cooldowns.entries()].sort((a, b) => a[1] - b[1])[0]?.[0];
    if (soonest) candidates.push(soonest);
  }
  for (const m of candidates) {
    try {
      const model = g.getGenerativeModel({ model: m });
      const res = await model.generateContent(prompt);
      return res.response.text();
    } catch (err) {
      if (isQuotaError(err)) {
        cooldowns.set(m, Date.now() + 60_000);
        continue;
      }
      console.warn(`[ai] ${m} text error:`, err instanceof Error ? err.message.slice(0, 120) : err);
    }
  }
  return null;
}
