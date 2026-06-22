# shared

Domain-agnostic UI, domain model types, utilities, API clients, and mock
infrastructure.

## Domain Model And Mock Data

Core domain types live in `shared/model`.
Representative mock data that satisfies those types lives in `shared/mock`.

## UI Tokens

Dark theme tokens are defined in `src/index.css` with Tailwind CSS v4 `@theme`.
Shared primitives live in `shared/ui`.

Status color mapping:

- `안정` -> `status-stable`
- `관망` -> `status-watch`
- `관망 유지` -> `status-watch-hold`
- `위험 증가` -> `status-risk`
- `추가 리서치 필요` -> `status-research`
- `매수 검토 가능` -> `status-buy`
- `비중 축소 검토` -> `status-reduce`

Risk level color mapping:

- `높음` -> `status-level-high`
- `중간` -> `status-level-medium`
- `낮음` -> `status-level-low`

When adding a status or risk level, update the model union, `@theme` tokens,
and the `Record` mapping together so typecheck catches missing color mappings.
