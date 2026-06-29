# 71 · Watchlist Summary 와이어링

Status: Frozen
Track: FE
Pair: BE 050 (`docs/designs/050-watchlist-summary.md`)

## 1. 배경

WatchlistPage의 요약 카드(`mockWatchlistSummary`)와 "새로 추가된 관심 종목"(`mockRecentWatchlist`)을
BE 050의 `GET /watchlists/{watchlist_id}/summary`로 전환합니다. 출처가 없는 항목은 노출하지 않습니다
([[70-portfolio-risk-exposures-wiring]] 선례).

## 2. 범위

### 포함

- 요약 카드: "전체 관심 종목"(`total_count`), "위험 증가 종목"(`risk_increasing_count`) 2개만 실데이터.
- "새로 추가된 관심 종목": `recent_items[]` 실데이터(`created_at` 내림차순).

### 제외 (mock 유지 / 제거)

- "추가 리서치 필요", "평균 현금 연관도" 카드 — 출처 없어 **제거**.
- 모든 카드의 "전일 대비" 델타 라벨 — **제거**.
- 최근 추가 종목 status 배지(안정/관망) — **제거**.
- AI 관찰 메모, 빠른 알림 설정 — mock 유지(후속 트랙).

## 3. 변경

### 3.1 dto (`src/features/watchlist/dto.ts`)

- `RecentWatchlistItemDto { symbol, name, created_at }` 추가.
- `WatchlistSummaryDto { total_count, risk_increasing_count, recent_items }` 추가.

### 3.2 adapters (`src/features/watchlist/adapters.ts`)

- `WatchlistSummaryView { totalCount, riskIncreasingCount, recentItems: RecentWatchlistView[] }` 추가.
- `adaptWatchlistSummary(dto)` — 필드 매핑, `recent_items ?? []` 방어.
- `RecentWatchlistView { symbol, name, addedAt }`.

### 3.3 queries (`src/features/watchlist/queries.ts`)

- `useWatchlistSummary()` 추가 — 기존 `useWatchlistAssets`와 동일하게 첫 watchlist를 조회한 뒤
  `/watchlists/{id}/summary`를 호출합니다. watchlist가 없으면 빈 요약
  (`totalCount=0`, `riskIncreasingCount=0`, `recentItems=[]`)을 반환합니다.

### 3.4 WatchlistPage (`src/pages/ui/WatchlistPage.tsx`)

- 요약 카드: mock 4개 배열 렌더를 제거하고 2개 카드(전체 관심 종목 / 위험 증가 종목)를
  `summary.totalCount`·`summary.riskIncreasingCount`로 렌더합니다. 델타 라벨은 표시하지 않습니다.
- 출처 없는 카드 전용 시각 요소(`SummaryVisual`의 도넛/막대, `cashCorrelationData`, `researchBars` 등)는
  제거하거나 잔존 카드에 맞게 정리합니다.
- "새로 추가된 관심 종목"을 `summary.recentItems`로 렌더하고, status `Badge`를 제거합니다.
- `mockWatchlistSummary`, `mockRecentWatchlist` import 제거. `mockWatchlistObservations`,
  `mockWatchlistAlertSettings`는 유지.
- 로딩/에러/빈 상태 처리: 요약 쿼리 로딩 시 스켈레톤, 에러 시 기존 패턴, `recentItems` 0건 시 빈 상태 문구.

## 4. 계약·degradation

- BE 050 미배포 시 summary 호출 실패는 빈 요약으로 흡수해 페이지가 깨지지 않도록 합니다.
- `mockWatchlistSummary`, `mockRecentWatchlist` 정의 자체는 타 화면 영향 확인 전까지 `shared/mock`에
  남겨두고 WatchlistPage 사용만 제거합니다.

## 5. 범위 밖

- 전일 대비 델타, status 배지, AI 관찰 메모, 알림 설정.
