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
- `위험 증가` -> `status-risk`
- `추가 리서치 필요` -> `status-research`
- `매수 검토 가능` -> `status-buy`
