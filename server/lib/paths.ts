import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const ROOT = path.resolve(__dirname, '../..');
export const DATA_DIR = path.join(ROOT, 'server', 'data');
export const SESSIONS_DIR = path.join(DATA_DIR, 'sessions');
export const SCREENSHOTS_DIR = path.join(DATA_DIR, 'screenshots');
export const RATE_LIMITS_FILE = path.join(DATA_DIR, 'rate-limits.json');
export const STATE_FILE = path.join(DATA_DIR, 'state.json');

export function ensureDataDirs() {
  for (const d of [DATA_DIR, SESSIONS_DIR, SCREENSHOTS_DIR]) {
    fs.mkdirSync(d, { recursive: true });
  }
}
