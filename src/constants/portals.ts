import type { PortalSlug } from '@/lib/types';

export interface PortalMeta {
  slug: PortalSlug;
  name: string;
  tier: 1 | 2 | 3;
  color: string;
  initials: string;
  default_limit: number;
  supports_auto_apply: boolean;
  website: string;
}

export const PORTALS: PortalMeta[] = [
  { slug: 'linkedin', name: 'LinkedIn', tier: 1, color: '#0a66c2', initials: 'Li', default_limit: 5, supports_auto_apply: true, website: 'https://linkedin.com/jobs' },
  { slug: 'indeed', name: 'Indeed', tier: 1, color: '#003a9b', initials: 'In', default_limit: 8, supports_auto_apply: true, website: 'https://indeed.com' },
  { slug: 'glassdoor', name: 'Glassdoor', tier: 1, color: '#0caa41', initials: 'Gd', default_limit: 5, supports_auto_apply: true, website: 'https://glassdoor.com' },
  { slug: 'naukri', name: 'Naukri', tier: 2, color: '#4a90e2', initials: 'Nk', default_limit: 10, supports_auto_apply: true, website: 'https://naukri.com' },
  { slug: 'foundit', name: 'Foundit', tier: 2, color: '#6c2bd9', initials: 'Fd', default_limit: 10, supports_auto_apply: true, website: 'https://foundit.in' },
  { slug: 'unstop', name: 'Unstop', tier: 2, color: '#2bb673', initials: 'Un', default_limit: 5, supports_auto_apply: true, website: 'https://unstop.com' },
  { slug: 'internshala', name: 'Internshala', tier: 3, color: '#008bdc', initials: 'Is', default_limit: 15, supports_auto_apply: true, website: 'https://internshala.com' },
  { slug: 'apna', name: 'Apna', tier: 3, color: '#ff4646', initials: 'Ap', default_limit: 15, supports_auto_apply: true, website: 'https://apna.co' },
  { slug: 'hirist', name: 'Hirist', tier: 3, color: '#3f51b5', initials: 'Hi', default_limit: 10, supports_auto_apply: true, website: 'https://hirist.com' },
  { slug: 'jobhai', name: 'Job Hai', tier: 3, color: '#ff7a00', initials: 'Jh', default_limit: 15, supports_auto_apply: true, website: 'https://jobhai.com' },
  { slug: 'workindia', name: 'WorkIndia', tier: 3, color: '#0ea5e9', initials: 'Wi', default_limit: 15, supports_auto_apply: true, website: 'https://workindia.in' },
  { slug: 'wellfound', name: 'Wellfound', tier: 3, color: '#111827', initials: 'Wf', default_limit: 10, supports_auto_apply: true, website: 'https://wellfound.com' },
  { slug: 'remotive', name: 'Remotive', tier: 3, color: '#f97316', initials: 'Rm', default_limit: 10, supports_auto_apply: false, website: 'https://remotive.com' },
];

export const PORTAL_MAP: Record<PortalSlug, PortalMeta> = PORTALS.reduce(
  (acc, p) => ({ ...acc, [p.slug]: p }),
  {} as Record<PortalSlug, PortalMeta>,
);

export const DEFAULT_DAILY_LIMITS: Record<string, number> = PORTALS.reduce(
  (acc, p) => ({ ...acc, [p.slug]: p.default_limit }),
  {} as Record<string, number>,
);

export const SAFE_TARGET_PER_DAY = 50;
export const MAX_CAPACITY_PER_DAY = PORTALS.reduce((s, p) => s + p.default_limit, 0);
