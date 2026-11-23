# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

TipFair is a web app that lets small restaurants and cafés split pooled tips fairly and transparently.
Owners set pooling rules, managers enter each shift's tips and hours, and staff see their own shares
with a breakdown. It records splits but never moves real money.

Product requirements and acceptance criteria: @docs/PRD.md

Next.js version rules (read before writing any Next-specific code): @AGENTS.md

## Commands

```bash
npm run dev            # Next dev server on http://localhost:3000 (Turbopack)
npm run build          # production build
npm run lint           # ESLint (flat config, eslint-config-next core-web-vitals + typescript)
npm run typecheck      # tsc --noEmit
npm test               # Vitest, single run
npm run test:watch     # Vitest watch mode
npm run test:coverage  # V8 coverage over src/**

npx vitest run src/path/to/file.test.tsx   # run one test file
npx vitest run -t "test name"              # run tests matching a name
```

## Tech Stack

Installed now:
- Next.js 16 (App Router under `src/app/`) + React 19 + TypeScript (strict mode)
- Tailwind CSS v4
- Zod 4 for input validation
- Vitest 5 + React Testing Library (jsdom) for unit and integration tests

Planned (not installed yet — ask before adding, per the Do list):
- PostgreSQL (Neon free tier) + Prisma ORM
- Auth.js (NextAuth v5) with Google sign-in
- Playwright for end-to-end tests
- Deployed on Vercel (preview deploy per PR, production on merge to main)

Project state: still the create-next-app scaffold; no domain code or tests exist yet.

## Architecture Decisions
- **All money is stored and computed as integer cents.** Never use floating-point dollars anywhere.
- **The split engine is a pure function** in `src/lib/split/` with no database or framework imports.
  It is the most important code in the project and must stay fully unit-tested.
- Database access happens only in `src/server/` (server actions and data functions). Components never import Prisma.
- Role-based access (OWNER, MANAGER, STAFF) is checked on the server for every action, never only in the UI.
- Validate every external input with a Zod schema at the server boundary.

## Folder Structure
```
src/
  app/            # routes and pages (App Router)
  components/     # React UI components
  lib/split/      # pure tip-split engine (no I/O)
  lib/validation/ # Zod schemas
  server/         # server actions and DB access
prisma/           # schema and migrations
tests/e2e/        # Playwright tests
docs/             # PRD and other project docs
```

## Non-obvious Configuration
- Path alias `@/*` → `src/*` is defined in both `tsconfig.json` and `vitest.config.ts` — keep them in sync.
- Next 16 APIs differ from older versions: check `node_modules/next/dist/docs/` (`01-app/`, `03-architecture/`, …)
  before writing Next-specific code. Example already in use: global route-typed helpers like `LayoutProps<"/">`
  in `src/app/layout.tsx` (no import needed).
- `next.config.ts` enables **`cacheComponents`** and **`partialPrefetching`**. Cache Components changes
  data-fetching/caching semantics (dynamic-by-default, `"use cache"`, Suspense boundaries for uncached data) —
  read the relevant docs before adding data fetching or route segment config.
- **Tailwind is wired through a Turbopack loader rule** (`@tailwindcss/turbopack` on `*.css` in `next.config.ts`),
  not PostCSS — there is no `postcss.config`. Theme tokens live in `src/app/globals.css` via `@theme inline`.
- Vitest uses jsdom, `globals: true`, and loads jest-dom matchers in `vitest.setup.ts`. Only files matching
  `src/**/*.test.{ts,tsx}` are picked up, so colocate unit tests under `src/` (Playwright tests in `tests/e2e/`
  are intentionally outside that glob).

## Coding Conventions
- TypeScript strict; no `any`. Prefer explicit return types on exported functions.
- File names: `kebab-case.ts`; React components: `PascalCase.tsx`.
- Named exports only (except Next.js pages/layouts).
- Keep functions small; one responsibility per function.
- Commits follow Conventional Commits: `feat:`, `fix:`, `test:`, `refactor:`, `docs:`, `chore:`.
  During TDD, mark the phase: `test(split): ... [red]`, `feat(split): ... [green]`, `refactor(split): ... [refactor]`.

## Testing Strategy
- **TDD is required for business logic**: write a failing test, commit it, then write the minimum code to pass.
- Unit tests sit next to the code: `foo.ts` → `foo.test.ts`.
- Every split rule needs tests for: normal case, rounding leftovers, zero/empty input, invalid input.
- Key invariant: the sum of all shares must always equal the total, to the cent.
- Run `npm test` before every commit. Target 70%+ coverage.

## Do
- Do read the relevant files and the PRD before changing code.
- Do write or update tests in the same change as the code.
- Do keep the split engine pure and deterministic (same input → same output).
- Do ask before adding a new dependency.

## Don't
- Don't use floats for money.
- Don't read or print `.env` files or any secrets.
- Don't let MANAGER or OWNER roles receive a share of the tip pool (federal tip-pool rule).
- Don't edit a test to make it pass unless the test itself is wrong — explain why first.
- Don't commit directly to `main`; use a feature branch.
