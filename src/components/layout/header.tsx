import { Bell, Settings2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/stores/auth-store';
import { initials } from '@/lib/utils/format';

export function Header() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const title = titleFor(pathname);

  return (
    <header className="sticky top-0 z-20 bg-ink-50/80 dark:bg-ink-950/80 backdrop-blur border-b border-ink-100 dark:border-ink-800 pt-safe">
      <div className="mx-auto w-full max-w-2xl px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-500 grid place-items-center text-white font-bold shadow-[var(--shadow-glow)]">
            A
          </Link>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-ink-400">ApplyKaro</p>
            <h1 className="text-sm font-semibold leading-tight">{title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-full grid place-items-center hover:bg-ink-100 dark:hover:bg-ink-800 relative" aria-label="Notifications">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500" />
          </button>
          <Link to="/settings" className="w-10 h-10 rounded-full grid place-items-center hover:bg-ink-100 dark:hover:bg-ink-800" aria-label="Settings">
            <Settings2 className="w-5 h-5" />
          </Link>
          <div className="w-9 h-9 rounded-full bg-ink-200 dark:bg-ink-800 grid place-items-center text-xs font-semibold">
            {initials(user?.name || user?.email || '?')}
          </div>
        </div>
      </div>
    </header>
  );
}

function titleFor(path: string): string {
  if (path === '/') return 'Dashboard';
  if (path.startsWith('/jobs')) return 'Jobs';
  if (path.startsWith('/queue')) return 'Apply Queue';
  if (path.startsWith('/tracker')) return 'Applications';
  if (path.startsWith('/analytics')) return 'Analytics';
  if (path.startsWith('/resume')) return 'Resume';
  if (path.startsWith('/settings')) return 'Settings';
  return 'ApplyKaro';
}
