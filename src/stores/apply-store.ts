import { create } from 'zustand';
import { db, uid } from '@/lib/db/dexie';
import { api } from '@/lib/api';
import type { Application, ApplicationStatus, Match, PortalSlug } from '@/lib/types';

interface ApplyEvent {
  type: string;
  at?: string;
  job_id?: string;
  job_url?: string;
  job_title?: string;
  portal?: string;
  message?: string;
}

interface ApplyState {
  running: boolean;
  paused: boolean;
  currentMatchId: string | null;
  queueSize: number;
  processed: number;
  events: ApplyEvent[];
  lastError: string | null;
  _closeStream: (() => void) | null;
  start: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  refreshQueueSize: () => Promise<void>;
  _attachStream: () => void;
}

export const useApply = create<ApplyState>((set, get) => ({
  running: false,
  paused: false,
  currentMatchId: null,
  queueSize: 0,
  processed: 0,
  events: [],
  lastError: null,
  _closeStream: null,

  refreshQueueSize: async () => {
    const count = await db.matches.where('status').equals('approved').count();
    set({ queueSize: count });
  },

  _attachStream: () => {
    if (get()._closeStream) return;
    const close = api.openEventStream((raw) => {
      const e = raw as unknown as ApplyEvent;
      set((s) => ({ events: [...s.events.slice(-199), e] }));
      if (e.type === 'apply_start' && e.job_id) {
        set({ currentMatchId: e.job_id });
      }
      if (e.type === 'success' && e.job_id) {
        // Mark the associated match as applied + write an Application row
        recordApplied(e);
        set((s) => ({ processed: s.processed + 1 }));
      }
      if (e.type === 'rate_limited' || e.type === 'captcha' || e.type === 'error') {
        set({ lastError: e.message ?? null });
      }
      if (e.type === 'done') {
        set({ running: false, currentMatchId: null });
      }
    });
    set({ _closeStream: close });
  },

  start: async () => {
    if (get().running) return;
    set({ lastError: null, events: [] });
    console.log('[apply] Start clicked');

    // Health check the server first so errors are actionable
    try {
      const h = await fetch('/api/health');
      if (!h.ok) throw new Error(`Server returned ${h.status}`);
    } catch (err) {
      set({
        lastError: `Backend not reachable — run "npm run dev" and refresh. (${err instanceof Error ? err.message : 'fetch failed'})`,
      });
      console.error('[apply] server down:', err);
      return;
    }

    get()._attachStream();

    const approved = await db.matches.where('status').equals('approved').toArray();
    const jobs = await db.jobs.bulkGet(approved.map((m) => m.job_id));
    const all = approved.map((m, i) => ({ m, j: jobs[i] }));
    const missingJob = all.filter((x) => !x.j);
    const wrongPortal = all.filter((x) => x.j && x.j.portal !== 'naukri');
    const items = all
      .filter((x): x is { m: Match; j: NonNullable<typeof x.j> } => !!x.j && x.j.portal === 'naukri')
      .map(({ j }) => ({
        job_id: j.id,
        job_url: j.job_url,
        job_title: j.title,
        portal: 'naukri' as const,
      }));

    console.log('[apply] queue breakdown:', {
      approved: approved.length,
      missingJob: missingJob.length,
      wrongPortal: wrongPortal.length,
      toApply: items.length,
    });

    if (items.length === 0) {
      const msg =
        wrongPortal.length > 0
          ? `${wrongPortal.length} approved job(s) are from portals other than Naukri. Only Naukri is wired up for auto-apply right now.`
          : missingJob.length > 0
            ? `Approved jobs are missing their Job records in local DB. Re-scrape jobs.`
            : 'No approved jobs found.';
      set({ lastError: msg });
      return;
    }

    set({ running: true, paused: false, processed: 0, queueSize: items.length, lastError: null });
    try {
      const res = await api.startApply(items);
      console.log('[apply] backend accepted:', res);
    } catch (err) {
      set({ running: false, lastError: err instanceof Error ? err.message : 'start failed' });
      console.error('[apply] start failed:', err);
    }
  },

  pause: async () => {
    await api.pauseApply().catch(() => undefined);
    set({ paused: true });
  },

  resume: async () => {
    await api.resumeApply().catch(() => undefined);
    set({ paused: false, running: true });
  },

  stop: async () => {
    await api.stopApply().catch(() => undefined);
    set({ running: false, paused: false, currentMatchId: null });
  },
}));

async function recordApplied(e: ApplyEvent) {
  const jobId = e.job_id;
  if (!jobId) return;
  const match = await db.matches.where('job_id').equals(jobId).first();
  if (match) await db.matches.update(match.id, { status: 'applied' as const });
  const existing = await db.applications.where('job_id').equals(jobId).first();
  const now = new Date().toISOString();
  if (existing) {
    await db.applications.update(existing.id, {
      status: 'applied' as ApplicationStatus,
      applied_at: existing.applied_at ?? now,
      updated_at: now,
    });
    return;
  }
  const job = await db.jobs.get(jobId);
  const app: Application = {
    id: uid('app'),
    job_id: jobId,
    match_id: match?.id,
    portal: (job?.portal ?? (e.portal as PortalSlug | undefined) ?? 'naukri') as PortalSlug,
    status: 'applied',
    applied_at: now,
    follow_up_count: 0,
    created_at: now,
    updated_at: now,
  };
  await db.applications.add(app);
}
