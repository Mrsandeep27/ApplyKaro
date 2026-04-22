import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { usePreferences } from '@/stores/preference-store';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { PORTALS } from '@/constants/portals';
import type { PortalSlug, WorkType } from '@/lib/types';

const STEPS = ['Titles', 'Location', 'Salary', 'Portals'] as const;

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { prefs, update } = usePreferences();
  const [step, setStep] = useState(0);

  if (!prefs) return null;

  const next = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else navigate('/', { replace: true });
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-indigo-50 dark:from-ink-950 dark:via-ink-900 dark:to-ink-950 px-4 pt-safe pb-safe flex items-center">
      <div className="mx-auto w-full max-w-sm">
        <div className="flex gap-2 mb-5">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={`flex-1 h-1 rounded-full ${
                i <= step ? 'bg-brand-500' : 'bg-ink-200 dark:bg-ink-800'
              }`}
            />
          ))}
        </div>

        <h1 className="text-xl font-bold mb-1">
          {step === 0 && 'What roles are you targeting?'}
          {step === 1 && 'Where do you want to work?'}
          {step === 2 && 'Salary expectations?'}
          {step === 3 && 'Pick your portals'}
        </h1>
        <p className="text-sm text-ink-500 mb-5">Takes 60 seconds. You can change these anytime.</p>

        {step === 0 && (
          <div className="space-y-3">
            <Label>Job titles (comma separated)</Label>
            <Input
              placeholder="Full Stack Developer, React Developer"
              defaultValue={prefs.job_titles.join(', ')}
              onBlur={(e) =>
                update({
                  job_titles: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                })
              }
            />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <Label>Locations (comma separated)</Label>
            <Input
              placeholder="Bangalore, Remote"
              defaultValue={prefs.locations.join(', ')}
              onBlur={(e) =>
                update({
                  locations: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                })
              }
            />
            <Label>Work type</Label>
            <div className="flex gap-1.5">
              {(['any', 'remote', 'hybrid', 'onsite'] as WorkType[]).map((w) => (
                <button
                  key={w}
                  onClick={() => update({ work_type: w })}
                  className={`flex-1 h-10 rounded-full text-xs font-medium border capitalize ${
                    prefs.work_type === w
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'border-ink-200 dark:border-ink-700'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Min (₹/yr)</Label>
              <Input
                type="number"
                defaultValue={prefs.min_salary}
                onBlur={(e) => update({ min_salary: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Max (₹/yr)</Label>
              <Input
                type="number"
                defaultValue={prefs.max_salary}
                onBlur={(e) => update({ max_salary: Number(e.target.value) })}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {PORTALS.map((p) => {
              const active = prefs.active_portals.includes(p.slug);
              return (
                <button
                  key={p.slug}
                  onClick={() =>
                    update({
                      active_portals: active
                        ? prefs.active_portals.filter((x) => x !== p.slug)
                        : ([...prefs.active_portals, p.slug] as PortalSlug[]),
                    })
                  }
                  className={`w-full card p-3 flex items-center gap-3 border-2 transition ${
                    active ? 'border-brand-500' : 'border-transparent'
                  }`}
                >
                  <span
                    className="w-9 h-9 rounded-lg grid place-items-center text-[10px] font-bold text-white"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.initials}
                  </span>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-[10px] text-ink-400">
                      tier {p.tier} · {p.default_limit}/day
                    </p>
                  </div>
                  {active && <CheckCircle2 className="w-5 h-5 text-brand-500" />}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex gap-2 mt-6">
          {step > 0 && (
            <Button variant="ghost" onClick={back} full>
              Back
            </Button>
          )}
          <Button onClick={next} full>
            {step === STEPS.length - 1 ? 'Finish' : 'Next'} <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
