# Local Review Policy

Claude Code review happens after PR creation.

The review is local by default, not a GitHub Actions job. This template does not configure Claude GitHub Action.

## Review Scope

Claude Code should review:

- PR diff.
- Related issue.
- Codex handoff task.
- CI result.
- Protected file changes.
- Documentation impact.
- ADR need.
- Failure Record need.
- Domain knowledge impact.

## Review Records

The review is written to a durable, versioned file:

`docs/reviews/pr-<number>.md`

This file is committed, not a throwaway under `tmp/`. The PR conversation remains the place to publish the review for discussion, and reusable findings should still be promoted into docs, ADRs, failure records, or the knowledge base.

## Review Format

Every review record uses the same section order and headers:

1. `## Review Summary`
2. `## Blocking`
3. `## Suggestions`
4. `## Questions`
5. `## CI Result`
6. `## Documentation Impact`
7. `## Final Recommendation`

Use the fixed headers even when a section is empty (state "None").

## Handling Review Feedback

When Codex addresses review feedback, it does **not** open a new PR. It pushes the fix to the same feature branch, which updates the existing PR, and the follow-up is recorded as a new comment on the same PR. Do not fragment a single review cycle across multiple PRs.

## Approval

Claude Code must not approve PRs automatically. Human reviewers own final approval.
