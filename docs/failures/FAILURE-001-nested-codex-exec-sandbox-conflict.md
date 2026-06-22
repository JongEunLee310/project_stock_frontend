# FAILURE-001: Nested Codex Exec Sandbox Conflict

## Status

Accepted

## Background

During dogfooding, Claude Code attempted to invoke Codex CLI directly via `codex exec` from inside its own Bash tool, intending to automate the full Issue → handoff → implementation → PR pipeline without a human running Codex separately.

## Failed Approach

Claude Code ran `codex exec --cd <worktree> -s read-only|workspace-write ...` to have Codex implement a handoff task non-interactively, inside a session already running under the harness's own tool execution layer.

## Failure Cause

`codex exec` crashed with exit code 133 on the first shell tool call under both `read-only` and `workspace-write` sandbox modes. The only available workarounds appeared to be `--dangerously-bypass-approvals-and-sandbox` or `-s danger-full-access`, both of which the harness's auto-mode classifier blocked as unapproved autonomous agent spawning. Beyond the sandbox question, granting those flags would have created a nested autonomous agent (Claude Code spawning a full-access Codex shell) with no independent approval gate — a structural problem, not just an environment bug.

### Update (2026-06-22): root cause is upstream, not the nested sandbox

Two upstream reports filed on 2026-06-18/19 match this symptom exactly and correct the original attribution:

- [openai/codex#29136](https://github.com/openai/codex/issues/29136) — Codex CLI v0.141.0 on Intel macOS x86_64 crashes with `zsh: trace trap codex` on the **first** file/shell tool action.
- [openai/codex#28893](https://github.com/openai/codex/issues/28893) — `codex exec` crashes with a **V8 SetPermissions SIGTRAP** on macOS x86_64.

Exit code 133 = 128 + 5 = SIGTRAP = macOS "trace trap", i.e. the same crash. Critically, both reports reproduce **standalone** (no Claude Code nesting) and **even under `-s danger-full-access` / `--dangerously-bypass-approvals-and-sandbox`**. So the crash is not a nested-sandbox conflict between the harness seatbelt and Codex's seatbelt; it is a Codex CLI v0.141.0 bug on Intel macOS x86_64. We only observed it under `read-only`/`workspace-write` because those were the modes we tried — full access would have crashed too. Both upstream issues are still OPEN (unfixed) as of 2026-06-22.

The structural conclusion below is unaffected: it is a role/approval decision, independent of the sandbox bug.

### Verified workaround (2026-06-22): pin Codex to 0.140.0

On this Intel macOS x86_64 machine, `codex exec` v0.140.0 was tested directly: the first shell tool call (`/bin/zsh -lc ls`) under the `workspace-write` sandbox **succeeded (exit 0, no trace trap)**. This confirms the v0.141.0 SIGTRAP is a regression, not a long-standing bug. Until a fixed release ships, pin Codex to 0.140.0:

```
npm install -g @openai/codex@0.140.0
```

Note: Homebrew cask only carries the latest version (0.141.0), so the pin must go through npm or a direct GitHub release (`rust-v0.140.0`), not `brew`.

## Impact

The dogfooding run could not exercise an automated Claude Code → Codex handoff in a single session. No application code or protected files were affected; only the orchestration mechanism was blocked.

## Replacement Decision

Claude Code does not call Codex CLI directly as a nested implementation agent. Claude Code creates the Codex handoff document only; the human operator runs Codex manually in a separate session or an explicitly approved isolated environment. See `docs/decisions/ADR-002-use-manual-codex-execution-instead-of-nested-codex-exec.md`.

## Retry Conditions

Reconsider direct `codex exec` invocation from Claude Code only if both hold:

- The upstream SIGTRAP crash is fixed (track [openai/codex#29136](https://github.com/openai/codex/issues/29136) and [openai/codex#28893](https://github.com/openai/codex/issues/28893); requires a Codex CLI release past v0.141.0), confirmed with `read-only` sandbox succeeding on a trivial command.
- A human-approved, scoped exception process exists for elevated Codex sandbox access (see Human Gate conditions in `docs/harness/human-gate-policy.md`), so any full-access run still requires explicit per-run human approval rather than being silently automated.

## Related Documents

- `docs/decisions/ADR-002-use-manual-codex-execution-instead-of-nested-codex-exec.md`
- `docs/harness/handoff-policy.md`
- `docs/harness/human-gate-policy.md`
- `docs/harness/autonomy-levels.md`
- `docs/feedback/dogfooding-plan.md`
- Upstream: [openai/codex#29136](https://github.com/openai/codex/issues/29136), [openai/codex#28893](https://github.com/openai/codex/issues/28893)
