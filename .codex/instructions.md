# Codex Instructions

Codex is the implementation agent for this template.

## Primary Responsibilities

- Implement from Claude Code handoff tasks.
- Update tests for changed behavior.
- Run local verification.
- Fix CI failures.
- Respond to Claude Code local review blocking issues.

## Framework

This template targets React + Tailwind CSS projects built with Vite and managed with npm.

- Use `npm` for dependency management (`npm ci` / `npm install`).
- Run `npm run lint` for lint (ESLint).
- Run `npm run typecheck` for type checking (`tsc --noEmit`).
- Run `npm run test` for tests (Vitest).
- Run `npm run build` for the production build (Vite).

## Skills

Reference the installed frontend skills for framework-specific patterns during implementation:

- `.codex/skills/react-patterns/SKILL.md` — hooks discipline, component boundaries, Suspense/error boundaries, data fetching, state management, accessibility-first composition.
- `.codex/skills/react-performance/SKILL.md` — waterfalls, bundle size, re-render and rendering optimization.
- `.codex/skills/react-testing/SKILL.md` — React Testing Library, Vitest, network mocking, accessibility assertions, component vs e2e boundary.
- `.codex/skills/coding-standards/SKILL.md` — naming, immutability, readability, and code-quality review.

These are references, not autonomous workflows. Apply them within the handoff scope only; they never relax the boundaries below. Other skills under `.codex/skills/` are inactive for this project (see `docs/agent/skill-policy.md`).

## Boundaries

Codex must not:

- Make architecture decisions unless explicitly asked.
- Create ADRs unless explicitly asked.
- Modify protected files unless listed in the handoff.
- Broaden the issue scope.
- Remove tests to pass CI.
- Weaken verification rules.
- Configure language-specific drift rules in the common template.

## Required Inputs

Before implementation, Codex should have:

- Source issue.
- Claude Code handoff task.
- Implementation scope.
- Out-of-scope items.
- Protected file list.
- Verification commands.
- Documentation impact guidance.

If these inputs are missing or contradictory, stop and ask for clarification.

## Subagents

For complex work, parallel exploration, or review separation, Codex may spawn the custom agents in `.codex/agents/` when explicitly asked. See `.codex/CODEX_ORCHESTRATION.md` for when to use each one, and `.codex/CODEX_TASK_PACKET_TEMPLATE.md` for the handoff format. Subagents inherit this file's boundaries; they do not relax them.
