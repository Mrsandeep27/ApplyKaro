import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Briefcase, Loader2, RefreshCw, Search, Sliders } from 'lucide-react';
import { db, uid } from '@/lib/db/dexie';
import { JobCard } from '@/components/jobs/job-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PORTALS } from '@/constants/portals';
import { Empty } from '@/components/ui/empty';
import { api } from '@/lib/api';
import type { Job, Match, PortalSlug } from '@/lib/types';

export default function JobsPage() {
  const [q, setQ] = useState('');
  const [portal, setPortal] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<string | null>(null);

  const matches = useLiveQuery(() => db.matches.toArray(), []) ?? [];
  const jobs = useLiveQuery(() => db.jobs.toArray(), []) ?? [];
  const jobMap = useMemo(() => new Map(jobs.map((j) => [j.id, j])), [jobs]);

  async function runScrape() {
    setScraping(true);
    setScrapeResult(null);
    try {
      const result = await api.scrapeJobs();
      setScrapeResult(`Scraped ${result.found} · kept ${result.kept} ≥${result.threshold}%`);
      // Pull the enriched job list and mirror into Dexie so the existing UI renders
      const fresh = await api.getJobs();
      for (const j of fresh.jobs) {
        const exists = await db.jobs.get(j.id);
        if (!exists) {
          const job: Job = {
            id: j.id,
            portal: j.portal as PortalSlug,
            portal_job_id: j.portal_job_id,
            title: j.title,
            company: j.company,
            location: j.location,
            salary_min: j.salary_min ?? null,
            salary_max: j.salary_max ?? null,
            description: j.description,
            skills: j.skills,
            job_url: j.job_url,
            job_type: j.job_type,
            scraped_at: j.scraped_at,
          };
          await db.jobs.add(job);
          if (j.match) {
            const m: Match = {
              id: uid('m'),
              user_id: 'local',
              job_id: j.id,
              resume_id: 'default',
              score: j.match.score,
              matching_skills: j.match.matching_skills,
              missing_skills: j.match.missing_skills,
              bonus_skills: j.match.bonus_skills,
              reasoning: j.match.reasoning,
              status: 'queued',
              created_at: new Date().toISOString(),
            };
            await db.matches.add(m);
          }
        }
      }
    } catch (err) {
      setScrapeResult(err instanceof Error ? err.message : 'Scrape failed');
    } finally {
      setScraping(false);
    }
  }

  const filtered = useMemo(() => {
    return matches
      .map((m) => ({ match: m, job: jobMap.get(m.job_id) }))
      .filter((x): x is { match: typeof matches[0]; job: NonNullable<ReturnType<typeof jobMap.get>> } => !!x.job)
      .filter(({ job }) => (portal === 'all' ? true : job.portal === portal))
      .filter(({ job }) =>
        !q
          ? true
          : `${job.title} ${job.company} ${job.location}`.toLowerCase().includes(q.toLowerCase()),
      )
      .sort((a, b) => b.match.score - a.match.score);
  }, [matches, jobMap, q, portal]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
          <Input
            placeholder="Search role, company, location"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={() => setShowFilters((v) => !v)} aria-label="Filters">
          <Sliders className="w-4 h-4" />
        </Button>
        <Button onClick={runScrape} disabled={scraping} aria-label="Scrape jobs">
          {scraping ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </Button>
      </div>
      {scrapeResult && <p className="text-[11px] text-ink-500 px-1">{scrapeResult}</p>}

      {showFilters && (
        <div className="card p-3">
          <p className="text-xs font-medium text-ink-500 mb-2">Portal</p>
          <div className="flex flex-wrap gap-1.5">
            <FilterChip active={portal === 'all'} onClick={() => setPortal('all')}>
              All
            </FilterChip>
            {PORTALS.map((p) => (
              <FilterChip key={p.slug} active={portal === p.slug} onClick={() => setPortal(p.slug)}>
                {p.name}
              </FilterChip>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <Empty
          icon={Briefcase}
          title="No jobs yet"
          description="We scan portals every 6 hours. New matches will show up automatically."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(({ match, job }) => (
            <JobCard
              key={match.id}
              match={match}
              job={job}
              footer={
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    full
                    onClick={() => db.matches.update(match.id, { status: 'saved' })}
                  >
                    Save
                  </Button>
                  <Button
                    full
                    onClick={() => db.matches.update(match.id, { status: 'approved' })}
                  >
                    Approve
                  </Button>
                </div>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 h-8 rounded-full text-xs font-medium border transition ${
        active
          ? 'bg-brand-600 text-white border-brand-600'
          : 'bg-transparent text-ink-600 dark:text-ink-300 border-ink-200 dark:border-ink-700 hover:bg-ink-100 dark:hover:bg-ink-800'
      }`}
    >
      {children}
    </button>
  );
}
