import path from 'node:path';
import fs from 'node:fs';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import { SESSIONS_DIR, ensureDataDirs } from '../lib/paths.js';

ensureDataDirs();

export function sessionDir(portal: string) {
  const dir = path.join(SESSIONS_DIR, portal);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function isConnected(portal: string) {
  const dir = sessionDir(portal);
  // If Puppeteer has created any profile files, assume a session exists.
  try {
    const entries = fs.readdirSync(dir);
    return entries.some((e) => e !== '.DS_Store');
  } catch {
    return false;
  }
}

export function forgetSession(portal: string) {
  const dir = sessionDir(portal);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

export async function launchBrowser(portal: string, options: { headless?: boolean } = {}) {
  return puppeteer.launch({
    headless: options.headless ?? false,
    userDataDir: sessionDir(portal),
    defaultViewport: null,
    args: [
      '--no-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--window-size=1280,840',
    ],
  });
}

export interface ConnectResult {
  portal: string;
  loggedIn: boolean;
  loginUrl: string;
  startUrl: string;
  message?: string;
}

export async function connectPortal(opts: {
  portal: string;
  loginUrl: string;
  loggedInCheckUrl: string;
  loggedInCheck: (page: Page) => Promise<boolean>;
  timeoutMs?: number;
}): Promise<ConnectResult> {
  const browser = await launchBrowser(opts.portal, { headless: false });
  const [page] = await browser.pages();
  await page.goto(opts.loginUrl, { waitUntil: 'domcontentloaded' });
  const loggedIn = await waitForLogin(page, opts.loggedInCheck, opts.timeoutMs ?? 5 * 60_000);
  // Leave the window open briefly so user sees the confirmation
  await new Promise((r) => setTimeout(r, 1500));
  await browser.close();
  return {
    portal: opts.portal,
    loggedIn,
    loginUrl: opts.loginUrl,
    startUrl: opts.loggedInCheckUrl,
    message: loggedIn
      ? 'Session saved. You can close this window.'
      : 'Login not detected within the time limit. Try again.',
  };
}

async function waitForLogin(page: Page, check: (p: Page) => Promise<boolean>, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      if (await check(page)) return true;
    } catch {
      // ignore
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}

export async function closeBrowser(b: Browser | null) {
  if (!b) return;
  try {
    await b.close();
  } catch {
    // ignore
  }
}
