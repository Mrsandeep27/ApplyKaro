import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { StatsRow } from '@/components/apply/stats-row';
import { ApplyChart } from '@/components/analytics/apply-chart';
import { PORTAL_MAP } from '@/constants/portals';

export default function AnalyticsPage() {
  const apps = useLiveQuery(() => db.applications.toArray(), []) ?? [];
  const matches = useLiveQuery(() => db.matches.toArray(), []) ?? [];

  const stats = useMemo(() => {
    const total = apps.length;
    const responses = apps.filter((a) => ['viewed', 'interview', 'offer'].includes(a.status)).length;
    const responseRate = total ? Math.round((responses / total) * 100) : 0;
    const interviews = apps.filter((a) => a.status === 'interview').length;
    return [
      { label: 'Applied', value: total },
      { label: 'Response %', value: `${responseRate}%` },
      { label: 'Interviews', value: interviews },
    ];
  }, [apps]);

  const chartData = useMemo(() => {
    const days: { date: string; applies: number; responses: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = `${d.getDate()}/${d.getMonth() + 1}`;
      const applies = apps.filter(
        (a) => a.applied_at && sameDay(new Date(a.applied_at), d),
      ).length;
      const responses = apps.filter(
        (a) => a.response_at && sameDay(new Date(a.response_at), d),
      ).length;
      days.push({ date: label, applies, responses });
    }
    // If no data, show a gentle uptrend to communicate the chart exists
    if (apps.length === 0) {
      return days.map((d, i) => ({ ...d, applies: Math.max(0, Math.round((i / 13) * 3)) }));
    }
    return days;
  }, [apps]);

  const portalBreakdown = useMemo(() => {
    const map: Record<string, { total: number; resp: number }> = {};
    for (const a of apps) {
      if (!map[a.portal]) map[a.portal] = { total: 0, resp: 0 };
      map[a.portal].total++;
      if (['viewed', 'interview', 'offer'].includes(a.status)) map[a.portal].resp++;
    }
    return Object.entries(map)
      .map(([slug, v]) => ({
        name: PORTAL_MAP[slug as keyof typeof PORTAL_MAP]?.name ?? slug,
        total: v.total,
        rate: v.total ? Math.round((v.resp / v.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [apps]);

  const skillGap = useMemo(() => {
    const freq = new Map<string, number>();
    for (const m of matches) {
      for (const s of m.missing_skills) freq.set(s, (freq.get(s) ?? 0) + 1);
    }
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [matches]);

  return (
    <div className="space-y-4">
      <StatsRow stats={stats} />
      <ApplyChart data={chartData} />

      <section className="card p-4">
        <h3 className="text-sm font-semibold mb-3">Response rate by portal</h3>
        <div className="space-y-2">
          {portalBreakdown.length === 0 && (
            <p className="text-xs text-ink-400">No applications yet.</p>
          )}
          {portalBreakdown.map((p) => (
            <div key={p.name}>
              <div className="flex justify-between text-xs mb-1">
                <span>{p.name}</span>
                <span className="text-ink-500">
                  {p.rate}% · {p.total} applied
                </span>
              </div>
              <div className="h-2 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-emerald-500"
                  style={{ width: `${p.rate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-4">
        <h3 className="text-sm font-semibold mb-3">Skill gap report</h3>
        {skillGap.length === 0 ? (
          <p className="text-xs text-ink-400">No gaps detected yet. Keep approving jobs.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {skillGap.map(([name, count]) => (
              <span key={name} className="chip-red">
                {name} · {count}
              </span>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
