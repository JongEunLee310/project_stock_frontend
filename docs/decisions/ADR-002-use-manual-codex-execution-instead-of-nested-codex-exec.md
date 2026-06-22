# ADR-002: Use Manual Codex Execution Instead Of Nested Codex Exec

## Status

Accepted

## Context

Dogfooding attempted to let Claude Code drive the full pipeline by invoking `codex exec` directly from its own Bash tool. This failed at the sandbox level (`FAILURE-001-nested-codex-exec-sandbox-conflict.md`) and, independent of the crash, raised a structural question: should Claude Code ever spawn Codex as a nested, shell-capable subprocess at all?

## Decision

Claude Code does not call Codex CLI directly as a nested implementation agent, with or without elevated sandbox flags.

Claude Code's role stays limited to writing the Codex handoff document (`.codex/task-template.md`). The human operator runs Codex manually — in a separate terminal session, IDE integration, or an explicitly approved isolated environment — using that handoff as the brief.

`--dangerously-bypass-approvals-and-sandbox` and `-s danger-full-access` must not be used in any automated Claude Code workflow. If Codex's own sandbox fails and only an elevated-access run can proceed, Claude Code stops and asks the human, per `docs/harness/human-gate-policy.md`, rather than escalating privileges itself.

## Alternatives

- Have Claude Code call `codex exec` with `danger-full-access` whenever the default sandbox fails. Rejected: this lets one agent grant another agent broad shell access without an independent approval step, which the harness's autonomy model is designed to prevent.
- Fix the sandbox crash and keep automated `codex exec` invocation under `read-only`/`workspace-write`. Possible in the future (see Follow-up), but not viable now since the crash reproduces even for trivial read-only commands.
- Run Codex inside a fully separate, pre-approved disposable container or VM that Claude Code can target without per-run human approval. Rejected for now: still a nested-agent structure, and out of scope for a template meant to run on a developer's local machine without extra infrastructure.

## Consequences

The Claude Code → Codex → CI → human pipeline keeps a human-operated step between handoff creation and implementation, so it is slightly less automated than originally planned for dogfooding. In exchange, the role boundary (`ADR-001-separate-claude-code-and-codex-roles.md`) stays intact: Claude Code plans and reviews, Codex implements under its own session and its own approval settings, and no agent silently acquires another agent's execution authority.

## Follow-up

- The exit-133 crash was later traced to an upstream Codex CLI v0.141.0 SIGTRAP regression on Intel macOS x86_64, not a nested-sandbox conflict — it reproduces standalone and even under `danger-full-access` (track [openai/codex#29136](https://github.com/openai/codex/issues/29136), [openai/codex#28893](https://github.com/openai/codex/issues/28893)). Codex 0.140.0 was verified working on this machine (first `workspace-write` shell tool call succeeded, exit 0), so the workaround is to pin Codex to 0.140.0 via npm until a fixed release ships. See `FAILURE-001` for details. This does not change the decision above, which is a role/approval boundary independent of the crash.
- If a future Codex CLI release fixes that crash, re-evaluate automated `codex exec` invocation under its default (non-bypassed) sandbox modes only — never under `danger-full-access` or the bypass flag.
- Document the manual Codex execution step in `docs/knowledge/template-usage.md` and `docs/feedback/dogfooding-plan.md`.

## Related Documents

- `docs/failures/FAILURE-001-nested-codex-exec-sandbox-conflict.md`
- `docs/decisions/ADR-001-separate-claude-code-and-codex-roles.md`
- `docs/harness/handoff-policy.md`
- `docs/harness/human-gate-policy.md`
- `docs/harness/autonomy-levels.md`
