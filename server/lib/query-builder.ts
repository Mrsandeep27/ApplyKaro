import { geminiJSON } from './ai.js';
import type { ServerState } from './store.js';

interface QueryPlan {
  queries: { keywords: string; location: string }[];
  reasoning: string;
}

const PROMPT = (resume: NonNullable<ServerState['resume']>, prefs: NonNullable<ServerState['preferences']>) => `
You are a job-search strategist. Given the candidate's resume and preferences,
produce a list of 3-5 distinct search-query variations to run on Indian job portals
(Naukri, LinkedIn, Indeed). Each query targets the candidate's real strengths.

Return STRICT JSON, no markdown:
{
  "queries": [
    { "keywords": string, "location": string },
    ...
  ],
  "reasoning": string
}

Rules:
- "keywords" should be 1-4 words a human would type (e.g. "React Developer", "Full Stack Engineer").
- "location" must be one of the candidate's locations, or "Remote" if work_type allows.
- Prefer roles the resume proves (by skills + experience years). Do not invent titles they aren't ready for.
- Avoid near-duplicates.

CANDIDATE:
  skills: ${resume.skills.slice(0, 20).join(', ')}
  experience_years: ${resume.experience_years ?? 0}
  summary: ${(resume.summary ?? '').slice(0, 500)}

PREFERENCES:
  job_titles: ${prefs.job_titles.join(', ')}
  locations: ${prefs.locations.join(', ')}
  work_type: ${prefs.work_type}
  salary: ${prefs.min_salary}-${prefs.max_salary}
`;

export async function buildQueries(
  resume: NonNullable<ServerState['resume']>,
  prefs: NonNullable<ServerState['preferences']>,
): Promise<{ keywords: string; location: string }[]> {
  const plan = await geminiJSON<QueryPlan>(PROMPT(resume, prefs));
  if (plan?.queries?.length) return plan.queries.slice(0, 5);
  // Fallback: zip titles × locations (max 5)
  const fallback: { keywords: string; location: string }[] = [];
  for (const t of prefs.job_titles) {
    for (const l of prefs.locations) {
      fallback.push({ keywords: t, location: l });
      if (fallback.length >= 5) break;
    }
    if (fallback.length >= 5) break;
  }
  return fallback;
}
