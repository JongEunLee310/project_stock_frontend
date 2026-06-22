# Issue 6 — 도메인 타입 및 Mock 데이터

## Context

백엔드 API 완성 전에도 화면 개발이 가능하도록 핵심 도메인 타입과 Mock 데이터를 정의한다. 타입은 컴포넌트 props의 기준이 되고, Mock은 실제 API로 교체 가능한 구조로 둔다. 아래 필드는 1차 골격이며 페이지 구현 시 확정한다. 이슈 6.

## Shared Enum

- `StockStatus` — `'안정' | '관망' | '위험 증가' | '추가 리서치 필요' | '매수 검토 가능'` (이슈 3 상태 색상과 1:1 매핑).

## Models

- `Stock` — `symbol: string`, `name: string`, `price: number`, `change: number`, `changePercent: number`, `status: StockStatus`.
- `Signal` — `id: string`, `symbol: string`, `kind: string`(시그널 종류), `message: string`, `createdAt: string`(ISO), `status: StockStatus`.
- `Portfolio` — `totalValue: number`, `holdings: Holding[]`.
  - `Holding` — `symbol: string`, `quantity: number`, `avgPrice: number`, `currentValue: number`.
- `AlertRule` — `id: string`, `symbol: string | null`, `condition: string`, `threshold: number`, `enabled: boolean`.
- `DecisionLog` — `id: string`, `symbol: string`, `decision: string`, `rationale: string`, `createdAt: string`(ISO).

## Mock Data

- 각 모델별 대표 샘플을 `shared/`의 mock 모듈에 정의한다.
- Mock은 도메인 타입을 그대로 만족시켜, 추후 API 응답으로 무손실 교체가 가능해야 한다.

## Open Questions

- `Signal.kind`를 자유 문자열로 둘지 enum으로 고정할지(시그널 종류 확정 후 결정).
- `AlertRule.condition`의 표현(문자열 vs 구조화 객체).
- `DecisionLog`에 작성자/판단 시점 가격 등 추가 필드 필요 여부.

## Related

- ADR-003 (`docs/decisions/ADR-003-frontend-foundation-stack.md`)
- `docs/designs/2-frontend-architecture.md`
- 이슈 3(상태 색상), 이슈 7~ 페이지 구현
