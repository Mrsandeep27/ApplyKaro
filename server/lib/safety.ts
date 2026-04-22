import fs from 'node:fs';
import { RATE_LIMITS_FILE, ensureDataDirs } from './paths.js';

interface PortalCounters {
  date: string;
  applied: number;
  last_apply_at: number;
}

type RateLimits = Record<string, PortalCounters>;

ensureDataDirs();

function load(): RateLimits {
  try {
    return JSON.parse(fs.readFileSync(RATE_LIMITS_FILE, 'utf-8')) as RateLimits;
  } catch {
    return {};
  }
}

function save(data: RateLimits) {
  fs.writeFileSync(RATE_LIMITS_FILE, JSON.stringify(data, null, 2));
}

const today = () => new Date().toISOString().slice(0, 10);

function rollover(data: RateLimits, portal: string) {
  const t = today();
  if (!data[portal] || data[portal].date !== t) {
    data[portal] = { date: t, applied: 0, last_apply_at: 0 };
  }
  return data[portal];
}

export function getCount(portal: string) {
  const data = load();
  return rollover(data, portal).applied;
}

export function recordApply(portal: string) {
  const data = load();
  const entry = rollover(data, portal);
  entry.applied += 1;
  entry.last_apply_at = Date.now();
  save(data);
  return entry;
}

export function snapshot(): Record<string, { applied: number; last_apply_at: number }> {
  const data = load();
  const t = today();
  const out: Record<string, { applied: number; last_apply_at: number }> = {};
  for (const [p, v] of Object.entries(data)) {
    if (v.date === t) out[p] = { applied: v.applied, last_apply_at: v.last_apply_at };
  }
  return out;
}

export interface GateResult {
  ok: boolean;
  reason?: string;
  wait_ms?: number;
}

export interface GateOptions {
  portal: string;
  daily_limit: number;
  min_gap_ms?: number; // minimum time since last apply
  apply_hours?: { start: number; end: number };
  skip_weekends?: boolean;
}

export function checkGate(opts: GateOptions): GateResult {
  const now = new Date();

  if (opts.skip_weekends && (now.getDay() === 0 || now.getDay() === 6)) {
    return { ok: false, reason: 'Weekend pause active' };
  }

  if (opts.apply_hours) {
    const h = now.getHours();
    if (h < opts.apply_hours.start || h >= opts.apply_hours.end) {
      return { ok: false, reason: `Outside apply hours (${opts.apply_hours.start}-${opts.apply_hours.end})` };
    }
  }

  const data = load();
  const entry = rollover(data, opts.portal);

  if (entry.applied >= opts.daily_limit) {
    return { ok: false, reason: `Daily limit reached (${opts.daily_limit})` };
  }

  if (opts.min_gap_ms && entry.last_apply_at) {
    const since = Date.now() - entry.last_apply_at;
    if (since < opts.min_gap_ms) {
      return { ok: true, wait_ms: opts.min_gap_ms - since };
    }
  }

  return { ok: true };
}
