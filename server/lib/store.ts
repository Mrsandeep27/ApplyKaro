import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR, ensureDataDirs, STATE_FILE } from './paths.js';

export interface ServerState {
  resume?: {
    name: string;
    email?: string;
    phone?: string;
    location?: string;
    experience_years?: number;
    skills: string[];
    summary?: string;
  };
  preferences?: {
    job_titles: string[];
    locations: string[];
    min_salary: number;
    max_salary: number;
    work_type: 'remote' | 'hybrid' | 'onsite' | 'any';
    match_threshold: number;
    daily_limits: Record<string, number>;
    active_portals: string[];
  };
  connected_portals: string[];
}

ensureDataDirs();

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

function writeJson(file: string, data: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

export function loadState(): ServerState {
  return readJson<ServerState>(STATE_FILE, { connected_portals: [] });
}

export function saveState(patch: Partial<ServerState>) {
  const current = loadState();
  const next = { ...current, ...patch };
  writeJson(STATE_FILE, next);
  return next;
}

export function fileStore(name: string) {
  const file = path.join(DATA_DIR, `${name}.json`);
  return {
    read<T>(fallback: T): T {
      return readJson<T>(file, fallback);
    },
    write(data: unknown) {
      writeJson(file, data);
    },
  };
}
