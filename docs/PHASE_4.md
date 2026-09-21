# Phase 4 — Admin Console

## Status: Complete

## What was built

Organization administration for Pulse360, accessible only to `admin` users
under `/admin`:

- **Overview** (`app/admin/page.tsx`) — org name/slug/timezone, live counts of
  users, departments, and teams, plus the 8 most recently added users.
- **Departments** (`app/admin/departments/page.tsx`) — create, rename, and
  delete departments, with per-department team counts.
- **Teams** (`app/admin/teams/page.tsx`) — create, rename, reassign, and
  delete teams, showing their department.
- **Users** (`app/admin/users/page.tsx`) — create users (with initial
  password), edit name/role/department/team/manager/job title/location, reset
  passwords, and activate or deactivate accounts.
- **Settings** (`app/admin/settings/page.tsx`) — edit organization name, slug,
  and timezone.

## Architecture

- `lib/admin/actions.ts` — server actions. Every mutation reads the current
  session via `requireRole("admin")` and is scoped to the caller's
  `organizationId`; nothing trusts client-supplied IDs. Results follow a
  consistent `AdminActionResult` shape.
- `lib/validation/admin.ts` — all inputs validated with Zod on the server
  (email normalization, slug regex, role enum, password rules). Duplicate-key
  errors are surfaced with friendly messages referencing
  `users_organization_email_unique`.
- `lib/audit.ts` — every administrative write inserts a row into
  `auditLogs` (actor, action, target, metadata).
- `components/admin/*` — server page components plus a single client
  `forms.tsx` module (all forms, refetching via `router.refresh()` on success).
- `app/admin/layout.tsx` — gated by `requireRole("admin")`; non-admins are
  redirected to their role home.

## Security notes

- All authorization is enforced server-side from the authenticated session.
- Users cannot deactivate themselves (`setUserActive` blocks `targetId === actorId`).
- Audit log covers every admin action for accountability.

## Checks

- Lint: pass
- Typecheck: pass
- Unit tests: 39 passed (7 new for `admin-validation`, in `tests/unit/admin-validation.test.ts`)
- Build: pass
- E2E: 12 passed (`tests/e2e/admin.spec.ts` adds 4: manager is blocked from
  `/admin`; admin creates a department, team, and user; the new user can sign
  in but cannot reach admin; deactivating a user locks them out)

## Notes

- E2E specs use unique `Date.now()`-derived names/emails so repeated runs never
  collide on the org-scoped email unique index.
- Label matching in Playwright is substring-based and case-insensitive; admin
  tests use `{ exact: true }` and row-scoped locators to target the right
  create/rename form.