# Codex Handoff Task

## Source Issue

설계: `docs/designs/73-decision-log-stats-wiring.md` (Frozen). BE 계약: `project_stock` 설계 052
(`GET /decision-logs/stats`).

## Task Summary

DecisionLogPage 우측 aside의 두 mock 카드를 BE `GET /decision-logs/stats` 실데이터로 교체합니다.
"자주 나온 판단 패턴"은 `decision_type_counts`(전체 기간) 기반으로, "최근 복기 메모"는 "최근 검토한 판단"
으로 재해석해 `recent_reviewed` 기반으로 렌더합니다.

## Goal

- `mockDecisionPatterns`·`mockReviewMemos` import·사용 제거(정의는 `shared/mock`에 유지).
- 패턴 카드가 stats의 유형별 분포를, 검토 카드가 최근 검토 판단을 실데이터로 표시한다.
- BE 미배포 시 두 카드만 graceful degrade하고 목록/작성 폼/요약은 정상.

## Background — 오케스트레이터가 확정한 사실

- 설계 73이 정본이며 동결됨. 아래대로 구현할 것.
- BE 052 응답: `decision_type_counts: Record<string, number>`, `total: number`,
  `recent_reviewed: ReviewedDecisionDto[]`.
- `ReviewedDecisionDto`: `id`, `ticker`, `company_name?`, `decision_type`, `reason?`, `risk_note?`,
  `reviewed_at`(non-null).
- 유형 코드 라벨링은 기존 `toDecisionTypeLabel`(`@/shared/model`) 재사용. 신규 라벨맵 만들지 말 것.
- 회고 텍스트 합성 금지. 검토 카드의 표시 텍스트는 `reason` 우선, 없으면 `risk_note`, 둘 다 없으면 빈 문자열.
- `apiGet`은 `{ data, meta? }`를 반환. stats는 `data`에서 추출.

## Implementation Scope

- `src/features/decision-log/dto.ts`
  - `DecisionLogStatsDto`, `ReviewedDecisionDto` 추가.
- `src/features/decision-log/queries.ts`
  - `decisionLogStatsQueryKey = ['decision-logs', 'stats']`.
  - `useDecisionLogStats()` — `GET /decision-logs/stats`, `data` 어댑팅.
- `src/features/decision-log/adapters.ts`
  - `adaptDecisionTypeCounts(counts, total) -> { type, label, count, percent }[]`
    (count desc 정렬, `label`=`toDecisionTypeLabel`, `percent`=total 기준 반올림, total 0이면 percent 0).
  - `adaptReviewedDecision(dto) -> { id, symbol, decisionTypeLabel, note, reviewedAt }`
    (`note`=`reason?.trim() || risk_note?.trim() || ''`, `reviewedAt`=`formatKstDateTime(reviewed_at)`).
- `src/pages/ui/DecisionLogPage.tsx`
  - `mockDecisionPatterns`/`mockReviewMemos` import·사용·`sortedPatterns`/`patternTotal` 제거.
  - `useDecisionLogStats()` 연동.
  - "자주 나온 판단 패턴" 카드: stats 패턴 배열로 기존 막대 UI(meter/percent) 렌더. 로딩 `Skeleton`,
    에러/0건 `EmptyState`("집계된 판단이 없습니다.").
  - 카드 제목 "최근 복기 메모" → "최근 검토한 판단", `recent_reviewed`로 목록 렌더(종목·유형 배지·note·
    검토 시각). 로딩 `Skeleton`, 0건 `EmptyState`("검토한 판단이 없습니다.").
  - 기존 `TODO: BE 미지원` 주석 2개 제거.

## Out of Scope

- 상단 요약 카드 4종 로직 변경(후속).
- `shared/mock`의 mock 정의 삭제(import·사용만 제거, 정의는 유지).
- 신규 라우팅/페이지, 회고 메모 작성 UI.
- 새 라벨 맵·의미 분류 도입.

## Protected Files

없음.

## Requirements

- 타입 안전(any 금지). 어댑터 경계에서 nullish 방어.
- BE 미배포(stats 404/에러) 시 두 카드만 에러/빈 상태, 페이지 나머지 정상.
- 기존 목록/요약/작성 폼 동작 불변.

## Test Requirements

- `src/features/decision-log/adapters.test.ts`: `adaptDecisionTypeCounts`(정렬·percent·0 total),
  `adaptReviewedDecision`(note 우선순위 reason→risk_note→'').
- `src/pages/ui/DecisionLogPage.test.tsx`: 두 카드 실데이터 렌더, 로딩/빈 상태. 기존 테스트 갱신.

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm format:check`
- `TZ=UTC pnpm test`
- `pnpm build`

## Documentation Impact

- `docs/designs/73-decision-log-stats-wiring.md` 추가됨(정본).
- 이 핸드오프 문서 추가.

## ADR Need

불요. 기존 decision-log 소비 확장, 신규 아키텍처 결정 없음.

## Failure Record Need

불요. 국소 변경, 회귀는 테스트로 커버.

## Risk Level

Low. 기존 페이지의 두 카드 데이터 소스 교체, mock 정의는 유지.

## Expected Output

- 위 4개 파일 변경 + 테스트 추가/갱신.
- 브랜치 `feat/decision-log-stats-wiring`에 커밋(한국어 메시지).

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
