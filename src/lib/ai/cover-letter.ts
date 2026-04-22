import { getGemini, geminiConfigured } from './gemini';
import type { Job, ParsedResume } from '@/lib/types';

export type CoverLetterTone = 'professional' | 'friendly' | 'startup';

const PROMPT = (resume: ParsedResume, job: Job, tone: CoverLetterTone) => `
Write a ${tone} cover letter (200-280 words) from the candidate below for this role.
- First paragraph: hook + fit for the role.
- Second paragraph: 2-3 concrete achievements mapped to the job requirements.
- Third paragraph: enthusiasm + call to action.
- Plain text only. No subject line, no markdown, no placeholders.

Candidate:
  name: ${resume.name}
  location: ${resume.location ?? ''}
  experience_years: ${resume.experience_years ?? 0}
  top skills: ${resume.skills.slice(0, 12).join(', ')}
  summary: ${(resume.summary ?? '').slice(0, 400)}

Role:
  title: ${job.title}
  company: ${job.company}
  description: ${job.description.slice(0, 1400)}
`;

export async function generateCoverLetter(
  resume: ParsedResume,
  job: Job,
  tone: CoverLetterTone = 'professional',
): Promise<string> {
  if (!geminiConfigured) return stubLetter(resume, job);
  try {
    const g = getGemini()!.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const res = await g.generateContent(PROMPT(resume, job, tone));
    return res.response.text().trim();
  } catch (err) {
    console.error('Cover letter generation failed; using stub', err);
    return stubLetter(resume, job);
  }
}

function stubLetter(resume: ParsedResume, job: Job): string {
  const top = resume.skills.slice(0, 4).join(', ') || 'modern web technologies';
  return [
    `Dear ${job.company} Hiring Team,`,
    '',
    `I'm excited to apply for the ${job.title} role at ${job.company}. With ${
      resume.experience_years ?? 0
    }+ years of experience and hands-on work with ${top}, I'm confident I can contribute from day one.`,
    '',
    `In my previous role I shipped production systems end-to-end, partnered closely with design and product, and treated reliability and performance as first-class concerns. The problem space described in the JD lines up with work I've already enjoyed doing.`,
    '',
    `I'd love a chance to discuss how I can help ${job.company} move faster. Thank you for your consideration.`,
    '',
    `Warm regards,`,
    resume.name || 'Candidate',
  ].join('\n');
}
