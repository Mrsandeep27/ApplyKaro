import { cn } from '@/lib/utils/cn';

export function MatchBadge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const tone =
    score >= 85
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
      : score >= 70
        ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
        : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
  const dot =
    score >= 85 ? 'bg-emerald-500' : score >= 70 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold',
        tone,
        size === 'sm' && 'px-2 py-0.5 text-[10px]',
        size === 'md' && 'px-2.5 py-1 text-xs',
        size === 'lg' && 'px-3 py-1.5 text-sm',
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', dot)} />
      {Math.round(score)}% match
    </span>
  );
}
