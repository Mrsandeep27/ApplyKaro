import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronRight, FileText, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '@/lib/db/dexie';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PORTALS } from '@/constants/portals';
import { usePreferences } from '@/stores/preference-store';
import { useAuth } from '@/stores/auth-store';
import { PortalConnectList } from '@/components/settings/portal-connect';
import type { WorkType } from '@/lib/types';

export default function SettingsPage() {
  const { prefs, update } = usePreferences();
  const { signOut, user } = useAuth();
  const [local, setLocal] = useState(prefs);
  const defaultResume = useLiveQuery(
    () => db.resumes.filter((r) => r.is_default === true).first(),
    [],
  );
  const resumeCount = useLiveQuery(() => db.resumes.count(), []) ?? 0;

  useEffect(() => setLocal(prefs), [prefs]);

  if (!local) return null;

  const save = (patch: Partial<typeof local>) => {
    setLocal({ ...local, ...patch });
    update(patch);
  };

  return (
    <div className="space-y-5">
      <section>
        <SectionTitle>Profile</SectionTitle>
        <div className="card p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">{user?.name || user?.email}</p>
            <p className="text-xs text-ink-500">{user?.email}</p>
          </div>
          <Button variant="outline" onClick={() => signOut()}>
            <LogOut className="w-4 h-4" /> Sign out
          </Button>
        </div>
      </section>

      <section>
        <SectionTitle>Resume</SectionTitle>
        <Link
          to="/resume"
          className="card p-4 flex items-center gap-3 hover:bg-ink-50 transition"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-50 grid place-items-center text-brand-600 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">
              {resumeCount === 0 ? 'Upload resume' : defaultResume?.name ?? 'Manage resumes'}
            </p>
            <p className="text-xs text-ink-500">
              {resumeCount === 0
                ? 'Required for AI matching and auto-apply'
                : `${resumeCount} resume${resumeCount > 1 ? 's' : ''} · ${defaultResume?.parsed_data.skills.length ?? 0} skills extracted`}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-ink-400" />
        </Link>
      </section>

      <section>
        <SectionTitle>Search preferences</SectionTitle>
        <div className="card p-4 space-y-3">
          <div>
            <Label>Job titles</Label>
            <ChipInput
              value={local.job_titles}
              onChange={(job_titles) => save({ job_titles })}
              placeholder="e.g. Full Stack Developer"
            />
          </div>
          <div>
            <Label>Locations</Label>
            <ChipInput
              value={local.locations}
              onChange={(locations) => save({ locations })}
              placeholder="e.g. Bangalore, Remote"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Min salary (₹)</Label>
              <Input
                type="number"
                value={local.min_salary}
                onChange={(e) => save({ min_salary: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Max salary (₹)</Label>
              <Input
                type="number"
                value={local.max_salary}
                onChange={(e) => save({ max_salary: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Experience min</Label>
              <Input
                type="number"
                value={local.experience_min}
                onChange={(e) => save({ experience_min: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Experience max</Label>
              <Input
                type="number"
                value={local.experience_max}
                onChange={(e) => save({ experience_max: Number(e.target.value) })}
              />
            </div>
          </div>
          <div>
            <Label>Work type</Label>
            <div className="flex gap-1.5">
              {(['any', 'remote', 'hybrid', 'onsite'] as WorkType[]).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => save({ work_type: w })}
                  className={`flex-1 h-10 rounded-full text-xs font-medium border transition ${
                    local.work_type === w
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'border-ink-200 dark:border-ink-700'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Match threshold: {local.match_threshold}%</Label>
            <input
              type="range"
              min={50}
              max={95}
              step={5}
              value={local.match_threshold}
              onChange={(e) => save({ match_threshold: Number(e.target.value) })}
              className="w-full accent-brand-500"
            />
          </div>
        </div>
      </section>

      <section>
        <SectionTitle>Daily apply limits</SectionTitle>
        <div className="card p-4 space-y-2">
          {PORTALS.map((p) => (
            <div key={p.slug} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-6 h-6 rounded-md grid place-items-center text-[9px] font-bold text-white shrink-0"
                  style={{ backgroundColor: p.color }}
                >
                  {p.initials}
                </span>
                <span className="text-sm truncate">{p.name}</span>
                <span className="text-[10px] text-ink-400">tier {p.tier}</span>
              </div>
              <Input
                type="number"
                className="w-20 h-9 text-center"
                min={0}
                max={50}
                value={local.daily_limits[p.slug] ?? p.default_limit}
                onChange={(e) =>
                  save({
                    daily_limits: {
                      ...local.daily_limits,
                      [p.slug]: Number(e.target.value),
                    },
                  })
                }
              />
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Connected portals</SectionTitle>
        <PortalConnectList />
      </section>

      <section>
        <SectionTitle>Danger zone</SectionTitle>
        <div className="card p-4 space-y-2">
          <Button
            variant="outline"
            full
            onClick={async () => {
              if (confirm('Clear all local data? This cannot be undone.')) {
                await db.delete();
                location.reload();
              }
            }}
          >
            Clear all local data
          </Button>
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[11px] uppercase tracking-wider text-ink-400 mb-2 px-1">{children}</h3>;
}

function ChipInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const t = draft.trim();
    if (!t) return;
    onChange([...value, t]);
    setDraft('');
  };
  return (
    <div className="flex flex-wrap gap-1.5 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 p-2">
      {value.map((v, i) => (
        <span key={`${v}-${i}`} className="chip-ink">
          {v}
          <button
            type="button"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            className="ml-1 text-ink-500 hover:text-rose-600"
            aria-label={`Remove ${v}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add();
          }
          if (e.key === 'Backspace' && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        placeholder={placeholder}
        className="flex-1 min-w-[120px] bg-transparent outline-none text-sm"
      />
    </div>
  );
}

