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

Originally (ADR-002): Claude Code created the handoff document only, and the human operator ran Codex manually in a separate session. **This has since been superseded by ADR-005**, which allows Claude Code to invoke `codex exec` automatically under the default sandbox once the Codex CLI is pinned to a crash-free version — the retry conditions below were met. Manual execution remains the fallback when automated invocation is unavailable. See `docs/decisions/ADR-005-allow-claude-code-to-invoke-codex-exec.md` and `docs/decisions/ADR-002-use-manual-codex-execution-instead-of-nested-codex-exec.md` (superseded).

## Retry Conditions

These conditions were the bar for resuming direct `codex exec` invocation; ADR-005 accepts automated invocation now that they hold:

- The sandbox crash is root-caused and avoidable (the SIGTRAP regression was isolated to specific Codex CLI versions per [openai/codex#29136](https://github.com/openai/codex/issues/29136) and [openai/codex#28893](https://github.com/openai/codex/issues/28893); pinning to a crash-free version, 0.140.0, sidesteps it), confirmed with `read-only` sandbox succeeding on a trivial command.
- Automated invocation stays within the **default** sandbox (`read-only` / `workspace-write`) only. Elevated/full-access runs remain forbidden in automated workflows and a Human Gate condition (`docs/harness/human-gate-policy.md`); the default-sandbox automation in ADR-005 is not such a run.

## Related Documents

- `docs/decisions/ADR-005-allow-claude-code-to-invoke-codex-exec.md`
- `docs/decisions/ADR-002-use-manual-codex-execution-instead-of-nested-codex-exec.md` (superseded)
- `docs/harness/handoff-policy.md`
- `docs/harness/human-gate-policy.md`
- `docs/harness/autonomy-levels.md`
- `docs/feedback/dogfooding-plan.md`
- Upstream: [openai/codex#29136](https://github.com/openai/codex/issues/29136), [openai/codex#28893](https://github.com/openai/codex/issues/28893)
