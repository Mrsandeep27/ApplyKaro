import { create } from 'zustand';
import { db } from '@/lib/db/dexie';
import { ensureDefaultPreferences } from '@/lib/db/seed';
import { api } from '@/lib/api';
import type { Preferences } from '@/lib/types';

interface PreferenceState {
  prefs: Preferences | null;
  loading: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<Preferences>) => Promise<void>;
}

async function syncToServer(prefs: Preferences) {
  try {
    await api.putPreferences(prefs);
  } catch {
    // server offline — UI still works locally
  }
}

export const usePreferences = create<PreferenceState>((set, get) => ({
  prefs: null,
  loading: false,
  load: async () => {
    set({ loading: true });
    const prefs = await ensureDefaultPreferences();
    set({ prefs, loading: false });
    syncToServer(prefs);
  },
  update: async (patch) => {
    const current = get().prefs ?? (await ensureDefaultPreferences());
    const next = { ...current, ...patch };
    await db.preferences.put({ ...next, id: 'me' });
    set({ prefs: next });
    syncToServer(next);
  },
}));
