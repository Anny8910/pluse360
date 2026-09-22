# Pulse360

Pulse360 is a workplace pulse-survey and wellbeing platform. Employees share a
quick daily check-in, teams and managers track sentiment over time, HR manages
concerns and period reports, and admins administer the org — all in one
role-based app.

This repository contains the full application: authentication, daily pulses,
teammate recognition, concerns, per-employee analytics, PDF report generation,
notification reminders, an admin console, and PWA support.

## Features

### Employee portal
- **Daily pulse check-in** — rate your day 1–5, pick mood tags, share your
  best moment, and suggest a "could be better" improvement.
- **Recognize a teammate** — optionally select a colleague, choose a
  recognition category (10 supported), and leave a note.
- **History** — a personal calendar/table of your past pulses, mood tags, and
  trends (average, high/low, streak).
- **Profile** — edit your details and set notification preferences (reminder
  time, email/Slack/Teams channels).

### Manager portal
- Team roster with filters; weekly/period team sentiment, participation, and
  trends; per-employee pulse views.
- Recognitions given and received for your team.

### HR / People-Ops portal
- **Dashboard** — company participation, average pulse, sentiment bands, mood
  tags, recognitions, open concerns, and prose insights. Insights unlock once
  at least **5 active employees** participate (privacy threshold).
- **Employees** — searchable roster (name, email, role, department, team,
  manager) with active counts, plus a per-employee **pulse log**: weekly
  snapshot, submissions, average mood, relationship signals (recognitions
  given/received), and mood tags across 7/30/90-day or custom periods.
- **Generate per-employee PDF report** — one click on any employee profile
  downloads a branded A4 PDF of the selected period.
- **Concerns** — inbox for anonymous or attributed concerns with category,
  severity, and status workflow, plus private HR notes.
- **Reports** — monthly company reports summarizing participation, sentiment,
  concerns, and recognitions, each downloadable as a PDF.

### Admin console
- **Users** — create, edit, activate/deactivate, and change roles
  (employee/manager/hr/admin).
- **Departments & Teams** — manage the org hierarchy.
- **Settings** — organization name, slug, and timezone.

### Platform
- **Auth** — email/password via Better Auth; sign-up disabled, accounts are
  provisioned by admins. Server-side authorization on every route and API.
- **Notifications** — a cron-triggered reminder pipeline sends daily pulse
  reminders to users who haven't yet checked in.
- **PWA + theming** — installable to the home screen, light/dark theming.
- **Audit log** — key organizational events are recorded.

## Tech stack

| Layer    | Technology |
| -------- | ---------- |
| Framework | Next.js (App Router), React 19, TypeScript |
| Styling  | Tailwind CSS v4, `@base-ui/react` / `shadcn` components |
| Auth     | Better Auth (email/password, drizzle adapter) |
| Database | PostgreSQL via Neon (serverless-http driver) + Drizzle ORM |
| PDFs     | `pdf-lib` |
| Validation | Zod |
| Tests    | Vitest (unit) + Playwright (E2E) |
| Deployment | Vercel |

## Getting started

