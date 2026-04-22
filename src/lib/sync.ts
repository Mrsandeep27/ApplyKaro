import { db } from '@/lib/db/dexie';
import { api } from '@/lib/api';

/**
 * Push the user's default resume + preferences to the backend so the
 * scrape/apply worker can use them. Safe to call on every app boot —
 * server-side state is a plain JSON overwrite.
 */
export async function syncLocalToServer(): Promise<void> {
  // Check server reachability first — if it's down, don't spam errors
  try {
    const r = await fetch('/api/health');
    if (!r.ok) return;
  } catch {
    return;
  }

  try {
    const resume = await db.resumes.filter((r) => r.is_default === true).first();
    if (resume) {
      await api.putResume(resume.parsed_data);
    }
  } catch (err) {
    console.warn('[sync] resume push failed:', err);
  }

  try {
    const prefs = await db.preferences.get('me');
    if (prefs) {
      // Drop the local-only "id" field
      const { id: _id, ...clean } = prefs;
      await api.putPreferences(clean);
    }
  } catch (err) {
    console.warn('[sync] preferences push failed:', err);
  }
}
