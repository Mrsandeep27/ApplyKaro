import type { Browser, Page } from 'puppeteer';
import { launchBrowser, connectPortal } from './session.js';
import { randSleep, PAGE_LOAD_MS, BEFORE_CLICK_MS } from '../lib/delays.js';
import { bus } from '../lib/events.js';

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

    // CAPTCHA / bot-check detection
    const html = await page.content();
    if (/captcha|recaptcha|unusual activity|verify you are human/i.test(html)) {
      onEvent?.({ type: 'captcha', message: 'Challenge detected — pausing portal' });
      return { job_url: jobUrl, status: 'captcha', duration_ms: Date.now() - start, message: 'Challenge detected' };
    }

    const applyBtn = await findApplyButton(page);
    if (!applyBtn) {
      return { job_url: jobUrl, status: 'skipped', message: 'Apply button not found', duration_ms: Date.now() - start };
    }

    onEvent?.({ type: 'form_detected' });
    await randSleep(BEFORE_CLICK_MS);
    await (applyBtn as unknown as { click: () => Promise<void> }).click();
    await randSleep(PAGE_LOAD_MS);

    // If an "Already Applied" indicator appears, call it out
    const already = await page.$eval('body', (b) =>
      /already applied|you have applied|application sent/i.test(b.innerText),
    ).catch(() => false);
    if (already) {
      return { job_url: jobUrl, status: 'already_applied', duration_ms: Date.now() - start };
    }

    // Naukri may show a chat-style "chatbot-divBase" flow with follow-up questions.
    // For MVP we skip any jobs that require additional answers and rely on Naukri's
    // auto-fill from the saved profile.
    const chatbot = await page.$('.chatbot-divBase, #chatbot_Drawer');
    if (chatbot) {
      onEvent?.({ type: 'skipped', message: 'Employer questions required — skipped' });
      return { job_url: jobUrl, status: 'skipped', message: 'Employer questions required', duration_ms: Date.now() - start };
    }

    onEvent?.({ type: 'submitted' });
    // Look for confirmation toast/message
    await randSleep(PAGE_LOAD_MS);
    const confirmed = await page.evaluate(() => {
      const body = document.body.innerText.toLowerCase();
      return /you have successfully applied|application sent|successfully submitted/.test(body);
    });

    if (!confirmed) {
      // Some apply flows just show a disabled "Applied" state on the button — check it
      const appliedState = await page.$eval('body', (b) =>
        /\bapplied\b/i.test(b.innerText),
      ).catch(() => false);
      if (!appliedState) {
        return { job_url: jobUrl, status: 'skipped', message: 'No confirmation detected', duration_ms: Date.now() - start };
      }
    }

    return { job_url: jobUrl, status: 'applied', duration_ms: Date.now() - start };
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

async function findApplyButton(page: Page) {
  // Try a few Naukri button variants (their markup changes often)
  const selectors = [
    '#apply-button',
    'button.apply-button',
    'button#job-apply-button',
    'button[id*="apply"]',
    'button.styles_btn-primary__JZ9fa',
    'a.apply-button',
  ];
  for (const sel of selectors) {
    const el = await page.$(sel);
    if (el) return el;
  }
  // Last-resort: scan for a button containing "Apply"
  const handle = await page.evaluateHandle(() => {
    const all = Array.from(document.querySelectorAll('button, a'));
    return all.find(
      (el) =>
        /\b(apply|easy apply)\b/i.test((el.textContent || '').trim()) &&
        !/applied/i.test((el.textContent || '').trim()),
    );
  });
  const element = handle.asElement();
  return element || null;
}
