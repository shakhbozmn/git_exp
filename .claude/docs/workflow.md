# Workflow & Principles

## Task Management

1. **Plan First** — write plan to `tasks/todo.md` with checkable items
2. **Verify Plan** — check in before starting implementation
3. **Track Progress** — mark items complete as you go
4. **Explain Changes** — high-level summary at each step

---

## Plan Mode

- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, **STOP and re-plan immediately** — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

---

## Subagent Strategy

- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution
- Keep the main context window clean

---

## Bug Fixing

- When given a bug report: just fix it. Don't ask for hand-holding.
- Point at logs, errors, failing tests → then resolve them.
- Zero context switching required from the user.
- Go fix failing CI tests without being told how.

---

## Elegance Principle

- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution."
- Skip this for simple, obvious fixes — don't over-engineer.
- Challenge your own work before presenting it.

---

## Core Principles

- **Simplicity First** — make every change as simple as possible; impact minimal code
- **No Laziness** — find root causes; no temporary fixes; senior developer standards
- **Minimal Impact** — changes should only touch what's necessary; avoid introducing bugs

---

## Learning & Lessons

- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write a rule that prevents the same mistake from recurring
- Ruthlessly iterate on these lessons until mistake rate drops
- Review `tasks/lessons.md` at the start of each session before touching any code
- After completing any major change, distill the key principle learned and add it as a rule in `CLAUDE.md`
