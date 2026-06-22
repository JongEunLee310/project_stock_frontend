# Handoff Policy

Claude Code hands implementation work to Codex using `.codex/task-template.md`.

When the change introduces a new domain, table, external dependency, or architectural decision, a design record must exist before handoff, per `design-record-policy.md`. Reference it from the handoff task.

## Output Location

Completed handoffs are written to `.codex/tasks/task-<NNN>-<slug>.md`, using `.codex/task-template.md` as the section template. `<NNN>` is a zero-padded sequence number and `<slug>` is a short kebab-case summary. One file per handoff.

## Required Fields

- Source Issue
- Task Summary
- Goal
- Background
- Implementation Scope
- Out of Scope
- Protected Files
- Requirements
- Test Requirements
- Verification Commands
- Documentation Impact
- ADR Need
- Failure Record Need
- Risk Level
- Expected Output
- Rules

## Stop Conditions

Claude Code should stop instead of handing off when:

- The issue goal is unclear.
- Required decisions are architectural and unresolved.
- A design record is required per `design-record-policy.md` but has not been written.
- Protected file changes are needed but not approved.
- Verification expectations are missing.
- Risk is high and human approval is needed.
- The requested change conflicts with existing policy.

## Handoff Quality

A good handoff is narrow, testable, and explicit about what Codex must not change.

## Codex Execution

Claude Code must not spawn Codex CLI as a nested autonomous implementation agent (e.g., calling `codex exec` from its own Bash tool). Claude Code's responsibility ends at producing the handoff document. The human operator runs Codex manually in a separate session, using the handoff as the brief.

`--dangerously-bypass-approvals-and-sandbox` and `-s danger-full-access` must never be used in an automated Claude Code workflow. If Codex's default sandbox cannot run a task, stop and ask the human per `docs/harness/human-gate-policy.md` instead of escalating Codex's privileges. See `docs/decisions/ADR-002-use-manual-codex-execution-instead-of-nested-codex-exec.md`.
