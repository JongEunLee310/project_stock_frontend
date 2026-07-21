# Codex Handoff Task — task-252: 판단 복기 작성 화면

## Source Issue

FE #252 — 판단 복기 작성 화면 (`/decision-log/:id/review`). 상위 #247(2차). Epic
`project_stock_frontend#242`. BE 계약: `project_stock` #358(`POST`/`GET
/api/v1/decision-logs/{id}/reviews`).

## Task Summary

판단 상세에서 진입하는 복기 작성 화면을 만든다. 판단 품질과 투자 결과를 **분리 표시**한다
(설계 §14). BE 복기 API를 소비한다.

## Goal

- `/decision-log/:id/review` 라우트에서 복기를 작성·표시한다.
- 판단 품질(체크리스트/설명형)과 투자 결과(수익률·벤치마크·MDD)를 **분리된 영역**으로 입력·
  표시한다.
- 판단 상세에서 복기 화면으로 이동하는 진입점을 둔다.
- `pnpm format:check` / `pnpm lint` / `pnpm typecheck` / `pnpm test` 통과.

## Background

BE 계약(`project_stock` #358, `docs/designs/358-decision-review.md`):

- `POST /api/v1/decision-logs/{id}/reviews` body `DecisionReviewCreate`:
  `{ outcome_status, thesis_result, process_quality?: object, result_metrics?: object,
  what_went_well?, what_was_missed?, what_to_change? }`.
- `GET /api/v1/decision-logs/{id}/reviews` → 복기 목록(최신순).
- `outcome_status`: `THESIS_CONFIRMED | THESIS_PARTIALLY_CONFIRMED | THESIS_INVALIDATED |
  INSUFFICIENT_TIME | CLOSED`. `thesis_result`: `CONFIRMED | PARTIALLY_CONFIRMED |
  INVALIDATED`.
- `process_quality`/`result_metrics`는 자유 JSON. FE는 설계 §14 항목을 폼으로 구성:
  품질 = 근거 충분성·반대 근거 검토·위험 인식·재검토 명확성·규칙 준수; 결과 = return_rate·
  benchmark_return_rate·max_drawdown.
- 복기 작성 시 BE가 판단 상태를 `REVIEWED`로 전이한다. DRAFT 판단 복기는 409.

원칙(설계 §14): 투자 결과와 판단 품질을 분리한다. 결과가 좋아도 과정이 나쁠 수 있고 그
반대도 가능하다.

## Implementation Scope

- `src/features/decision-log/dto.ts` — 복기 요청/응답 타입(`*Dto`).
- `src/features/decision-log/adapters.ts` — 복기 응답 변환.
- `src/features/decision-log/queries.ts` — `useDecisionReviews(id)`,
  `useCreateDecisionReview(id)`.
- `src/shared/model/` — `outcomeStatus`·`thesisResult` 라벨 매핑(한글), `index.ts` export.
- `src/pages/ui/DecisionReviewPage.tsx`(신규) — 복기 작성 화면.
- `src/app/router.tsx`·`src/shared/config/navigation.ts` — `/decision-log/:id/review` 라우트
  추가.
- 판단 상세(`DecisionDetailPage`/`widgets/decision-detail`)에 복기 화면 진입점.
- 테스트.

## Out of Scope

- 당시/현재 비교·타임라인·버전 이력(#253), 딥링크(#254), 필터(#255).
- 품질 점수 자동 산정(3차).
- BE 변경(#358에서 완료).

## Protected Files

없음. router/navigation은 경로 추가만.

## Requirements

- 품질 입력과 결과 입력을 화면에서 분리(같은 폼이라도 시각적으로 구분).
- `outcome_status`·`thesis_result`는 `shared/model` 라벨로 선택.
- 복기 저장 성공 시 판단/복기 쿼리 무효화, 상세로 복귀 또는 복기 목록 갱신.
- DRAFT 판단(복기 불가)·404/403·오류 상태 처리.

## Test Requirements

- 복기 작성 → `POST reviews` 호출, 품질·결과가 분리 전송.
- 복기 목록 표시(최신순).
- outcome/thesis enum 라벨 선택.
- 오류·권한 상태 처리.

## Verification Commands

```
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
```

## Documentation Impact

불필요(BE 계약 정본은 `project_stock`).

## ADR Need

불필요.

## Failure Record Need

불필요.

## Risk Level

Medium — 신규 화면·라우트·폼(품질/결과 분리).

## Expected Output

- 변경 파일: dto/adapters/queries, shared/model, DecisionReviewPage, router/navigation, 상세
  진입점 + 테스트.
- 검증 4종 통과 로그.
- 현재 브랜치 `feat/252-decision-review-ui` 유지(새 브랜치 금지). 한국어 `feat:` 커밋, `#252`
  참조.
