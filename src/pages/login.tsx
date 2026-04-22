import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/stores/auth-store';
import { supabaseConfigured } from '@/lib/supabase';
import { isEmail, isStrongPassword } from '@/lib/utils/validators';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isEmail(email)) return setError('Enter a valid email');
    if (!isStrongPassword(password)) return setError('Password must be at least 8 characters');
    setBusy(true);
    try {
      const res = mode === 'login' ? await signIn(email, password) : await signUp(email, password, name);
      if (res.error) setError(res.error);
      else navigate(mode === 'signup' ? '/onboarding' : '/', { replace: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-indigo-50 dark:from-ink-950 dark:via-ink-900 dark:to-ink-950 grid place-items-center px-4 pt-safe pb-safe">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-500 grid place-items-center text-white text-xl font-bold shadow-[var(--shadow-glow)] mb-3">
            A
          </div>
          <h1 className="text-2xl font-bold">ApplyKaro</h1>
          <p className="text-sm text-ink-500 mt-1">Job dhundna band, apply karna shuru.</p>
        </div>

        <form onSubmit={submit} className="card p-5 space-y-4">
          <div className="flex gap-1 rounded-full bg-ink-100 dark:bg-ink-800 p-1">
            {(['login', 'signup'] as const).map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 h-9 rounded-full text-sm font-medium transition ${
                  mode === m ? 'bg-white dark:bg-ink-900 shadow' : 'text-ink-500'
                }`}
              >
                {m === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          {mode === 'signup' && (
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                placeholder="Sandeep Pandey"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-900 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <Button type="submit" full disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </Button>
        </form>

        <p className="text-center text-[11px] text-ink-400 mt-5">
          {supabaseConfigured
            ? 'Secured by Supabase Auth'
            : 'Running in demo mode — add Supabase keys in .env to enable real auth'}
        </p>
      </div>
    </div>
  );
}
