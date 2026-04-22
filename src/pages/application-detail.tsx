import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { db } from '@/lib/db/dexie';
import { PortalBadge } from '@/components/jobs/portal-badge';
import { Button } from '@/components/ui/button';
import { timeAgo } from '@/lib/utils/format';
import type { ApplicationStatus } from '@/lib/types';

const STATUSES: ApplicationStatus[] = [
  'applied',
  'viewed',
  'interview',
  'offer',
  'rejected',
  'ghosted',
];

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const app = useLiveQuery(() => (id ? db.applications.get(id) : undefined), [id]);
  const job = useLiveQuery(
    () => (app ? db.jobs.get(app.job_id) : undefined),
    [app?.job_id],
  );
  const logs =
    useLiveQuery(
      () => (id ? db.logs.where('application_id').equals(id).sortBy('timestamp') : []),
      [id],
    ) ?? [];

  if (!app || !job) {
    return <div className="card p-8 text-center text-sm text-ink-500">Loading…</div>;
  }

  const changeStatus = (s: ApplicationStatus) => {
    db.applications.update(app.id, { status: s, updated_at: new Date().toISOString() });
  };

  return (
    <div className="space-y-4">
      <Link to="/tracker" className="inline-flex items-center gap-1 text-xs text-ink-500">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to tracker
      </Link>

      <section className="card p-5">
        <div className="flex items-center gap-2 mb-2">
          <PortalBadge portal={app.portal} />
          {app.applied_at && (
            <span className="text-[11px] text-ink-400 inline-flex items-center gap-1">
              <Clock className="w-3 h-3" /> applied {timeAgo(app.applied_at)}
            </span>
          )}
        </div>
        <h1 className="text-xl font-bold">{job.title}</h1>
        <p className="text-sm text-ink-500">{job.company} · {job.location}</p>
      </section>

      <section className="card p-5">
        <h2 className="font-semibold text-sm mb-3">Status</h2>
        <div className="grid grid-cols-3 gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => changeStatus(s)}
              className={`h-10 rounded-full text-xs font-medium border transition ${
                app.status === s
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'border-ink-200 dark:border-ink-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="font-semibold text-sm mb-3">Notes</h2>
        <textarea
          defaultValue={app.notes ?? ''}
          onBlur={(e) =>
            db.applications.update(app.id, {
              notes: e.target.value,
              updated_at: new Date().toISOString(),
            })
          }
          rows={4}
          className="w-full rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-4 py-3 text-sm outline-none focus:border-brand-500"
          placeholder="Add notes, contacts, follow-ups…"
        />
      </section>

      <section className="card p-5">
        <h2 className="font-semibold text-sm mb-3">Apply log</h2>
        {logs.length === 0 ? (
          <p className="text-xs text-ink-400">No activity yet.</p>
        ) : (
          <ul className="space-y-2">
            {logs.map((l) => (
              <li key={l.id} className="flex items-center gap-3">
                <span className="text-[11px] text-ink-400 w-14">{timeAgo(l.timestamp)}</span>
                <span className="chip-ink capitalize">{l.action.replace('_', ' ')}</span>
                {l.details && <span className="text-xs text-ink-500 truncate">{l.details}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Button
        variant="outline"
        full
        onClick={async () => {
          if (confirm('Delete this application?')) {
            await db.applications.delete(app.id);
            history.back();
          }
        }}
      >
        Delete application
      </Button>
    </div>
  );
}
