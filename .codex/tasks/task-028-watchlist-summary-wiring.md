# Codex Handoff Task

## Source Issue

설계: `docs/designs/71-watchlist-summary-wiring.md` (Frozen). BE 페어: 050 / BE #task-116.

## Task Summary

WatchlistPage의 요약 카드와 "새로 추가된 관심 종목"을 mock에서 BE 050
(`GET /watchlists/{id}/summary`)의 실데이터로 전환합니다.

## Goal

- 요약 카드는 "전체 관심 종목"(`total_count`), "위험 증가 종목"(`risk_increasing_count`) 2개만 실데이터로 표시.
- "새로 추가된 관심 종목"은 `recent_items[]`로 표시(status 배지 없음).
- 출처 없는 카드 2개와 전일 대비 델타 라벨은 제거.

## Background — 오케스트레이터가 확정한 사실

- 설계 71이 정본이며 동결됨.
- BE 050 응답: `{ total_count, risk_increasing_count, recent_items: [{ symbol, name, created_at }] }`.
- "추가 리서치 필요", "평균 현금 연관도" 카드는 BE 출처가 없어 **제거**한다(mock 유지 아님).
- 전일 대비 델타 라벨, 최근 추가 status 배지(안정/관망)는 **제거**한다.
- AI 관찰 메모(`mockWatchlistObservations`), 빠른 알림 설정(`mockWatchlistAlertSettings`)은 **유지**한다.
- `useWatchlistSummary`는 기존 `useWatchlistAssets`처럼 첫 watchlist를 조회한 뒤 summary를 호출하고,
  watchlist가 없거나 호출 실패 시 빈 요약으로 흡수한다.

## Implementation Scope

- `src/features/watchlist/dto.ts`
  - `RecentWatchlistItemDto { symbol, name, created_at }`,
    `WatchlistSummaryDto { total_count, risk_increasing_count, recent_items }` 추가.
- `src/features/watchlist/adapters.ts`
  - `WatchlistSummaryView`, `RecentWatchlistView`, `adaptWatchlistSummary(dto)` 추가
    (`recent_items ?? []` 방어).
- `src/features/watchlist/queries.ts`
  - `useWatchlistSummary()` 추가(빈 요약 fallback 포함).
- `src/pages/ui/WatchlistPage.tsx`
  - 요약 카드 2개를 실데이터로 렌더, 출처 없는 카드/델타/관련 차트 요소 정리.
  - "새로 추가된 관심 종목"을 `recentItems`로 렌더, status `Badge` 제거.
  - `mockWatchlistSummary`, `mockRecentWatchlist` import 제거.

## Out of Scope

- `mockWatchlistObservations`, `mockWatchlistAlertSettings` 변경(유지).
- `shared/mock/domain.ts`의 mock 정의 자체 삭제(정의는 남기고 페이지 사용만 제거).
- 관심 종목 목록 테이블 로직(기존 `useWatchlistAssets`) 변경.

## Protected Files

없음.

## Requirements

- BE 미배포/호출 실패 시 빈 요약(`totalCount=0`, `riskIncreasingCount=0`, `recentItems=[]`)으로 graceful 처리.
- 요약 로딩/에러/빈 상태 처리.
- typecheck/lint/format 통과.

## Test Requirements

- `adaptWatchlistSummary`: 정상 매핑, `recent_items` 누락 시 `[]` 폴백.
- WatchlistPage 렌더: 카드 2개 값 표시, status 배지 부재, recentItems 0건 빈 상태.
- 범위 밖 mock(`mockWatchlistObservations`, `mockWatchlistAlertSettings`)이 그대로 렌더되는지 확인.

## Verification Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm format:check`
- `TZ=UTC corepack pnpm test`
- `corepack pnpm build`

## Documentation Impact

- `docs/designs/71-watchlist-summary-wiring.md` 추가됨(정본).
- 이 핸드오프 문서 추가.

## ADR Need

불요. 기존 summary 소비 확장, 신규 아키텍처 결정 없음.

## Failure Record Need

불요. 국소 변경, 회귀는 테스트로 커버.

## Risk Level

Low. 페이지 국소 변경, graceful degradation 유지.

## Expected Output

- 위 4개 파일 변경 + 테스트.
- 브랜치 `feat/watchlist-summary-wiring`에 커밋(한국어 메시지).

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
