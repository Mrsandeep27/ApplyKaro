import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export function ApplyChart({ data }: { data: { date: string; applies: number; responses: number }[] }) {
  return (
    <div className="card p-4">
      <p className="text-xs uppercase tracking-wider text-ink-400 mb-3">Last 14 days</p>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: -24 }}>
            <defs>
              <linearGradient id="applies" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="responses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} width={36} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
            />
            <Area type="monotone" dataKey="applies" stroke="#0ea5e9" strokeWidth={2} fill="url(#applies)" />
            <Area type="monotone" dataKey="responses" stroke="#10b981" strokeWidth={2} fill="url(#responses)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
