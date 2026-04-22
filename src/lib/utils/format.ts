export function formatSalary(min?: number | null, max?: number | null) {
  if (min == null && max == null) return 'Not disclosed';
  const toLPA = (n: number) => `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)} LPA`;
  if (min && max) return `${toLPA(min)} — ${toLPA(max)}`;
  if (min) return `From ${toLPA(min)}`;
  if (max) return `Up to ${toLPA(max)}`;
  return 'Not disclosed';
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return d.toLocaleDateString();
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function pct(n: number) {
  return `${Math.round(Math.max(0, Math.min(100, n)))}%`;
}
