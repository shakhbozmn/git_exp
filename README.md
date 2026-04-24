# GitHub Repo Comparison Dashboard

A side-by-side GitHub repository comparison tool built with Next.js 16, React 19, and shadcn/ui.

## Features

- Compare two GitHub repositories side-by-side
- Displays stars, forks, open issues, watchers, language, license, and last push date
- Auto-fetches repositories on load from localStorage state
- Full error handling: not found, rate limited, network errors, unauthorized
- Dark/light theme support
- Persists compared repos across sessions via localStorage

## Tech Stack

- **Framework**: Next.js 16.2 (App Router, Turbopack)
- **UI**: shadcn/ui (new-york style, zinc palette) + Tailwind CSS v4
- **Language**: TypeScript (strict mode)
- **Package manager**: pnpm

## Getting Started

```bash
pnpm install
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

```bash
pnpm run dev        # Dev server (Turbopack)
pnpm run build      # Production build
pnpm run start      # Start production server
pnpm run lint       # ESLint (zero warnings)
npx tsc --noEmit    # Type check
npx vitest          # Unit tests
pnpm run e2e        # Playwright E2E tests
```

## CI

Pull requests trigger automated checks via GitHub Actions (`.github/workflows/pr-checks.yml`):

1. **Lint** — ESLint with zero warnings policy
2. **Type-check** — `tsc --noEmit`
3. **Build** — Next.js production build
4. **E2E** — Playwright tests against the production build

CI posts a summary comment on the PR and opens issues for any failures.

## Project Structure

```
src/
  app/                        # Next.js pages
  containers/
    repo-comparison/          # Main feature container
      components/             # RepoCard, RepoSearchInput, RepoMetricRow
      hooks/                  # useRepoComparison
  api/                        # fetchRepo (GitHub REST API)
  components/
    ui/                       # shadcn/ui primitives (do not modify)
    custom/                   # Shared custom components
  types/                      # github.ts, shared types
  config/                     # App routes, config
```
