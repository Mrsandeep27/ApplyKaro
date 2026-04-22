import Dexie, { type EntityTable } from 'dexie';
import type {
  Application,
  ApplyLog,
  Job,
  Match,
  PortalCredential,
  Preferences,
  Resume,
} from '@/lib/types';

export interface Settings {
  key: string;
  value: unknown;
}

class ApplyKaroDB extends Dexie {
  resumes!: EntityTable<Resume, 'id'>;
  portals!: EntityTable<PortalCredential, 'id'>;
  jobs!: EntityTable<Job, 'id'>;
  matches!: EntityTable<Match, 'id'>;
  applications!: EntityTable<Application, 'id'>;
  logs!: EntityTable<ApplyLog, 'id'>;
  preferences!: EntityTable<Preferences & { id: string }, 'id'>;
  settings!: EntityTable<Settings, 'key'>;

  constructor() {
    super('applykaro');
    this.version(1).stores({
      resumes: 'id, is_default, created_at',
      portals: 'id, portal, status',
      jobs: 'id, portal, company, scraped_at',
      matches: 'id, job_id, status, score, created_at',
      applications: 'id, job_id, status, applied_at, created_at',
      logs: 'id, application_id, timestamp',
      preferences: 'id',
      settings: 'key',
    });
    // v2: index applications.updated_at so the tracker can sort by recency
    this.version(2).stores({
      applications: 'id, job_id, status, applied_at, created_at, updated_at',
    });
  }
}

export const db = new ApplyKaroDB();

export function uid(prefix = ''): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}${prefix ? '_' : ''}${time}${rand}`;
}
