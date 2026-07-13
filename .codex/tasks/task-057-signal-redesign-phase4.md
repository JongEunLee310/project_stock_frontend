# Codex Handoff Task

## Source Issue

#135 — 시그널 페이지 재설계 4단계 — BE 계약 연결 (view=current·변화·전일대비·근거 불릿)
`gh issue view 135 --repo JongEunLee310/project_stock_frontend`

설계 문서: `docs/designs/135-signal-redesign-phase4.md` (반드시 먼저 읽는다)

## Task Summary

1단계(#131)가 "준비 중"으로 남긴 자리 4곳을 BE 실계약으로 연결한다. 시그널
목록을 `view=current`(종목당 dominant 1건)로 전환하고, KPI 전일 대비를
`/signals/summary`로, 우선순위 레일 "변화" 컬럼을 임베드된 `change`로, 최근
변경 레일을 `/signals/changes`로, 카드 본문을 `key_points` 불릿(빈 배열이면
`reason` 폴백)으로 채운다.

## Goal

작업 완료 시 다음 상태여야 한다.

- 시그널 페이지 카드 그리드가 `GET /signals?view=current&expand=asset` 기반
  으로 종목당 1카드를 표시한다.
- KPI 5종의 건수·비율·전일 대비가 `GET /signals/summary` 응답에서 파생된다.
  delta는 `+n`/`-n`/`±0`, summary 로딩·오류 시 `—`.
- 우선순위 레일 "변화" 컬럼이 `change` 기반 표기(설계 문서의 direction 매핑
  표)를 따른다. `change: null`은 `—`.
- 최근 변경 레일이 `GET /signals/changes` 타임라인을 표시한다. 행: 심볼
  (리서치 링크) · direction 라벨 · dominant 카테고리 배지(있을 때) · snapshot
  날짜. 빈 목록이면 "아직 변경 이력이 없습니다." EmptyState.
- 카드 본문이 `keyPoints` 불릿 목록으로 렌더되고, 빈 배열이면 기존 `reason`
  문단을 폴백으로 표시한다. 둘을 동시에 표시하지 않는다.
- DashboardPage는 동작이 변하지 않는다 (`useSignals` 기본 view=all 유지).
- `pnpm format:check`, `pnpm typecheck`, `pnpm lint`, `pnpm test`가 전부
  통과한다.

## Background

BE 계약은 project_stock(백엔드 repo) dev에 머지되어 있다. 응답 형태는 설계
문서의 DTO 절을 그대로 따른다. summary의 카테고리 키(WATCH/RISK/BUY/
RESEARCH)는 FE `SignalCategory`와 동일하다.

`change.direction`의 6값(NEW/CLEARED/ESCALATED/DEESCALATED/CHANGED/
UNCHANGED)과 표기·색상 매핑은 설계 문서 표를 따른다. CLEARED는 목록에는
나타나지 않고 타임라인에만 나타나며 그때 `dominant: null`이다.

현재 브랜치 `feat/135-signal-redesign-phase4`에서 그대로 작업한다. 새
브랜치를 만들지 않는다.

## Implementation Scope

**갱신**

- `src/features/signals/dto.ts` — `SignalChangeDto`·`SignalSummaryDto`·
  `SignalChangeTimelineItemDto` 신설, `SignalDto`에 `key_points`·`change`
  추가.
- `src/features/signals/adapters.ts` — `Signal`에 `keyPoints`·`change` 추가,
  `SignalChange` 뷰 모델·direction 표기 매핑, `adaptSignalSummary`·
  `adaptChangeTimelineItem` 신설.
- `src/features/signals/queries.ts` — `useSignals`에 view 파라미터(기본
  'all', queryKey 포함), `useSignalSummary`·`useSignalChanges(limit = 8)`
  신설.
- `src/pages/ui/SignalsPage.tsx` — view=current 전환, `SignalKpiRow` props를
  summary로 교체, 카드 불릿 렌더·폴백, "변화" 컬럼, `RecentChangesRail` 연결.
- `src/shared/mock/domain.ts` 등 msw 핸들러 — `/signals/summary`·
  `/signals/changes`·`view=current` 분기·`key_points`·`change` 필드.
- 테스트: `adapters.test.ts`, `queries.test.tsx`, `SignalsPage.test.tsx` 갱신
  및 아래 Test Requirements 추가.

**변경 불가**

- `src/features/signals/signalCategories.ts`
- `src/pages/ui/DashboardPage.tsx`
- BE 계약 관련 이외의 페이지·위젯

## Test Requirements

- adapters: `key_points` 누락/null → `keyPoints: []`, direction 6값 표기
  매핑, summary 4축 키 누락 시 0 채움, timeline `dominant: null` 처리.
- queries: `useSignals`가 view=current일 때 쿼리스트링·queryKey에 반영,
  `useSignalSummary`·`useSignalChanges` 응답 변환.
- SignalsPage: 불릿 렌더와 빈 배열 reason 폴백(동시 표시 없음), KPI delta
  `+n`/`-n`/`±0`·로딩 시 `—`, "변화" 컬럼 표기(`change: null` 포함), 최근
  변경 레일 행 구성과 빈 상태 문구.
- DashboardPage 테스트가 수정 없이 통과한다.

## Out of Scope

- 알림 설정 버튼 활성화·deep-link (FE #134).
- 좌측 시장 요약 사이드바.
- 기간 필터 UI(`since` 파라미터).
- BE 계약 변경.

## Rules

- 커밋은 1개로 만든다. push는 하지 않는다.
- 필요하지 않은 추상화를 추가하지 않는다.

## Verification

- `pnpm format:check`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
