import { Loader2, Pause, Play, Square } from 'lucide-react';
import { useApply } from '@/stores/apply-store';
import { Button } from '@/components/ui/button';

export function ApplyProgress() {
  const { running, paused, queueSize, processed, pause, resume, stop, start } = useApply();

  if (!running && queueSize === 0 && processed === 0) return null;

  const total = queueSize + processed || 1;
  const pct = Math.round((processed / total) * 100);

  return (
    <div className="card p-4 bg-gradient-to-br from-brand-50 to-indigo-50 dark:from-brand-900/30 dark:to-indigo-900/30 border-brand-100 dark:border-brand-900">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {running && !paused ? (
            <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
          ) : (
            <Play className="w-4 h-4 text-brand-600" />
          )}
          <span className="text-sm font-semibold">
            {running ? (paused ? 'Paused' : 'Auto-applying…') : 'Ready'}
          </span>
        </div>
        <span className="text-xs text-ink-500">
          {processed}/{processed + queueSize}
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/60 dark:bg-white/10 overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex gap-2">
        {running ? (
          paused ? (
            <Button onClick={resume} variant="primary" full>
              <Play className="w-4 h-4" /> Resume
            </Button>
          ) : (
            <Button onClick={pause} variant="outline" full>
              <Pause className="w-4 h-4" /> Pause
            </Button>
          )
        ) : (
          <Button onClick={start} variant="primary" full>
            <Play className="w-4 h-4" /> Start
          </Button>
        )}
        <Button onClick={stop} variant="ghost" aria-label="Stop">
          <Square className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
