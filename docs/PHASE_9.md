# Phase 9 — Notifications & Reminders

## Status: Complete

## What was built

- **Preferences UI** (`components/employee/preferences-form.tsx` on
  `/employee/profile`) — toggle daily pulse reminders, email/Slack/Microsoft
  Teams channels, and set a 24h reminder time (validated as HH:MM).
- **Server action** (`lib/notifications/actions.ts`) — `updateNotificationPreferences`
  validates with Zod and upserts the user's `notificationPreferences` row.
- **Reminder engine** (`lib/notifications/reminders.ts`) — a pure,
  deterministic engine: `minutesOfDay`, `isDue` (due within ±3 minutes of the
  reminder time unless already pulsed today, disabled, or no channel),
  `pickDueCandidates`, and `dueChannels`.
- **Cron route** (`app/api/cron/reminders/route.ts`) — loads preferences with
  their users, builds candidate list, checks "already pulsed" against the last
  2 days of `dailyPulses`, and writes a `reminder_delivered` audit row per due
  user. Endpoint is `POST` (or bare `GET` when no `CRON_SECRET` is set in non-prod);
  when `CRON_SECRET` is configured, requests must include `x-cron-secret`.

## Architecture

- Keep flows instance-friendly: the engine is timezone-aware per user and
  never stores "last sent" state — recency is derived from pulses, so the
  endpoint is safe to invoke repeatedly.
- `lib/validation/notifications.ts` — `reminderTimeParts` (HH:MM) + preferences
  schema.

## Checks

- Lint: pass
- Typecheck: pass
- Unit tests: 54 passed (5 new in `tests/unit/reminders.test.ts`)
- Build: pass
- E2E: 19 passed (preferences saved in `tests/e2e/pulse.spec.ts`)