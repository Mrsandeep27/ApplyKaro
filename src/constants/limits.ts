export const APPLY_DELAY_BETWEEN_MS = { min: 45_000, max: 180_000 };
export const TYPING_DELAY_MS = { min: 50, max: 150 };
export const BEFORE_CLICK_MS = { min: 500, max: 2_000 };
export const PAGE_LOAD_WAIT_MS = { min: 2_000, max: 5_000 };

export const BATCH_SIZE = 5;
export const BATCH_COOLDOWN_MS = 30 * 60 * 1000;
export const APPLY_HOURS = { start: 9, end: 18 };
export const SKIP_WEEKENDS = true;

export const DEFAULT_MATCH_THRESHOLD = 70;

export const FOLLOW_UP_DAYS = [7, 14, 21] as const;
