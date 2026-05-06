# ApplyKaro — Platforms Roadmap

Single source of truth for what portals/job boards we want to add to ApplyKaro and where each one stands.

Currently wired up: **Naukri** (web scrape + auto-apply via Puppeteer with saved Chrome session).

---

## Tier A — Easiest wins (public JSON / RSS, no headless browser needed)

These have public APIs that return job listings as structured data. Each is roughly **~80–120 lines** of new server code (one scraper module + one `apply` stub).

| # | Site | Endpoint | Auto-apply? | Notes |
|---|------|----------|-------------|-------|
| A1 | **RemoteOK** | `https://remoteok.io/api` (JSON, no auth) | ❌ — redirects to company site | Fastest possible add. Pure JSON list. |
| A2 | **Remotive** | `https://remotive.com/api/remote-jobs` (JSON, no auth) | ❌ — redirects to company site | Already in `PORTALS` list as a stub. |
| A3 | **We Work Remotely** | RSS per category (e.g. `/categories/2-programming-jobs.rss`) | ❌ — redirects | Tech roles only on most categories. |
| A4 | **Jooble** | `https://jooble.org/api/<key>` (free key, ~500 req/day) | ❌ — redirects | Aggregator; lots of duplication with Naukri/Indeed. |

**Apply caveat**: All Tier A boards send users to the *employer's own* site for the actual application. So we can pull jobs into the feed and score them, but auto-submission is only possible per-employer (very fragile). Treat these as a way to **broaden the discovery surface** while Naukri remains the auto-apply workhorse.

---

## Tier B — Medium effort (HTML scraping, Puppeteer)

Same pattern as Naukri. Requires a saved logged-in session (`userDataDir`) plus brittle CSS selectors.

| # | Site | Why worth it | Apply pattern |
|---|------|--------------|---------------|
| B1 | **Internshala** | Native web apply with profile + cover letter; ideal for fresher use case (matches your persona) | Click "Apply now" → fill cover letter → submit |
| B2 | **Wellfound (AngelList)** | Already in `PORTALS` list. Strong startup roles. | Easy Apply on most listings |
| B3 | **Foundit (Monster)** | Already in `PORTALS` list. Same kind of profile-driven apply as Naukri | Click apply → confirm |
| B4 | **LinkedIn Easy Apply** | Highest-volume portal but very strict bot detection | Multi-step modal — needs careful selector work |
| B5 | **Indeed** | Aggregator + native apply | Mostly redirects; some "Apply with Indeed" inline |
| B6 | **Glassdoor** | Login + bot-hostile | Last priority |

---

## Tier C — Recruitment agencies (referenced in reel @aiwithdivyam)

Not job boards — these are agencies that match candidates to MNC roles. The reel's pitch: "they only profit if you get hired, so they push your CV harder than algorithms do."

The play here is **registration + CV upload**, not auto-apply per-listing.

| Agency | Site | What we'd do |
|---|---|---|
| **Randstad** | randstad.in | Register profile, upload resume, set preferences |
| **ABC Consultants** | abcconsultants.in | Same — profile + resume |
| **Kelly Services** | kellyservices.co.in | Same |
| **ManpowerGroup** | manpowergroup.co.in | Same |
| **TeamLease** | teamlease.com | Register + apply per listing |
| **Michael Page** | michaelpage.co.in | Premium; profile + interview-driven |

**Build approach**: A "register me on these agencies" one-time flow — opens each agency's site, user fills profile manually (not auto), and we record which agencies the user is registered with. After that, **monitoring** (not auto-applying) — periodically check each agency's portal for messages/new matches.

---

## Tier D — Specialized boards (from reel @abhishekranjan714)

Frame-OCR'd from the reel "40 less crowded websites for remote internship, job, or freelance projects". Useful for niche use cases.

### Already covered in Tier A or PORTALS list
Indeed · Glassdoor · FlexJobs · WeWorkRemotely · Remote.com · Remotive · RemoteOK · AngelList/Wellfound

### Marketplaces (wrong model — not job boards)
Upwork · Freelancer · Fiverr · Guru · Toptal · CloudPeeps · TaskRabbit

### Aggregators (lots of overlap with Naukri/Indeed)
Talent.com · Jooble · SimplyHired · Hireable · TheMuse

### Niche remote-only
VirtualVocations · WorkingNomads · DRemote · Jobspresso · OnlineJobs.ph · SkipTheDrive · JustRemote · RemoteWorkHub · Jobbatical · Hubstaff Talent · Hired · Zirtual

### Writing / design
FreelanceWritingGigs · ContentWritingJobs · Problogger.com/jobs · Behance · Designhill

### Defunct / not worth
StackOverflow Jobs (shut down 2022)

---

## Priority order I'd ship

1. **RemoteOK + Remotive** (Tier A1, A2) — both ~2 hours each, public JSON, doubles your job discovery surface immediately.
2. **Internshala** (B1) — matches your fresher/early-career persona; reliable web apply.
3. **Wellfound** (B2) — high-quality startup roles, Easy Apply.
4. **Recruitment-agency registration flow** (Tier C) — different shape from auto-apply but high-leverage; do this when you want long-term passive coverage.
5. **LinkedIn Easy Apply** (B4) — highest reward, highest fragility. Don't do until everything else is solid.

---

## Source attributions

- 6 recruitment agencies — Instagram reel by @aiwithdivyam (`reel/DXzJJkOtACL`)
- 39 remote/job boards — Instagram reel by @abhishekranjan714 (`reel/DX4DAtJJRxm`)
- Frame-OCR'd directly via Claude Code, audio-transcribed via Gemini 2.5-flash; reel MP4s archived in `server/data/reels/`.

---

*Last updated: 2026-04-23*
