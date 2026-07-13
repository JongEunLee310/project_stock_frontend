# Codex Handoff Task

## Source Issue

https://github.com/JongEunLee310/project_stock_frontend/issues/117

## Task Summary

관심 종목 페이지를 디자인 시안에 맞춰 보완하는 Phase 1 작업이다. 즐겨찾기 컬럼·알림
현황 카드 제거, 서버 페이지네이션 연동, 행 메뉴 관심 해제·결정 기록 연결, 시장 필터
드롭다운, MarketSummary·FxRateStrip 플로팅 카드 전환을 수행한다.

## Goal

- 즐겨찾기(★) 컬럼과 관련 state·callback이 `WatchlistPage`에서 완전히 제거된다.
- 알림 현황 카드와 `useUnreadAlertSummary` 사용처가 `WatchlistPage`에서 제거된다.
- 관심 종목 테이블이 `page`/`size` 파라미터로 BE를 호출하고 `meta.total` 기반으로
  페이지네이션 UI가 동작한다. 표시 개수 select가 10/25/50 옵션으로 활성화된다.
- 행 메뉴 "관심 해제"가 `DELETE /watchlists/{id}/items/{item_id}`를 호출하고
  목록·요약 쿼리를 invalidate한다.
- 행 메뉴 "결정 기록"이 `/decision-log` 페이지로 이동한다.
- 시장 필터 드롭다운이 `asset.market` 기반으로 클라이언트 필터링을 수행한다.
- `MarketSummary`·`FxRateStrip`이 `Sidebar`에서 분리되어 `FloatingMarketCard`
  컴포넌트로 왼쪽 하단 고정(`position: fixed`) 배치된다. 모든 페이지에서 표시된다.
- `pnpm format:check` / `pnpm typecheck` / `pnpm lint` / `pnpm test` 4종 모두 통과한다.

## Background

설계 문서: `docs/designs/117-watchlist-phase1.md` — Decisions·Components·테스트 영향 확정.

구현 전 설계 문서의 **BE Contract 확인 사항**을 실제 파일에 대해 검증하고, 불일치하면
보고 후 실계약을 우선한다.

핵심 계약 (설계 문서의 Verified Facts 절 참고):

- `DELETE /watchlists/{watchlist_id}/items/{item_id}` → HTTP 200, `data: null`
  (`ApiResponse<None>`, `app/api/v1/endpoints/watchlists.py:228-240`)
- `GET /watchlists/{id}/items` pagination `meta: { page, size, total }` 포함.
  `size` 최대 100 (`app/core/pagination.py:13`)
- `AssetBriefResponse.market: str` — BE가 이미 반환, `WatchlistItemAssetDto`에 누락됨
  (`app/domains/watchlists/schema.py:42`)
- `apiDelete` 함수 존재 (`src/shared/api/client.ts:147`)
- `ApiMeta { page, size, total }` — `src/shared/api/envelope.ts:8-12`
- `appRoutePaths.decisionLog = '/decision-log'` — `src/shared/config/navigation.ts:8`

기존 패턴:

- `apiGet` + `unwrapEnvelope`가 `meta`를 함께 반환 (`src/shared/api/client.ts`)
- 테스트 픽스처는 `WatchlistPage.test.tsx`의 `watchlistRows` 배열을 따른다. 수정
  후에도 픽스처의 `id` 필드는 삭제 mutation 테스트에 활용된다.

## Implementation Scope

설계 문서의 Components 절을 그대로 따른다.

**신규 파일:**

- `src/widgets/FloatingMarketCard.tsx`
  — `<FxRateStrip />` + `<MarketSummary />` 컨테이너. `position: fixed`,
  `bottom: 1rem`, `left: 1rem`, `z-index: 30`. `hidden lg:flex flex-col gap-3`.
  너비 `w-[calc(16rem-2rem)]`.

**수정 파일:**

- `src/features/watchlist/dto.ts`
  — `WatchlistItemAssetDto`에 `market?: string` 추가

- `src/features/watchlist/adapters.ts`
  — `WatchlistAssetRow` 인터페이스: `isFavorite` 제거, `market: string` 추가
  — `adaptWatchlistAsset`: `isFavorite` 삭제, `market: item.asset.market ?? 'UNKNOWN'` 추가

- `src/features/watchlist/queries.ts`
  — `useWatchlistAssets(page: number, size: number)`: 파라미터 추가, `meta` 함께 반환
  — `useRemoveWatchlistItem()`: `apiDelete` 호출 mutation 추가,
  `onSuccess`에서 `watchlistQueryKey` + `[...watchlistQueryKey, 'summary']` invalidate

- `src/pages/ui/WatchlistPage.tsx`
  — `page` state (기본값 1), `pageSize` state (10 | 25 | 50, 기본값 10),
  `marketFilter` state (기본값 `''`) 추가
  — 즐겨찾기 관련 모두 제거: `favoriteBySymbol`, `toggleFavorite`, `isFavorite`
  overlay 로직, 즐겨찾기 `<td>` 컬럼, 헤더 배열 조정
  — `unreadAlertSummaryQuery`, `alertSummary`, 알림 현황 `<Card>` 전체 제거
  — 클라이언트 `slice`·`visiblePageNumbers` 계산 제거, `meta` 기반 페이지 수 계산
  — 표시 개수 select를 10/25/50 옵션으로 활성화, 변경 시 `page` 를 1로 초기화
  — 시장 필터 드롭다운 추가: `rows`에서 유일한 `market` 값을 추출해 옵션 구성
  — `RowMenu`에 `onRemove`, `onDecisionLog` prop 추가 및 동작 연결

