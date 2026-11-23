# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

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

## Stack and project state

- Next.js 16 App Router under `src/app/`, React 19, TypeScript strict, Tailwind CSS v4, Zod 4. The app is still the create-next-app scaffold; no domain code or tests exist yet.
- Path alias `@/*` → `src/*` (defined in both `tsconfig.json` and `vitest.config.ts` — keep them in sync).
- Per AGENTS.md, Next 16 APIs differ from older versions: check `node_modules/next/dist/docs/` (`01-app/`, `03-architecture/`, …) before writing Next-specific code. Example already in use: global route-typed helpers like `LayoutProps<"/">` in `src/app/layout.tsx` (no import needed).

## Non-obvious configuration

- `next.config.ts` enables **`cacheComponents`** and **`partialPrefetching`**. Cache Components changes data-fetching/caching semantics (dynamic-by-default, `"use cache"`, Suspense boundaries for uncached data) — read the relevant docs before adding data fetching or route segment config.
- **Tailwind is wired through a Turbopack loader rule** (`@tailwindcss/turbopack` on `*.css` in `next.config.ts`), not PostCSS — there is no `postcss.config`. Theme tokens live in `src/app/globals.css` via `@theme inline`.
- Tests: Vitest with jsdom, `globals: true`, jest-dom matchers loaded in `vitest.setup.ts`. Only files matching `src/**/*.test.{ts,tsx}` are picked up, so colocate tests under `src/`.
