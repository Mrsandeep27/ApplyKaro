import { db, uid } from './dexie';
import type { Job, Match, Application, Preferences, PortalSlug } from '@/lib/types';
import { DEFAULT_DAILY_LIMITS, PORTALS } from '@/constants/portals';
import { DEFAULT_MATCH_THRESHOLD } from '@/constants/limits';

const SAMPLE_JOBS: Omit<Job, 'id'>[] = [
  {
    portal: 'linkedin',
    title: 'Senior React Developer',
    company: 'Flipkart',
    location: 'Bangalore',
    salary_min: 1800000,
    salary_max: 2500000,
    description:
      'We are looking for a Senior React Developer with strong experience in React, TypeScript, Node.js, PostgreSQL and modern frontend performance. You will own the consumer web app end-to-end.',
    skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Redux'],
    job_url: 'https://linkedin.com/jobs/view/example-1',
    job_type: 'hybrid',
    experience_level: '4-6 years',
    posted_date: new Date(Date.now() - 86400000).toISOString(),
    scraped_at: new Date().toISOString(),
  },
  {
    portal: 'naukri',
    title: 'Full Stack Engineer',
    company: 'Razorpay',
    location: 'Bangalore',
    salary_min: 1500000,
    salary_max: 2200000,
    description:
      'Build full-stack features using React, Node.js and PostgreSQL. Focus on payments infrastructure with strong emphasis on reliability and observability.',
    skills: ['React', 'Node.js', 'PostgreSQL', 'Redis', 'Docker'],
    job_url: 'https://naukri.com/job-listings-example-2',
    job_type: 'onsite',
    experience_level: '2-5 years',
    posted_date: new Date(Date.now() - 2 * 86400000).toISOString(),
    scraped_at: new Date().toISOString(),
  },
  {
    portal: 'wellfound',
    title: 'Frontend Engineer (Remote)',
    company: 'Linear',
    location: 'Remote',
    salary_min: 2500000,
    salary_max: 4000000,
    description:
      'Work on a world-class issue tracker. React 19, TypeScript, GraphQL, attention to micro-interactions and accessibility.',
    skills: ['React', 'TypeScript', 'GraphQL', 'CSS'],
    job_url: 'https://wellfound.com/jobs/example-3',
    job_type: 'remote',
    experience_level: '3-5 years',
    posted_date: new Date(Date.now() - 3 * 86400000).toISOString(),
    scraped_at: new Date().toISOString(),
  },
  {
    portal: 'indeed',
    title: 'Node.js Backend Developer',
    company: 'Zomato',
    location: 'Gurgaon',
    salary_min: 1200000,
    salary_max: 1800000,
    description:
      'Own backend services in Node.js + PostgreSQL. Work on high-scale systems powering food delivery.',
    skills: ['Node.js', 'PostgreSQL', 'Redis', 'AWS'],
    job_url: 'https://indeed.com/viewjob?jk=example-4',
    job_type: 'hybrid',
    experience_level: '2-4 years',
    posted_date: new Date(Date.now() - 4 * 86400000).toISOString(),
    scraped_at: new Date().toISOString(),
  },
  {
    portal: 'internshala',
    title: 'React Developer Intern',
    company: 'CoolStartup',
    location: 'Remote',
    salary_min: 300000,
    salary_max: 500000,
    description:
      'Looking for a React intern who can ship product UI with TypeScript, TailwindCSS and shadcn/ui.',
    skills: ['React', 'TypeScript', 'Tailwind'],
    job_url: 'https://internshala.com/internship/detail/example-5',
    job_type: 'remote',
    experience_level: '0-1 years',
    posted_date: new Date(Date.now() - 12 * 3600000).toISOString(),
    scraped_at: new Date().toISOString(),
  },
  {
    portal: 'foundit',
    title: 'Full Stack Developer',
    company: 'Swiggy',
    location: 'Bangalore',
    salary_min: 1400000,
    salary_max: 2000000,
    description:
      'Full-stack role touching React, Node.js, PostgreSQL and Kafka. High ownership environment.',
    skills: ['React', 'Node.js', 'PostgreSQL', 'Kafka'],
    job_url: 'https://foundit.in/job/example-6',
    job_type: 'hybrid',
    experience_level: '3-6 years',
    posted_date: new Date(Date.now() - 5 * 86400000).toISOString(),
    scraped_at: new Date().toISOString(),
  },
  {
    portal: 'apna',
    title: 'Frontend Developer',
    company: 'Unacademy',
    location: 'Bangalore',
    salary_min: 1000000,
    salary_max: 1500000,
    description: 'Frontend role focused on React, Redux, performance and design systems.',
    skills: ['React', 'Redux', 'TypeScript', 'CSS'],
    job_url: 'https://apna.co/job/example-7',
    job_type: 'hybrid',
    experience_level: '2-4 years',
    posted_date: new Date(Date.now() - 6 * 86400000).toISOString(),
    scraped_at: new Date().toISOString(),
  },
  {
    portal: 'hirist',
    title: 'Senior Full Stack Engineer',
    company: 'CRED',
    location: 'Bangalore',
    salary_min: 3000000,
    salary_max: 5000000,
    description:
      'Senior role across React, Node.js, PostgreSQL. Strong system design expected. DevOps comfort a plus.',
    skills: ['React', 'Node.js', 'PostgreSQL', 'System Design', 'Docker'],
    job_url: 'https://hirist.com/job/example-8',
    job_type: 'onsite',
    experience_level: '5-8 years',
    posted_date: new Date(Date.now() - 7 * 86400000).toISOString(),
    scraped_at: new Date().toISOString(),
  },
];

