export function StatsRow({ stats }: { stats: { label: string; value: string | number; hint?: string }[] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="card p-3 text-center">
          <p className="text-[11px] uppercase tracking-wider text-ink-400">{s.label}</p>
          <p className="text-xl font-bold mt-1">{s.value}</p>
          {s.hint && <p className="text-[10px] text-ink-500 mt-0.5">{s.hint}</p>}
        </div>
      ))}
    </div>
  );
}
