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
    get()._attachStream();

    const approved = await db.matches.where('status').equals('approved').toArray();
    const jobs = await db.jobs.bulkGet(approved.map((m) => m.job_id));
    const items = approved
      .map((m, i) => ({ m, j: jobs[i] }))
      .filter((x): x is { m: Match; j: NonNullable<typeof x.j> } => !!x.j && x.j.portal === 'naukri')
      .map(({ m, j }) => ({
        job_id: j.id,
        job_url: j.job_url,
        job_title: j.title,
        portal: 'naukri' as const,
      }));

    if (items.length === 0) {
      set({ lastError: 'No Naukri jobs in queue. (Other portals aren’t wired yet.)' });
      return;
    }

    set({ running: true, paused: false, processed: 0, lastError: null });
    try {
      await api.startApply(items);
    } catch (err) {
      set({ running: false, lastError: err instanceof Error ? err.message : 'start failed' });
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
