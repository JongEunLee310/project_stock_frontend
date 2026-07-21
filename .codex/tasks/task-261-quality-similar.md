# Codex Handoff Task — task-261: 판단 품질 체크리스트 + 유사 판단 표시

## Source Issue

FE #261 — 판단 품질 체크리스트 + 유사 판단 표시. 상위 #248(3차). Epic
`project_stock_frontend#242`. BE 계약: `project_stock` #365(`GET /decision-logs/{id}/similar`).

## Task Summary

판단 상세에 (1) 복기 품질(process_quality)을 체크리스트/점수로 표시하고, (2) 유사 과거 판단
링크를 노출한다. BE 유사 검색 API를 소비한다.

## Goal

- 판단 상세에서 복기의 `process_quality`를 항목별 체크리스트/점수로 표시(복기가 있을 때).
- 판단 상세에서 유사 과거 판단(`GET /decision-logs/{id}/similar`)을 목록으로 표시, 항목 클릭
  시 해당 판단 상세로 이동.
- `pnpm format:check` / `pnpm lint` / `pnpm typecheck` / `pnpm test` 통과.

## Background

- 복기 데이터는 `useDecisionReviews(id)`(#252)로 조회. `process_quality`는 항목별 수치(근거
  충분성·반대 근거 검토·위험 인식·재검토 명확성·규칙 준수). `shared/model/processQuality.ts`
  라벨(#260에서 추가)을 재사용한다.
- 유사 판단: `GET /api/v1/decision-logs/{id}/similar` → `DecisionLogListItem[]`. `useSimilarDecisions(id)` 훅 추가.
- 설계 §24: 품질 점검은 자동 점수보다 체크리스트/설명형이 안전. 항목을 ✓/△/✕ 형태로 표현
  가능. AI 확정 진단 금지.

## Implementation Scope

- `src/features/decision-log/dto.ts`·`queries.ts` — `useSimilarDecisions(id)`(기존 list-item
  어댑터 재사용).
- `src/widgets/decision-detail/DecisionDetail.tsx`(또는 상세 페이지) — 품질 체크리스트 섹션
  (복기 process_quality 표시) + 유사 판단 섹션.
- 필요 시 `src/widgets/decision-quality-checklist/`.
- 테스트.

## Out of Scope

- 품질 자동 점수 산정(체크리스트/설명형으로 표시만), analytics(#260, 완료), BE 변경.

## Protected Files

없음.

## Requirements

- 복기가 없으면 품질 체크리스트는 "복기 후 표시" 등 빈 상태.
- process_quality 항목은 `shared/model` 라벨로, 값은 점수/체크로 중립 표시(확정 진단 금지).
- 유사 판단은 로딩·빈 상태 처리, 항목 클릭 시 `/decision-log/:id` 이동.
- 유사 판단이 경량 항목(대상·유형·이유 요약 등)으로 표시.

## Test Requirements

- 복기 있는 판단에서 process_quality 체크리스트 렌더, 없으면 빈 상태.
- 유사 판단 목록 렌더·항목 클릭 내비게이션·빈 상태.
- enum·항목 라벨 표시.

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

Low~Medium — 상세 확장·유사 판단 소비.

## Expected Output

- 변경 파일: queries/dto, decision-detail(+체크리스트 위젯) + 테스트.
- 검증 4종 통과 로그.
- 현재 브랜치 `feat/261-quality-similar` 유지(새 브랜치 금지). 한국어 `feat:` 커밋, `#261`
  참조.
