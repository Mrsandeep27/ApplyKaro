import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { PortalBadge } from '@/components/jobs/portal-badge';
import type { Application, ApplicationStatus, Job } from '@/lib/types';

const COLUMNS: { key: ApplicationStatus; label: string; tone: string }[] = [
  { key: 'applied', label: 'Applied', tone: 'bg-ink-100 dark:bg-ink-800' },
  { key: 'viewed', label: 'Viewed', tone: 'bg-sky-100 dark:bg-sky-900/40' },
  { key: 'interview', label: 'Interview', tone: 'bg-amber-100 dark:bg-amber-900/40' },
  { key: 'offer', label: 'Offer', tone: 'bg-emerald-100 dark:bg-emerald-900/40' },
  { key: 'rejected', label: 'Rejected', tone: 'bg-rose-100 dark:bg-rose-900/40' },
];

export function PipelineBoard() {
  const apps = useLiveQuery(() => db.applications.orderBy('updated_at').reverse().toArray(), []) ?? [];
  const jobs = useLiveQuery(() => db.jobs.toArray(), []) ?? [];
  const jobMap = new Map<string, Job>(jobs.map((j) => [j.id, j]));

  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-none -mx-4 px-4 pb-1">
      {COLUMNS.map((col) => {
        const items = apps.filter((a) => a.status === col.key);
        return (
          <div key={col.key} className="min-w-[220px] w-[220px] shrink-0">
            <div className={`rounded-t-xl px-3 py-2 flex items-center justify-between ${col.tone}`}>
              <span className="text-xs font-semibold">{col.label}</span>
              <span className="text-[10px] text-ink-500 bg-white/60 dark:bg-black/20 rounded-full px-2 py-0.5">
                {items.length}
              </span>
            </div>
            <div className="card rounded-t-none p-2 space-y-2 min-h-[180px]">
              {items.length === 0 && (
                <p className="text-xs text-ink-400 text-center py-6">No applications</p>
              )}
              {items.map((a) => {
                const job = jobMap.get(a.job_id);
                if (!job) return null;
                return <MiniAppCard key={a.id} application={a} job={job} />;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MiniAppCard({ application, job }: { application: Application; job: Job }) {
  return (
    <Link to={`/tracker/${application.id}`} className="block rounded-lg p-2 hover:bg-ink-50 dark:hover:bg-ink-800 transition">
      <div className="flex items-center gap-2 mb-1">
        <PortalBadge portal={application.portal} size="sm" />
      </div>
      <p className="text-xs font-semibold truncate">{job.title}</p>
      <p className="text-[11px] text-ink-500 truncate">{job.company}</p>
    </Link>
  );
}
