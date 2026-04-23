---
name: pr-create
description: Create a pull request following best practices — proper title, linked issues, meaningful description, and reviewer assignment. Use when the user says "create PR", "open a pull request", "make a PR", "submit PR", or "/pr-create".
---

Create a well-structured pull request following GitHub best practices.

## Arguments

Optional arguments the user may provide:
- **title**: PR title override. If not provided, generate from commits.
- **base**: Target branch to merge into. Defaults to `main`.
- **draft**: Open as draft PR. Defaults to `false`.
- **issue**: Related issue number to link (e.g., `#42`).
- **reviewer**: GitHub username(s) to request review from.

## Steps

### 1. Gather context

Run in parallel:

```bash
git branch --show-current
git log main..HEAD --oneline
git diff main..HEAD --stat
```

If current branch is `main` or `master`, stop and warn: "You're on the default branch — create a feature branch first."

If there are no commits ahead of `main`, stop: "No new commits to open a PR for."

### 2. Extract keywords from user prompt

Parse the user's message for:
- **Intent keywords** — feature name, bug description, scope
- **Issue references** — any `#123`, `closes #123`, `fixes #123` patterns
- **Target branch** — "into main", "into develop", "into staging"
- **Draft signal** — "draft PR", "WIP", "work in progress"
- **Reviewers** — "@username" mentions

Use extracted keywords to enrich the title and description.

### 3. Build PR title

Rules:
- Start with a conventional commit-style prefix: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`
- Infer the prefix from the commits on this branch (majority type wins)
- Concise subject, max 72 characters, no period at end
- Capitalise first word after the prefix

Example:
- Commits: `feat: add dark mode toggle`, `feat: update theme provider` → Title: `feat: Add dark mode support`

If the user provided a title in their prompt, use it (cleaned up if needed).

### 4. Build PR body

Use this structure:

```markdown
## Summary

- {bullet: what changed and why — 1–3 bullets max}

## Changes

- {bullet: key implementation detail}
- {bullet: key implementation detail}

## Test plan

- [ ] {manual or automated test step}
- [ ] Lint passes (`pnpm run lint`)
- [ ] Type check passes (`npx tsc --noEmit`)
- [ ] Visually verified in browser (light + dark mode if UI change)

{if issue linked}
Closes #{issue_number}
```

Rules:
- Keep Summary focused on **why**, not what
- Changes section is **what** — specific files/components touched
- Test plan must always include lint + type check checkboxes
- Add `Closes #N` only if an issue number was extracted or provided

### 5. Run pre-PR checks

```bash
pnpm run lint 2>&1 | tail -5
npx tsc --noEmit 2>&1 | tail -5
```

If lint or type check exits non-zero (errors **or** warnings — `--max-warnings 0` is enforced),
stop and report: "PR not created — lint/type check failed. Fix all issues first."

### 6. Push branch if needed

Check if the current branch has a remote tracking branch:

```bash
git status -sb
```

If no upstream is set, push first:

```bash
git push -u origin {current_branch}
```

### 7. Create the PR

Use the GitHub MCP `create_pull_request` tool:

```
create_pull_request(
  owner   = {repo_owner},
  repo    = {repo_name},
  title   = "{title}",
  body    = "{body}",
  head    = "{current_branch}",
  base    = "{base_branch}",
  draft   = {true|false},
)
```

Infer `owner` and `repo` from `git remote get-url origin`.

If reviewers were provided, call `update_pull_request` with `reviewers` after creation.

### 8. Output

Print:
```
✔ PR created: {pr_url}
  Title:  {title}
  Base:   {base_branch} ← {current_branch}
  Status: {Open | Draft}
```

If reviewers were assigned, list them. If an issue was linked, confirm the `Closes #N` line.

**NEVER force-push to prepare for a PR.**
**NEVER open a PR from main into main.**
**NEVER skip lint/type checks — fix errors before creating.**
**NEVER add AI attribution to PR titles or bodies.**
