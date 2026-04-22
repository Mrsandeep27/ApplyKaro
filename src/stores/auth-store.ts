import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getSupabase, supabaseConfigured } from '@/lib/supabase';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  created_at: string;
}

interface AuthState {
  user: AuthUser | null;
  ready: boolean;
  hydrate: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      ready: false,
      hydrate: async () => {
        const s = getSupabase();
        if (s) {
          const { data } = await s.auth.getSession();
          const u = data.session?.user;
          set({
            user: u
              ? {
                  id: u.id,
                  email: u.email ?? '',
                  name: (u.user_metadata?.name as string | undefined) ?? '',
                  created_at: u.created_at ?? new Date().toISOString(),
                }
              : null,
            ready: true,
          });
          s.auth.onAuthStateChange((_event, session) => {
            const u = session?.user;
            set({
              user: u
                ? {
                    id: u.id,
                    email: u.email ?? '',
                    name: (u.user_metadata?.name as string | undefined) ?? '',
                    created_at: u.created_at ?? new Date().toISOString(),
                  }
                : null,
            });
          });
        } else {
          set({ ready: true });
        }
      },
      signIn: async (email, password) => {
        const s = getSupabase();
        if (s) {
          const { error, data } = await s.auth.signInWithPassword({ email, password });
          if (error) return { error: error.message };
          const u = data.user;
          set({
            user: {
              id: u!.id,
              email: u!.email ?? '',
              name: (u!.user_metadata?.name as string | undefined) ?? '',
              created_at: u!.created_at ?? new Date().toISOString(),
            },
          });
          return {};
        }
        // Fallback: local-only demo auth
        set({
          user: {
            id: 'local-user',
            email,
            name: email.split('@')[0],
            created_at: new Date().toISOString(),
          },
        });
        return {};
      },
      signUp: async (email, password, name) => {
        const s = getSupabase();
        if (s) {
          const { error } = await s.auth.signUp({
            email,
            password,
            options: { data: { name } },
          });
          if (error) return { error: error.message };
          return {};
        }
        set({
          user: {
            id: 'local-user',
            email,
            name: name ?? email.split('@')[0],
            created_at: new Date().toISOString(),
          },
        });
        return {};
      },
      signOut: async () => {
        const s = getSupabase();
        if (s) await s.auth.signOut();
        set({ user: null });
      },
    }),
    {
      name: 'applykaro-auth',
      partialize: (state) => (supabaseConfigured ? {} : { user: state.user }),
    },
  ),
);
