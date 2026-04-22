import { MapPin, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Job, Match } from '@/lib/types';
import { MatchBadge } from './match-badge';
import { PortalBadge } from './portal-badge';
import { formatSalary, timeAgo } from '@/lib/utils/format';

export function JobCard({ job, match, footer }: { job: Job; match?: Match; footer?: React.ReactNode }) {
  return (
    <article className="card p-4 animate-slide-up">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <PortalBadge portal={job.portal} size="sm" />
            <span className="text-[11px] text-ink-400">{timeAgo(job.scraped_at)}</span>
          </div>
          <Link to={`/jobs/${job.id}`} className="block">
            <h3 className="font-semibold leading-snug truncate">{job.title}</h3>
            <p className="text-sm text-ink-500 truncate">{job.company}</p>
          </Link>
        </div>
        {match && <MatchBadge score={match.score} />}
      </div>

      <div className="flex items-center gap-4 text-xs text-ink-500 mb-3">
        <span className="inline-flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" />
          {job.location} · {job.job_type}
        </span>
        <span className="inline-flex items-center gap-1">
          <Wallet className="w-3.5 h-3.5" />
          {formatSalary(job.salary_min, job.salary_max)}
        </span>
      </div>

      {match && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {match.matching_skills.slice(0, 4).map((s) => (
            <span key={s} className="chip-green">{s}</span>
          ))}
          {match.missing_skills.slice(0, 2).map((s) => (
            <span key={s} className="chip-red">{s}</span>
          ))}
        </div>
      )}

      {footer}
    </article>
  );
}
