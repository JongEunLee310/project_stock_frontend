# Codex Handoff Task — task-260: 판단 분석 화면

## Source Issue

FE #260 — 판단 분석 화면(`/decision-log/analytics`). 상위 #248(3차). Epic
`project_stock_frontend#242`. BE 계약: `project_stock` #364(`GET /decision-logs/analytics`).

## Task Summary

판단 분석 화면을 추가한다. 반복 판단 패턴과 품질 지표를 BE 집계로 받아 시각화한다. AI 확정
진단 없이 정량 지표/점검 후보로만 표시한다.

## Goal

- `/decision-log/analytics` 라우트·화면에서 판단 분석 지표를 표시한다.
- `useDecisionAnalytics` 훅으로 `GET /decision-logs/analytics` 소비.
- 판단 기록 화면에서 분석 화면으로의 진입점.
- `pnpm format:check` / `pnpm lint` / `pnpm typecheck` / `pnpm test` 통과.

## Background

BE 계약(`project_stock` #364, `docs/designs/364-decision-analytics.md`):

- `GET /api/v1/decision-logs/analytics` → `{ total_count, decision_type_distribution:
  [{type,count,share}], counter_argument_rate, confidence_distribution: [{level,count,share}],
  outcome_by_confidence: [{level,thesis_result,count}], risk_tag_frequency: [{type,count}],
  review_adherence: {reviewed_count,overdue_count,adherence_rate}, process_quality_averages:
  {<항목>:avg}, as_of }`.
- 지표는 정량 집계다. FE는 이를 비율·빈도·준수율·성과로 시각화하고, 편향은 "점검 후보/지표"로
  중립적으로 제시한다(확정 진단 어조 금지, 스펙 §16).

## Implementation Scope

- `src/features/decision-log/dto.ts` — analytics 응답 타입.
- `src/features/decision-log/adapters.ts` — analytics 변환.
- `src/features/decision-log/queries.ts` — `useDecisionAnalytics`.
- `src/shared/model/` — `thesisResult` 등 기존 라벨 재사용, 필요한 라벨 보강.
- `src/pages/ui/DecisionAnalyticsPage.tsx`(신규) — 분석 화면.
- `src/app/router.tsx`·`src/shared/config/navigation.ts` — `/decision-log/analytics` 라우트.
- `src/pages/ui/DecisionLogPage.tsx` 또는 헤더 — 분석 화면 진입점.
- 필요 시 `src/widgets/decision-pattern-panel/`.
- 테스트.

## Out of Scope

- 유사 판단 검색 표시(#261), 품질 체크리스트(#261 — 단순 평균 표시는 이 화면에 포함 가능).
- insight AI 문장 생성(BE 후속), 거래 연동.
- BE 변경(analytics 계약 이미 존재).

## Protected Files

없음. router/navigation은 경로 추가만.

## Requirements

- 지표를 시각적으로 구분해 표시(분포·비율·빈도·준수율·성과·품질 평균).
- 편향/충동 관련 지표(반대 근거 작성률 등)는 중립적 표현으로, 확정 진단 어조 금지.
- enum·라벨은 `shared/model` 사용.
- 0건·빈 분포·로딩·오류 상태 처리.

## Test Requirements

- analytics 응답이 각 지표 영역에 반영.
- 0건·빈 상태·오류·로딩 처리.
- 분석 화면 라우트 매칭·진입점 동작.
- 편향 지표가 중립적 라벨로 표시(확정 진단 문구 없음).

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

Medium — 신규 화면·다지표 시각화.

## Expected Output

- 변경 파일: dto/adapters/queries, DecisionAnalyticsPage, router/navigation, 진입점 + 테스트.
- 검증 4종 통과 로그.
- 현재 브랜치 `feat/260-decision-analytics-ui` 유지(새 브랜치 금지). 한국어 `feat:` 커밋,
  `#260` 참조.
