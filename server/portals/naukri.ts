import path from 'node:path';
import fs from 'node:fs';
import type { Browser, Page } from 'puppeteer';
import { launchBrowser, connectPortal } from './session.js';
import { randSleep, PAGE_LOAD_MS, BEFORE_CLICK_MS } from '../lib/delays.js';
import { bus } from '../lib/events.js';
import { SCREENSHOTS_DIR } from '../lib/paths.js';

export const NAUKRI = {
  slug: 'naukri',
  name: 'Naukri',
  daily_limit_default: 10,
  min_gap_ms: 30_000,
} as const;

export interface ScrapedJob {
  portal: string;
  portal_job_id: string;
  title: string;
  company: string;
  location: string;
  salary_min?: number;
  salary_max?: number;
  experience_level?: string;
  description: string;
  skills: string[];
  job_url: string;
  job_type: 'remote' | 'hybrid' | 'onsite';
  posted_date?: string;
  scraped_at: string;
}

export async function connectNaukri() {
  return connectPortal({
    portal: NAUKRI.slug,
    loginUrl: 'https://www.naukri.com/nlogin/login',
    loggedInCheckUrl: 'https://www.naukri.com/mnjuser/homepage',
    loggedInCheck: async (page) => {
      const url = page.url();
      if (url.includes('/mnjuser/')) return true;
      // Profile link or avatar usually appears when logged in
      const hit = await page.$('a[href*="/mnjuser/profile"], .nI-gNb-drawer__icon, img[alt*="profile" i]');
      return Boolean(hit);
    },
  });
}

function buildSearchUrl(keywords: string, location: string) {
  const k = keywords
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  const l = location
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  if (l === 'remote' || l === 'any') return `https://www.naukri.com/${k}-jobs?wfhType=1`;
  return `https://www.naukri.com/${k}-jobs-in-${l}`;
}

