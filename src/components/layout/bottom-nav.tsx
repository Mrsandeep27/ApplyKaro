import { NavLink } from 'react-router-dom';
import { BarChart3, Briefcase, Home, ListChecks, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const items = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/queue', label: 'Queue', icon: Rocket, accent: true },
  { to: '/tracker', label: 'Tracker', icon: ListChecks },
  { to: '/analytics', label: 'Stats', icon: BarChart3 },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 bg-white/90 dark:bg-ink-900/90 backdrop-blur border-t border-ink-100 dark:border-ink-800 pb-safe">
      <ul className="mx-auto w-full max-w-2xl grid grid-cols-5 h-16">
        {items.map(({ to, label, icon: Icon, accent }) => (
          <li key={to} className="grid place-items-center">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-0.5 text-[10.5px] font-medium w-full h-full transition',
                  isActive ? 'text-brand-600 dark:text-brand-300' : 'text-ink-500 dark:text-ink-400',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={cn(
                      'w-10 h-10 rounded-2xl grid place-items-center transition',
                      accent
                        ? 'bg-gradient-to-br from-brand-500 to-indigo-500 text-white shadow-[var(--shadow-glow)] -mt-5'
                        : isActive
                          ? 'bg-brand-50 dark:bg-brand-900/30'
                          : '',
                    )}
                  >
                    <Icon className={cn('w-5 h-5', accent && 'w-6 h-6')} strokeWidth={accent ? 2.2 : 1.8} />
                  </div>
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
