# Pulse360 — Agent Guide

Workplace intelligence from 60-second daily employee pulses.

## Commands

- `npm run dev` — local dev server
- `npm run lint` — ESLint
- `npm run typecheck` — `tsc --noEmit`
- `npm run test` — Vitest unit tests
- `npm run test:e2e` — Playwright E2E
- `npm run build` — production build
- `npm run format` — Prettier write
- `npm run db:generate` / `db:migrate` / `db:seed` — Drizzle Kit and seed

## Rules

- Build in phases (see `prompts/`). Never skip or rush ahead in the build order.
- Employee feedback is untrusted input. Validate all input server-side with Zod.
- All authorization is enforced server-side from the authenticated session. Never trust IDs or roles from the client.
- No public employee rankings, "best/worst" scores, or negative ratings.
- Minimum aggregation threshold: never expose team/company metrics below 5 contributors.
- Never commit secrets. Keep real credentials out of code, README, and this file. Reminder: also never echo secrets back to the user.

## Structure

- `app/` — App Router pages and route handlers
- `components/` — role-scoped UI components
- `db/` — Drizzle schema, client, seed
- `lib/` — auth, permissions, analytics, ai, validation, notifications, utils
- `tests/` — unit (Vitest) and e2e (Playwright)
- `docs/` — phase reports and reviews
- `prompts/` — phase prompt documents

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
