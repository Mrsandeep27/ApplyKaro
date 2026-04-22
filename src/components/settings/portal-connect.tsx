import { useEffect, useState } from 'react';
import { CheckCircle2, Link2, Loader2, Unplug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PORTALS } from '@/constants/portals';
import { api } from '@/lib/api';

interface PortalStatus {
  slug: string;
  connected: boolean;
  applied_today: number;
}

export function PortalConnectList() {
  const [list, setList] = useState<PortalStatus[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [serverReachable, setServerReachable] = useState<boolean | null>(null);

  async function refresh() {
    setError(null);
    // Ping health first — distinguishes "server not running" from "server errored"
    try {
      const r = await fetch('/api/health');
      setServerReachable(r.ok);
      if (!r.ok) return;
    } catch {
      setServerReachable(false);
      return;
    }
    try {
      const data = await api.getPortals();
      setList(
        data.portals.map((p) => ({
          slug: p.slug,
          connected: p.connected,
          applied_today: data.counters[p.slug]?.applied ?? 0,
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function connect(slug: string) {
    setBusy(slug);
    setError(null);
    try {
      const r = await api.connectPortal(slug);
      if (!r.loggedIn) setError(r.message ?? 'Login not detected');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connect failed');
    } finally {
      setBusy(null);
    }
  }

  async function disconnect(slug: string) {
    setBusy(slug);
    try {
      await api.disconnectPortal(slug);
      await refresh();
    } finally {
      setBusy(null);
    }
  }

  if (serverReachable === false) {
    return (
      <div className="card p-4">
        <p className="text-xs text-ink-500">
          Backend isn't running. Start both: <code className="text-[11px]">npm run dev</code>
          (starts client + server together). Server should log{' '}
          <code className="text-[11px]">listening on http://localhost:3001</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-4 space-y-2">
      {PORTALS.filter((p) => ['naukri', 'linkedin', 'indeed', 'internshala'].includes(p.slug)).map((p) => {
        const status = list.find((x) => x.slug === p.slug);
        const connected = status?.connected;
        const count = status?.applied_today ?? 0;
        const limit = p.default_limit;
        const usagePct = Math.min(100, Math.round((count / limit) * 100));
        const supported = p.slug === 'naukri';
        return (
          <div key={p.slug} className="flex items-center gap-3">
            <span
              className="w-8 h-8 rounded-lg grid place-items-center text-[10px] font-bold text-white shrink-0"
              style={{ backgroundColor: p.color }}
            >
              {p.initials}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{p.name}</p>
                {!supported && <span className="chip-ink">soon</span>}
                {connected && <span className="chip-green"><CheckCircle2 className="w-3 h-3" /> linked</span>}
              </div>
              <div className="h-1 mt-1 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-emerald-500"
                  style={{ width: `${usagePct}%` }}
                />
              </div>
              <p className="text-[10px] text-ink-400 mt-0.5">
                {count}/{limit} today
              </p>
            </div>
            {supported ? (
              connected ? (
                <Button variant="outline" onClick={() => disconnect(p.slug)} disabled={busy === p.slug}>
                  {busy === p.slug ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unplug className="w-4 h-4" />}
                </Button>
              ) : (
                <Button onClick={() => connect(p.slug)} disabled={busy === p.slug}>
                  {busy === p.slug ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                  {busy === p.slug ? 'Opening…' : 'Connect'}
                </Button>
              )
            ) : (
              <Button variant="ghost" disabled>
                soon
              </Button>
            )}
          </div>
        );
      })}
      {error && <p className="text-[11px] text-rose-600 mt-1">{error}</p>}
      <p className="text-[10px] text-ink-400 pt-1">
        Clicking Connect opens a real Chrome window. Log in there — we save the session, no password stored.
      </p>
    </div>
  );
}
