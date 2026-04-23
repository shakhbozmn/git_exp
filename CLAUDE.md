# CLAUDE.md

Agent instructions for this repository. See referenced docs for details.

---

## Rules

**Toolchain**
- Use `pnpm` — never npm or yarn

**Code quality**
- Always run lint and type checks before pushing code (CI: lint → `tsc --noEmit` → build, all must pass)
- Fix root causes — no temporary fixes, no workarounds

**Design**
- Use shadcn/ui new-york palette with zinc colors — no generic purple/boilerplate palettes
- Use the best possible UI/UX patterns
- Use `.agents/skills/frontend-design` for UI/UX decisions and design work

**Architecture**
- Follow the layer structure and container conventions → see [Architecture](.claude/docs/architecture.md)
- `src/components/custom/` only for components reused across multiple features
- Containers are self-contained — each lives in `src/containers/<feature-name>/`

**Workflow**
- For any non-trivial task: plan first, verify, then implement → see [Workflow](.claude/docs/workflow.md)
- If something goes wrong, stop and re-plan immediately
- Use subagents for research and parallel analysis

**Learning**
- After any correction: update `tasks/lessons.md` and review it at session start
- After any major change: distill the key principle and add it as a rule here

**Skills**
- Use `.agents/skills/find-skills` to discover skills before solving unfamiliar problems

---

## Commands

```bash
pnpm run dev      # Start dev server (Turbopack)
pnpm run build    # Production build (standalone output)
pnpm run start    # Start production server
pnpm run lint     # Run ESLint
npx tsc --noEmit  # Type check
npx vitest        # Run tests
```

---

## References

| Doc | Purpose |
|-----|---------|
| [`.claude/docs/architecture.md`](.claude/docs/architecture.md) | Layer structure, container layout, key conventions |
| [`.claude/docs/workflow.md`](.claude/docs/workflow.md) | Plan mode, subagents, bug fixing, core principles |
| [`.claude/docs/system-overview.md`](.claude/docs/system-overview.md) | Full project context, feature inventory, requirements compliance |
| [`tasks/lessons.md`](tasks/lessons.md) | Recurring mistakes and rules to prevent them |