export async function scrapeNaukri(queries: { keywords: string; location: string }[], maxPerQuery = 20): Promise<ScrapedJob[]> {
  let browser: Browser | null = null;
  const results: ScrapedJob[] = [];
  const seen = new Set<string>();
  try {
    browser = await launchBrowser(NAUKRI.slug, { headless: true });
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    );

    for (const q of queries) {
      const url = buildSearchUrl(q.keywords, q.location);
      bus.emit({ type: 'portal_start', portal: NAUKRI.slug, message: `Searching "${q.keywords}" in ${q.location}` });
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await randSleep(PAGE_LOAD_MS);
        // Accept cookie/prompt if present
        await dismissOverlays(page);

        const items = await page.$$eval('article.jobTuple, .srp-tuple, [data-job-id]', (els) =>
          els.map((el) => {
            const anchor = el.querySelector('a.title, a[data-job-id], a.jobTitle') as HTMLAnchorElement | null;
            const title = (anchor?.textContent || '').trim();
            const url = anchor?.href || '';
            const company = (el.querySelector('a.subTitle, .companyInfo .subTitle, .comp-name')?.textContent || '').trim();
            const loc = (el.querySelector('.loc, .location, li.fleft.locationsContainer')?.textContent || '').trim();
            const exp = (el.querySelector('.expwdth, .exp')?.textContent || '').trim();
            const desc = (el.querySelector('.job-description, .job-desc, .job-descriptions')?.textContent || '').trim();
            const skills = Array.from(el.querySelectorAll('.tag-li, .tags li, .tags-gt li')).map(
              (t) => (t.textContent || '').trim(),
            ).filter(Boolean);
            const job_id = el.getAttribute('data-job-id') || anchor?.getAttribute('data-job-id') || '';
            return { title, url, company, loc, exp, desc, skills, job_id };
          }),
        );

        for (const it of items.slice(0, maxPerQuery)) {
          if (!it.title || !it.url) continue;
          const id = it.job_id || hash(it.url);
          if (seen.has(id)) continue;
          seen.add(id);
          results.push({
            portal: NAUKRI.slug,
            portal_job_id: id,
            title: it.title,
            company: it.company || 'Unknown',
            location: it.loc || q.location,
            experience_level: it.exp || undefined,
            description: it.desc || '',
            skills: it.skills,
            job_url: it.url,
            job_type: /remote|work from home/i.test(it.loc) ? 'remote' : 'onsite',
            scraped_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        bus.emit({
          type: 'error',
          portal: NAUKRI.slug,
          message: `Search failed: ${err instanceof Error ? err.message : 'unknown'}`,
        });
      }
    }
  } finally {
    if (browser) await browser.close();
  }
  return results;
}

async function dismissOverlays(page: Page) {
  const selectors = ['button[aria-label="Close"]', '#crossbtn', '.crossIcon', '[data-dismiss]'];
  for (const s of selectors) {
    const el = await page.$(s);
    if (el) {
      try {
        await el.click({ delay: 200 });
        await randSleep(BEFORE_CLICK_MS);
      } catch {
        // ignore
      }
    }
  }
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

export interface ApplyResult {
  job_url: string;
  status: 'applied' | 'already_applied' | 'skipped' | 'captcha' | 'error';
  message?: string;
  screenshot?: string;
  duration_ms: number;
}

// Static mount point for screenshots, exposed via /api/screenshots/naukri/*
export { SCREENSHOTS_DIR };

export async function applyToNaukri(
  jobUrl: string,
  onEvent?: (partial: { type: string; message?: string; screenshot?: string }) => void,
): Promise<ApplyResult> {
  let browser: Browser | null = null;
  const start = Date.now();
  try {
    browser = await launchBrowser(NAUKRI.slug, { headless: false });
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    );

    onEvent?.({ type: 'opened', message: jobUrl });
    await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await randSleep(PAGE_LOAD_MS);
    await dismissOverlays(page);

    const shotDir = path.join(SCREENSHOTS_DIR, 'naukri');
    fs.mkdirSync(shotDir, { recursive: true });
    const shotPath = path.join(shotDir, `${Date.now()}.png`);
    try {
      await page.screenshot({ path: shotPath as `${string}.png`, fullPage: false });
    } catch {
      // non-fatal
    }

    // CAPTCHA / bot-check detection — look at the URL and VISIBLE page text, not raw HTML
    // (raw HTML always contains "recaptcha" as part of Google script references even on clean pages)
    const currentUrl = page.url();
    const visibleText = await page.evaluate(() => document.body?.innerText ?? '').catch(() => '');
    const urlHit = /captcha|challenge|block|denied/i.test(currentUrl);
    const textHit =
      /please verify you are (a )?human|unusual activity|to continue, (please )?complete/i.test(
        visibleText,
      ) ||
      /^\s*Access Denied/i.test(visibleText) ||
      /You have been blocked/i.test(visibleText);
    if (urlHit || textHit) {
      onEvent?.({
        type: 'captcha',
        message: `Challenge on ${currentUrl} · screenshot saved`,
      });
      // Keep the browser open briefly so the user can see & screenshot it themselves
      await new Promise((r) => setTimeout(r, 12_000));
      return {
        job_url: jobUrl,
        status: 'captcha',
        duration_ms: Date.now() - start,
        message: 'Challenge detected',
        screenshot: shotPath,
      };
    }

    const applyInfo = await findApplyButton(page);
    if (!applyInfo) {
      // Dump candidates found on the page so we know what to match against next time
      const diag = await page.evaluate(() => {
        const all = Array.from(document.querySelectorAll<HTMLElement>('*'));
        const cands: string[] = [];
        for (const el of all) {
          const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
          if (!t || t.length > 60) continue;
          if (/apply|applied/i.test(t) && cands.length < 20) {
            const tag = el.tagName.toLowerCase();
            cands.push(`${tag}: "${t}"`);
          }
        }
        return cands;
      });
      const diagMsg = diag.length ? ` · apply-text on page: ${diag.slice(0, 5).join(' | ')}` : '';
      onEvent?.({ type: 'skipped', message: `Apply button not found.${diagMsg}` });
      await new Promise((r) => setTimeout(r, 10_000));
      return {
        job_url: jobUrl,
        status: 'skipped',
        message: `Apply button not found on ${currentUrl}${diagMsg}`,
        duration_ms: Date.now() - start,
        screenshot: shotPath,
      };
    }

    const { handle: applyBtn, text: btnText } = applyInfo;

    // If the button already says "Applied", skip
    if (/\bapplied\b/i.test(btnText) && !/\bapply\b/i.test(btnText)) {
      onEvent?.({ type: 'skipped', message: 'Already applied' });
      return { job_url: jobUrl, status: 'already_applied', duration_ms: Date.now() - start };
    }

    onEvent?.({ type: 'form_detected', message: `Button: "${btnText}"` });
    await randSleep(BEFORE_CLICK_MS);
    await (applyBtn as unknown as { click: () => Promise<void> }).click();

    // Wait up to 15s for one of the known post-apply outcomes instead of a fixed 2-5s sleep
    const outcome = await waitForApplyOutcome(page, 15_000);
    const afterShot = path.join(shotDir, `${Date.now()}-after.png`);
    try {
      await page.screenshot({ path: afterShot as `${string}.png`, fullPage: false });
    } catch {
      // non-fatal
    }

    if (outcome.type === 'chatbot') {
      onEvent?.({ type: 'skipped', message: 'Employer questions (chatbot) — skipped' });
      await new Promise((r) => setTimeout(r, 6_000));
      return {
        job_url: jobUrl,
        status: 'skipped',
        message: 'Employer questions required',
        duration_ms: Date.now() - start,
        screenshot: afterShot,
      };
    }

    if (outcome.type === 'already') {
      onEvent?.({ type: 'skipped', message: 'Already applied' });
      return { job_url: jobUrl, status: 'already_applied', duration_ms: Date.now() - start, screenshot: afterShot };
    }

    if (outcome.type === 'applied') {
      onEvent?.({ type: 'submitted', message: outcome.evidence });
      return { job_url: jobUrl, status: 'applied', duration_ms: Date.now() - start, screenshot: afterShot };
    }

    if (outcome.type === 'redirect') {
      onEvent?.({ type: 'skipped', message: `Redirected to company site: ${outcome.evidence}` });
      return {
        job_url: jobUrl,
        status: 'skipped',
        message: `External apply at ${outcome.evidence}`,
        duration_ms: Date.now() - start,
        screenshot: afterShot,
      };
    }

    onEvent?.({ type: 'skipped', message: 'No confirmation detected after click' });
    await new Promise((r) => setTimeout(r, 8_000));
    return {
      job_url: jobUrl,
      status: 'skipped',
      message: 'No confirmation after submit — check screenshot',
      duration_ms: Date.now() - start,
      screenshot: afterShot,
    };
  } catch (err) {
    return {
      job_url: jobUrl,
      status: 'error',
      message: err instanceof Error ? err.message : 'unknown error',
      duration_ms: Date.now() - start,
    };
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {
        // ignore
      }
    }
  }
}

