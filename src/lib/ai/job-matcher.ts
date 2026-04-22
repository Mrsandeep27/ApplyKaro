import { geminiJSON, geminiConfigured } from './gemini';
import type { Job, MatchResult, ParsedResume } from '@/lib/types';

const PROMPT = (resume: ParsedResume, job: Job) => `
You are a job/resume matcher. Score how well this resume matches the job description.
Return STRICT JSON (no markdown):

{
  "score": number,           // 0 to 100 (integer)
  "matching_skills": string[],
  "missing_skills": string[],
  "bonus_skills": string[],
  "reasoning": string        // max 240 chars
}

Resume:
  name: ${resume.name}
  location: ${resume.location ?? ''}
  experience_years: ${resume.experience_years ?? 0}
  skills: ${resume.skills.join(', ')}
  summary: ${(resume.summary ?? '').slice(0, 600)}

Job:
  title: ${job.title}
  company: ${job.company}
  location: ${job.location}
  type: ${job.job_type}
  required skills: ${(job.skills || []).join(', ')}
  description: ${job.description.slice(0, 2000)}
`;

export async function matchJob(resume: ParsedResume, job: Job): Promise<MatchResult> {
  if (!geminiConfigured) return heuristicMatch(resume, job);
  try {
    const r = await geminiJSON<MatchResult>(PROMPT(resume, job));
    if (r) return clampResult(r);
  } catch (err) {
    console.error('Gemini match failed; falling back', err);
  }
  return heuristicMatch(resume, job);
}

function clampResult(r: MatchResult): MatchResult {
  return {
    score: Math.max(0, Math.min(100, Math.round(Number(r.score) || 0))),
    matching_skills: (r.matching_skills ?? []).slice(0, 20),
    missing_skills: (r.missing_skills ?? []).slice(0, 20),
    bonus_skills: (r.bonus_skills ?? []).slice(0, 10),
    reasoning: (r.reasoning ?? '').slice(0, 280),
  };
}

function heuristicMatch(resume: ParsedResume, job: Job): MatchResult {
  const resumeSkills = new Set(resume.skills.map((s) => s.toLowerCase()));
  const jobSkills = (job.skills || []).map((s) => s.toLowerCase());
  const jobSkillsFromDesc = extractSkillsFromText(job.description);
  const allJobSkills = Array.from(new Set([...jobSkills, ...jobSkillsFromDesc]));

  const matching = allJobSkills.filter((s) => resumeSkills.has(s));
  const missing = allJobSkills.filter((s) => !resumeSkills.has(s));
  const bonus = Array.from(resumeSkills).filter((s) => !allJobSkills.includes(s));

  const base = allJobSkills.length ? (matching.length / allJobSkills.length) * 100 : 50;
  return {
    score: Math.round(base),
    matching_skills: capitalize(matching),
    missing_skills: capitalize(missing),
    bonus_skills: capitalize(bonus).slice(0, 6),
    reasoning:
      matching.length >= 3
        ? `Strong match on ${matching.slice(0, 3).join(', ')}.`
        : 'Limited overlap with required skills. Consider saving for later.',
  };
}

const KEYWORDS = [
  'react','next.js','typescript','javascript','node.js','express','python','django','flask','java','spring',
  'go','rust','docker','kubernetes','aws','gcp','azure','graphql','rest','postgresql','mysql','mongodb','redis',
  'tailwind','css','html','git','linux','redux','vite','prisma','supabase','firebase','puppeteer','playwright','ci/cd',
];

function extractSkillsFromText(text: string): string[] {
  const found: string[] = [];
  const t = text.toLowerCase();
  for (const k of KEYWORDS) if (t.includes(k)) found.push(k);
  return found;
}

function capitalize(arr: string[]): string[] {
  return arr.map((s) =>
    s.replace(/\b[a-z]/g, (c) => c.toUpperCase()).replace(/\.Js$/, '.js').replace(/\.Net$/, '.NET'),
  );
}
