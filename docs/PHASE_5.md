# Phase 5 — Daily Pulse

## Status: Complete

## What was built

A 60-second daily employee check-in, one submission per day per employee:

- **Submit** (`app/employee/pulse/page.tsx`) — sentiment score (1–5 with
  labels), up to 3 mood tags, optional "best moment" and "what could be
  better" notes (500 chars each). After a submission the page switches to a
  read-only "Pulse recorded" summary with a link back to history.
- **Server action** (`lib/pulse/actions.ts`) — `submitPulse` validates with
  Zod, sanitizes mood tags against the fixed allow-list, rejects a second
  submission for the same employee on the same org-local day, and
  `revalidatePath`s `/employee` on success.
- **Employee home** (`app/employee/page.tsx`) — shows today's pulse status, a
  "Record today's pulse" entry point (only when none exists today), a streak
  counter of total pulses, and the role-scoped nav.

## Architecture

- `lib/validation/pulse.ts` — `pulseSchema` (scores 1–5, ≤3 tags, lengths) and
  `sanitizeMoodTags`; employee input is treated as untrusted.
- `lib/utils/date.ts` — org-local "today" helpers (`nowInTimezone`, `todayKey`,
  `daysAgoKey`, `formatDateKey`) plus `utcDateKey` to convert an org-local
  calendar day into the UTC `date` value stored in `dailyPulses`.

## Checks

- Lint: pass
- Typecheck: pass
- Unit tests: 54 passed (7 new in `tests/unit/pulse-validation.test.ts`; E2E in `pulse.spec.ts`)
- Build: pass
- E2E: 19 passed overall, including the fresh-user pulse flow in
  `tests/e2e/pulse.spec.ts`

## Notes

- Reports the one-per-day rule prevents duplicates: the action re-checks the
  existing row server-side rather than relying on the disabled form.
- The `date`-mode Drizzle column required UTC midnight `Date` values; all
  comparisons route through `utcDateKey`.