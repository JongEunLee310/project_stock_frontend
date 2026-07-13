# Design: 관심 종목 페이지 완성 Phase 1 (#117)

## Status

Implemented

## Context

`WatchlistPage`의 현재 구현과 초기 디자인 시안 사이에 테이블 컬럼 구성, 요약 카드,
필터, 우측 레일에서 차이가 확인된다. Phase 1은 기존 BE 계약 범위 안에서 해결 가능한
항목만 다룬다.

## Verified Facts

확인 기준 — FE: `feat/115-fx-display` (2026-07-08), BE: `origin/dev` (PR #229 머지 이후).

- `DELETE /watchlists/{watchlist_id}/items/{item_id}` → `ApiResponse<None>` (HTTP 200, `data: null`)
  — `app/api/v1/endpoints/watchlists.py:228-240`
- `GET /watchlists/{id}/items?page={p}&size={s}&sort=priority&expand=asset` 응답에
  `meta: { page, size, total }` 포함 — `app/api/v1/endpoints/watchlists.py:87-128`
- `size` 파라미터 허용 범위: `ge=1, le=100` — `app/core/pagination.py:13`
- `AssetBriefResponse.market: str` — `app/domains/watchlists/schema.py:42`
  → `WatchlistItemAssetDto`에 현재 누락 (가정 아님, BE 응답에 이미 포함)
- `ApiMeta { page: number; size: number; total: number }` — `src/shared/api/envelope.ts:8-12`
- `apiDelete` 함수 존재 — `src/shared/api/client.ts:147`
- `toTablePagination(meta, onPageChange)` 유틸 존재 — `src/shared/api/paging.ts:4-15`
- `appRoutePaths.decisionLog = '/decision-log'` — `src/shared/config/navigation.ts:8`
- `DecisionLogPage` 라우트 등록됨 (`<AppShell />` 자식) — `src/app/router.tsx:39-41`
- `FxRateStrip`, `MarketSummary`는 현재 `Sidebar` 하단 `mt-auto` 영역에 위치
  — `src/widgets/Sidebar.tsx:91-94`
- `AppShell` 구조: `lg:grid-cols-[16rem_minmax(0,1fr)]`, `<Sidebar />` + `<main>` 분리
  — `src/widgets/AppShell.tsx:9`

## Decisions

### 1. 즐겨찾기(★) 컬럼 제거

테이블 첫 컬럼 `<td>` 버튼(★/☆)을 제거한다. `WatchlistAssetRow.isFavorite`,
`favoriteBySymbol` state, `toggleFavorite` callback을 함께 제거한다.
`adaptWatchlistAsset`의 `isFavorite: true` 하드코딩도 삭제한다.
테이블 헤더 배열과 `colSpan` 값을 이에 맞춰 조정한다.

### 2. 알림 현황 카드 제거

우측 레일의 "알림 현황" `<Card>` 전체를 제거한다. `WatchlistPage`에서
`useUnreadAlertSummary` import와 `unreadAlertSummaryQuery` 상태, `alertSummary`
변수를 함께 제거한다. `Sidebar`는 배지 표시를 위해 `useUnreadAlertSummary`를
계속 사용하므로 `src/features/alerts/queries.ts`는 건드리지 않는다.

### 3. 서버 페이지네이션 연동

`useWatchlistAssets`를 `page: number`, `size: number` 파라미터를 받도록 수정하고,
반환 타입을 `{ rows: WatchlistAssetRow[]; meta: ApiMeta | undefined }`로 변경한다.
내부적으로 `apiGet` 응답의 `meta`를 `unwrapEnvelope`가 이미 노출하므로 이를 그대로
전달한다.

`WatchlistPage`에 `page` state(기본값 1)와 `pageSize` state(10 | 25 | 50, 기본값 10)를
추가한다. 페이지네이션 버튼과 표시 개수 select를 활성화하고, 표시 개수 변경 시
`page`를 1로 초기화한다. 클라이언트 측 `slice`와 `visiblePageNumbers` 계산 로직은
제거하고, `meta.total`을 기반으로 전체 페이지 수를 계산한다.

시장 필터(아이템 4 참고)는 클라이언트 필터이므로 page/size와 독립적으로 적용한다.

### 4. 시장 필터 드롭다운

`WatchlistItemAssetDto`에 `market?: string` 필드를 추가한다. `WatchlistAssetRow`에
`market: string` 필드를 추가하고 어댑터에서 `item.asset.market ?? 'UNKNOWN'`으로
전달한다.

`WatchlistPage`에 `marketFilter` state(기본값 `''` = 전체)를 추가하고,
`visibleStocks` 필터링 단계에서 `stock.market`을 기준으로 클라이언트 필터링한다.
드롭다운 옵션 목록은 현재 로드된 `rows`에서 유일한 `market` 값을 추출해 동적으로
구성한다.

### 5. 행 메뉴 관심 해제 — DELETE 연결

`useRemoveWatchlistItem()` mutation을 `queries.ts`에 추가한다. mutation 함수는
첫 번째 watchlistId를 내부적으로 조회하고 `apiDelete`를 호출한다. `onSuccess`에서
`watchlistQueryKey`(목록)와 `[...watchlistQueryKey, 'summary']`(요약)를 invalidate한다.

`RowMenu` 컴포넌트에 `onRemove: (itemId: number) => void` prop을 추가한다. 버튼
클릭 시 mutation을 트리거하고, 진행 중에는 버튼을 `disabled` 처리한다.

### 6. 행 메뉴 결정 기록 — 라우트 연결

`RowMenu`에 `useNavigate`를 추가하고 "결정 기록" 버튼 클릭 시
`appRoutePaths.decisionLog`(`/decision-log`)로 이동한다. Phase 1에서는 symbol
query string 없이 페이지 최상위로 이동한다. symbol 기반 사전 필터링은 Phase 2로
보류한다 (현재 `DecisionLogPage` 라우트에 심볼 파라미터 없음).

### 7. MarketSummary + FxRateStrip — 플로팅 카드로 전환

`Sidebar.tsx`의 `mt-auto` 영역에서 `<FxRateStrip />`와 `<MarketSummary />`를
제거한다. 이를 대체하는 `FloatingMarketCard` 컴포넌트를 신규 생성한다.

`FloatingMarketCard`는 `position: fixed`, `bottom: 1rem`, `left: 1rem`,
`z-index: 30`으로 배치하고 모바일(`lg` 미만)에서는 숨긴다(`hidden lg:flex`).
너비는 `w-[calc(16rem-2rem)]`(사이드바 폭 - 좌우 패딩)으로 지정한다.
`AppShell.tsx`에서 `<FloatingMarketCard />`를 최상위 `div` 안에 추가한다
(`<Outlet />` 외부, `<Sidebar />` 형제).

`Sidebar.tsx`에서는 `FxRateStrip`, `MarketSummary` import와 렌더링을 제거한다.
`Sidebar.test.tsx`의 mock 선언도 함께 제거한다.

## Components

### 신규

- `src/widgets/FloatingMarketCard.tsx`
  — `<FxRateStrip />` + `<MarketSummary />` 컨테이너. `position: fixed` 배치.
  `AppShell`에서 렌더링한다. 로딩·오류 상태는 각 하위 컴포넌트에 위임한다.

### 수정

- `src/features/watchlist/dto.ts`
  — `WatchlistItemAssetDto`에 `market?: string` 추가

- `src/features/watchlist/adapters.ts`
  — `WatchlistAssetRow`에 `market: string` 추가, `isFavorite` 제거
  — `adaptWatchlistAsset`: `market` 전달, `isFavorite` 삭제

- `src/features/watchlist/queries.ts`
  — `useWatchlistAssets(page: number, size: number): UseQueryResult<{ rows: WatchlistAssetRow[]; meta: ApiMeta | undefined }>`
  반환 타입 변경 및 파라미터 추가
  — `useRemoveWatchlistItem(): UseMutationResult<void, Error, { watchlistId: number; itemId: number }>`
  신규 추가

- `src/pages/ui/WatchlistPage.tsx`
  — `page`, `pageSize`, `marketFilter` state 추가
  — 즐겨찾기 컬럼 삭제 (`favoriteBySymbol`, `toggleFavorite`, `isFavorite` 관련)
  — 알림 현황 카드 및 `unreadAlertSummaryQuery` 삭제
  — 클라이언트 slice 제거, `meta` 기반 페이지네이션 UI 활성화
  — 시장 필터 드롭다운 추가
  — `RowMenu`에 `onRemove`, 결정 기록 navigate 연결

- `src/widgets/Sidebar.tsx`
  — `FxRateStrip`, `MarketSummary` import 및 렌더링 제거
  — `mt-auto` 영역 제거

- `src/widgets/AppShell.tsx`
  — `<FloatingMarketCard />` 추가

### 테스트 영향

- `src/pages/ui/WatchlistPage.test.tsx`
  — `isFavorite`·즐겨찾기 관련 픽스처·assertion 제거
  — `unreadAlertSummary` mock 제거 및 관련 assertion 제거
  — 관심 해제 mutation 테스트 추가 (invalidate 확인)
  — 페이지네이션 state 변경 테스트 추가
  — 시장 필터 동작 테스트 추가
- `src/widgets/Sidebar.test.tsx`
  — `FxRateStrip`, `MarketSummary` mock 제거
- `src/widgets/FloatingMarketCard.test.tsx` (신규)
  — `<FxRateStrip />`, `<MarketSummary />` 렌더링 확인

## Out of Scope

- Phase 2·3 항목 (상태 배지, 스파크라인, 위험 필터, 요약 카드 델타, 뉴스·AI 배지)
- `DecisionLogPage` 내 symbol 기반 필터링 (라우트 파라미터 미존재)
- Topbar 변경
- BE 변경
