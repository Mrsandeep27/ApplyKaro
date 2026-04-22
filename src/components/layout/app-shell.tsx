import { Outlet } from 'react-router-dom';
import { Header } from './header';
import { BottomNav } from './bottom-nav';

export function AppShell() {
  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950 flex flex-col">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-2xl px-4 pb-24 pt-2">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
