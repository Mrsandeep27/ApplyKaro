export type PortalSlug =
  | 'linkedin'
  | 'naukri'
  | 'indeed'
  | 'internshala'
  | 'foundit'
  | 'unstop'
  | 'apna'
  | 'hirist'
  | 'jobhai'
  | 'glassdoor'
  | 'workindia'
  | 'wellfound'
  | 'remotive';

export type WorkType = 'remote' | 'hybrid' | 'onsite' | 'any';

export type PortalStatus = 'active' | 'paused' | 'expired' | 'banned' | 'disconnected';

export interface ParsedResume {
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  experience_years?: number;
  skills: string[];
  experience: {
    role: string;
    company: string;
    duration?: string;
    highlights?: string[];
  }[];
  education: {
    degree: string;
    college?: string;
    year?: string;
  }[];
  projects?: string[];
  summary?: string;
}

export interface Resume {
  id: string;
  name: string;
  file_url?: string;
  parsed_data: ParsedResume;
  is_default: boolean;
  created_at: string;
}

export interface PortalCredential {
  id: string;
  portal: PortalSlug;
  email: string;
  status: PortalStatus;
  last_login?: string;
  daily_limit: number;
}

export interface Preferences {
  job_titles: string[];
  locations: string[];
  min_salary: number;
  max_salary: number;
  experience_min: number;
  experience_max: number;
  work_type: WorkType;
  match_threshold: number;
  auto_apply_enabled: boolean;
  daily_limits: Record<string, number>;
  active_portals: PortalSlug[];
}

export interface Job {
  id: string;
  portal: PortalSlug;
  portal_job_id?: string;
  title: string;
  company: string;
  location: string;
  salary_min?: number | null;
  salary_max?: number | null;
  description: string;
  requirements?: string[];
  skills: string[];
  job_url: string;
  job_type: WorkType;
  experience_level?: string;
  posted_date?: string;
  scraped_at: string;
}

export interface MatchResult {
  score: number;
  matching_skills: string[];
  missing_skills: string[];
  bonus_skills: string[];
  reasoning: string;
}

export interface Match extends MatchResult {
  id: string;
  user_id: string;
  job_id: string;
  resume_id: string;
  status: 'queued' | 'approved' | 'skipped' | 'applied' | 'saved';
  created_at: string;
}

export type ApplicationStatus =
  | 'queued'
  | 'applying'
  | 'applied'
  | 'viewed'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'ghosted'
  | 'error';

export interface Application {
  id: string;
  job_id: string;
  match_id?: string;
  portal: PortalSlug;
  status: ApplicationStatus;
  applied_at?: string;
  response_at?: string;
  cover_letter?: string;
  screenshot_url?: string;
  follow_up_count: number;
  next_follow_up?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ApplyLog {
  id: string;
  application_id: string;
  action:
    | 'queued'
    | 'opened'
    | 'form_detected'
    | 'filled'
    | 'submitted'
    | 'success'
    | 'captcha'
    | 'error';
  details?: string;
  screenshot_url?: string;
  duration_ms?: number;
  timestamp: string;
}

export interface DailyAnalytics {
  date: string;
  jobs_found: number;
  jobs_matched: number;
  jobs_applied: number;
  responses: number;
  interviews: number;
  offers: number;
  portal_breakdown: Record<string, number>;
  top_matching_skills: string[];
  top_missing_skills: string[];
}