### Prerequisites
- Node.js 20+ (`engines` field in `package.json`)
- A PostgreSQL database (a free [Neon](https://neon.tech) project works)

### 1. Install and configure

```bash
npm install
cp .env.example .env.local   # or create .env.local manually
```

`.env.local` requires:

```bash
DATABASE_URL=postgres://...                # your Neon connection string
AUTH_SECRET=<random 32+ char secret>       # generate: openssl rand -base64 32
AUTH_URL=http://localhost:3000             # origin of this deployment
NEXT_PUBLIC_APP_URL=http://localhost:3000  # public origin (client-side)
CRON_SECRET=<random secret>                # guards /api/cron/reminders
# Optional:
# AI_API_KEY=<OpenAI key>                  # richer English insights if present
```

### 2. Create the schema and seed demo data

```bash
npm run db:push     # push schema to the database (or: npm run db:migrate)
npm run db:seed     # load the demo org — DESTRUCTIVE, wipes seeded tables first
```

### 3. Run it

```bash
npm run dev          # http://localhost:3000
```

Sign in with any demo account (password `Pulse360@Dev1`).

## Demo accounts

All data is **invented** — no real person or organization is used. Seeding is
deterministic for the given date range, producing ~22 users, ~90 days of
pulses, ~60 days of recognitions, concerns, HR notes, and analytics snapshots.

| Role | Name | Email |
| ---- | ---- | ----- |
| Admin | Ananya Sharma | `ananya.sharma@pulse360.dev` |
| HR | Rohan Kapoor | `rohan.kapoor@pulse360.dev` |
| HR | Priya Menon | `priya.menon@pulse360.dev` |
| Manager (Engineering) | Arjun Gupta | `arjun.gupta@pulse360.dev` |
| Manager (Sales) | Meera Rao | `meera.rao@pulse360.dev` |
| Manager (Marketing) | Vikram Iyer | `vikram.iyer@pulse360.dev` |
| Manager (Operations) | Sneha Chopra | `sneha.chopra@pulse360.dev` |
| Employee | Kabir Patel | `kabir.patel@pulse360.dev` |

Each role lands on its own portal (e.g. HR on `/hr`, managers on `/manager`,
admins on `/admin`).

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start the dev server (Next.js) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type check |
| `npm run format` | Prettier write |
| `npm run test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright, starts its own server on :3100) |
| `npm run db:generate` | Generate a Drizzle migration file |
| `npm run db:migrate` | Apply migrations |
| `npm run db:push` | Push schema directly (dev convenience) |
| `npm run db:studio` | Drizzle Studio GUI |
| `npm run db:seed` | Seed the demo dataset |

## Testing

- **Unit** (`npm run test`) — validation schemas, business logic, date helpers,
  insight generation. Currently ~60 cases.
- **E2E** (`npm run test:e2e`) — Playwright suites covering sign-in and RBAC,
  admin console, employee daily pulse / history / profile, manager dashboard,
  and the full HR workspace (concerns, roster search, per-employee pulse log,
  PDF downloads). ~21 scenarios.
- Gate: `npm run lint && npm run typecheck && npm run test && npm run build`
  before shipping.

## Project structure

```
app/
  (auth)/login/          Sign-in
  admin/                 Admin console (users, departments, teams, settings)
  employee/              Daily pulse, history, profile
  hr/                    HR dashboard, concerns, employees, reports
  manager/               Manager dashboard
  api/                   Auth, cron reminders, HR report PDF endpoints
components/              UI components (employee pulse form, tables, cards)
db/
  schema/                Drizzle tables + canonical constants
  seed.ts                Demo data seeder
  index.ts               Database client
lib/
  auth/                  Better Auth server + client config
  pulse/                 Submission actions + validation
  hr/                    Insights, roster logic, per-employee report data
  ai/                    (Optional) prose insight enhancement
  notifications/         Reminder engine (due channels, candidates)
  utils/date.ts          Timezone-safe date helpers
docs/                    Phase-by-phase build documents
tests/
  unit/                  Vitest suites
  e2e/                   Playwright specs
```

## Deployment

This app is designed for Vercel.

1. Push the repo and import it as a Vercel project.
2. Add the environment variables from `.env.local` to the project
   (production + preview), using the deployed URL for `AUTH_URL` /
   `NEXT_PUBLIC_APP_URL`.
3. Deploy (`vercel --prod`). Next.js handles the serverless functions
   (including the PDF routes) automatically.
4. Schedule the reminder cron against `/api/cron/reminders` with header
   `Authorization: Bearer <CRON_SECRET>`. On Vercel, add a Cron Job hitting
   that path (e.g. every 15 minutes is a good default; the pipeline no-ops
   until each user's configured reminder time).

Auth sessions use database-backed cookies, so no extra server state is needed.