# Claude Command: Review Local PR

Review a PR locally after PR creation.

## Required Review Inputs

- PR diff.
- Related issue.
- Codex handoff task.
- CI result.
- Protected file changes.
- Documentation impact.
- ADR need.
- Failure Record need.
- Domain knowledge impact.

## Output Format

Write the result to the durable, versioned file:

`docs/reviews/pr-<PR_NUMBER>.md`

Use this fixed section order and headers (keep each header even when empty, stating "None"):

## Review Summary

## Blocking

## Suggestions

## Questions

## CI Result

## Documentation Impact

## Final Recommendation

## Publishing Commands

Suggested commands:

```bash
gh pr comment <PR_NUMBER> --body-file docs/reviews/pr-<PR_NUMBER>.md
gh pr review <PR_NUMBER> --comment --body-file docs/reviews/pr-<PR_NUMBER>.md
gh pr review <PR_NUMBER> --request-changes --body-file docs/reviews/pr-<PR_NUMBER>.md
```

Do not approve PRs automatically. See `docs/harness/local-review-policy.md`.
