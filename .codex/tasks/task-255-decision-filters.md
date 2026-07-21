# Codex Handoff Task — task-255: 판단 기록 목록 필터 UI + 재검토 큐

## Source Issue

FE #255 — 판단 기록 목록 필터 UI + 재검토 큐. 상위 #247(2차). Epic
`project_stock_frontend#242`.

## Task Summary

1차에서 미룬 목록 필터 UI를 추가하고, 재검토 예정 큐를 화면에 노출한다. 필터·재검토 큐용
BE 계약과 훅은 이미 존재한다(`useDecisionLogs(filters)`, `useReviewQueue`).

## Goal

- 판단 기록 목록에 필터 바를 둔다: `target_type`·`decision_type`·`status`·`risk_type`·
  `review_due_before`(+기존 `symbol`). 필터 변경 시 목록이 갱신된다.
- 재검토 예정 큐를 화면에 노출한다(`useReviewQueue` 소비). 항목 클릭 시 판단 상세로 이동.
- `pnpm format:check` / `pnpm lint` / `pnpm typecheck` / `pnpm test` 통과.

## Background

- `features/decision-log/queries.ts`의 `useDecisionLogs(filters)`가 이미 `DecisionLogFilters`
  (target_type·symbol·decision_type·status·risk_type·review_due_before·page·size·sort)를
  쿼리 파라미터로 직렬화한다. FE는 이 필터를 UI로 노출만 하면 된다.
- `useReviewQueue`가 재검토 예정 목록을 반환한다(BE `GET /decision-logs/review-queue`).
- enum 값은 `shared/model` 라벨로 표시(영문 직접 노출 금지).

## Implementation Scope

- `src/widgets/decision-log-table/` 또는 신규 `src/widgets/decision-filter-bar/` — 필터 바
  컴포넌트. 셀렉트/입력으로 필터 상태를 만들고 `useDecisionLogs`에 전달.
- `src/widgets/review-queue-panel/`(신규) — 재검토 예정 큐 패널.
- `src/pages/ui/DecisionLogPage.tsx` — 필터 바·재검토 큐 배치.
- 테스트.

## Out of Scope

- 상세 2차(#253), 딥링크(#254), 복기(#252, 완료).
- BE 변경(필터·큐 계약 이미 존재).
- 커서 페이지네이션(기존 offset 유지).

## Protected Files

없음.

## Requirements

- 필터는 조합 가능하며 미선택 시 조건 없음(전체). 필터 변경이 목록 쿼리에 반영.
- `target_type`·`decision_type`·`status`·`risk_type`는 `shared/model` 라벨로 선택.
- `review_due_before`는 날짜 입력.
- 재검토 큐는 로딩·빈 상태 처리, 항목 클릭 시 `/decision-log/:id` 이동.
- 빈 결과·초기 상태를 명확히 표시.

## Test Requirements

- 필터 선택 시 목록 쿼리 파라미터가 반영되는지.
- 필터 조합·초기화 동작.
- 재검토 큐 렌더·항목 클릭 내비게이션·빈 상태.

## Verification Commands

```
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
```

## Documentation Impact

불필요.

## ADR Need

불필요.

## Failure Record Need

불필요.

## Risk Level

Low — 읽기 UI, 계약·훅 이미 존재.

## Expected Output

- 변경 파일: 필터 바·재검토 큐 위젯 + DecisionLogPage + 테스트.
- 검증 4종 통과 로그.
- 현재 브랜치 `feat/255-decision-filters` 유지(새 브랜치 금지). 한국어 `feat:` 커밋, `#255`
  참조.
