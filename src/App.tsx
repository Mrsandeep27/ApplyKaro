import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import { useAuth } from '@/stores/auth-store';
import { usePreferences } from '@/stores/preference-store';
import { seedIfEmpty } from '@/lib/db/seed';
import { syncLocalToServer } from '@/lib/sync';

import LoginPage from '@/pages/login';
import DashboardPage from '@/pages/dashboard';
import JobsPage from '@/pages/jobs';
import QueuePage from '@/pages/queue';
import TrackerPage from '@/pages/tracker';
import AnalyticsPage from '@/pages/analytics';
import ResumePage from '@/pages/resume';
import SettingsPage from '@/pages/settings';
import JobDetailPage from '@/pages/job-detail';
import ApplicationDetailPage from '@/pages/application-detail';
import OnboardingPage from '@/pages/onboarding';

export default function App() {
  const { user, ready, hydrate } = useAuth();
  const loadPrefs = usePreferences((s) => s.load);

  useEffect(() => {
    hydrate();
    seedIfEmpty();
    loadPrefs().then(() => {
      // Push local resume + prefs to server so the scrape/apply worker can use them
      syncLocalToServer();
    });
  }, [hydrate, loadPrefs]);

  if (!ready) return <BootSplash />;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/onboarding" element={user ? <OnboardingPage /> : <Navigate to="/login" replace />} />
      <Route
        element={user ? <AppShell /> : <Navigate to="/login" replace />}
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/jobs/:id" element={<JobDetailPage />} />
        <Route path="/queue" element={<QueuePage />} />
        <Route path="/tracker" element={<TrackerPage />} />
        <Route path="/tracker/:id" element={<ApplicationDetailPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/resume" element={<ResumePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function BootSplash() {
  return (
    <div className="min-h-screen grid place-items-center bg-ink-50 dark:bg-ink-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-500 shadow-[var(--shadow-glow)] grid place-items-center text-white font-bold">
          A
        </div>
        <p className="text-sm text-ink-500">Loading ApplyKaro…</p>
      </div>
    </div>
  );
}
