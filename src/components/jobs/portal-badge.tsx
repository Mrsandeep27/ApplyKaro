import { PORTAL_MAP } from '@/constants/portals';
import type { PortalSlug } from '@/lib/types';

export function PortalBadge({ portal, size = 'md' }: { portal: PortalSlug; size?: 'sm' | 'md' }) {
  const meta = PORTAL_MAP[portal];
  const dim = size === 'sm' ? 'w-6 h-6 text-[9px]' : 'w-8 h-8 text-[10px]';
  return (
    <div className="flex items-center gap-2">
      <span
        className={`${dim} rounded-lg grid place-items-center font-bold text-white`}
        style={{ backgroundColor: meta.color }}
        aria-label={meta.name}
      >
        {meta.initials}
      </span>
      {size === 'md' && <span className="text-xs text-ink-500">{meta.name}</span>}
    </div>
  );
}
