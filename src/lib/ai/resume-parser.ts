import { geminiJSON, geminiConfigured } from './gemini';
import type { ParsedResume } from '@/lib/types';

const PROMPT = (text: string) => `
You are a resume parser. Extract structured data from the resume text below.
Return STRICT JSON matching this schema. Do not include markdown.

{
  "name": string,
  "email": string | null,
  "phone": string | null,
  "location": string | null,
  "experience_years": number,
  "skills": string[],
  "experience": [{ "role": string, "company": string, "duration": string, "highlights": string[] }],
  "education": [{ "degree": string, "college": string, "year": string }],
  "projects": string[],
  "summary": string
}

Rules:
- "skills" must be a deduped array of tech/tools/frameworks/languages (max 30).
- "experience_years" is a rounded number based on work history.
- Do not invent data. Use empty string / empty array if unknown.

Resume text:
"""
${text.slice(0, 24_000)}
"""
`;

export async function parseResumeWithAI(text: string): Promise<ParsedResume> {
  if (!geminiConfigured) return heuristicParse(text);
  try {
    const parsed = await geminiJSON<ParsedResume>(PROMPT(text));
    if (parsed) return normalizeParsed(parsed);
  } catch (err) {
    console.error('Gemini parse failed; falling back', err);
  }
  return heuristicParse(text);
}

function normalizeParsed(p: Partial<ParsedResume>): ParsedResume {
  return {
    name: p.name ?? '',
    email: p.email ?? undefined,
    phone: p.phone ?? undefined,
    location: p.location ?? undefined,
    experience_years: Number(p.experience_years ?? 0),
    skills: Array.isArray(p.skills) ? p.skills.filter(Boolean).slice(0, 30) : [],
    experience: Array.isArray(p.experience) ? p.experience : [],
    education: Array.isArray(p.education) ? p.education : [],
    projects: Array.isArray(p.projects) ? p.projects : [],
    summary: p.summary ?? '',
  };
}

const SKILL_DICT = [
  'React','Next.js','TypeScript','JavaScript','Node.js','Express','NestJS','Python','Django','Flask','FastAPI',
  'Java','Spring','Kotlin','Swift','Go','Rust','C#','.NET','PHP','Laravel','Ruby','Rails','HTML','CSS','Tailwind',
  'SASS','Redux','Zustand','MobX','GraphQL','REST','PostgreSQL','MySQL','MongoDB','Redis','SQLite','Prisma','Supabase',
  'Firebase','AWS','GCP','Azure','Docker','Kubernetes','CI/CD','GitHub Actions','Jenkins','Nginx','Linux','Bash',
  'Figma','Photoshop','Illustrator','Git','Jira','Jest','Vitest','Cypress','Playwright','Puppeteer','Android','iOS',
  'Flutter','React Native','SwiftUI','Jetpack Compose','Machine Learning','TensorFlow','PyTorch','Pandas','NumPy','SQL',
];

function heuristicParse(text: string): ParsedResume {
  const email = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0];
  const phone = text.match(/\+?\d[\d\s\-()]{8,}\d/)?.[0];
  const skills = SKILL_DICT.filter((s) => new RegExp(`\\b${s.replace('.', '\\.').replace('/', '\\/')}\\b`, 'i').test(text));
  const firstLine = text.split('\n').map((l) => l.trim()).find(Boolean) ?? '';
  return {
    name: firstLine.length < 60 ? firstLine : '',
    email,
    phone,
    location: undefined,
    experience_years: 0,
    skills: Array.from(new Set(skills)).slice(0, 30),
    experience: [],
    education: [],
    projects: [],
    summary: text.slice(0, 500).trim(),
  };
}
