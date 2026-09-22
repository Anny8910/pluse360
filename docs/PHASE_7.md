# Phase 7 — Manager Team Dashboard

## Status: Complete

## What was built

A manager-only view (`app/manager/page.tsx`) aggregating their direct reports:

- **Members** — active users where `managerId = session user`, with team and
  department names, latest pulse (date · score), and a today "Recorded /
  Pending" badge.
- **KPI cards** — participation today (`x/y` and %), 7-day average sentiment,
  and 7-day positive rate.
- **7-day trend** — per-calendar-day average and the number of contributing
  pulses.
- **Threshold gate** — team analytics render only at 5+ active members
  (`MIN_TEAM_SIZE`); below that a notice explains when analytics unlock.
  Members are still listed individually (no hidden data, no rankings).

## Architecture

- `lib/analytics/aggregate.ts` — pure functions: `averageScore`,
  `participationRate`, `sentimentBands`, `trendSeries`, `meetsThreshold`;
  all return `null` when below the aggregation threshold.
- Access gated by `requireRole("manager")`; queries scoped to
  `organizationId` and the manager's own reports.

## Checks

- Lint: pass
- Typecheck: pass
- Unit tests: 54 passed (8 new in `tests/unit/analytics.test.ts`)
- Build: pass
- E2E: 19 passed (manager dashboard test in `tests/e2e/hr.spec.ts`)