import { bus } from '../lib/events.js';
import { BATCH_COOLDOWN_MS, BATCH_SIZE, APPLY_DELAY_MS, randSleep } from '../lib/delays.js';
import { checkGate, recordApply } from '../lib/safety.js';
import { applyToNaukri, NAUKRI } from '../portals/naukri.js';
import { loadState } from '../lib/store.js';

export interface QueueItem {
  job_id: string;
  job_url: string;
  job_title?: string;
  company?: string;
  portal: 'naukri'; // extend as more portals are added
}

interface WorkerStatus {
  running: boolean;
  paused: boolean;
  stopRequested: boolean;
  current: QueueItem | null;
  queued: QueueItem[];
  processed: number;
  batch_count: number;
}

const status: WorkerStatus = {
  running: false,
  paused: false,
  stopRequested: false,
  current: null,
  queued: [],
  processed: 0,
  batch_count: 0,
};

const PORTAL_CONFIG: Record<QueueItem['portal'], { daily_limit_default: number; min_gap_ms: number; apply: (url: string, onEvent: (e: { type: string; message?: string }) => void) => ReturnType<typeof applyToNaukri> }> = {
  naukri: {
    daily_limit_default: NAUKRI.daily_limit_default,
    min_gap_ms: NAUKRI.min_gap_ms,
    apply: (url, onEvent) => applyToNaukri(url, onEvent),
  },
};

export function getStatus() {
  return {
    running: status.running,
    paused: status.paused,
    current: status.current,
    queued: status.queued.length,
    processed: status.processed,
  };
}

export function enqueue(items: QueueItem[]) {
  // If a previous run already finished, reset the queue to what the user just approved
  if (!status.running) {
    status.queued = [];
    status.processed = 0;
    status.batch_count = 0;
  }
  // Dedupe against what's already pending
  const existingUrls = new Set(status.queued.map((q) => q.job_url));
  const fresh = items.filter((i) => !existingUrls.has(i.job_url));
  status.queued.push(...fresh);
  bus.emit({
    type: 'queued',
    message: `${fresh.length} job(s) queued · total ${status.queued.length}`,
  });
}

export function pause() {
  status.paused = true;
}
export function resume() {
  status.paused = false;
}
export function stop() {
  status.stopRequested = true;
}
export function clear() {
  status.queued = [];
  status.processed = 0;
}

export async function run() {
  if (status.running) return;
  status.running = true;
  status.paused = false;
  status.stopRequested = false;
  status.processed = 0;
  status.batch_count = 0;

  try {
    while (status.queued.length > 0 && !status.stopRequested) {
      while (status.paused && !status.stopRequested) {
        await new Promise((r) => setTimeout(r, 500));
      }
      if (status.stopRequested) break;

      const item = status.queued.shift()!;
      status.current = item;
      const portalCfg = PORTAL_CONFIG[item.portal];
      if (!portalCfg) {
        bus.emit({ type: 'skipped', job_id: item.job_id, message: `Unsupported portal: ${item.portal}` });
        continue;
      }

      const prefs = loadState().preferences;
      const dailyLimit = prefs?.daily_limits?.[item.portal] ?? portalCfg.daily_limit_default;

      // Apply-hour / weekend gates are OPT-IN. For personal single-user mode, default to no restriction.
      // Set APPLY_HOUR_START + APPLY_HOUR_END in .env to enable the time window.
      // Set SKIP_WEEKENDS=true in .env to enable the weekend pause.
      const applyHours =
        process.env.APPLY_HOUR_START !== undefined && process.env.APPLY_HOUR_END !== undefined
          ? {
              start: Number(process.env.APPLY_HOUR_START),
              end: Number(process.env.APPLY_HOUR_END),
            }
          : undefined;
      const gate = checkGate({
        portal: item.portal,
        daily_limit: dailyLimit,
        min_gap_ms: portalCfg.min_gap_ms,
        apply_hours: applyHours,
        skip_weekends: process.env.SKIP_WEEKENDS === 'true',
      });

      if (!gate.ok) {
        bus.emit({ type: 'rate_limited', portal: item.portal, message: gate.reason });
        // Put it back in front and stop (user can resume later)
        status.queued.unshift(item);
        break;
      }
      if (gate.wait_ms) {
        bus.emit({ type: 'rate_limited', portal: item.portal, message: `Cooling down ${Math.round(gate.wait_ms / 1000)}s` });
        await new Promise((r) => setTimeout(r, gate.wait_ms));
      }

      bus.emit({
        type: 'apply_start',
        job_id: item.job_id,
        job_url: item.job_url,
        job_title: item.job_title,
        portal: item.portal,
      });

      const result = await portalCfg.apply(item.job_url, (e) => {
        bus.emit({
          type: e.type as never,
          job_id: item.job_id,
          portal: item.portal,
          message: e.message,
        });
      });

      if (result.status === 'applied') {
        recordApply(item.portal);
        status.processed += 1;
        bus.emit({
          type: 'success',
          job_id: item.job_id,
          portal: item.portal,
          message: 'Applied successfully',
        });
      } else if (result.status === 'already_applied') {
        // Count it as processed so it doesn't stay in "approved" forever on the client.
        status.processed += 1;
        // Treat this like a success from the PWA's perspective so the match stops
        // being requeued on every Start click.
        bus.emit({
          type: 'success',
          job_id: item.job_id,
          portal: item.portal,
          message: 'Already applied (previously)',
        });
      } else if (result.status === 'captcha') {
        bus.emit({ type: 'captcha', job_id: item.job_id, message: result.message });
        // Stop and requeue item for when user resumes
        status.queued.unshift(item);
        break;
      } else {
        bus.emit({ type: 'error', job_id: item.job_id, message: result.message });
      }

      status.batch_count += 1;
      if (status.batch_count >= BATCH_SIZE) {
        bus.emit({ type: 'rate_limited', message: `Batch of ${BATCH_SIZE} complete — cooling down 30 min` });
        await new Promise((r) => setTimeout(r, BATCH_COOLDOWN_MS));
        status.batch_count = 0;
      } else {
        await randSleep(APPLY_DELAY_MS);
      }
    }
  } finally {
    status.running = false;
    status.current = null;
    bus.emit({ type: 'done', message: `Run complete · ${status.processed} applied` });
  }
}
