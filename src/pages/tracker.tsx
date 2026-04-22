import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ListChecks, Search } from 'lucide-react';
import { db } from '@/lib/db/dexie';
import { Input } from '@/components/ui/input';
import { PipelineBoard } from '@/components/tracker/pipeline-board';
import { Empty } from '@/components/ui/empty';
import { PortalBadge } from '@/components/jobs/portal-badge';
import { Link } from 'react-router-dom';
import { timeAgo } from '@/lib/utils/format';
import type { ApplicationStatus } from '@/lib/types';

const STATUS_TONES: Record<ApplicationStatus, string> = {
  queued: 'chip-ink',
  applying: 'chip-blue',
  applied: 'chip-ink',
  viewed: 'chip-blue',
  interview: 'chip-green',
  offer: 'chip-green',
  rejected: 'chip-red',
  ghosted: 'chip-red',
  error: 'chip-red',
};

export default function TrackerPage() {
  const [q, setQ] = useState('');
  const apps = useLiveQuery(() => db.applications.orderBy('updated_at').reverse().toArray(), []) ?? [];
  const jobs = useLiveQuery(() => db.jobs.toArray(), []) ?? [];
  const jobMap = useMemo(() => new Map(jobs.map((j) => [j.id, j])), [jobs]);

  const filtered = apps.filter((a) => {
    const job = jobMap.get(a.job_id);
    if (!job) return false;
    if (!q) return true;
    return `${job.title} ${job.company}`.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <PipelineBoard />

      <div className="relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search applications"
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <Empty
          icon={ListChecks}
          title="No applications yet"
          description="Start auto-apply and your applications will be tracked here with real-time status."
        />
      ) : (
        <div className="card divide-y divide-ink-100 dark:divide-ink-800 p-0 overflow-hidden">
          {filtered.map((a) => {
            const job = jobMap.get(a.job_id);
            if (!job) return null;
            return (
              <Link
                key={a.id}
                to={`/tracker/${a.id}`}
                className="flex items-center gap-3 p-3 hover:bg-ink-50 dark:hover:bg-ink-800 transition"
              >
                <PortalBadge portal={a.portal} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{job.title}</p>
                  <p className="text-xs text-ink-500 truncate">
                    {job.company} · {a.applied_at ? timeAgo(a.applied_at) : 'just now'}
                  </p>
                </div>
                <span className={STATUS_TONES[a.status]}>{a.status}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
