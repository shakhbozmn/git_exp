---
name: create-branch
description: Create and checkout a new git branch with a properly named branch. Use when the user says "create branch", "new branch", "checkout new branch", "branch off", "start a branch", or "/create-branch".
---

Create a new git branch with a conventional, descriptive name and check it out.

## Arguments

Optional arguments the user may provide:
- **type**: Branch type prefix (e.g., `feat`, `fix`, `chore`, `refactor`). If not provided, infer from the user's description of the work.
- **scope**: Short module/feature scope (e.g., `auth`, `dashboard`, `api`). If not provided, infer from context.
- **description**: What the branch is for. If not provided, extract key intent words from the user's prompt.

## Steps

### 1. Gather context

Check current branch and repo state:

```bash
git branch --show-current && git status --short
```

If there are uncommitted changes, warn the user: "You have uncommitted changes. Do you want to stash them first?"
Do NOT block — let the user decide. Continue if they confirm.

### 2. Determine branch name

Branch name format: `{type}/{scope}-{description}`

**Type** — infer if not provided:
- New feature work → `feat`
- Bug fix → `fix`
- Refactor / restructure → `refactor`
- Tests → `test`
- Config / deps / CI → `chore`
- Docs → `docs`

**Scope** — infer from user description or current working area (e.g., changed files, feature being discussed).
Omit scope if it's too vague or spans the whole project: `{type}/{description}`

**Description** — extract 2–4 key words from the user's intent. Transform to `kebab-case`. Drop filler words (the, a, for, to, in, of).

Examples:
- "create branch for fixing login bug" → `fix/auth-login-bug`
- "new branch for repo comparison dark mode" → `feat/repo-comparison-dark-mode`
- "branch to refactor the API layer" → `refactor/api-layer`
- "chore branch to update deps" → `chore/update-deps`

Rules:
- All lowercase
- Hyphens only (no slashes inside description, no underscores)
- Max 50 characters total
- No special characters

### 3. Propose and confirm

Print the proposed branch name and ask for confirmation before creating:

```
Proposed branch: feat/repo-comparison-dark-mode

Create and checkout? [Y/n]
```

If the user suggests a different name, use their name verbatim.

### 4. Create and checkout

```bash
git checkout -b {branch_name}
```

If the branch already exists, show the error and suggest appending `-2` or ask the user for a different name.

### 5. Output

Print:
```
✔ Switched to new branch '{branch_name}'
```

Then remind the user to push with: `git push -u origin {branch_name}` when ready.

**NEVER force-push, delete, or modify existing branches.**
**NEVER create a branch from a dirty state without warning the user first.**
