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
  const resume = new Set(i.resume_skills.map((s) => s.toLowerCase().trim()));
  const required = i.job_skills.map((s) => s.toLowerCase().trim());

  // Also extract skills mentioned anywhere in the job description
  const desc = (i.job_description + ' ' + i.job_title).toLowerCase();
  const skillsFromDesc = Array.from(resume).filter((s) => {
    if (s.length < 2) return false;
    const re = new RegExp(`\\b${s.replace(/[.+*?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return re.test(desc);
  });

  // Combine explicit job_skills matches with skills found in description
  const allMatched = new Set([
    ...required.filter((s) => resume.has(s)),
    ...skillsFromDesc,
  ]);
  const matching = Array.from(allMatched);
  const missing = required.filter((s) => !resume.has(s));
  const bonus = Array.from(resume).filter((s) => !required.includes(s) && !skillsFromDesc.includes(s)).slice(0, 6);

  // Be generous when AI is unavailable — we'd rather show too many than too few.
  // Score = (skill matches × 8, capped at 60) + title relevance bonus
  let score = Math.min(60, matching.length * 12);
  // Title bonus: if any resume skill appears in the job title, +25
  const titleHit = Array.from(resume).some((s) => i.job_title.toLowerCase().includes(s));
  if (titleHit) score += 25;
  // Floor at 50 if we have any matches at all (so heuristic-only doesn't filter everything out)
  if (matching.length > 0 && score < 55) score = 55;
  // Default for total uncertainty
  if (matching.length === 0 && score < 40) score = 40;
  score = Math.min(95, score);

  return {
    score,
    matching_skills: matching,
    missing_skills: missing.slice(0, 8),
    bonus_skills: bonus,
    reasoning:
      matching.length >= 3
        ? `Strong overlap: ${matching.slice(0, 3).join(', ')} (heuristic — AI quota hit)`
        : matching.length > 0
          ? `Some overlap: ${matching.join(', ')} (heuristic — AI quota hit)`
          : 'No keyword overlap detected (heuristic — AI quota hit)',
  };
}
