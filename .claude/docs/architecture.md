# Architecture Reference

## Stack

**Framework:** Next.js 16 App Router (React 19, TypeScript strict mode). Path alias `@/*` → `src/*`.
**Styling:** Tailwind CSS v4 via PostCSS. shadcn/ui for primitives. Globally shared custom components in `src/components/custom/`.
**State Management:** No global state library. All state is co-located in React components and hooks.
**API Layer:** Framework clients (REST for server-side, Socket.IO for client). Raw API calls in `src/api/`, wrapped in services in `src/services/`.
**Routing:** Typed route constants in `src/config/appRoutes.ts`. No string literals for paths.
**Environment Variables:** Access via `src/config/environment.ts`, not `process.env` directly.

---

## Layer Structure

| Layer             | Path                             | Purpose                                                                              |
| ----------------- | -------------------------------- | ------------------------------------------------------------------------------------ |
| Pages             | `src/app/`                       | Thin RSC wrappers; fetch initial data server-side, pass to client containers         |
| Containers        | `src/containers/<feature-name>/` | Feature-level smart components; own business logic + scoped components, hooks, types |
| Shared Components | `src/components/custom/`         | App-specific compound components reused across multiple features                     |
| UI Primitives     | `src/components/ui/`             | shadcn/ui (new-york style, zinc color) — do not modify generated files               |
| Hooks             | `src/hooks/`                     | Shared custom React hooks used by multiple features                                  |
| API               | `src/api/`                       | Shared raw API call functions, one file per operation                                |
| Services          | `src/services/`                  | Feathers client wrappers + Firebase auth                                             |
| Config            | `src/config/`                    | Env vars, typed routes, service names                                                |

---

## Container Folder Structure

Each container is a self-contained unit of feature logic:

```
src/containers/<feature-name>/
├── <FeatureName>Container.tsx   # main smart component (entry point)
├── components/                  # UI components used only by this container
├── hooks/                       # hooks used only by this container
├── types/                       # types used only by this container
└── api/                         # raw API calls used only by this container (optional)
```

Start scoped inside the container. Promote to a shared layer only when a second consumer appears.

---

## Two Feathers Clients

- **Server-side**: REST-based, used in RSC/Server Actions
- **Client-side**: Socket.IO-based, used for real-time events and mutations

Always use the appropriate client for the rendering context.

---

## Key Conventions

- **TypeScript**: `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noImplicitReturns` are all enabled — be precise with optional properties and array access.
- **Styling**: Tailwind v4 via PostCSS. Use `cn()` from `src/lib/utils.ts` (clsx + tailwind-merge) for conditional classes. No generic purple palettes — use shadcn/ui new-york zinc.
- **Routes**: Always use typed constants from `src/config/appRoutes.ts` instead of string literals.
- **Environment**: Access env vars through `src/config/environment.ts`, not `process.env` directly.
- **SVGs**: Imported as React components (SVGR via Turbopack).
- **Toasts**: Use `sonner` (`toast.success`, `toast.error`).
- **Components**: `src/components/custom/` only for components reused across multiple features. Everything else lives inside its owning container.
