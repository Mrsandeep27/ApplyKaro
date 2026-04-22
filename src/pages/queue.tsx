import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Zap } from 'lucide-react';
import { db } from '@/lib/db/dexie';
import { ApplyProgress } from '@/components/apply/apply-progress';
import { JobCard } from '@/components/jobs/job-card';
import { Button } from '@/components/ui/button';
import { Empty } from '@/components/ui/empty';
import { useApply } from '@/stores/apply-store';

export default function QueuePage() {
  const matches = useLiveQuery(() => db.matches.toArray(), []) ?? [];
  const jobs = useLiveQuery(() => db.jobs.toArray(), []) ?? [];
  const jobMap = useMemo(() => new Map(jobs.map((j) => [j.id, j])), [jobs]);
  const { start, running } = useApply();

  const approved = matches
    .filter((m) => m.status === 'approved')
    .sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-4">
      <div className="card p-4 flex items-center justify-between bg-gradient-to-br from-brand-50 to-indigo-50 dark:from-brand-900/30 dark:to-indigo-900/30">
        <div>
          <p className="text-xs uppercase tracking-wider text-brand-700 dark:text-brand-300">Ready to apply</p>
          <p className="text-2xl font-bold">{approved.length} jobs</p>
          <p className="text-xs text-ink-500 mt-1">Estimated time: ~{Math.max(1, approved.length * 2)} min</p>
        </div>
        <Button onClick={start} disabled={running || approved.length === 0}>
          <Zap className="w-4 h-4" /> {running ? 'Running' : 'Start'}
        </Button>
      </div>

      <ApplyProgress />

      {approved.length === 0 ? (
        <Empty
          icon={Zap}
          title="Queue is empty"
          description="Approve jobs from the Jobs tab. Auto-apply starts once you have jobs lined up."
        />
      ) : (
        <div className="space-y-3">
          {approved.map((m) => {
            const job = jobMap.get(m.job_id);
            if (!job) return null;
            return (
              <JobCard
                key={m.id}
                job={job}
                match={m}
                footer={
                  <Button
                    variant="outline"
                    full
                    onClick={() => db.matches.update(m.id, { status: 'queued' })}
                  >
                    Remove from queue
                  </Button>
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
