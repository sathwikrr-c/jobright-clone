# JobBot - AI-Powered Job Search & Auto-Apply

An AI-powered job search platform that monitors LinkedIn for new postings, matches them to your criteria, and auto-applies on company career portals via browser automation.

## Features

- **Job Feed** — Search and browse jobs with AI match scoring (0-100%)
- **Smart Criteria** — Full filter panel: job function, experience, salary, H1B, industry, skills, company stage
- **Resume Tailoring** — Claude AI rewrites your resume for each job, highlights key changes
- **Auto-Apply** — Playwright fills and submits applications on company portals (Greenhouse, Lever, Workday, Ashby)
- **Stealth Mode** — Fingerprint randomization, human-like typing, residential proxies, CAPTCHA solving
- **Orion AI Chat** — Ask questions about jobs, interview prep, salary negotiation
- **GitHub Actions Worker** — Runs every 5 minutes, polls for new jobs, auto-applies to matches

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **AI**: Anthropic Claude API (resume tailoring, match scoring, form answers)
- **Jobs API**: JSearch via RapidAPI
- **Database**: Supabase (criteria, profile, applications log)
- **Automation**: Playwright + playwright-extra + stealth plugin
- **Deployment**: Vercel (web app) + GitHub Actions (worker)

## Getting Started

```bash
# Install dependencies
npm install

# Copy env file and add your keys
cp .env.local.example .env.local

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | For AI features | Claude API key |
| `JSEARCH_API_KEY` | For real jobs | RapidAPI JSearch key |
| `SUPABASE_URL` | For persistence | Supabase project URL |
| `SUPABASE_ANON_KEY` | For persistence | Supabase anon key |
| `SUPABASE_SERVICE_KEY` | For worker | Supabase service role key |
| `PROXY_URL` | Optional | Residential proxy (`http://user:pass@host:port`) |
| `CAPTCHA_API_KEY` | Optional | 2Captcha or Anti-Captcha key |

Without API keys, the app runs with mock data (15 sample jobs).

## Auto-Apply Worker

The worker runs as a GitHub Actions cron job every 5 minutes:

1. Polls JSearch for new LinkedIn postings matching your criteria
2. Scores each job against your resume via Claude
3. Finds the company's direct career portal URL
4. Detects ATS type (Greenhouse, Lever, Workday, Ashby, etc.)
5. Opens Playwright with stealth mode, fills the application form
6. Takes a screenshot, logs the result

### Supported ATS Platforms

| ATS | Coverage | Detection Level |
|---|---|---|
| Greenhouse | ~30% of tech | Low |
| Lever | ~15% of tech | Low |
| Ashby | Growing | Low |
| Workday | ~20% of large co | Medium-High |
| Generic | Fallback | Claude-assisted |

### Anti-Detection

- Browser fingerprint randomization (viewport, UA, timezone)
- Human-like typing (50-150ms per key, occasional typo corrections)
- Bezier curve mouse movements
- Rate limiting (max 20/day, 2-5 min between apps)
- Residential proxy rotation
- CAPTCHA auto-solving (2Captcha/Anti-Captcha)
- Cookie persistence for session management

## Project Structure

```
src/
  app/                    # Next.js pages and API routes
    jobs/                 # Job feed (Recommended/Liked/Applied)
    profile/              # Criteria panel + personal info
    resume/               # Resume upload + AI tailoring
    agent/                # Orion AI chat
    settings/             # Auto-apply config
    api/                  # Backend routes
  components/             # React components
    layout/               # Sidebar, RightPanel
    jobs/                 # JobCard, MatchScoreRing, FilterBar
    criteria/             # Full criteria panel (7 components)
    resume/               # Resume editor
  lib/                    # API clients (JSearch, Claude, Supabase)
  worker/                 # Auto-apply worker
    apply/                # ATS-specific handlers
    utils/                # Stealth, human-like, proxy, captcha, cookies
  types/                  # TypeScript types
```
