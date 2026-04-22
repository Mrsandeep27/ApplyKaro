import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { LogOut, Plus, Trash2 } from 'lucide-react';
import { db, uid } from '@/lib/db/dexie';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PORTALS } from '@/constants/portals';
import { usePreferences } from '@/stores/preference-store';
import { useAuth } from '@/stores/auth-store';
import type { PortalSlug, WorkType } from '@/lib/types';

export default function SettingsPage() {
  const { prefs, update } = usePreferences();
  const { signOut, user } = useAuth();
  const portals = useLiveQuery(() => db.portals.toArray(), []) ?? [];
  const [local, setLocal] = useState(prefs);

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
        <div className="card p-4 space-y-2">
          {portals.length === 0 && (
            <p className="text-xs text-ink-400">Connect your portal accounts to enable auto-apply.</p>
          )}
          {portals.map((p) => (
            <div key={p.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{p.portal}</p>
                <p className="text-xs text-ink-500">{p.email}</p>
              </div>
              <button
                className="w-9 h-9 rounded-full hover:bg-rose-100 dark:hover:bg-rose-900/30 grid place-items-center text-rose-600"
                onClick={() => db.portals.delete(p.id)}
                aria-label="Remove portal"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <ConnectPortalForm
            onAdd={async (portal, email) => {
              await db.portals.add({
                id: uid('portal'),
                portal: portal as PortalSlug,
                email,
                status: 'active',
                daily_limit: local.daily_limits[portal] ?? 10,
              });
            }}
          />
        </div>
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

function ConnectPortalForm({ onAdd }: { onAdd: (portal: string, email: string) => void }) {
  const [portal, setPortal] = useState<string>(PORTALS[0].slug);
  const [email, setEmail] = useState('');
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button variant="outline" full onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4" /> Connect portal
      </Button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!email) return;
        onAdd(portal, email);
        setEmail('');
        setOpen(false);
      }}
      className="space-y-2 pt-2 border-t border-ink-100 dark:border-ink-800"
    >
      <select
        value={portal}
        onChange={(e) => setPortal(e.target.value)}
        className="input"
      >
        {PORTALS.map((p) => (
          <option key={p.slug} value={p.slug}>
            {p.name}
          </option>
        ))}
      </select>
      <Input
        type="email"
        placeholder="Your portal email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <p className="text-[10px] text-ink-400">
        Passwords are encrypted server-side. We never store plaintext.
      </p>
      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={() => setOpen(false)} full>
          Cancel
        </Button>
        <Button type="submit" full>
          Save
        </Button>
      </div>
    </form>
  );
}
