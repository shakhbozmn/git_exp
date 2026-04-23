# GitHub Repository Comparison Dashboard — System Overview

**Project name**: `git_exp`
**Type**: Single-page client-side app — no backend, no auth, no database
**Stack**: Next.js 16.2.1 / React 19 / TypeScript strict mode, Tailwind CSS v4 via PostCSS, shadcn/ui (new-york zinc), pnpm

---

## Architecture

| Layer | Path | Purpose |
|-------|------|---------|
| Page | `src/app/page.tsx` | Thin RSC wrapper rendering `<RepoComparisonContainer />` |
| Container | `src/containers/repo-comparison/RepoComparisonContainer.tsx` | Orchestrates comparison UI, winner logic, preset pairs |
| Hook | `src/containers/repo-comparison/hooks/useRepoComparison.ts` | All state, localStorage, URL sync, AbortControllers |
| API | `src/api/fetchRepo.ts` | GitHub REST API call with full error triage |
| Types | `src/types/github.ts` | `GitHubRepo`, `RepoFetchState`, `RepoFetchError` |
| Components | `src/containers/repo-comparison/components/` | `RepoCard`, `RepoSearchInput`, `RepoMetricRow` |
| Utils | `src/containers/repo-comparison/utils/timeAgo.ts` | Relative-time formatter |

---

## Core Flow

```
User types owner/repo → Enter / Search button
  → useRepoComparison.fetchLeft/Right
  → fetchRepo()
  → GitHub API (https://api.github.com/repos/{owner}/{repo})
  → RepoFetchState update
  → RepoCard renders result
```

---

## Key Design Decisions

- **AbortController per side** — request cancellation on re-search; each side has its own controller so cancelling one doesn't affect the other
- **`hydrated` flag** — prevents localStorage wipe on mount; state is set from storage before first render
- **`swapRepos()`** — swaps both paths + states atomically with no re-fetch
- **URL `?left=&right=` params** — enable shareable links; URL params take priority over localStorage on hydration
- **Proportional bars in `RepoMetricRow`** — `value / (value + otherValue)` share, no chart library needed

---

## Requirements Compliance Audit

All requirements are fully met.

### 1. Repository Data Fetching

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Dual Search Input | ✅ | Two independent `RepoSearchInput` components (`leftPath` / `rightPath`) |
| GitHub API Integration | ✅ | `https://api.github.com/repos/{owner}/{repo}` with `X-GitHub-Api-Version: 2022-11-28` |
| Error Handling | ✅ | 404→not_found, 401→unauthorized, 403→rate_limited/network, 429→rate_limited, 5xx→server_error, invalid path→invalid_path; displayed as `Alert variant="destructive"` with contextual icon |

### 2. Side-by-Side Comparison Dashboard

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Synchronized Layout | ✅ | `grid grid-cols-1 sm:grid-cols-2` |
| Star Count | ✅ | `stargazers_count` in `RepoMetricRow` |
| Fork Count | ✅ | `forks_count` in `RepoMetricRow` |
| Open Issues | ✅ | `open_issues_count` in `RepoMetricRow` |
| Visual Highlights | ✅ | Per-metric amber bg + "Best" trophy badge in `RepoMetricRow`; overall winner gets `ring-2 ring-amber-400/70` on card; winner banner shows "X leads N-M Y" |

### 3. Repository Metadata & Details

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Header Information | ✅ | `owner.avatar_url` (Avatar), `data.name`, `data.owner.login`, `data.description` |
| Last Updated | ✅ | "Pushed X ago" via `timeAgo(data.pushed_at)` + full date on desktop |
| Direct Links | ✅ | `ExternalLinkIcon` → `data.html_url` (target="_blank") |

### 4. Technical Constraints & UI

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Responsive Design | ✅ | `grid-cols-1 sm:grid-cols-2` stacks to single column on mobile; search row uses `grid-cols-1 sm:grid-cols-[1fr_auto_1fr]`; separate mobile swap button (`ArrowUpDownIcon`) |
| Loading States | ✅ | `LoadingCard` with full skeleton (avatar, title, desc chips, 4 metric rows, activity row) using shadcn `Skeleton` |
| Local Storage | ✅ | `STORAGE_KEY="github-comparison-repos"` persists last pair; hydration guard prevents erasure on mount; URL params take priority on hydration |

---

## Above & Beyond (not in requirements)

- **URL-shareable links** — `?left=&right=` query params
- **6 preset comparison chips** — react vs vue, next.js vs nuxt, etc.
- **Recent pairs history** — last 5 comparisons, persisted to `HISTORY_KEY`
- **Swap repos button** — desktop: `ArrowLeftRightIcon`; mobile: `ArrowUpDownIcon`
- **4th metric: watchers** — `watchers_count`
- **Proportional bars** — in each metric row
- **Rich metadata** — language color dots, license badge, Fork/Archived badges, topics list
- **Staggered CSS entry animations** — `animate-hero-in`, `animate-card-in`, `anim-delay-*`
- **Dark mode** — next-themes
