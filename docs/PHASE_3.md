# Pulse360 — Phase 3 Report

## Scope
Phase 3 only: email/password authentication (Better Auth) wired to the existing
PostgreSQL stack, server-side RBAC, login flow, role-gated placeholders, and
credential provisioning for seed users. No product dashboards yet.

## Auth provider
Better Auth v1.7.5 (the master document's endorsed choice) with the official
Drizzle adapter (`@better-auth/drizzle-adapter`, provider `pg`).

Integration decisions (validated against the live adapter):
- The Better Auth `user` model is mapped **onto our existing `users` table**
  (`schema: { user: users, session, account, verification }`) so auth identity
  and the employee profile stay in one row. `camelCase: true` resolves our
  camelCase Drizzle properties; DB columns remain snake_case.
- `advanced.database.generateId: "uuid"` makes Better Auth emit UUID strings,
  so `session.userId` / `account.userId` (uuid columns) FK cleanly to users.id.
- `transaction: false` (Neon HTTP driver doesn't participate in transactions).
- `emailAndPassword.disableSignUp: true` — no public sign-up; users are
  provisioned by seed/admin only.
- `email_verified` + `image` columns added to `users` (standard Better Auth user
  fields); profile columns (`role`, `organization_id`, `department_id`,
  `team_id`, `manager_id`, `job_title`, `location`) exposed via
  `additionalFields` (input: false) so they appear in the session user.

## Schema changes
New migration `drizzle/0001_bright_toad.sql` (applied to Neon):
- `users` += `email_verified` (bool, not null, default false), `image` (text)
- `session` (token unique, cascade to users, expires_at + user_id indexes)
- `account` (unique provider_id+account_id, cascade to users, password hash
  column, user_id index)
- `verification` (identifier + expires_at indexes)
- `relations.ts` extended (user ↔ session/account; auth FKs cascade on user
  delete).

## Files added/changed
- `lib/auth/index.ts` — Better Auth server config (drizzle adapter + schema map)
- `lib/auth/client.ts` — typed `authClient` (inferAdditionalFields)
- `lib/auth/actions.ts` — server actions `signIn` / `signOut`
- `app/api/auth/[...all]/route.ts` — Better Auth REST handler
- `lib/permissions/rules.ts` — pure RBAC (ranked roles, capability helpers)
- `lib/permissions/index.ts` — session → fresh DB row, `getCurrentUser`,
  `requireAuth`, `requireRole` (redirect-based)
- `lib/validation/auth.ts` — Zod `signInSchema`
- `components/auth/login-form.tsx`, `components/auth/sign-out-button.tsx`
- `app/page.tsx` — auth-aware redirect (role home or /login)
- `app/(auth)/login/page.tsx` + `(auth)/layout.tsx`
- `app/employee/page.tsx`, `app/hr/page.tsx`, `app/admin/page.tsx` — role-gated
  placeholders (server-side enforcement)
- `db/seed.ts` — `emailVerified: true` + credential accounts for all 26 users
- `.env.local` += `AUTH_SECRET`, `AUTH_URL`, `NEXT_PUBLIC_APP_URL`
  (AUTH_SECRET generated locally, never printed or committed)

Role hierarchy (§28): employee < manager < hr < admin. HR module requires hr+,
admin module requires admin; account is blocked (redirect to role home) when
`active` is false.

## Seed credentials (dev only)
Every seed user has a Better Auth credential account (`providerId: credential`,
`accountId = user.id` — the exact lookup shape Better Auth uses) with a shared
fake password `Pulse360@Dev1` hashed with Better Auth's own `hashPassword`.
Example accounts (also used by E2E):
- admin: `ananya.sharma@pulse360.dev`
- hr: `rohan.kapoor@pulse360.dev`
- manager: `arjun.gupta@pulse360.dev`
- employee: `kabir.patel@pulse360.dev`

This password is a dev fixture for fake users only, never a production secret.

## Tests
- New `tests/unit/permissions.test.ts` (7 tests): role ordering, hasRole truth
  table, HR/admin module gating, analytics/employee-data gating, cross-org
  denial, role-home mapping. Pure rules module keeps the DB out of unit tests.
- `tests/unit/schema.test.ts` extended (+3): auth fields on users, session /
  account / verification tables.
- New `tests/e2e/auth.spec.ts` (7 tests): anonymous redirect, bad password,
  employee/manager blocked from HR+admin, HR blocked from admin, admin reaches
  both, sign-out. Updated `smoke.spec.ts` for the auth redirect on `/`.
- Live integration probe: `auth.api.signInEmail` returns the admin user with
  role/org and rejects a wrong password (logged "Invalid password").

## Commands run
`npm run db:generate`, `npm run db:migrate`, `npm run db:seed`, `npm run lint`,
`npm run typecheck`, `npm run test` (32 passing), `npm run build`,
`npm run test:e2e` (8 passing). All green.

## Known issues
- The app is served on port **3100** (3000 is occupied by an unrelated local
  app), so `AUTH_URL` / `NEXT_PUBLIC_APP_URL` point at `http://localhost:3100`.
  Run dev/E2E as `npm run dev -- --port 3100`.
- Role/org live in the session user (written from the DB at login); guards do a
  fresh DB read each request to also enforce `active`.
- Better Auth treats email as globally unique; with multiple organizations a
  future phase must scope by `unique(organization_id, email)` — noted as an MVP
  constraint (single-org demo today).
- 4 moderate transitive npm audit findings remain (pre-existing).

## Suggested commit
`feat: add authentication and RBAC`