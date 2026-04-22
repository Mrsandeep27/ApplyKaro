import { geminiJSON } from './ai.js';

export interface MatchInput {
  resume_skills: string[];
  resume_summary: string;
  experience_years: number;
  job_title: string;
  job_company: string;
  job_description: string;
  job_skills: string[];
}

export interface MatchOutput {
  score: number;
  matching_skills: string[];
  missing_skills: string[];
  bonus_skills: string[];
  reasoning: string;
}

const PROMPT = (i: MatchInput) => `
Score how well this resume matches the job. Return STRICT JSON (no markdown):
{
  "score": number (0-100 integer),
  "matching_skills": string[],
  "missing_skills": string[],
  "bonus_skills": string[],
  "reasoning": string (<= 240 chars)
}

RESUME:
  skills: ${i.resume_skills.join(', ')}
  experience_years: ${i.experience_years}
  summary: ${i.resume_summary.slice(0, 600)}

JOB:
  title: ${i.job_title}
  company: ${i.job_company}
  required skills: ${i.job_skills.join(', ')}
  description: ${i.job_description.slice(0, 2000)}
`;

export async function matchJob(input: MatchInput): Promise<MatchOutput> {
  const r = await geminiJSON<MatchOutput>(PROMPT(input));
  if (r) return clamp(r);
  return heuristic(input);
}

function clamp(r: MatchOutput): MatchOutput {
  return {
    score: Math.max(0, Math.min(100, Math.round(Number(r.score) || 0))),
    matching_skills: (r.matching_skills ?? []).slice(0, 20),
    missing_skills: (r.missing_skills ?? []).slice(0, 20),
    bonus_skills: (r.bonus_skills ?? []).slice(0, 10),
    reasoning: (r.reasoning ?? '').slice(0, 280),
  };
}

function heuristic(i: MatchInput): MatchOutput {
  const resume = new Set(i.resume_skills.map((s) => s.toLowerCase()));
  const required = i.job_skills.map((s) => s.toLowerCase());
  const matching = required.filter((s) => resume.has(s));
  const missing = required.filter((s) => !resume.has(s));
  const bonus = [...resume].filter((s) => !required.includes(s)).slice(0, 6);
  const score = required.length ? Math.round((matching.length / required.length) * 100) : 60;
  return {
    score,
    matching_skills: matching,
    missing_skills: missing,
    bonus_skills: bonus,
    reasoning: matching.length >= 3 ? `Strong overlap: ${matching.slice(0, 3).join(', ')}` : 'Limited overlap with required skills',
  };
}
