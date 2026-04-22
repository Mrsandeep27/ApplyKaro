import { create } from 'zustand';
import { db, uid } from '@/lib/db/dexie';
import type { Application, Match } from '@/lib/types';

interface ApplyState {
  running: boolean;
  paused: boolean;
  currentMatchId: string | null;
  queueSize: number;
  processed: number;
  lastError: string | null;
  start: () => Promise<void>;
  pause: () => void;
  resume: () => Promise<void>;
  stop: () => void;
  refreshQueueSize: () => Promise<void>;
}

async function pickNext(): Promise<Match | null> {
  const queued = await db.matches.where('status').equals('approved').sortBy('score');
  const sorted = queued.sort((a, b) => b.score - a.score);
  return sorted[0] ?? null;
}

async function simulateApply(match: Match): Promise<void> {
  const job = await db.jobs.get(match.job_id);
  if (!job) return;
  const now = new Date().toISOString();
  const app: Application = {
    id: uid('app'),
    job_id: match.job_id,
    match_id: match.id,
    portal: job.portal,
    status: 'applying',
    follow_up_count: 0,
    created_at: now,
    updated_at: now,
  };
  await db.applications.add(app);
  await db.logs.add({
    id: uid('log'),
    application_id: app.id,
    action: 'queued',
    timestamp: now,
  });
  // Simulated steps — real engine would drive Puppeteer in cloud browser
  await new Promise((r) => setTimeout(r, 900));
  await db.logs.add({ id: uid('log'), application_id: app.id, action: 'opened', timestamp: new Date().toISOString() });
  await new Promise((r) => setTimeout(r, 600));
  await db.logs.add({ id: uid('log'), application_id: app.id, action: 'form_detected', timestamp: new Date().toISOString() });
  await new Promise((r) => setTimeout(r, 900));
  await db.logs.add({ id: uid('log'), application_id: app.id, action: 'filled', timestamp: new Date().toISOString() });
  await new Promise((r) => setTimeout(r, 500));
  await db.logs.add({ id: uid('log'), application_id: app.id, action: 'submitted', timestamp: new Date().toISOString() });
  await db.logs.add({ id: uid('log'), application_id: app.id, action: 'success', timestamp: new Date().toISOString() });

  const appliedAt = new Date().toISOString();
  await db.applications.update(app.id, { status: 'applied', applied_at: appliedAt, updated_at: appliedAt });
  await db.matches.update(match.id, { status: 'applied' });
}

export const useApply = create<ApplyState>((set, get) => ({
  running: false,
  paused: false,
  currentMatchId: null,
  queueSize: 0,
  processed: 0,
  lastError: null,
  refreshQueueSize: async () => {
    const count = await db.matches.where('status').equals('approved').count();
    set({ queueSize: count });
  },
  start: async () => {
    if (get().running) return;
    set({ running: true, paused: false, processed: 0, lastError: null });
    try {
      while (get().running) {
        if (get().paused) {
          await new Promise((r) => setTimeout(r, 500));
          continue;
        }
        const next = await pickNext();
        if (!next) break;
        set({ currentMatchId: next.id });
        await simulateApply(next);
        set((s) => ({ processed: s.processed + 1 }));
        await get().refreshQueueSize();
      }
    } catch (err) {
      set({ lastError: err instanceof Error ? err.message : String(err) });
    } finally {
      set({ running: false, currentMatchId: null });
    }
  },
  pause: () => set({ paused: true }),
  resume: async () => {
    set({ paused: false });
    if (!get().running) await get().start();
  },
  stop: () => set({ running: false, paused: false, currentMatchId: null }),
}));
