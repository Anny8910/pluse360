# Phase 8 — HR Workspace

## Status: Complete

## What was built

HR-only pages under `/hr` (`requireRole("hr")`):

- **HR Hub** (`app/hr/page.tsx`) — org overview: active employees, today's
  pulses, 7-day average/band, open concerns, total pulses, and the AI insight
  digest (Phase 10). Below-threshold aggregates render as "—".
- **Concerns** (`app/hr/concerns/page.tsx`) — log a concern (category,
  severity, visibility, anonymous flag), update status/severity, and add
  internal notes; listed newest first with reporter info.
- **Employees** (`app/hr/employees/page.tsx`) — roster with department/team,
  today's pulse status, and latest pulse.
- **Reports** (`app/hr/reports/page.tsx`) — generate a monthly report and view
  prior ones (month, status, avg sentiment, % positive/negative, generated
  at).

## Architecture

- `lib/validation/hr.ts` — Zod schemas for concerns, notes, and monthly
  reports.
- `lib/hr/actions.ts` — `createConcern`, `updateConcern`, `addHrNote`,
  `generateMonthlyReport`, and `computeOrgAggregate`; every action re-reads
  the session via `requireRole("hr")` and writes an `auditLogs` row (concern
  created/updated, note added, report generated).
- `lib/analytics/aggregate.ts` — shared aggregation used by reports and the HR
  hub; company-level metrics respect the 5-contributor threshold.
- Monthly reports upsert per `(organizationId, year, month)` and also persist
  a company `analyticsSnapshots` row for time-series comparison.

## Checks

- Lint: pass
- Typecheck: pass
- Unit tests: 54 passed
- Build: pass
- E2E: 19 passed (`tests/e2e/hr.spec.ts` adds: manager blocked from HR; HR
  logs/updates/notes a concern; employee roster loads; monthly report
  generation)