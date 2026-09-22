# Phase 10 — AI Insights

## Status: Complete

## What was built

A deterministic insight layer that turns aggregate data into plain-language
narrative summaries, landing on the HR Hub:

- `lib/ai/insights.ts` — `buildInsights(opts)` composes:
  - **Participation** trend (this week vs last week, with the raw delta).
  - **Mood band shift** (share of positive/neutral/negative over the window).
  - **Top themes** derived from the one-dimensional mood-tag frequency
    breakdown.
  - Suggested actions only when there is enough signal (≥5 contributors).
- The optional `withAssistantImprovements` hook can run an LLM variant, but
  the default path requires no external key — everything is computed from
  `lib/analytics/aggregate.ts` outputs with the same threshold rules applied.

## Architecture

- Airbnb-style: functions stay pure and testable; no secret keys are needed
  for the shipped default.
- The HR hub renders insights only after the aggregation threshold passes;
  below threshold the copy defers gracefully with "—".

## Checks

- Lint: pass
- Typecheck: pass
- Unit tests: 54 passed (insight builders covered indirectly via
  `analytics.test.ts`); consistency asserted through the HR page in
  `tests/e2e/hr.spec.ts`.
- Build: pass
- E2E: 19 passed

## Notes

- Never ranks employees or surfaces individual scores; insights operate on
  aggregates only.