async function findApplyButton(
  page: Page,
): Promise<{ handle: unknown; text: string; candidates: string[] } | null> {
  // Scan broadly — Naukri often uses <div>/<span> with onclick handlers instead of <button>.
  // We look for any leaf-ish clickable whose visible text is close to "Apply".
  const found = await page.evaluate(() => {
    const isVisible = (el: Element) => {
      const r = el.getBoundingClientRect();
      if (r.width < 10 || r.height < 10) return false;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) < 0.3)
        return false;
      return true;
    };

    const all = Array.from(document.querySelectorAll<HTMLElement>('*'));
    const matches: { text: string; tag: string; cls: string; index: number }[] = [];
    const candidates: string[] = [];

    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      if (!isVisible(el)) continue;

      // Only consider elements that look clickable in some way
      const tag = el.tagName.toLowerCase();
      const looksClickable =
        tag === 'button' ||
        tag === 'a' ||
        el.getAttribute('role') === 'button' ||
        el.hasAttribute('onclick') ||
        window.getComputedStyle(el).cursor === 'pointer';
      if (!looksClickable) continue;

      const raw = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!raw || raw.length > 80) continue;

      // Capture a sample of "apply-ish" texts for diagnostics
      if (/apply|applied/i.test(raw) && candidates.length < 15) {
        candidates.push(`${tag}: "${raw.slice(0, 60)}"`);
      }

      // Reject obvious non-matches
      if (/apply\s*(filter|filters|coupon|now on company)/i.test(raw)) continue;
      if (/send me jobs/i.test(raw)) continue;

      // Accept "Applied" standalone → already applied
      if (/^\s*applied\s*$/i.test(raw)) {
        matches.push({ text: raw, tag, cls: el.className || '', index: i });
      }
      // Accept Apply / Easy Apply / Quick Apply / Apply now (with possible icons/whitespace)
      else if (/^(apply|easy\s*apply|quick\s*apply|apply\s*now)$/i.test(raw)) {
        matches.push({ text: raw, tag, cls: el.className || '', index: i });
      }
    }

    // Prefer the smallest element (innermost, closest to the actual click target)
    if (matches.length > 0) {
      matches.sort((a, b) => b.index - a.index); // later in DOM = likely more inner
      const best = matches[0];
      // Return a stable-ish path to re-fetch as a handle
      const el = all[best.index];
      const marker = `__ak_apply_btn_${Date.now()}`;
      el.setAttribute('data-ak-marker', marker);
      return { text: best.text, marker, candidates };
    }

    return { text: null, marker: null, candidates };
  });

  if (!found.marker || !found.text) return null;

  const handle = await page.$(`[data-ak-marker="${found.marker}"]`);
  if (!handle) return null;

  return { handle, text: found.text, candidates: found.candidates };
}

