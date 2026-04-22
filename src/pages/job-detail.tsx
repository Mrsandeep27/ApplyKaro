import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Loader2, Sparkles } from 'lucide-react';
import { db } from '@/lib/db/dexie';
import { Button } from '@/components/ui/button';
import { MatchBadge } from '@/components/jobs/match-badge';
import { PortalBadge } from '@/components/jobs/portal-badge';
import { SkillMatch } from '@/components/jobs/skill-match';
import { formatSalary, timeAgo } from '@/lib/utils/format';
import { generateCoverLetter } from '@/lib/ai/cover-letter';

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const job = useLiveQuery(() => (id ? db.jobs.get(id) : undefined), [id]);
  const match = useLiveQuery(
    () => (id ? db.matches.where('job_id').equals(id).first() : undefined),
    [id],
  );
  const defaultResume = useLiveQuery(
    () => db.resumes.where('is_default').equals(1 as unknown as string).first(),
    [],
  );

  const [letter, setLetter] = useState<string>('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLetter('');
  }, [id]);

  const handleGenerate = async () => {
    if (!job) return;
    setBusy(true);
    try {
      const resume =
        defaultResume?.parsed_data ?? {
          name: 'Candidate',
          skills: [],
          experience: [],
          education: [],
          experience_years: 0,
        };
      const text = await generateCoverLetter(resume, job);
      setLetter(text);
    } finally {
      setBusy(false);
    }
  };

  const description = useMemo(() => job?.description.split('\n').filter(Boolean) ?? [], [job]);

  if (!job) {
    return (
      <div className="card p-8 text-center text-sm text-ink-500">Loading job…</div>
    );
  }

  return (
    <div className="space-y-4">
      <Link to="/jobs" className="inline-flex items-center gap-1 text-xs text-ink-500">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to jobs
      </Link>

      <section className="card p-5">
        <div className="flex items-center gap-2 mb-2">
          <PortalBadge portal={job.portal} />
          <span className="text-[11px] text-ink-400">{timeAgo(job.scraped_at)}</span>
          {match && <div className="ml-auto"><MatchBadge score={match.score} size="lg" /></div>}
        </div>
        <h1 className="text-xl font-bold">{job.title}</h1>
        <p className="text-sm text-ink-500">
          {job.company} · {job.location} · {job.job_type}
        </p>
        <p className="text-sm font-medium mt-1">{formatSalary(job.salary_min, job.salary_max)}</p>

        {match && (
          <div className="mt-4">
            <SkillMatch
              matching={match.matching_skills}
              missing={match.missing_skills}
              bonus={match.bonus_skills}
            />
            {match.reasoning && (
              <p className="text-xs text-ink-500 mt-2 italic">{match.reasoning}</p>
            )}
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <a className="btn-outline" href={job.job_url} target="_blank" rel="noreferrer">
            <ExternalLink className="w-4 h-4" /> Open on {job.portal}
          </a>
          {match && match.status !== 'approved' && (
            <Button
              full
              onClick={() => db.matches.update(match.id, { status: 'approved' })}
            >
              Approve for auto-apply
            </Button>
          )}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="font-semibold mb-2">Description</h2>
        <div className="text-sm text-ink-700 dark:text-ink-200 space-y-2">
          {description.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-500" /> AI cover letter
          </h2>
          <Button variant="outline" onClick={handleGenerate} disabled={busy}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate'}
          </Button>
        </div>
        {letter ? (
          <pre className="whitespace-pre-wrap text-sm text-ink-700 dark:text-ink-200 font-sans leading-relaxed">
            {letter}
          </pre>
        ) : (
          <p className="text-sm text-ink-500">
            Generate a 250-word personalized cover letter based on your default resume and this job.
          </p>
        )}
      </section>
    </div>
  );
}