- `src/widgets/Sidebar.tsx`
  — `FxRateStrip`, `MarketSummary` import 및 렌더링 제거
  — `mt-auto` 영역(`<div className="mt-auto ...">`) 제거

- `src/widgets/AppShell.tsx`
  — 최상위 `div` 안에 `<FloatingMarketCard />` 추가 (그리드 밖, 형제 위치)

**테스트 파일:**

- `src/pages/ui/WatchlistPage.test.tsx`
  — 픽스처에서 `isFavorite` 제거
  — 즐겨찾기·알림 관련 mock·assertion 제거
  — `useRemoveWatchlistItem` mock 추가, 관심 해제 버튼 클릭 → mutation 호출 확인
  — 시장 필터 select 변경 → 해당 market 행만 표시 확인
  — 표시 개수 변경 → `useWatchlistAssets` 호출 파라미터 변경 확인
- `src/widgets/Sidebar.test.tsx`
  — `FxRateStrip`, `MarketSummary` mock 제거 (더 이상 렌더링하지 않으므로)
- `src/widgets/FloatingMarketCard.test.tsx` (신규)
  — `<FxRateStrip />`, `<MarketSummary />` 렌더링 확인

## Out of Scope

- Phase 2·3 항목 (상태 배지, 스파크라인, 위험 필터, 요약 카드 델타, 뉴스·AI 배지)
- `DecisionLogPage` 내부의 symbol 기반 필터링 (현재 라우트에 심볼 파라미터 없음)
- Topbar 변경
- BE 변경 (계약 불일치 발견 시 보고만 하고 중단)
- `Sidebar` 이외 다른 화면에서 `FxRateStrip`·`MarketSummary` 수정

## Protected Files

없음. 보호 파일을 수정하지 않는다.

## Requirements

- `useRemoveWatchlistItem` mutation 실패가 목록 렌더링을 중단하거나 오류를 전면에
  표시해서는 안 된다. 실패 시 조용히 처리하거나 toast 수준의 피드백에 그친다.
- 페이지네이션 `page` state가 바뀔 때 `useWatchlistAssets` 쿼리 파라미터가 함께
  갱신된다. 표시 개수 변경 시 `page`를 1로 초기화한다.
- 시장 필터는 클라이언트 필터로, 서버 요청 파라미터에 포함하지 않는다.
- `FloatingMarketCard`는 `lg` 미만 뷰포트에서 숨긴다(`hidden lg:flex`). `Sidebar`에서
  제거한 뒤 두 컴포넌트가 동시에 렌더링되는 구간이 없어야 한다.
- 기존 테스트를 약화하거나 삭제하지 않는다. 커버리지는 현행 수준 이상을 유지한다.
- `RowMenu`의 "관심 해제" 진행 중에는 해당 버튼을 `disabled` 처리한다.

## Test Requirements

- `useRemoveWatchlistItem`: `apiDelete` 호출 경로·`onSuccess` invalidate 대상 단위 테스트
- `WatchlistPage` 관심 해제: 버튼 클릭 → mutation 호출, 목록 refetch 확인
- `WatchlistPage` 시장 필터: 특정 market 선택 → 해당 market 행만 표시, 타 market 행 미표시
- `WatchlistPage` 페이지네이션: 표시 개수 변경 → `page` 1 초기화 확인
- `FloatingMarketCard`: `FxRateStrip`·`MarketSummary` 모두 렌더링되는지 확인
- `Sidebar`: `FxRateStrip`·`MarketSummary`가 더 이상 렌더링되지 않는지 확인
- `adapters.ts`: `market` 전달 및 `isFavorite` 미포함 단위 테스트 갱신

## Verification Commands

- `pnpm format:check`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`

(참고: prettier 미준수 시 개별 파일 대상 `pnpm prettier --write <파일>`로 정리.
repo 전체 `pnpm format`은 샌드박스에서 EPERM 실패 전례가 있다.)

## Documentation Impact

- `docs/designs/117-watchlist-phase1.md`의 Status를 구현 완료 후 `Implemented`로 갱신한다.

## ADR Need

불필요. 기존 BE 계약 활용이고 신규 외부 의존성이 없다.

## Failure Record Need

불필요.

## Risk Level

Medium — 제거 항목(즐겨찾기·알림 카드)과 쿼리 시그니처 변경(`useWatchlistAssets`)이
있어 기존 테스트 갱신 범위가 넓다. `FloatingMarketCard` 배치는 전 페이지에 영향을
주므로 다른 페이지에서 레이아웃 충돌 여부를 시각적으로 확인한다.

## Expected Output

- 변경·신규 파일 목록 보고
- 검증 4종 실행 결과 보고
- BE 계약 대조 결과 보고 (특히 `DELETE` 응답 코드·`market` 필드 존재 확인)
- 가정·잔여 위험 보고

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
- `main` 브랜치의 최신 커밋을 기반으로 `feat/117-watchlist-phase1` 브랜치를 생성해
  작업한다. PR은 `main`을 대상으로 한다.
- 커밋하지 않는다 (커밋은 오케스트레이터가 별도 지시한다).
- BE 계약 불일치 발견 시 중단하고 보고한다.
