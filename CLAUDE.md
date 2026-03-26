# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Rules

- use pnpm instead of npm or yarn
- use `.agents/skills/frontend-design` for UI/UX decisions and design work
- use `.agents/skills/find-skills` for research and finding best skills to solve a problem and install them
- dont use general boilerplate colour palette like general purple like colours, instead use the shadcn/ui new-york palette with zinc colors for a modern, elegant look and have modern, elegant design as a core principle in UI/UX decisions
- use the best possible UI/UX patterns
- always run lint and type checks before pushing code
- follow the architecture and conventions outlined below
- for any non-trivial task, write a plan first and verify it before implementation
- if something goes wrong, stop and re-plan immediately instead of pushing through
- use subagents for research and parallel analysis to keep the main context clean
- demand elegance in solutions, but avoid over-engineering simple fixes
- when given a bug report, just fix it without asking for hand-holding. Point at logs, errors, failing tests, then resolve them. No context switching required from the user.
- after completing any major change, distill the key principle learned and add it as a rule in CLAUDE.md
- after ANY correction from the user: update `tasks/lessons.md` with the pattern — write a rule that prevents the same mistake from recurring, ruthlessly iterate on these lessons until mistake rate drops, and review `tasks/lessons.md` at the start of each session before touching any code
- use `src/components/custom/` only for components that are reusable and not dependent on the state, props, or context of a specific feature; everything else belongs inside its owning container
- containers are self-contained, independent units of feature logic — each lives in `src/containers/<feature-name>/` and may own its own `components/`, `hooks/`, `types/`, `utils/`, `services/` subdirectories

## Commands

```bash
pnpm run dev      # Start dev server (Turbopack)
pnpm run build    # Production build (standalone output)
pnpm run start    # Start production server
pnpm run lint     # Run ESLint
npx tsc --noEmit # Type check
npx vitest       # Run tests
```

CI runs: lint → `tsc --noEmit` → build. All three must pass before merging to `main`.

## Architecture

**Framework:** Next.js 16 App Router (React 19, TypeScript strict mode). Path alias `@/*` → `src/*`.
**Styling:** Tailwind CSS v4 via PostCSS. shadcn/ui for primitives. Globally shared custom components in `src/components/custom/`.
**State Management:** No global state library. All state is co-located in React components and hooks.
**API Layer:** Framework clients (REST for server-side, Socket.IO for client). Raw API calls in `src/api/`, wrapped in services in `src/services/`.
**Routing:** Typed route constants in `src/config/appRoutes.ts`. No string literals for paths.
**Environment Variables:** Access via .env, through `process.env` directly.

### Layer Structure

| Layer             | Path                             | Purpose                                                                                       |
| ----------------- | -------------------------------- | --------------------------------------------------------------------------------------------- |
| Pages             | `src/app/`                       | Thin RSC wrappers; fetch initial data server-side, pass to client containers                  |
| Containers        | `src/containers/<feature-name>/` | Feature-level smart components; own business logic + scoped components, hooks, types          |
| Shared Components | `src/components/custom/`         | App-specific compound components reused across multiple features                              |
| UI Primitives     | `src/components/ui/`             | shadcn/ui (new-york style, zinc color) — do not modify generated files                        |
| Hooks             | `src/hooks/`                     | Shared custom React hooks used by multiple features                                           |
| API               | `src/api/`                       | Shared raw API call functions, one file per operation                                         |
| Services          | `src/services/`                  | Feathers client wrappers + Firebase auth                                                      |
| Config            | `src/config/`                    | Env vars (`environment.ts`), typed routes (`appRoutes.ts`), service names (`api/services.ts`) |

### Container folder structure

```
src/containers/<feature-name>/
├── <FeatureName>Container.tsx   # main smart component (entry point)
├── components/                  # UI components used only by this container
├── hooks/                       # hooks used only by this container
├── types/                       # types used only by this container
└── api/                         # raw API calls used only by this container (optional)
```

Global shared code stays in the top-level layers (`src/api/`, `src/types/`, `src/hooks/`, etc.). When in doubt, start scoped inside the container and promote to a shared layer only when a second consumer appears.

### Two Feathers Clients

- **Server-side** : REST-based, used in RSC/Server Actions
- **Client-side** : Socket.IO-based, used for real-time events and mutations

Always use the appropriate client for the rendering context.

### Key Conventions

- **TypeScript**: `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noImplicitReturns` are all enabled — be precise with optional properties and array access.
- **Styling**: Tailwind v4 via PostCSS. Use `cn()` from `src/lib/utils.ts` (clsx + tailwind-merge) for conditional classes.
- **Routes**: Always use typed constants from `src/config/appRoutes.ts` instead of string literals.
- **Environment**: Access env vars through `src/config/environment.ts`, not `process.env` directly.
- **SVGs**: Imported as React components (SVGR via Turbopack).
- **Toasts**: Use `sonner` (`toast.success`, `toast.error`).

## Workflow Orchestration

### 1. Plan Mode Default

- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy to keep main context window clean

- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Demand Elegance (Balanced)

- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it

### 4. Autonomous Bug Fixing

- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests -> then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to 'tasks/todo.md' with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
