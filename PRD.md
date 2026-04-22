# ApplyKaro — Product Requirements Document (PRD)

**Product Name:** ApplyKaro — Smart Job Auto-Apply Platform
**Version:** 1.0
**Author:** Sandeep Pandey
**Date:** March 26, 2026
**Status:** Draft

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [User Persona](#4-user-persona)
5. [User Stories](#5-user-stories)
6. [Functional Requirements](#6-functional-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Auto-Apply Engine](#8-auto-apply-engine)
9. [AI Features](#9-ai-features)
10. [Database Design](#10-database-design)
11. [API Design](#11-api-design)
12. [Security](#12-security)
13. [Release Plan](#13-release-plan)
14. [Risk Assessment](#14-risk-assessment)

---

## 1. Executive Summary

**ApplyKaro** is a mobile-first PWA that automates the job application process. Users upload their resume, set preferences, and the app finds matching jobs across LinkedIn, Naukri, Indeed, Wellfound, and Internshala — then auto-applies with safe daily limits using a headless browser on the backend.

**Key differentiators:**
- **Auto-apply with safe limits** — not reckless mass-apply that gets accounts banned
- **AI job matching** — only applies to jobs that actually match your skills (70%+ threshold)
- **Multi-portal** — 7 job portals in one unified feed
- **Application tracker** — pipeline board from applied to offer
- **AI cover letter** — custom letter per job in one click
- **Free + open source** — competitors charge $24-50/month

---

## 2. Problem Statement

### 2.1 Current Workflow

```
Indian job seeker's daily routine:

Morning (1 hour):
  -> Open LinkedIn -> search "React Developer Bangalore"
  -> Scroll 50 jobs -> open 10 tabs -> apply to 3 (Easy Apply)
  -> Most jobs need external application -> give up

Afternoon (1 hour):
  -> Open Naukri -> same search -> 80% overlap with LinkedIn
  -> Fill same form again: name, email, phone, resume
  -> Apply to 5 jobs

Evening (30 min):
  -> Open Indeed -> same thing
  -> Apply to 3 jobs

Result:
  -> 3 hours spent -> 11 applications
  -> No tracking of where you applied
  -> Forgot to follow up
  -> Applied to jobs that don't match your skills
  -> Got rejected from 9, ghosted by 2

Repeat for 2-3 months. Frustration. Depression.
```

### 2.2 Desired State

```
WITH APPLYKARO:

Morning (30 seconds):
  -> Push notification: "15 new matching jobs found"
  -> Open app -> swipe through 15 jobs
  -> Approve 10, skip 5 -> tap "Start Auto-Apply"

15 minutes later:
  -> Notification: "10 jobs applied! LinkedIn 3, Naukri 5, Indeed 2"
  -> All tracked in dashboard

After 7 days:
  -> Notification: "TCS hasn't responded — follow up?"
  -> One tap -> sends follow-up email

Result:
  -> 30 seconds of effort -> 10 targeted applications
  -> Every application tracked
  -> Follow-ups automated
  -> Only matched jobs -> better response rate
```

### 2.3 Value Proposition

| Metric | Manual Apply | With ApplyKaro |
|--------|-------------|---------------|
| Time per day | 2-3 hours | 30 seconds |
| Applications per day | 5-10 | 20-30 |
| Match quality | Random (apply to everything) | 70%+ match only |
| Tracking | None / spreadsheet | Automatic pipeline |
| Follow-ups | Forgotten | Auto-reminders |
| Cover letters | Skip or copy-paste | AI-generated per job |
| Response rate | 3-5% | 10-15% (targeted) |

---

## 3. Goals & Success Metrics

### 3.1 Project Goals

| Priority | Goal |
|----------|------|
| P0 | Resume upload + AI parsing works accurately |
| P0 | Jobs fetched from at least 3 portals (LinkedIn, Naukri, Indeed) |
| P0 | AI matching scores jobs with 70%+ accuracy |
| P0 | Auto-apply works on at least 2 portals without getting banned |
| P0 | Application tracker shows all applied jobs |
| P1 | Auto-apply on all 5 portals |
| P1 | AI cover letter generation |
| P1 | Follow-up reminder system |
| P1 | Push notifications |
| P2 | Analytics dashboard with insights |
| P2 | Skill gap analyzer |

### 3.2 Success Metrics

| Metric | Target |
|--------|--------|
| Resume parse accuracy | 90%+ field extraction |
| Job match accuracy | 80%+ (user agrees with score) |
| Auto-apply success rate | 85%+ (form submitted successfully) |
| Account ban rate | < 1% (safe limits work) |
| User daily effort | < 2 minutes |
| Applications per user per week | 30-50 |
| Response rate improvement | 2x vs manual apply |

---

## 4. User Persona

### Sandeep — Fresh Graduate / Job Seeker

| Attribute | Detail |
|-----------|--------|
| **Age** | 22-28 |
| **Education** | B.Tech / MCA |
| **Experience** | 0-3 years |
| **Target roles** | Full Stack Developer, React Developer, Node.js Developer |
| **Target salary** | ₹4-15 LPA |
| **Location** | Bangalore, Remote, Hybrid |
| **Current method** | Manually applying on LinkedIn + Naukri (2-3 hours/day) |
| **Frustration** | "100 applications, 3 responses, 1 interview in 2 months" |
| **Tech comfort** | High — can use any app |
| **Device** | Android phone + laptop |
| **Goal** | "Mujhe bas interview chahiye. Application ka kaam automate ho jaye" |

---

## 5. User Stories

### 5.1 Resume & Setup

| ID | Story | Priority |
|----|-------|----------|
| US-001 | As a job seeker, I want to upload my resume and have AI extract my details | P0 |
| US-002 | As a job seeker, I want to maintain multiple resumes for different roles | P1 |
| US-003 | As a job seeker, I want to set my job preferences (title, location, salary, work type) | P0 |
| US-004 | As a job seeker, I want to connect my portal accounts (LinkedIn, Naukri, Indeed) | P0 |
| US-005 | As a job seeker, I want to set daily apply limits per portal | P0 |

### 5.2 Job Discovery

| ID | Story | Priority |
|----|-------|----------|
| US-010 | As a job seeker, I want to see jobs from all portals in one unified feed | P0 |
| US-011 | As a job seeker, I want each job scored by AI for how well it matches my resume | P0 |
| US-012 | As a job seeker, I want to see matching skills (green) and missing skills (red) per job | P1 |
| US-013 | As a job seeker, I want to filter jobs by portal, location, salary, remote/onsite | P0 |
| US-014 | As a job seeker, I want to save jobs for later review | P1 |
| US-015 | As a job seeker, I want new jobs fetched automatically every 6 hours | P1 |

### 5.3 Auto-Apply

| ID | Story | Priority |
|----|-------|----------|
| US-020 | As a job seeker, I want to approve/skip jobs in a queue before auto-applying | P0 |
| US-021 | As a job seeker, I want the app to auto-fill and submit applications on my behalf | P0 |
| US-022 | As a job seeker, I want safe daily limits so my accounts don't get banned | P0 |
| US-023 | As a job seeker, I want to be notified if a CAPTCHA is detected | P0 |
| US-024 | As a job seeker, I want to see progress as each job is being applied | P1 |
| US-025 | As a job seeker, I want proof (screenshot) that each application was submitted | P1 |
| US-026 | As a job seeker, I want AI to generate a custom cover letter per job | P1 |
| US-027 | As a job seeker, I want to pause/resume auto-apply anytime | P0 |

### 5.4 Tracking & Follow-Up

| ID | Story | Priority |
|----|-------|----------|
| US-030 | As a job seeker, I want a pipeline board showing all my applications | P0 |
| US-031 | As a job seeker, I want to update application status (interview, offer, rejected) | P0 |
| US-032 | As a job seeker, I want reminders to follow up after 7 days of no response | P1 |
| US-033 | As a job seeker, I want pre-written follow-up email templates | P2 |
| US-034 | As a job seeker, I want to add notes to each application | P1 |
| US-035 | As a job seeker, I want to search and filter my applications | P1 |

### 5.5 Analytics

| ID | Story | Priority |
|----|-------|----------|
| US-040 | As a job seeker, I want to see how many jobs I applied to this week/month | P1 |
| US-041 | As a job seeker, I want to see my response rate and interview rate | P1 |
| US-042 | As a job seeker, I want to know which portal gives the best response rate | P2 |
| US-043 | As a job seeker, I want to see which skills I'm missing most often | P2 |
| US-044 | As a job seeker, I want to know the best time/day to apply | P2 |

---

## 6. Functional Requirements

### 6.1 Authentication

| ID | Requirement | Details |
|----|------------|---------|
| FR-001 | Email + password auth | Supabase auth, email verification |
| FR-002 | Session management | JWT httpOnly cookies, 30-day expiry |
| FR-003 | Password reset | Email-based reset flow |

### 6.2 Resume Management

| ID | Requirement | Details |
|----|------------|---------|
| FR-010 | Resume upload | PDF/DOCX, max 5MB |
| FR-011 | AI resume parsing | Gemini extracts: name, email, phone, skills[], experience[], education[], projects[] |
| FR-012 | Manual edit | User can correct parsed data |
| FR-013 | Multiple resumes | Up to 5 resumes per user, one default |
| FR-014 | Resume storage | File stored in Supabase Storage, parsed data in DB |

### 6.3 Portal Management

| ID | Requirement | Details |
|----|------------|---------|
| FR-020 | Portal credentials | Store encrypted (AES-256) credentials for each portal |
| FR-021 | Portal health check | Verify credentials work before starting auto-apply |
| FR-022 | Portal status | Active / paused / credential expired / banned |
| FR-023 | Credential update | User can update password anytime |
| FR-024 | Credential deletion | Full deletion of stored credentials |

### 6.4 Job Scraping

| ID | Requirement | Details |
|----|------------|---------|
| FR-030 | Multi-portal scraping | Fetch jobs from LinkedIn, Naukri, Indeed, Internshala, Foundit, Unstop, Apna, Hirist, Job Hai, Glassdoor, WorkIndia, Wellfound (12 portals) |
| FR-031 | Scheduled fetching | Run every 6 hours via cron job |
| FR-032 | Deduplication | Same job posted on multiple portals is shown once |
| FR-033 | Job storage | Store all fetched jobs with portal source and URL |
| FR-034 | Preference filtering | Only fetch jobs matching user's title, location, salary, experience |

### 6.5 AI Job Matching

| ID | Requirement | Details |
|----|------------|---------|
| FR-040 | Match scoring | Gemini compares resume vs job description, returns 0-100 score |
| FR-041 | Skill extraction | Extract required skills from job description |
| FR-042 | Match breakdown | Show: matching skills (green), missing skills (red), bonus skills |
| FR-043 | Threshold filter | Only show jobs above user's threshold (default 70%) |
| FR-044 | Learning | Track user's approve/skip patterns to improve future matching |

### 6.6 Auto-Apply Engine

| ID | Requirement | Details |
|----|------------|---------|
| FR-050 | Job queue | Bull queue with Redis, ordered by match score (highest first) |
| FR-051 | Cloud browser worker | Browserless/BrowserBase/Apify/ScrapingBee — rotated across 4 free providers (8K sessions/month total) |
| FR-052 | Form detection | Detect input fields: name, email, phone, resume upload, text areas |
| FR-053 | Form filling | Fill fields with user data, human-like typing speed (50-150ms/char) |
| FR-054 | Resume upload | Attach PDF to file input fields |
| FR-055 | Cover letter | Auto-generate and fill if cover letter field detected |
| FR-056 | Submit | Click submit button, verify success page |
| FR-057 | Screenshot | Capture screenshot of submitted application |
| FR-058 | Logging | Log every action: opened, filled, submitted, error, captcha |
| FR-059 | Daily limits | Tier 1 (LinkedIn 5, Indeed 8, Glassdoor 5), Tier 2 (Naukri 10, Foundit 10, Unstop 5), Tier 3 (Internshala 15, Apna 15, Hirist 10, Job Hai 15, WorkIndia 15). Total: 113/day max, 50-60/day safe target |
| FR-060 | Anti-detection | Random delays, mouse movements, typing variation, session rotation |
| FR-061 | CAPTCHA handling | Detect CAPTCHA, pause portal, notify user via push notification |
| FR-062 | Error recovery | If apply fails, retry once then skip and log error |
| FR-063 | Pause/resume | User can pause all auto-apply or per portal |

### 6.7 Application Tracker

| ID | Requirement | Details |
|----|------------|---------|
| FR-070 | Pipeline board | Kanban: Queue -> Applied -> Viewed -> Interview -> Offer -> Rejected |
| FR-071 | Status update | Manual status change with timestamp |
| FR-072 | Follow-up reminders | Auto-remind after 7 days, 14 days, 21 days of no response |
| FR-073 | Notes | Add text notes per application |
| FR-074 | Search/filter | By company, role, portal, status, date range |

### 6.8 Analytics

| ID | Requirement | Details |
|----|------------|---------|
| FR-080 | Daily/weekly/monthly stats | Jobs found, matched, applied, responses, interviews, offers |
| FR-081 | Portal comparison | Response rate per portal |
| FR-082 | Skill gap report | Most common missing skills across rejected/unmatched jobs |
| FR-083 | Trend charts | Applications over time, response rate over time |

---

## 7. Non-Functional Requirements

### 7.1 Performance

| Requirement | Target |
|------------|--------|
| Resume parse time | < 10 seconds |
| Job matching (per job) | < 2 seconds |
| Auto-apply (per job) | 1-3 minutes (with human-like delays) |
| Dashboard load | < 1 second |
| Job feed load | < 2 seconds |

### 7.2 Reliability

| Requirement | Target |
|------------|--------|
| Auto-apply success rate | 85%+ |
| Account ban rate | < 1% |
| Data loss | Zero |
| Uptime | 99%+ |

### 7.3 Capacity

| Requirement | Target |
|------------|--------|
| Users | Up to 10,000 |
| Jobs stored | Up to 1M |
| Applications per user | Up to 5,000 |
| Cloud browser sessions | 8,000/month (4 provider free tiers combined) |

### 7.4 Device Compatibility

| Requirement | Target |
|------------|--------|
| Android | Chrome 90+ |
| iOS | Safari 15+ |
| Desktop | Chrome, Firefox, Edge |
| PWA | Installable on all platforms |

---

## 8. Auto-Apply Engine

### 8.1 Architecture

```
User approves jobs in PWA
        |
        v
  ┌────────────┐
  │  REST API   │ ── POST /api/apply/start
  └─────┬──────┘
        |
        v
  ┌────────────┐
  │ Bull Queue  │ ── Redis-backed job queue
  │  (Redis)    │    Priority: match score descending
  └─────┬──────┘
        |
        v
  ┌────────────┐
  │ Browser    │ ── Cloud browser (Browserless/BrowserBase/Apify/ScrapingBee)
  │  Pool      │ ── Rotates across 4 free providers (8K sessions/month)
  └──────┬─────┘
         │
  ┌──────┴─────┐
  │  Apply     │ ── Checks daily limit per portal
  │  Worker    │ ── Random delay (45-180s)
  │            │ ── Opens job URL in cloud browser
  │            │ ── Detects form fields
  │            │ ── Fills with human-like typing
  │            │ ── Attaches resume
  │            │ ── Generates cover letter (if needed)
  │            │ ── Takes screenshot
  │            │ ── Clicks submit
  │            │ ── Verifies success
  │            │ ── Logs result
  └──────┬─────┘
         |
         v
  ┌────────────┐
  │ Supabase   │ ── application record created
  │ DB + Push  │ ── Realtime status update to PWA
  │ + Realtime │ ── push notification sent
  └────────────┘
```

### 8.2 Portal-Specific Flows

**LinkedIn Easy Apply:**
```
1. Open job URL
2. Click "Easy Apply" button
3. Fill: phone (if asked), resume upload
4. Click "Next" through steps
5. Click "Submit application"
6. Verify "Application sent" confirmation
```

**Naukri Apply:**
```
1. Open job URL
2. Click "Apply" button
3. Fill: resume upload, cover letter (if asked)
4. Update profile fields if required
5. Click "Submit"
6. Verify confirmation
```

**Indeed Apply:**
```
1. Open job URL
2. Click "Apply now"
3. Fill: resume upload, questions (if any)
4. Click "Submit your application"
5. Verify "Application submitted"
```

**Foundit (Monster) Apply:**
```
1. Open job URL
2. Click "Apply" button
3. Fill: resume upload, expected salary
4. Click "Submit"
5. Verify confirmation page
```

**Internshala Apply:**
```
1. Open job/internship URL
2. Click "Apply now"
3. Fill: cover letter, availability, questions
4. Attach resume
5. Click "Submit"
6. Verify "Application submitted"
```

**Apna Apply:**
```
1. Open job URL
2. Click "Apply"
3. Profile auto-filled from Apna account
4. Click "Confirm apply"
5. Verify confirmation
```

**Hirist Apply:**
```
1. Open job URL
2. Click "Apply"
3. Fill: resume, expected CTC, notice period
4. Click "Submit"
5. Verify confirmation
```

**Glassdoor Apply:**
```
1. Open job URL
2. Click "Apply" (may redirect to company site)
3. If direct: fill form, attach resume, submit
4. If redirect: detect external form, fill, submit
5. Verify confirmation
```

**Job Hai / WorkIndia Apply:**
```
1. Open job URL
2. Click "Apply"
3. Profile auto-sent (simple portals)
4. Verify confirmation
```

**Unstop Apply (Jobs only, not competitions):**
```
1. Open job URL
2. Click "Apply"
3. Fill: resume, questions (if any)
4. Click "Submit"
5. Verify confirmation
```

### 8.3 Anti-Detection Config

```json
{
  "delays": {
    "between_applies": { "min": 45, "max": 180, "unit": "seconds" },
    "between_keystrokes": { "min": 50, "max": 150, "unit": "ms" },
    "before_click": { "min": 500, "max": 2000, "unit": "ms" },
    "page_load_wait": { "min": 2000, "max": 5000, "unit": "ms" }
  },
  "mouse": {
    "random_movements": true,
    "scroll_before_action": true,
    "hover_before_click": true
  },
  "session": {
    "rotate_user_agent": true,
    "clear_cookies_daily": false,
    "max_session_duration": "2 hours"
  },
  "schedule": {
    "apply_hours": "9:00-18:00",
    "skip_weekends": true,
    "max_batch_size": 5,
    "batch_cooldown": "30 minutes"
  }
}
```

---

## 9. AI Features

### 9.1 Resume Parsing (Gemini)

```
Input: PDF/DOCX raw text
Output:
{
  "name": "Sandeep Pandey",
  "email": "sandeeppandey70391@gmail.com",
  "phone": "+91-XXXXXXXXXX",
  "location": "Bangalore",
  "experience_years": 1,
  "skills": ["React", "Next.js", "TypeScript", "Node.js", "PostgreSQL"],
  "experience": [
    {
      "role": "Full Stack Developer",
      "company": "2XG-Growth",
      "duration": "Oct 2025 - Present",
      "highlights": ["Built multi-tenant CRM", "Deployed 7+ apps"]
    }
  ],
  "education": [
    {
      "degree": "MCA",
      "college": "Seshadripuram First Grade College",
      "year": "2025-2027"
    }
  ],
  "projects": ["GigFlow", "MediLog", "BillKaro"]
}
```

### 9.2 Job Matching

```
Input: user.parsed_resume + job.description
Output:
{
  "score": 87,
  "matching_skills": ["React", "TypeScript", "Node.js", "PostgreSQL"],
  "missing_skills": ["Docker", "AWS"],
  "bonus_skills": ["Socket.io", "PWA"],
  "reasoning": "Strong frontend + backend match. Missing DevOps skills but not required."
}
```

### 9.3 Cover Letter Generation

```
Input: user.parsed_resume + job.description + tone (professional/friendly/startup)
Output: 200-300 word personalized cover letter
```

---

## 10. Database Design

```sql
-- Users
users (
  id UUID PK,
  email VARCHAR UNIQUE,
  password_hash VARCHAR,
  name VARCHAR,
  phone VARCHAR,
  created_at TIMESTAMP
)

-- Resumes
resumes (
  id UUID PK,
  user_id UUID FK -> users,
  name VARCHAR,          -- "Frontend Resume"
  file_url TEXT,
  parsed_data JSONB,     -- extracted fields
  is_default BOOLEAN,
  created_at TIMESTAMP
)

-- Portal Credentials
portal_credentials (
  id UUID PK,
  user_id UUID FK -> users,
  portal VARCHAR,        -- linkedin, naukri, indeed
  email VARCHAR,
  password_encrypted TEXT,  -- AES-256
  status VARCHAR,        -- active, paused, expired, banned
  last_login TIMESTAMP,
  created_at TIMESTAMP
)

-- User Preferences
preferences (
  id UUID PK,
  user_id UUID FK -> users,
  job_titles TEXT[],
  locations TEXT[],
  min_salary INTEGER,
  max_salary INTEGER,
  experience_min INTEGER,
  experience_max INTEGER,
  work_type VARCHAR,     -- remote, hybrid, onsite, any
  match_threshold INTEGER DEFAULT 70,
  auto_apply_enabled BOOLEAN DEFAULT true,
  daily_limits JSONB,    -- {"linkedin": 5, "naukri": 10}
  active_portals TEXT[],
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Jobs (scraped from portals)
jobs (
  id UUID PK,
  portal VARCHAR,
  portal_job_id VARCHAR,
  title VARCHAR,
  company VARCHAR,
  location VARCHAR,
  salary_min INTEGER,
  salary_max INTEGER,
  description TEXT,
  requirements TEXT[],
  skills TEXT[],
  job_url TEXT,
  job_type VARCHAR,      -- remote, hybrid, onsite
  experience_level VARCHAR,
  posted_date DATE,
  scraped_at TIMESTAMP,
  UNIQUE(portal, portal_job_id)
)

-- AI Matches
matches (
  id UUID PK,
  user_id UUID FK -> users,
  job_id UUID FK -> jobs,
  resume_id UUID FK -> resumes,
  match_score INTEGER,   -- 0-100
  matching_skills TEXT[],
  missing_skills TEXT[],
  status VARCHAR,        -- queued, approved, skipped, applied
  created_at TIMESTAMP
)

-- Applications
applications (
  id UUID PK,
  user_id UUID FK -> users,
  job_id UUID FK -> jobs,
  match_id UUID FK -> matches,
  portal VARCHAR,
  status VARCHAR,        -- applied, viewed, interview, offer, rejected, ghosted
  applied_at TIMESTAMP,
  response_at TIMESTAMP,
  cover_letter TEXT,
  screenshot_url TEXT,
  follow_up_count INTEGER DEFAULT 0,
  next_follow_up DATE,
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Apply Logs
apply_logs (
  id UUID PK,
  application_id UUID FK -> applications,
  action VARCHAR,        -- opened, form_detected, filled, submitted, captcha, error, success
  details TEXT,
  screenshot_url TEXT,
  duration_ms INTEGER,
  timestamp TIMESTAMP
)

-- Daily Analytics
daily_analytics (
  id UUID PK,
  user_id UUID FK -> users,
  date DATE,
  jobs_found INTEGER,
  jobs_matched INTEGER,
  jobs_applied INTEGER,
  responses INTEGER,
  interviews INTEGER,
  portal_breakdown JSONB,
  top_matching_skills TEXT[],
  top_missing_skills TEXT[],
  UNIQUE(user_id, date)
)
```

---

## 11. API Design

```
Auth:
  POST   /api/auth/signup
  POST   /api/auth/login
  POST   /api/auth/logout
  POST   /api/auth/reset-password

Resume:
  POST   /api/resume/upload        -- upload + AI parse
  GET    /api/resume                -- list user's resumes
  PUT    /api/resume/:id            -- update parsed data
  DELETE /api/resume/:id
  PUT    /api/resume/:id/default    -- set as default

Portals:
  POST   /api/portals/connect      -- save encrypted credentials
  GET    /api/portals               -- list connected portals
  POST   /api/portals/:id/verify   -- test login
  PUT    /api/portals/:id           -- update credentials
  DELETE /api/portals/:id           -- remove portal

Preferences:
  GET    /api/preferences
  PUT    /api/preferences

Jobs:
  GET    /api/jobs                  -- matched jobs feed
  GET    /api/jobs/:id              -- job detail + match breakdown
  POST   /api/jobs/:id/approve     -- approve for auto-apply
  POST   /api/jobs/:id/skip        -- skip job
  POST   /api/jobs/:id/save        -- save for later

Apply:
  POST   /api/apply/start          -- start auto-apply for approved jobs
  POST   /api/apply/pause          -- pause all auto-apply
  POST   /api/apply/resume         -- resume auto-apply
  GET    /api/apply/status         -- current apply queue status
  GET    /api/apply/logs/:id       -- logs for specific application

Applications:
  GET    /api/applications         -- all applications (filterable)
  GET    /api/applications/:id     -- application detail
  PUT    /api/applications/:id     -- update status, notes
  GET    /api/applications/pipeline -- pipeline counts

Analytics:
  GET    /api/analytics/summary    -- weekly/monthly stats
  GET    /api/analytics/portals    -- per-portal breakdown
  GET    /api/analytics/skills     -- skill gap report
  GET    /api/analytics/trends     -- charts data

Cover Letter:
  POST   /api/cover-letter/generate -- AI generate for specific job
```

---

## 12. Security

| Area | Implementation |
|------|---------------|
| Portal passwords | AES-256-GCM encryption, key in environment variable |
| Password storage | bcrypt (14 rounds) |
| API auth | JWT httpOnly cookies, 30-day expiry, refresh tokens |
| HTTPS | Enforced on all endpoints |
| Rate limiting | 100 req/min per user |
| Input validation | Zod schemas on all endpoints |
| Puppeteer isolation | Separate browser context per user |
| Screenshot cleanup | Auto-delete after 7 days |
| Credential deletion | Immediate, irreversible delete from DB |
| CORS | Whitelist frontend domain only |
| Environment secrets | Never in code, always in env vars |

---

## 13. Release Plan

### Phase 1 — Foundation (Week 1-2)
- React + Vite + Tailwind + Supabase setup
- Auth (email/password)
- Resume upload + Gemini AI parser
- Preferences setup UI
- Mobile-first PWA layout with bottom nav

### Phase 2 — Job Feed (Week 3-4)
- Job scraper workers (LinkedIn RSS, Naukri, Indeed API)
- Gemini AI job matching engine
- Job queue UI (card-based feed)
- Job detail view with skill match breakdown
- Approve / skip / save flow

### Phase 3 — Auto-Apply Engine (Week 5-7)
- Puppeteer setup on Railway/Render
- LinkedIn Easy Apply automation
- Naukri apply automation
- Indeed apply automation
- Form detection + human-like auto-fill
- Anti-detection (delays, mouse, typing variation)
- Daily limit enforcement
- CAPTCHA detection + push notification
- Apply logging + screenshots
- Pause/resume controls

### Phase 4 — Tracker + Analytics (Week 8-9)
- Application pipeline board (kanban)
- Status tracking + history
- Follow-up reminder system (7/14/21 days)
- Notes per application
- Analytics dashboard (Recharts)
- Skill gap report

### Phase 5 — AI Extras (Week 10-11)
- AI cover letter generator (per job)
- Follow-up email drafts
- "Best time to apply" insights
- Wellfound + Internshala portal support
- Job recommendation learning from swipe patterns

### Phase 6 — Polish + Launch (Week 12)
- Push notifications (all events)
- Offline support (view tracker + jobs offline)
- Dark mode
- PWA install prompt
- Testing (unit + integration)
- Deploy: Vercel (frontend) + Railway (backend + Puppeteer)

---

## 14. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Account banned from auto-apply | Medium | High | Conservative daily limits, human-like delays, batch cooldowns, weekend pauses |
| Portal changes login/apply flow | High | Medium | Modular Puppeteer scripts per portal, easy to update when flow changes |
| CAPTCHA blocks automation | High | Medium | Detect and notify user, fallback to manual apply with auto-fill |
| Gemini API costs | Low | Medium | Cache job matching results, batch requests, use Flash model |
| Legal issues with automation | Low | Medium | Terms of service compliance, user accepts responsibility, no credential sharing |
| Cloud browser free tier exhausted | Medium | Medium | Rotate across 4 providers (8K total), Pro tier covers paid usage |
| User credentials leak | Low | Critical | AES-256 encryption, secure environment, regular security audits |
| Job data becomes stale | Medium | Low | Re-fetch every 6 hours, mark expired jobs |

---

**Document Version History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | March 26, 2026 | Sandeep Pandey | Initial PRD |