type ApplyOutcome =
  | { type: 'applied'; evidence: string }
  | { type: 'already'; evidence: string }
  | { type: 'chatbot'; evidence: string }
  | { type: 'redirect'; evidence: string }
  | { type: 'unknown'; evidence: string };

async function waitForApplyOutcome(page: Page, timeoutMs: number): Promise<ApplyOutcome> {
  const deadline = Date.now() + timeoutMs;
  const startUrl = page.url();
  while (Date.now() < deadline) {
    const snap = await page
      .evaluate(() => {
        const body = document.body?.innerText ?? '';
        const chatbot = document.querySelector(
          '.chatbot-divBase, #chatbot_Drawer, [class*="chatbot"], [class*="questionBot"]',
        );
        const btn = Array.from(document.querySelectorAll('button, a')).find((el) => {
          const t = (el.textContent || '').trim();
          return /^\s*applied\s*$/i.test(t);
        });
        return {
          body: body.slice(0, 4000),
          hasChatbot: !!chatbot,
          appliedBtn: btn ? (btn.textContent || '').trim() : null,
          url: window.location.href,
        };
      })
      .catch(() => ({ body: '', hasChatbot: false, appliedBtn: null, url: startUrl }));

    if (snap.hasChatbot) return { type: 'chatbot', evidence: 'chatbot drawer visible' };
    if (snap.appliedBtn) return { type: 'applied', evidence: `button text: ${snap.appliedBtn}` };
    if (/you have successfully applied|application sent|applied successfully/i.test(snap.body)) {
      return { type: 'applied', evidence: 'success toast detected' };
    }
    if (/you have already applied|already applied/i.test(snap.body)) {
      return { type: 'already', evidence: 'already-applied notice' };
    }
    if (snap.url !== startUrl && !snap.url.includes('naukri.com')) {
      return { type: 'redirect', evidence: snap.url };
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return { type: 'unknown', evidence: 'timed out waiting for outcome' };
}
