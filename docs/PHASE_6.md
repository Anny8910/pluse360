# Phase 6 — History & Profile

## Status: Complete

## What was built

- **History** (`app/employee/history/page.tsx`) — the employee's last 60
  pulses, newest first, showing date, sentiment badge, mood tags, best moment,
  and improvement note.
- **Profile** (`app/employee/profile/page.tsx`) — the employee's own details
  (email, role, job title, location, department, team, manager name) drawn
  server-side with their relations, plus an account status badge.

## Architecture

- Both pages use `requireAuth` and scope all queries to the signed-in user's
  `id`; no client ids are trusted.
- Route-level layout persistence is provided by `components/employee/nav.tsx`
  (Dashboard / Pulse / History / Profile / Team).

## Checks

- Lint: pass
- Typecheck: pass
- Unit tests: 54 passed
- Build: pass
- E2E: 19 passed (history row asserted in `tests/e2e/pulse.spec.ts`)