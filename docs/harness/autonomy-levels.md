# Autonomy Levels

This document defines the autonomy levels available in the AI-assisted development workflow.

## Levels

### Level 0: Manual

All work is performed by a human. AI tools are not used.

### Level 1: AI-Assisted

Claude Code and Codex assist with planning, drafting, and implementation. Humans review and approve every step before it proceeds.

Use when: the team is learning the workflow, or the task is High or Critical risk.

### Level 2: Semi-Autonomous

Claude Code plans, Codex implements, and CI verifies. Humans review PRs before merge.

Use when: the task is Low or Medium risk, scope is clearly defined, and verification commands exist.

Codex implementation at this level is still started manually by the human operator, in a separate session, using Claude Code's handoff document. Claude Code does not invoke Codex CLI itself; see `docs/harness/handoff-policy.md` and `docs/decisions/ADR-002-use-manual-codex-execution-instead-of-nested-codex-exec.md`.

## Default Level

This template operates at Level 2 for Low and Medium risk tasks. High and Critical risk tasks require Level 1 (human gate before implementation begins).

## Related

- `task-classification-policy.md` — risk levels
- `human-gate-policy.md` — gate conditions
