# ApplyKaro — Smart Job Auto-Apply Platform

> Set preferences. Upload resume. App applies to matching jobs automatically — with safe daily limits. Track everything from your phone.

**Live Demo:** [apply-karo.vercel.app](https://apply-karo.vercel.app)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase)
![PWA](https://img.shields.io/badge/PWA-Installable-purple)

---

## The Problem

Every job seeker in India faces this daily:

- **2-3 hours wasted** opening LinkedIn, Naukri, Indeed one by one
- **Same form filled 50 times** — name, email, phone, resume, cover letter
- **No tracking** — "Maine kahan kahan apply kiya? Yaad nahi"
- **Good jobs missed** — by the time you see them, 500 people already applied
- **No follow-up** — applied 2 weeks ago, forgot to check status
- **Resume mismatch** — applying to jobs that don't match your skills

**Result:** 100 applications, 5 responses, 1 interview. Months of frustration.

---

## The Solution

**ApplyKaro** is a PWA that automates your job search — find, match, apply, and track from your phone.

### How It Works

```
1. Upload Resume        →  AI extracts your skills, experience, education
2. Set Preferences      →  Job title, location, salary, portals
3. AI Finds Jobs        →  Scans LinkedIn, Naukri, Indeed, Wellfound daily
4. AI Scores Matches    →  "92% match" / "45% match" — only shows 70%+
5. You Review Queue     →  30 seconds — remove any you don't want
6. Tap "Start Apply"    →  App applies automatically with safe limits
7. Track Everything     →  Dashboard: applied, viewed, interview, offer
8. Get Reminders        →  "No response in 7 days — follow up?"
```

---

## Core Features

### 1. Smart Resume Parser
- Upload PDF/DOCX resume
- AI extracts: name, email, phone, skills, experience, education, projects
- Stores structured data for auto-filling applications
- Support multiple resumes (Frontend / Full Stack / Backend)

### 2. Multi-Portal Job Aggregator
- Pulls jobs from multiple Indian + global portals
- Unified feed — no need to open 5 different sites
- Filters: title, location, salary, remote/hybrid/onsite, experience level
- New jobs fetched every 6 hours

| Portal | Method | Auto-Apply | Difficulty |
|--------|--------|-----------|------------|
| LinkedIn | Jobs API / RSS | Easy Apply only | Medium (strict anti-bot) |
| Naukri | RSS + Scraping | Yes | Easy |
| Indeed | API | Yes | Medium |
| Internshala | Scraping | Yes | Easy |
| Foundit (Monster) | Scraping | Yes | Easy |
| Unstop | Scraping | Partial (competitions manual) | Medium |
| Apna | Scraping | Yes | Easy |
| Hirist | Scraping | Yes | Easy (tech-focused) |
| Job Hai | Scraping | Yes | Easy |
| Glassdoor | Scraping | Yes | Medium |
| WorkIndia | Scraping | Yes | Easy |
| Wellfound | API | Yes | Easy |
| Remotive | API | Remote jobs only | Easy |

**11 portals with full auto-apply. 50-60 applications/day on autopilot.**

### 3. AI Job Matching (Gemini)
- Compares your resume skills vs job requirements
- Match score: 0-100%
- Highlights: matching skills (green), missing skills (red)
- Only shows jobs above your threshold (default 70%)
- Learns from your swipe patterns — gets smarter over time

### 4. Auto-Apply Engine (With Safe Limits)

```
How it works:
  1. Cloud browser (Browserless/BrowserBase) runs on remote server
  2. Logs into portals with your saved credentials (encrypted)
  3. Opens job page → fills form → attaches resume → submits
  4. Random human-like delays between each apply (45s - 3min)
  5. Random scroll + mouse movements (anti-detection)
  6. Stops at daily limit per portal
  7. Rotates between browser providers (free tiers)

Daily limits (configurable):
  Tier 1 — Strict anti-bot:
    LinkedIn:       5/day
    Indeed:          8/day
    Glassdoor:       5/day

  Tier 2 — Moderate:
    Naukri:         10/day
    Foundit:        10/day
    Unstop:          5/day

  Tier 3 — Lenient:
    Internshala:    15/day
    Apna:           15/day
    Hirist:         10/day
    Job Hai:        15/day
    WorkIndia:      15/day

  TOTAL CAPACITY:  113 applies/day
  SAFE TARGET:      50-60 applies/day

Safety triggers:
  CAPTCHA detected     →  pause, push notification to user
  "Unusual activity"   →  stop portal for 24 hours
  Rate limit hit       →  switch to next portal
  Daily limit reached  →  "Done for today ✓"
  Account warning      →  emergency stop all, notify user
```

### 5. AI Cover Letter Generator
- One-click custom cover letter per job
- Uses your resume + job description → personalized letter
- Tone options: Professional / Friendly / Startup-casual
- Hindi + English support
- Edit before sending or auto-attach

### 6. Application Tracker Dashboard

```
Pipeline view:
  Queue (23) → Applied (47) → Viewed (12) → Interview (3) → Offer (1)

Per application:
  Company, role, portal, date applied, status, salary range
  Notes, follow-up date, contact person

Filters:
  By portal, date range, status, company, match score
```

### 7. Smart Follow-Up System
- Auto-reminder after 7 days of no response
- Pre-written follow-up email templates
- Track: first follow-up, second follow-up, final follow-up
- "This company typically responds in 5 days" (learns from data)

### 8. Analytics & Insights

```
This week:
  Applied: 42 jobs
  Response rate: 7.1% (3 responses)
  Interview rate: 2.3% (1 interview)
  Top matching skill: React (mentioned in 85% of matches)
  Weakest skill: Docker (missing in 60% of rejections)
  Best portal: Naukri (highest response rate)
  Best time to apply: Tuesday 10 AM
```

### 9. Skill Gap Analyzer
- AI analyzes rejected applications
- "You're missing Docker, AWS, CI/CD — these appeared in 60% of jobs you didn't match"
- Suggests free courses (YouTube, freeCodeCamp, Coursera)
- Tracks skill improvement over time

### 10. Push Notifications (PWA)
- "5 new jobs matching your profile"
- "Auto-apply complete: 8 jobs applied today"
- "CAPTCHA detected on LinkedIn — manual action needed"
- "No response from TCS in 7 days — follow up?"
- "Interview scheduled: Google, March 28, 2 PM"

---

## Tech Stack

### Frontend (PWA)
| Tech | Purpose |
|------|---------|
| React 19 | UI framework |
| Vite 6 | Build tool (fast) |
| TypeScript 5 | Type safety |
| Tailwind CSS v4 | Styling |
| shadcn/ui | Component library |
| Zustand | State management |
| Recharts | Analytics charts |
| Dexie.js (IndexedDB) | Offline-first local storage |

### Backend (100% Free)
| Tech | Purpose |
|------|---------|
| Supabase Edge Functions | API server (500K invocations/month free) |
| Supabase PostgreSQL | Database (Mumbai region, free) |
| Supabase Auth | Authentication (free) |
| Supabase Storage | Resume + screenshot storage (1GB free) |
| Supabase Realtime | Live apply status updates (free) |
| Supabase pg_cron | Scheduled job scraping (free) |
| Google Gemini API | Resume parsing, job matching, cover letters (free) |
| Web Push API | Push notifications (free) |

### Cloud Browser (Auto-Apply Engine)
| Provider | Free Tier | Role |
|----------|-----------|------|
| Browserless.io | 1,000 sessions/month | Primary |
| BrowserBase.com | 1,000 sessions/month | Fallback 1 |
| Apify.com | 5,000 runs/month | Fallback 2 |
| ScrapingBee.com | 1,000 sessions/month | Fallback 3 |
| **Total** | **8,000 sessions/month** | **~260 applies/day** |

### Infrastructure
| Tech | Purpose | Cost |
|------|---------|------|
| Vercel | Frontend hosting (PWA) | Free |
| Supabase | DB + Auth + Storage + Edge Functions + Realtime | Free |
| Cloud browsers | 4 providers rotated | Free (8K sessions/month) |
| **Total monthly cost** | | **₹0** |

---

## Database Schema

```
users
  id, email, password_hash, name, phone
  created_at, updated_at

resumes
  id, user_id, name (e.g. "Frontend Resume")
  raw_text, parsed_data (JSON: skills, experience, education)
  file_url, is_default
  created_at

portal_credentials
  id, user_id, portal (linkedin/naukri/indeed)
  email, password_encrypted
  status (active/paused/banned)
  last_login, created_at

preferences
  id, user_id
  job_titles[] ("Full Stack Developer", "React Developer")
  locations[] ("Bangalore", "Remote")
  min_salary, max_salary
  experience_min, experience_max
  work_type (remote/hybrid/onsite/any)
  match_threshold (default 70)
  daily_limits (JSON per portal)
  auto_apply_enabled (boolean)
  portals[] (which portals to scan)

jobs
  id, portal, portal_job_id
  title, company, location, salary_range
  description, requirements[], skills[]
  job_url, job_type, experience_level
  posted_date, scraped_at

matches
  id, user_id, job_id
  match_score (0-100)
  matching_skills[], missing_skills[]
  status (queued/approved/rejected/applied/skipped)
  created_at

applications
  id, user_id, job_id, match_id
  portal, status (applied/viewed/interview/offer/rejected/ghosted)
  applied_at, response_at
  cover_letter_text
  follow_up_count, next_follow_up_date
  notes

apply_logs
  id, application_id
  action (form_filled/submitted/captcha/error/success)
  screenshot_url (for debugging)
  duration_ms, timestamp

analytics
  id, user_id, date
  jobs_found, jobs_matched, jobs_applied
  responses, interviews, offers
  top_skills[], weak_skills[]
```

---

## Auto-Apply Flow (Detailed)

```
┌──────────────┐
│  Job Queue   │  ← AI matched jobs above 70%
│  (Bull/Redis)│
└──────┬───────┘
       │ picks next job
       v
┌──────────────┐
│  Puppeteer   │  ← headless Chrome on server
│  Worker      │
└──────┬───────┘
       │
       ├─→ Check daily limit → if exceeded, skip portal
       │
       ├─→ Random delay (45s - 180s)
       │
       ├─→ Open job URL in headless browser
       │
       ├─→ Detect form fields:
       │     name, email, phone, resume, cover letter,
       │     experience, location, salary expectation
       │
       ├─→ Fill each field with user's data
       │     (with random typing speed: 50-150ms per char)
       │
       ├─→ Attach resume PDF
       │
       ├─→ Generate cover letter (if required)
       │
       ├─→ Take screenshot (proof of submission)
       │
       ├─→ Click submit
       │
       ├─→ Verify: success page / confirmation email
       │
       ├─→ Log result: success / captcha / error
       │
       └─→ If CAPTCHA:
             → Pause this portal
             → Send push notification to user
             → User solves manually OR skip

Next job in queue...
```

---

## Safe Apply Strategies

### Anti-Detection Measures
```
1. Random delays:        45-180 seconds between applies
2. Random typing speed:  50-150ms per character (not instant)
3. Mouse movements:      Random scroll, hover before click
4. Session variation:    Different user-agent per session
5. Provider rotation:    Rotate across 4 cloud browser providers
6. Time variation:       Don't apply at exact same time daily
7. Portal rotation:      Alternate between portals
8. Weekend pause:        No auto-apply on weekends (looks human)
9. Batch size:           Max 3-5 applies per session, then pause 30 min
```

### Account Safety Rules
```
Tier 1 — STRICT (high ban risk):
  LinkedIn:    max 5 Easy Apply/day, 25/week, 1hr gap between applies
  Indeed:      max 8/day, 40/week, 45s minimum gap
  Glassdoor:   max 5/day, 25/week, 1hr gap between applies

Tier 2 — MODERATE:
  Naukri:      max 10/day, 50/week, 30s minimum gap
  Foundit:     max 10/day, 50/week, 30s minimum gap
  Unstop:      max 5/day (jobs only, not competitions), 45s gap

Tier 3 — LENIENT (low ban risk):
  Internshala: max 15/day, 15s minimum gap
  Apna:        max 15/day, 15s minimum gap
  Hirist:      max 10/day, 20s minimum gap
  Job Hai:     max 15/day, 15s minimum gap
  WorkIndia:   max 15/day, 15s minimum gap
```

---

## User Flows

### First-Time Setup (5 minutes)

```
[Welcome Screen]
  "ApplyKaro — Job dhundna band, apply karna shuru"
  [Get Started]
     |
     v
[Upload Resume]
  Drag & drop PDF/DOCX
  → AI parses in 10 seconds
  → Shows extracted: skills, experience, education
  → "Sahi hai? Edit karo ya continue"
  [Continue]
     |
     v
[Set Preferences]
  Job titles: [Full Stack Developer, React Developer]
  Location: [Bangalore, Remote]
  Min salary: [₹6 LPA]
  Experience: [0-2 years]
  Work type: [Remote / Hybrid / Any]
  [Continue]
     |
     v
[Connect Portals]
  [+ LinkedIn]  → email + password (encrypted)
  [+ Naukri]    → email + password (encrypted)
  [+ Indeed]    → email + password (encrypted)
  [Skip — Add Later]
     |
     v
[Set Daily Limits]
  LinkedIn:   [5] /day
  Naukri:     [10] /day
  Indeed:     [8] /day
  Auto-apply: [ON]
  [Start Finding Jobs]
     |
     v
[Dashboard — Ready!]
  "Scanning portals... 47 jobs found, 23 match your profile"
```

### Daily Usage (30 seconds)

```
[Push notification]: "12 new matching jobs found"
     |
     v
[Open App → Job Queue]
  Shows 12 jobs, sorted by match score:

  ┌────────────────────────────────┐
  │ 🟢 92% match                   │
  │ Senior React Developer         │
  │ Flipkart — Bangalore           │
  │ ₹18-25 LPA — Remote            │
  │ Skills: React ✓ TS ✓ Node ✓   │
  │                                │
  │ [Skip]  [Save]  [Apply ➜]     │
  └────────────────────────────────┘

  Swipe through 12 jobs (30 seconds)
  Tap "Apply" on 8 of them
     |
     v
[Auto-Apply Running]
  "Applying to 8 jobs... estimated time: 15 minutes"
  Progress: ████████░░ 6/8
     |
     v
[Push notification]: "Done! 8 jobs applied today"
```

---

## Project Structure

```
ApplyKaro/
├── public/
│   ├── manifest.json
│   ├── sw.js
│   ├── icons/
│   └── screenshots/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── components/
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   ├── bottom-nav.tsx
│   │   │   └── sidebar.tsx
│   │   ├── jobs/
│   │   │   ├── job-card.tsx
│   │   │   ├── job-queue.tsx
│   │   │   ├── job-detail.tsx
│   │   │   ├── match-badge.tsx
│   │   │   └── skill-match.tsx
│   │   ├── apply/
│   │   │   ├── apply-progress.tsx
│   │   │   ├── apply-log.tsx
│   │   │   └── captcha-alert.tsx
│   │   ├── resume/
│   │   │   ├── resume-upload.tsx
│   │   │   ├── resume-parser.tsx
│   │   │   └── resume-preview.tsx
│   │   ├── tracker/
│   │   │   ├── pipeline-board.tsx
│   │   │   ├── application-card.tsx
│   │   │   └── follow-up-reminder.tsx
│   │   ├── analytics/
│   │   │   ├── stats-cards.tsx
│   │   │   ├── apply-chart.tsx
│   │   │   └── skill-gap.tsx
│   │   ├── settings/
│   │   │   ├── preferences-form.tsx
│   │   │   ├── portal-connect.tsx
│   │   │   └── limit-config.tsx
│   │   └── ui/               (shadcn components)
│   ├── pages/
│   │   ├── dashboard.tsx
│   │   ├── jobs.tsx
│   │   ├── queue.tsx
│   │   ├── tracker.tsx
│   │   ├── analytics.tsx
│   │   ├── resume.tsx
│   │   ├── settings.tsx
│   │   └── login.tsx
│   ├── hooks/
│   │   ├── use-jobs.ts
│   │   ├── use-applications.ts
│   │   ├── use-resume.ts
│   │   ├── use-apply.ts
│   │   └── use-analytics.ts
│   ├── stores/
│   │   ├── auth-store.ts
│   │   ├── job-store.ts
│   │   └── preference-store.ts
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── resume-parser.ts
│   │   │   ├── job-matcher.ts
│   │   │   └── cover-letter.ts
│   │   ├── db/
│   │   │   ├── dexie.ts
│   │   │   └── schema.ts
│   │   ├── api/
│   │   │   └── client.ts
│   │   └── utils/
│   │       ├── encryption.ts
│   │       └── validators.ts
│   └── constants/
│       ├── portals.ts
│       └── limits.ts
├── server/
│   ├── index.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── jobs.ts
│   │   ├── apply.ts
│   │   ├── resume.ts
│   │   └── analytics.ts
│   ├── workers/
│   │   ├── job-scraper.ts        (fetches jobs every 6 hours)
│   │   ├── job-matcher.ts        (scores matches)
│   │   └── auto-apply.ts         (Puppeteer apply worker)
│   ├── portals/
│   │   ├── linkedin.ts           (LinkedIn Easy Apply flow)
│   │   ├── naukri.ts             (Naukri apply flow)
│   │   ├── indeed.ts             (Indeed apply flow)
│   │   ├── internshala.ts        (Internshala apply flow)
│   │   ├── foundit.ts            (Foundit/Monster apply flow)
│   │   ├── unstop.ts             (Unstop apply flow)
│   │   ├── apna.ts               (Apna apply flow)
│   │   ├── hirist.ts             (Hirist apply flow)
│   │   ├── jobhai.ts             (Job Hai apply flow)
│   │   ├── glassdoor.ts          (Glassdoor apply flow)
│   │   ├── workindia.ts          (WorkIndia apply flow)
│   │   ├── wellfound.ts          (Wellfound apply flow)
│   │   ├── form-detector.ts      (detect form fields)
│   │   ├── form-filler.ts        (fill with human-like typing)
│   │   ├── anti-detect.ts        (random delays, mouse, scroll)
│   │   └── browser-pool.ts       (rotate Browserless/BrowserBase/Apify/ScrapingBee)
│   ├── lib/
│   │   ├── encryption.ts         (AES-256 for portal passwords)
│   │   ├── queue.ts              (Bull queue setup)
│   │   └── gemini.ts             (AI helper)
│   └── prisma/
│       └── schema.prisma
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## Security

| Concern | Solution |
|---------|----------|
| Portal passwords | AES-256 encrypted at rest, never stored in plain text |
| Credential transmission | HTTPS only, encrypted payload |
| Session tokens | httpOnly cookies, 30-day expiry |
| Puppeteer isolation | Each user's browser session is isolated |
| Data deletion | User can delete all data + credentials anytime |
| No password sharing | Credentials never leave the server |
| Screenshot privacy | Apply screenshots auto-delete after 7 days |

---

## Release Plan

### Phase 1 — Foundation (Week 1-2)
- Project setup (React + Vite + Tailwind + Supabase)
- Auth (email + password)
- Resume upload + AI parser (Gemini)
- Preferences setup
- Mobile-first PWA layout

### Phase 2 — Job Feed (Week 3-4)
- Job scraper workers (LinkedIn RSS, Naukri, Indeed API)
- AI job matching engine
- Job queue UI (swipe cards)
- Job detail view
- Save / skip / approve flow

### Phase 3 — Auto-Apply Engine (Week 5-7)
- Puppeteer setup on backend
- Portal-specific apply flows (LinkedIn, Naukri, Indeed)
- Form detection + auto-fill
- Anti-detection measures
- Daily limit enforcement
- CAPTCHA detection + user notification
- Apply logging + screenshots

### Phase 4 — Tracker + Analytics (Week 8-9)
- Application pipeline board
- Status tracking (applied → viewed → interview → offer)
- Follow-up reminder system
- Analytics dashboard (charts, stats)
- Skill gap analyzer

### Phase 5 — AI Features (Week 10-11)
- AI cover letter generator
- Smart follow-up email drafts
- "Best time to apply" insights
- Job recommendation learning (from swipe patterns)

### Phase 6 — Polish + Launch (Week 12)
- Push notifications
- Offline support (view queue + tracker offline)
- PWA install prompt
- Dark mode
- Testing
- Deploy (Vercel + Railway)

---

## Comparison

| Feature | ApplyKaro | Simplify | LazyApply | Huntr | LinkedIn |
|---------|-----------|----------|-----------|-------|----------|
| Multi-portal | **13 portals** | 3 | 5 | 0 | 1 |
| AI job matching | Yes | No | No | No | Basic |
| Auto-apply | Yes (safe limits) | No (auto-fill only) | Yes (gets banned) | No | Easy Apply |
| AI cover letter | Yes | No | Generic | No | No |
| Application tracker | Yes | Basic | Basic | Yes | Basic |
| Skill gap analysis | Yes | No | No | No | No |
| Follow-up reminders | Yes | No | No | Yes | No |
| Offline support | Yes (PWA) | No | No | No | No |
| Hindi support | Yes | No | No | No | No |
| Price | Free | $9/month | $24/month | Free | Free |
| Open source | Yes | No | No | No | No |

---

## Target Users

- **Fresh graduates** — applying to 50+ jobs/week, need automation
- **Experienced devs** — don't have time to manually apply everywhere
- **Career switchers** — need AI to find matching jobs in new field
- **Tier 2-3 city candidates** — less access to job networks, need wider reach
- **Freelancers** — looking for full-time, applying while working

---

*Built by [Sandeep Pandey](https://github.com/Mrsandeep27)*
