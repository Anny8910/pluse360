# Pulse360 — Remaining Phase Prompts (P5–P10)

Build order continues after Phase 4 (Admin Console). UI/UX polish is deferred
per owner direction and will be phased later. Every phase keeps the standing
rules: server-side auth + Zod validation, org-scoped data, no public rankings,
no metrics below 5 contributors, no secrets in code.

## Phase 5 — Daily Pulse (Employee)
- Employee submits one 60-second pulse per calendar day: sentiment 1–5
  (+ labels), up to 3 mood tags from `MOOD_TAGS`, optional "best moment" and
  "what could be better" (≤500 chars each).
- Enforced server-side: one pulse per employee per day in the org's timezone
  (unique `(employee_id, pulse_date)`). Second submission is rejected with a
  friendly message.
- Route: `/employee/pulse`; employee workspace shows today's status
  (submitted / pending) with links to pulse, history, profile.
- Deliverables: `lib/validation/pulse.ts`, `lib/pulse/actions.ts`
  (`submitPulse`), `components/employee/pulse-form.tsx`,
  `components/employee/nav.tsx`, `/employee/pulse` page, updated employee home.
- Gates: lint, typecheck, unit tests for pulse validation + action guard,
  build, E2E (submit once, second submit rejected, history row appears).

## Phase 6 — Employee History & Profile
- `/employee/history`: the employee's past pulses (date, score, tags, notes)
  newest first, capped list.
- `/employee/profile`: read-only profile (role, job title, location,
  department, team, manager) plus notification preferences form (P9 fields).
- Gates: lint, typecheck, unit (history query building), build, E2E (history
  shows the submitted pulse; profile renders).

## Phase 7 — Manager Team Dashboard
- `/manager`: a manager+ page listing the user's direct reports (same org,
  active), each member's latest pulse and whether they submitted today, plus
  team participation rate and 7-day average sentiment.
- Aggregation threshold: team metrics render only when the team has ≥5 active
  members (per-day trend points also need ≥5 respondents that day). Below that,
  show a "not enough data" notice. No best/worst rankings; members listed
  alphabetically.
- Gates: lint, typecheck, unit (threshold + aggregation pure functions), build,
  E2E (manager reaches /manager, sees members).

## Phase 8 — HR Workspace
- `/hr`: org-wide participation and sentiment (threshold ≥5), counts.
- `/hr/employees`: all org users with department/team/manager and pulse status.
- `/hr/concerns`: create concern (category, description, anonymous toggle,
  visibility, severity) + list + status transition to
  resolved/reviewed/investigating/action_taken + severity update; HR notes.
- `/hr/reports`: monthly report generation (aggregation over the current month,
  threshold applied) writing `monthlyReports` + `analyticsSnapshots`; list of
  generated reports.
- Deliverables: `lib/validation/hr.ts`, `lib/hr/actions.ts`, `lib/analytics/`
  aggregation functions, HR pages, `components/hr/*` forms, `components/hr/nav.tsx`.
- Gates: lint, typecheck, unit (aggregation + threshold + concern validation),
  build, E2E (HR creates/reviews concern; report generates ≥ threshold).

## Phase 9 — Notifications & Reminders
- Employee notification preferences form (daily pulse reminder on/off,
  reminder time, channels email/slack/teams toggles) backed by
  `notificationPreferences`.
- Reminder engine: pure function computing which active users are due a
  reminder (prefs enabled, current time in candidate's reminder window, no
  pulse today, channel enabled); exposed via `lib/notifications/` and a
  `/api/cron/reminders` endpoint that records deliveries in the audit log
  (no external mail provider configured — logging only).
- Gates: lint, typecheck, unit (due-user selection logic), build.

## Phase 10 — AI Insights (fallback first)
- `lib/ai/insights.ts`: deterministic, rule-based plain-language insights from
  aggregation (participation, sentiment trend, concern load, recognition
  activity). If an LLM provider is configured later, it slots in behind the
  same `buildInsights` interface — no LLM key required to ship.
- Insights surface on the HR overview and in monthly reports.
- Gates: lint, typecheck, unit (insight strings from fixtures), build.

## Deferred
- UI/UX polish phase (visual system, animations, empty states, accessibility
review) — scheduled after P10 per owner.
- Production deployment is handled as part of this session (Vercel).