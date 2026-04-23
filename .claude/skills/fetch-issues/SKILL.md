# Skill: fetch-issues

Triage and fix open `e2e-failure` GitHub issues without leaving the Claude Code session.

## When to invoke

Use this skill when you see `e2e-failure` issues in the GitHub repository and want to
investigate and fix the root causes directly from Claude Code.

## Steps

### 1. List open e2e-failure issues

Use the GitHub MCP `list_issues` tool filtered by label:

```
list_issues(owner, repo, state="open", labels=["e2e-failure"])
```

### 2. Read each issue

For each open issue, use `issue_read(method="get")` to retrieve:
- Full test title (from the issue body's **Test:** field)
- Error message (from the code block in the issue body)
- Branch and PR link (for context)

### 3. Map test title to source file

Use the following keyword → source file lookup to identify where to look:

| Keywords in test title | Source file |
|---|---|
| `search button`, `clear button`, `input`, `placeholder`, `typed text` | `src/containers/repo-comparison/components/RepoSearchInput.tsx` |
| `repo card`, `star`, `fork`, `external link`, `description`, `pushed`, `language`, `owner name` | `src/containers/repo-comparison/components/RepoCard.tsx` |
| `metric row`, `best badge`, `winner badge`, `open issues`, `watchers`, `forks count` | `src/containers/repo-comparison/components/RepoMetricRow.tsx` |
| `preset chip`, `swap`, `winner banner`, `leads`, `equal match`, `recently compared`, `page title`, `live github data` | `src/containers/repo-comparison/RepoComparisonContainer.tsx` |
| `fetch`, `api`, `rate limit`, `not found`, `network error`, `unauthorized` | `src/api/fetchRepo.ts` |
| `state`, `localstorage`, `abort`, `hook` | `src/containers/repo-comparison/hooks/useRepoComparison.ts` |

### 4. Investigate and fix

1. Read the mapped source file
2. Correlate the error message to the relevant line/function
3. Apply the minimal fix
4. Run `pnpm lint && npx tsc --noEmit` to verify the fix

### 5. Close the fixed issues

For each resolved issue, use:

```
issue_write(
  method="update",
  issue_number=<N>,
  state="closed",
  state_reason="completed"
)
```

## Notes

- Tests that hit the real GitHub API have `test.setTimeout(60_000)` — transient API failures
  are retried once in CI (`retries: 1`). If the error message says "Timeout" or "net::ERR",
  check `src/api/fetchRepo.ts` for AbortController timeout values before assuming a logic bug.
- Selector mismatches (`getByPlaceholder`, `getByLabel`, `getByRole`) mean a UI text or
  aria-label changed — cross-reference the selector in `e2e/repo-comparison.spec.ts` with
  the actual rendered component.
- The `[aria-live="polite"]` locator maps to the outer `<div>` in `RepoCard.tsx:290`.
