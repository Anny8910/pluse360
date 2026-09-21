# Pulse360 — Phase 2 Report

## Scope
Phase 2 only: Neon PostgreSQL + Drizzle schema, relations, constraints, indexes,
migrations, and realistic fake development seed data. No UI.

## Schema implemented (§14)
All 13 tables: organizations, departments, teams, users, daily_pulses, recognitions,
concerns, concern_mentions, hr_notes, monthly_reports, analytics_snapshots,
audit_logs, notification_preferences.

Key design points:
- UUID primary keys everywhere (`gen_random_uuid()`).
- Timestamps (`created_at` / `updated_at`) with timezone on every table.
- Postgres enums for role, concern visibility, concern status, concern severity,
  report status, analytics scope type.
- JSONB for mood tags, report JSON, and metadata columns.
- Every org-scoped table carries an `organization_id` FK to `organizations`
  (organization isolation by design). Named `*_fk` foreign keys.

## Constraints
- `daily_pulses_employee_date_unique` — one pulse per employee per day.
- `daily_pulses_sentiment_range` — sentiment 1..5.
- `recognitions_no_self` — giver ≠ recipient.
- `users_organization_email_unique` — unique email within an organization.
- `concern_mentions_concern_employee_unique`, `monthly_reports_org_year_month_unique`,
  `notification_preferences_user_id_unique`, `organizations_slug_unique`.

## Indexes (§15)
All required indexes created: daily_pulses(employee,date), daily_pulses(org,date),
recognitions(recipient,date), recognitions(giver,date), recognitions(org,date),
concerns(org,created), concerns(status,created), users(org,department),
users(org,team), analytics_snapshots(org,date). Plus audit_logs and hr_notes indexes.

## Relations
Full `relations()` graph in `db/schema/relations.ts` (org → children,
user → manager/reports/recognitions given & received/pulses/concerns/preferences,
concern → mentions/hr-notes/reporter, etc.).

## Migrations
- `npm run db:generate` → `drizzle/0000_military_next_avengers.sql`
- Applied to Neon with `npm run db:migrate` (serverless driver) — applied successfully.

## Seed data (§42)
`db/seed.ts` — deterministic PRNG, destructive-reset, fake data only:
- Organization: Pulse360 Demo Company (slug `pulse360-demo`, tz Asia/Kolkata)
- Departments: Engineering, Sales, Marketing, Operations
- Teams: Frontend, Backend, Enterprise Sales, Growth, Operations
- 26 users: 1 admin, 2 HR, 4 managers (+1 report per role), 19 employees
- 1,156 daily pulses over ~90 days
- 80 recognitions over ~60 days
- 16 concerns + 1 mention + 13 HR notes (varied status/severity/visibility)
- 30 company-level analytics snapshots
- Sample audit log entries
- Notification preferences for every user

## Live constraint verification
One-off script against Neon confirmed (then cleaned up):
- Duplicate daily pulse → blocked (`duplicate key value violates unique constraint
  "daily_pulses_employee_date_unique"`)
- Self-recognition → blocked (check constraint)
- Unknown/cross-org FK → blocked (`foreign key` violation)
- Valid recognition → inserted OK

## Tests
New unit tests (all DB-free):
- `constants.test.ts` — option lists match the master document
- `schema.test.ts` — table/column structure, UUID PKs, org scoping
- `migration.test.ts` — generated SQL contains required constraints and indexes
Total: 21 tests passing across 4 files.

## Commands run
`npm run db:generate`, `npm run db:migrate` (with env from `.env.local`),
`npm run db:seed`, live constraint probes, `npm run lint`, `npm run typecheck`,
`npm run test`, `npm run build`.  All pass.

## Known issues
- Seed snapshot concern_count uses total concern count (constant per day) rather
  than per-day counts — acceptable for demo data; revisit when analytics service
  lands in Phase 7.
- `.env.local` (real Neon connection string) is gitignored and never committed.
  The credential was provided for local configuration per §58; rotate it since it
  was originally exposed in chat.
- Migration file name `0000_military_next_avengers.sql` is auto-generated.

## Suggested commit
`feat: add database schema, migrations, and seed data`