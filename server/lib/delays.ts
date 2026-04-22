export const APPLY_DELAY_MS = { min: 45_000, max: 180_000 };
export const TYPING_MS = { min: 50, max: 150 };
export const BEFORE_CLICK_MS = { min: 500, max: 2_000 };
export const PAGE_LOAD_MS = { min: 2_000, max: 5_000 };
export const BATCH_SIZE = 5;
export const BATCH_COOLDOWN_MS = 30 * 60 * 1000;

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
export const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
export const randSleep = (range: { min: number; max: number }) => sleep(rand(range.min, range.max));

export async function humanType(page: { keyboard: { type: (s: string, o?: { delay: number }) => Promise<void> } }, text: string) {
  for (const ch of text) {
    await page.keyboard.type(ch, { delay: rand(TYPING_MS.min, TYPING_MS.max) });
  }
}
