import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowRight, FileText, Sparkles, Zap } from 'lucide-react';
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
  const resumeCount = useLiveQuery(() => db.resumes.count(), []) ?? 0;

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

      {resumeCount === 0 && (
        <Link
          to="/resume"
          className="card p-4 flex items-center gap-3 bg-gradient-to-br from-amber-50 to-rose-50 border-amber-100 hover:brightness-95 transition"
        >
          <div className="w-10 h-10 rounded-xl bg-white grid place-items-center text-amber-600 shrink-0 shadow">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Upload your resume</p>
            <p className="text-xs text-ink-500">Required for AI matching and auto-apply</p>
          </div>
          <ArrowRight className="w-4 h-4 text-ink-500" />
        </Link>
      )}

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
            <div className="card p-5 text-center space-y-2">
              <p className="text-sm font-medium">No matches yet</p>
              <p className="text-xs text-ink-500">
                Go to Jobs → tap the refresh button to scrape Naukri with Gemini-generated queries.
                Connect Naukri first in Settings → Connected portals.
              </p>
              <Link to="/jobs" className="btn-primary inline-flex mt-2">
                Go to Jobs
              </Link>
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
