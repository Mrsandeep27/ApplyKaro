import { db } from './dexie';
import type { Preferences, PortalSlug } from '@/lib/types';
import { DEFAULT_DAILY_LIMITS, PORTALS } from '@/constants/portals';
import { DEFAULT_MATCH_THRESHOLD } from '@/constants/limits';

export async function seedIfEmpty() {
  // One-time cleanup: wipe any demo data left from earlier builds.
  const flag = await db.settings.get('seed_v1_wiped');
  if (flag?.value) return;
  await db.transaction(
    'rw',
    [db.jobs, db.matches, db.applications, db.logs, db.settings],
    async () => {
      await db.jobs.clear();
      await db.matches.clear();
      await db.applications.clear();
      await db.logs.clear();
      await db.settings.put({ key: 'seed_v1_wiped', value: true });
    },
  );
}

export async function ensureDefaultPreferences(): Promise<Preferences> {
  const existing = await db.preferences.get('me');
  if (existing) return existing;
  const fresh: Preferences & { id: string } = {
    id: 'me',
    job_titles: ['Full Stack Developer', 'React Developer'],
    locations: ['Bangalore', 'Remote'],
    min_salary: 600000,
    max_salary: 2500000,
    experience_min: 0,
    experience_max: 3,
    work_type: 'any',
    match_threshold: DEFAULT_MATCH_THRESHOLD,
    auto_apply_enabled: true,
    daily_limits: { ...DEFAULT_DAILY_LIMITS },
    active_portals: PORTALS.map((p) => p.slug as PortalSlug).slice(0, 6),
  };
  await db.preferences.put(fresh);
  return fresh;
}
