# Lessons

Rules derived from user corrections. Review this file at the start of every session before touching any code.

---

## Mistake: Logging changes as a changelog instead of extracting principles as rules

**What happened:** After major changes, added a `## Changelog` section to CLAUDE.md listing what files changed and what lines were edited.

**Why it was wrong:** A changelog documents history. CLAUDE.md is a behaviour guide. History is noise — principles are signal. The goal is preventing the same mistake, not recording that it happened.

**Rule:** When reflecting on a change, ask "what principle, if followed from the start, would have made this change unnecessary?" Write that as a rule, not a log entry.

---

## Mistake: Placing feature-specific components in the global components folder

**What happened:** `RepoCard`, `RepoSearchInput`, and `RepoMetricRow` were placed in `src/components/custom/` despite being used exclusively by a single container.

**Why it was wrong:** `src/components/custom/` is for components reusable across features. Putting single-owner components there creates false signals about shareability and pollutes the global namespace.

**Rule:** Before placing a component in `src/components/custom/`, verify it has (or will imminently have) more than one consumer across different features. Default to scoping inside the owning container; promote only when a second consumer actually appears.

---

## Mistake: Placing a feature-specific hook in the global hooks folder

**What happened:** `useRepoComparison` was placed in `src/hooks/` despite being consumed only by `RepoComparisonContainer`.

**Why it was wrong:** `src/hooks/` is for hooks shared across features. A single-owner hook there misleads future developers about its scope.

**Rule:** Same promotion rule as components — start hooks inside `src/containers/<feature>/hooks/`; move to `src/hooks/` only when a second, unrelated feature needs it.

---

## Mistake: Placing a container directly in src/containers/ as a flat file instead of a folder

**What happened:** `RepoComparisonContainer.tsx` was created as `src/containers/RepoComparisonContainer.tsx` rather than `src/containers/repo-comparison/RepoComparisonContainer.tsx`.

**Why it was wrong:** A flat file has no room to grow. A container almost always ends up needing collocated components, hooks, or types. Starting as a folder makes that growth natural and keeps feature code grouped.

**Rule:** Always create a container as a folder from day one: `src/containers/<feature-name>/`. Never create a bare container file directly under `src/containers/`.

---

## Mistake: Leaving fetch calls without timeout or cancellation

**What happened:** `fetchRepo` had no `AbortController` timeout and no way for the caller to cancel an in-flight request, causing spinners to hang indefinitely on slow/offline connections and stale responses to overwrite newer ones on rapid re-searches.

**Why it was wrong:** Every network call can hang or become stale. Without a timeout the UI has no escape hatch. Without a cancellation signal, a slow first request can resolve after a fast second one and silently overwrite the correct result.

**Rule:** Always wrap `fetch` with an `AbortController` timeout; always accept and forward an `AbortSignal` from the caller; always check `signal.aborted` before applying the result to state.

---

## Mistake: Collapsing distinct HTTP error statuses into a single generic error kind

**What happened:** All `403` responses were mapped to `rate_limited`, and `401`, `429`, and `5xx` all fell through to a generic `network` kind — losing meaningful distinctions and surfacing misleading messages to the user.

**Why it was wrong:** Each status means something different: `401` is an auth problem, `403` without rate-limit headers is a permissions problem, `429` is a secondary rate limit, and `5xx` is a GitHub-side failure. Collapsing them hides the real cause and makes error messages useless.

**Rule:** Triage every HTTP status to a specific error kind. Never map unrelated statuses to the same kind. When adding a new API integration, enumerate every expected error status upfront.

---

## Mistake: Using a ref to guard a sibling effect against running too early

**What happened:** `isFirstRender = useRef(true)` was set to `false` at the end of the hydration effect to try to block the persistence effect from firing on mount. The persistence effect still fired with empty values on the first render, erasing stored localStorage data.

**Why it was wrong:** React batches effects — a ref mutation inside one effect does not prevent a sibling effect in the same commit from reading the stale ref value. Only state triggers a re-render boundary that sibling effects can observe.

**Rule:** Use a `useState` boolean flag (e.g. `hydrated`) to guard effects that must not run before an earlier effect completes. Never rely on a ref mutated in one effect to gate another effect in the same render commit.

---

## Mistake: Missing label/input association and no ARIA live region for dynamic content

**What happened:** `<Label>` had no `htmlFor` and `<Input>` had no `id`, so screen readers did not announce the label on focus. Error and success states were conditionally mounted, so screen readers received no announcement when the card content changed.

**Why it was wrong:** An unassociated label is a WCAG Level A failure — keyboard and screen reader users cannot identify the field. Conditionally mounting content (rather than rendering it inside a persistent live region) means assistive technology never detects the DOM change.

**Rule:** Always bind `<Label htmlFor={id}>` and `<Input id={id}>` using `React.useId()`. Always render dynamic state transitions (loading, error, success) inside a persistent `<div aria-live="polite" aria-atomic="true">` that is present in the DOM before any state changes occur.

---

## Mistake: Keyboard submit handler not guarded by the same condition as the button

**What happened:** The Enter key handler called `onSearch()` unconditionally, while the Search button was `disabled` when `value.trim()` was empty — so pressing Enter on a whitespace-only input fired a real API call that the button would have blocked.

**Why it was wrong:** Two code paths that trigger the same action must enforce the same preconditions. Diverging guards create invisible holes in validation.

**Rule:** Any keyboard shortcut that mirrors a button action must apply the identical guard condition as that button's `disabled` prop. Treat them as a single logical action with two entry points.
