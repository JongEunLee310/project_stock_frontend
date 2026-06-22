# FAILURE-001: Nested Codex Exec Sandbox Conflict

## Status

Accepted

## Background

During dogfooding, Claude Code attempted to invoke Codex CLI directly via `codex exec` from inside its own Bash tool, intending to automate the full Issue → handoff → implementation → PR pipeline without a human running Codex separately.

## Failed Approach

Claude Code ran `codex exec --cd <worktree> -s read-only|workspace-write ...` to have Codex implement a handoff task non-interactively, inside a session already running under the harness's own tool execution layer.

## Failure Cause

`codex exec` crashed with exit code 133 on the first shell tool call under both `read-only` and `workspace-write` sandbox modes. The only available workarounds were `--dangerously-bypass-approvals-and-sandbox` or `-s danger-full-access`, both of which the harness's auto-mode classifier blocked as unapproved autonomous agent spawning. Beyond the immediate sandbox crash, granting those flags would have created a nested autonomous agent (Claude Code spawning a full-access Codex shell) with no independent approval gate — a structural problem, not just an environment bug.

## Impact

The dogfooding run could not exercise an automated Claude Code → Codex handoff in a single session. No application code or protected files were affected; only the orchestration mechanism was blocked.

## Replacement Decision

Claude Code does not call Codex CLI directly as a nested implementation agent. Claude Code creates the Codex handoff document only; the human operator runs Codex manually in a separate session or an explicitly approved isolated environment. See `docs/decisions/ADR-002-use-manual-codex-execution-instead-of-nested-codex-exec.md`.

## Retry Conditions

Reconsider direct `codex exec` invocation from Claude Code only if both hold:

- The sandbox crash is root-caused and fixed (e.g., a Codex CLI or OS update resolves the seatbelt conflict), confirmed with `read-only` sandbox succeeding on a trivial command.
- A human-approved, scoped exception process exists for elevated Codex sandbox access (see Human Gate conditions in `docs/harness/human-gate-policy.md`), so any full-access run still requires explicit per-run human approval rather than being silently automated.

## Related Documents

- `docs/decisions/ADR-002-use-manual-codex-execution-instead-of-nested-codex-exec.md`
- `docs/harness/handoff-policy.md`
- `docs/harness/human-gate-policy.md`
- `docs/harness/autonomy-levels.md`
- `docs/feedback/dogfooding-plan.md`
