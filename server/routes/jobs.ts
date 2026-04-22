import { Router } from 'express';
import { buildQueries } from '../lib/query-builder.js';
import { matchJob } from '../lib/matcher.js';
import { scrapeNaukri } from '../portals/naukri.js';
import { loadState } from '../lib/store.js';
import { bus } from '../lib/events.js';
import { fileStore } from '../lib/store.js';
import type { ScrapedJob } from '../portals/naukri.js';

export const jobsRouter = Router();

interface JobRecord extends ScrapedJob {
  id: string;
  match?: {
    score: number;
    matching_skills: string[];
    missing_skills: string[];
    bonus_skills: string[];
    reasoning: string;
  };
}

const jobStore = fileStore('jobs');

function readJobs(): JobRecord[] {
  return jobStore.read<JobRecord[]>([]);
}
function writeJobs(j: JobRecord[]) {
  jobStore.write(j);
}

jobsRouter.get('/', (_req, res) => {
  res.json({ jobs: readJobs() });
});

jobsRouter.post('/scrape', async (req, res) => {
  const state = loadState();
  if (!state.resume) return res.status(400).json({ error: 'Upload a resume first' });
  if (!state.preferences) return res.status(400).json({ error: 'Set preferences first' });

  const portals: string[] = Array.isArray(req.body?.portals) && req.body.portals.length
    ? req.body.portals
    : state.preferences.active_portals ?? ['naukri'];

  bus.emit({ type: 'portal_start', message: 'Planning search queries…' });
  const queries = await buildQueries(state.resume, state.preferences);
  bus.emit({ type: 'portal_start', message: `Running ${queries.length} queries` });

  const allJobs: ScrapedJob[] = [];
  for (const portal of portals) {
    if (portal === 'naukri') {
      const rows = await scrapeNaukri(queries);
      allJobs.push(...rows);
    }
    // Future portals plug in here.
  }

  // Dedupe by portal + portal_job_id
  const byKey = new Map<string, ScrapedJob>();
  for (const j of allJobs) byKey.set(`${j.portal}:${j.portal_job_id}`, j);
  const unique = [...byKey.values()];

  // Match each against resume
  const threshold = state.preferences.match_threshold ?? 70;
  const scored: JobRecord[] = [];
  for (const j of unique) {
    const m = await matchJob({
      resume_skills: state.resume.skills,
      resume_summary: state.resume.summary ?? '',
      experience_years: state.resume.experience_years ?? 0,
      job_title: j.title,
      job_company: j.company,
      job_description: j.description,
      job_skills: j.skills,
    });
    scored.push({ ...j, id: `${j.portal}_${j.portal_job_id}`, match: m });
    bus.emit({
      type: 'portal_start',
      message: `Matched: ${j.title} @ ${j.company} · ${m.score}%`,
    });
  }

  const kept = scored.filter((j) => (j.match?.score ?? 0) >= threshold);

  // Merge with existing, newest first, dedupe
  const existing = readJobs();
  const keyed = new Map(existing.map((e) => [e.id, e]));
  for (const j of kept) keyed.set(j.id, j);
  const merged = [...keyed.values()]
    .sort((a, b) => (new Date(b.scraped_at).getTime()) - (new Date(a.scraped_at).getTime()))
    .slice(0, 500);
  writeJobs(merged);

  bus.emit({
    type: 'done',
    message: `Scrape complete · ${kept.length} above threshold (${threshold}%)`,
  });
  res.json({ found: allJobs.length, unique: unique.length, kept: kept.length, threshold });
});

jobsRouter.delete('/:id', (req, res) => {
  const remaining = readJobs().filter((j) => j.id !== req.params.id);
  writeJobs(remaining);
  res.json({ ok: true });
});
