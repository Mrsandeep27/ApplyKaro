import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowRight, Sparkles, Zap } from 'lucide-react';
import { db } from '@/lib/db/dexie';
import { StatsRow } from '@/components/apply/stats-row';
import { ApplyProgress } from '@/components/apply/apply-progress';
import { JobCard } from '@/components/jobs/job-card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/stores/auth-store';
import { usePreferences } from '@/stores/preference-store';

export default function DashboardPage() {
  const { user } = useAuth();
  const prefs = usePreferences((s) => s.prefs);
  const matches = useLiveQuery(() => db.matches.toArray(), []) ?? [];
  const jobs = useLiveQuery(() => db.jobs.toArray(), []) ?? [];
  const apps = useLiveQuery(() => db.applications.toArray(), []) ?? [];

  const topMatches = useMemo(() => {
    const threshold = prefs?.match_threshold ?? 70;
    return matches
      .filter((m) => m.score >= threshold && m.status === 'queued')
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [matches, prefs?.match_threshold]);

  const jobMap = useMemo(() => new Map(jobs.map((j) => [j.id, j])), [jobs]);

  const stats = useMemo(() => {
    const appliedThisWeek = apps.filter((a) => {
      if (!a.applied_at) return false;
      return Date.now() - new Date(a.applied_at).getTime() < 7 * 86400000;
    }).length;
    const responses = apps.filter((a) => ['viewed', 'interview', 'offer'].includes(a.status)).length;
    const interviews = apps.filter((a) => a.status === 'interview').length;
    return [
      { label: 'Applied', value: appliedThisWeek, hint: 'this week' },
      { label: 'Responses', value: responses },
      { label: 'Interviews', value: interviews },
    ];
  }, [apps]);

  const name = user?.name || user?.email?.split('@')[0] || 'there';

  return (
    <div className="space-y-5 pt-2">
      <section className="flex items-end justify-between">
        <div>
          <p className="text-xs text-ink-500">Namaste,</p>
          <h2 className="text-2xl font-bold">{name} 👋</h2>
          <p className="text-xs text-ink-500 mt-0.5">
            {matches.length} jobs matched · {apps.length} applications tracked
          </p>
        </div>
        <Link to="/queue" className="btn-primary">
          <Zap className="w-4 h-4" /> Queue
        </Link>
      </section>

      <StatsRow stats={stats} />

      <ApplyProgress />

      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-500" /> Top matches today
          </h3>
          <Link to="/jobs" className="text-xs text-brand-600 font-medium inline-flex items-center gap-1">
            See all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-3">
          {topMatches.length === 0 && (
            <div className="card p-5 text-center">
              <p className="text-sm text-ink-500">
                Fetching jobs… check back in a few minutes. New matches appear automatically.
              </p>
            </div>
          )}
          {topMatches.map((m) => {
            const job = jobMap.get(m.job_id);
            if (!job) return null;
            return (
              <JobCard
                key={m.id}
                job={job}
                match={m}
                footer={
                  <div className="flex gap-2">
                    <Button variant="outline" full onClick={() => db.matches.update(m.id, { status: 'skipped' })}>
                      Skip
                    </Button>
                    <Button full onClick={() => db.matches.update(m.id, { status: 'approved' })}>
                      Approve
                    </Button>
                  </div>
                }
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