export async function seedIfEmpty() {
  const count = await db.jobs.count();
  if (count > 0) return;

  const now = new Date().toISOString();

  const jobs: Job[] = SAMPLE_JOBS.map((j) => ({ ...j, id: uid('job') }));
  await db.jobs.bulkAdd(jobs);

  const matches: Match[] = jobs.map((j, i) => ({
    id: uid('m'),
    user_id: 'local',
    job_id: j.id,
    resume_id: 'default',
    score: [92, 87, 84, 79, 88, 82, 74, 81][i] ?? 75,
    matching_skills: j.skills.slice(0, Math.max(1, j.skills.length - 1)),
    missing_skills: i === 3 || i === 7 ? ['AWS', 'Docker'] : [],
    bonus_skills: ['Tailwind', 'Zustand'],
    reasoning: 'Strong match on core tech stack; minor gaps in DevOps.',
    status: 'queued',
    created_at: now,
  }));
  await db.matches.bulkAdd(matches);

  const apps: Application[] = [
    {
      id: uid('app'),
      job_id: jobs[0].id,
      portal: jobs[0].portal,
      status: 'applied',
      applied_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      follow_up_count: 0,
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: uid('app'),
      job_id: jobs[1].id,
      portal: jobs[1].portal,
      status: 'viewed',
      applied_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      response_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      follow_up_count: 0,
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: uid('app'),
      job_id: jobs[2].id,
      portal: jobs[2].portal,
      status: 'interview',
      applied_at: new Date(Date.now() - 6 * 86400000).toISOString(),
      response_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      follow_up_count: 0,
      created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ];
  await db.applications.bulkAdd(apps);
}

export async function ensureDefaultPreferences(): Promise<Preferences> {
  const existing = await db.preferences.get('me');
  if (existing) return existing;
  const fresh: Preferences & { id: string } = {
    id: 'me',
    job_titles: ['Full Stack Developer', 'React Developer'],
    locations: ['Bangalore', 'Remote'],
    min_salary: 600000,
    max_salary: 2500000,
    experience_min: 0,
    experience_max: 3,
    work_type: 'any',
    match_threshold: DEFAULT_MATCH_THRESHOLD,
    auto_apply_enabled: true,
    daily_limits: { ...DEFAULT_DAILY_LIMITS },
    active_portals: PORTALS.map((p) => p.slug as PortalSlug).slice(0, 6),
  };
  await db.preferences.put(fresh);
  return fresh;
}
