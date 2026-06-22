# Designs

## Directory Purpose

This directory stores skeleton design records written before a Codex handoff, per `docs/harness/design-record-policy.md`.

## File Naming Rules

Use `<issue>-<slug>.md`, one file per issue. `<slug>` is a short kebab-case summary.

## Skeleton Template

```markdown
# <Issue> — <Title>

## Context

What this change is for. Link the issue.

## Models

- `<ModelName>` — fields with type and constraints only.

## APIs

- `<METHOD> <path>` — request schema name, response schema name.

## Services / Repositories

- `<name>(<signature>)` — one-line responsibility.

## Open Questions

- ...
```

## Content Rules

Describe structure, not implementation. No SQL, query bodies, migrations, or business-logic code. See `docs/harness/design-record-policy.md`.

## Related Directories

- `docs/harness/`
- `docs/decisions/`
- `docs/knowledge/`
