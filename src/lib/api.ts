const BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const body = await res.json();
      msg = body?.error ?? msg;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => request<{ ok: boolean; gemini_ready: boolean }>('/health'),

  getState: () =>
    request<{
      resume: unknown;
      preferences: unknown;
      connected_portals: string[];
      counters: Record<string, { applied: number; last_apply_at: number }>;
      gemini_ready: boolean;
    }>('/state'),

  putResume: (resume: unknown) =>
    request('/state/resume', { method: 'PUT', body: JSON.stringify(resume) }),

  putPreferences: (prefs: unknown) =>
    request('/state/preferences', { method: 'PUT', body: JSON.stringify(prefs) }),

  getPortals: () =>
    request<{
      portals: { slug: string; connected: boolean }[];
      counters: Record<string, { applied: number; last_apply_at: number }>;
      connected: string[];
    }>('/portals'),

  connectPortal: (portal: string) =>
    request<{ portal: string; loggedIn: boolean; message?: string }>(
      `/portals/${portal}/connect`,
      { method: 'POST' },
    ),

  disconnectPortal: (portal: string) =>
    request(`/portals/${portal}`, { method: 'DELETE' }),

  getJobs: () =>
    request<{
      jobs: Array<{
        id: string;
        portal: string;
        portal_job_id: string;
        title: string;
        company: string;
        location: string;
        salary_min?: number;
        salary_max?: number;
        description: string;
        skills: string[];
        job_url: string;
        job_type: 'remote' | 'hybrid' | 'onsite';
        scraped_at: string;
        match?: {
          score: number;
          matching_skills: string[];
          missing_skills: string[];
          bonus_skills: string[];
          reasoning: string;
        };
      }>;
    }>('/jobs'),

  scrapeJobs: (portals?: string[]) =>
    request<{ found: number; unique: number; kept: number; threshold: number }>(
      '/jobs/scrape',
      { method: 'POST', body: JSON.stringify({ portals }) },
    ),

  deleteJob: (id: string) => request(`/jobs/${id}`, { method: 'DELETE' }),

  getApplyStatus: () =>
    request<{ running: boolean; paused: boolean; queued: number; processed: number }>(
      '/apply/status',
    ),

  startApply: (
    items: { job_id: string; job_url: string; job_title?: string; portal: 'naukri' }[],
  ) => request('/apply/start', { method: 'POST', body: JSON.stringify({ items }) }),

  pauseApply: () => request('/apply/pause', { method: 'POST' }),
  resumeApply: () => request('/apply/resume', { method: 'POST' }),
  stopApply: () => request('/apply/stop', { method: 'POST' }),

  openEventStream(onEvent: (data: Record<string, unknown>) => void) {
    const es = new EventSource(`${BASE}/apply/events`);
    es.onmessage = (e) => {
      try {
        onEvent(JSON.parse(e.data));
      } catch {
        // ignore
      }
    };
    es.onerror = () => {
      // EventSource auto-reconnects; no-op
    };
    return () => es.close();
  },
};
