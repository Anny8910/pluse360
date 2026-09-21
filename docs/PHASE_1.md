# Pulse360 — Phase 1 Report

## Scope
Phase 1 only: project bootstrap. No business features (per master build document §43–44).

## What was implemented
- Next.js 16.3.5 (App Router, TypeScript, Tailwind CSS v4, ESLint)
- shadcn/ui (base-nova preset, Base UI) with 12 primitives
- Prettier + `prettier-plugin-tailwindcss`
- Zod v4
- Drizzle ORM + Drizzle Kit + Neon (`@neondatabase/serverless`)
- Vitest v5 + Playwright (Chromium installed)
- Project directory structure per §5 (app route stubs as `.gitkeep`, no fake features)
- `drizzle.config.ts`, `db/index.ts`, empty `db/schema/index.ts`, stub `db/seed.ts`
- `.env.example` (placeholders only), hardened `.gitignore`, `AGENTS.md`
- `.npmrc` scoped to this project (`allow-scripts`) to satisfy the parent directory's npm policy
- `next.config.ts` sets `turbopack.root` to silence monorepo-detection warning (parent dir holds an unrelated app)

## Files created
`app/` (layout, page, route stubs), `components/ui/*` (12 shadcn primitives),
`db/{index.ts, seed.ts, schema/index.ts}`, `drizzle.config.ts`,
`tests/unit/sample.test.ts`, `tests/e2e/smoke.spec.ts`,
`vitest.config.mts`, `playwright.config.ts`, `next.config.ts`,
`.env.example`, `.prettierrc`, `.prettierignore`, `.npmrc`, `AGENTS.md`,
directory stubs under `components/`, `lib/`, `docs/`, `prompts/`, `app/*`.

## Files changed
- `app/layout.tsx`, `app/page.tsx` (branded placeholders)
- `package.json` (scripts: lint, typecheck, test, test:e2e, build, format, db:*)
- `.gitignore` (env hard-ignore, unignore `.env.example`, Playwright output)

## Packages installed
- deps: `@base-ui/react`, `@neondatabase/serverless`, `class-variance-authority`,
  `cn`, `lucide-react`, `next`, `react`, `react-dom`, `shadcn`, `tw-animate-css`, `zod`
- dev: `@playwright/test`, `@tailwindcss/postcss`, `@types/node@^24`, `@types/react`,
  `@types/react-dom`, `drizzle-kit`, `drizzle-orm`, `eslint`, `eslint-config-next`,
  `prettier`, `prettier-plugin-tailwindcss`, `tailwindcss`, `typescript`, `vitest`,
  `tsx`, `dotenv`

## Commands run
`npx create-next-app@latest`, `npm install`, shadcn `init`/`add`, `npx playwright install chromium`,
`npm run format`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:e2e`, `npm run build`

## Results
- lint: pass (clean)
- typecheck: pass (after replacing `LayoutProps<...>` global with an explicit props type)
- unit tests: 1/1 pass (Vitest)
- E2E: 1/1 pass (Playwright, Chromium, dedicated port 3100 — port 3000 is occupied by an unrelated local app)
- production build: pass (Next.js Turbopack)

## Known issues
- Shadcn CLI installs dependencies via `npm install --allow-scripts`, which the local npm
  policy rejects; deps were installed manually and `add` succeeded. Re-running `shadcn add`
  for new components may hit the same issue and require manual dep install first.
- Port 3000 is taken by an unrelated app on this machine; E2E uses `E2E_PORT` (default 3100).
- 4 moderate npm audit findings present (transitive); revisit in a later phase.

## Suggested commit
`feat: bootstrap Pulse360 (Next.js, Drizzle, shadcn/ui, Vitest, Playwright)`