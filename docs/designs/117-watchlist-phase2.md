# Design: 관심 종목 페이지 완성 Phase 2 (#117)

## Status

Implemented

## Context

Phase 1 구현(PR #118)으로 서버 페이지네이션, 시장 필터, 관심 해제, MarketSummary 플로팅
전환이 완료됐다. Phase 2는 BE PR #235(dev 머지 완료)로 확정된 계약을 바탕으로 테이블
상태 배지, 위험 필터 드롭다운, 마지막 갱신 컬럼(추가일 대체), 변화(1D) 스파크라인,
요약 카드 전일 대비 델타를 구현하고, PR #118 리뷰에서 식별된 논블로커 3건을 함께 정리한다.

## Verified Facts

확인 기준 — BE: `/Users/sleepyowl/Projects/project_stock` origin/dev (2026-07-08, BE PR #235 머지
이후); FE: main (PR #118 머지 이후).

- `WatchlistItemExpandedResponse.status: str` — BE에서 `"NORMAL"` 또는 활성
  `SignalType.value` 중 우선순위 최상위 값으로 반환
  (출처: BE `app/domains/signals/types.py:24-28`, `docs/designs/233-watchlist-row-enrichment.md` Interfaces 절)
- BE `status` 가능 값(모두 대문자 문자열, str Enum):
  `"NORMAL"`, `"WATCH"`, `"RISK_ALERT"`, `"THESIS_BROKEN"`, `"BUY_CANDIDATE"`, `"SELL_REVIEW"`, `"OVERHEATED"`
  (출처: BE `app/domains/signals/types.py:4-13`)
- `WATCHLIST_STATUS_PRIORITY` 순서: `RISK_ALERT > THESIS_BROKEN > SELL_REVIEW > OVERHEATED > BUY_CANDIDATE > WATCH`
  (출처: BE `app/domains/signals/types.py:14-21`)
- `AssetBriefResponse.reference_at: UtcDatetime | None = None`
  (출처: BE `docs/designs/233-watchlist-row-enrichment.md` Interfaces 절)
- `GET /api/v1/watchlists/{watchlist_id}/sparklines?range=Literal["1M","3M","6M","1Y"]` (기본 `"1M"`)
  → `ApiResponse[WatchlistSparklineResponse]`
  — `WatchlistSparklineResponse.items: list[AssetSparklineResponse]`
  — `AssetSparklineResponse.symbol: str`, `bars: list[SparklineBar]`
  — `SparklineBar.date: str`, `SparklineBar.close: str` (문자열)
  (출처: BE `docs/designs/233-watchlist-row-enrichment.md` Interfaces · API 절)
- `WatchlistSummaryTrendsView.watchlistTotal: number[]`, `.riskIncreasing: number[]`
  — `SummaryVisual`이 이미 이 데이터를 `useWatchlistSummaryTrends`로 읽고 스파크라인을 렌더링함
  (출처: FE `src/features/watchlist/adapters.ts:36-39`, `src/pages/ui/WatchlistPage.tsx:128-157`)
- `Sparkline` 컴포넌트 — `SparklinePoint.value: number` 입력, `shared/ui`에서 export됨
  (출처: FE `src/shared/ui/charts/Sparkline.tsx:17-19`, `src/shared/ui/index.ts:8-10`)
- `stockStatusClassNames`: `관망`(`status-watch-*`)과 `위험 증가`(`status-risk-*`) 스타일이
  이미 정의되어 있음
  (출처: FE `src/shared/ui/stockStatus.ts:11-18`)
- `FloatingMarketCard`의 `<aside aria-label="시장 요약">` 안에 `MarketSummary`가 자체
  `aria-label="시장 요약"`을 선언해 동일 이름의 ARIA 랜드마크 두 개가 DOM에 공존하는 문제
  (출처: `docs/reviews/pr-118.md` S1 항목)
- `SortKey` 타입에 `createdAt`이 포함되어 있고 `sortLabels`에 `추가일`로 렌더링됨
  (출처: FE `src/pages/ui/WatchlistPage.tsx:28,47-52`)

## Decisions

### 1. status 배지 라벨 매핑

디자인 시안이 안정/관망/위험 증가 3단계를 지정하므로, BE의 7개 status 값을 3단계로 접는다.
기존 `stockStatusClassNames`의 `관망`·`위험 증가` 스타일을 재사용해 별도 디자인 토큰 추가를
피한다.

| BE status         | FE 배지 라벨 | 색상 그룹       | 근거                                                    |
| ----------------- | ------------ | --------------- | ------------------------------------------------------- |
| `"NORMAL"`        | 안정         | `status-stable` | 활성 시그널 없음                                        |
| `"WATCH"`         | 관망         | `status-watch`  | 관찰 단계 진입, 위험 미확정                             |
| `"BUY_CANDIDATE"` | 관망         | `status-watch`  | 긍정 시그널이나 아직 관찰 단계; BE 우선순위상 하위 그룹 |
| `"RISK_ALERT"`    | 위험 증가    | `status-risk`   | 직접적 위험 경보                                        |
| `"THESIS_BROKEN"` | 위험 증가    | `status-risk`   | 투자 논리 붕괴 = 심각한 위험                            |
| `"SELL_REVIEW"`   | 위험 증가    | `status-risk`   | 매도 검토 단계는 위험 범주                              |
| `"OVERHEATED"`    | 위험 증가    | `status-risk`   | 과열 = 하락 위험                                        |

`BUY_CANDIDATE`를 관망으로 분류하는 이유: 매수 검토가 필요하다는 의미는 아직 결론이 나지 않은
관찰 상태이며, 디자인 시안의 3단계 중 중간값이 관망에 해당한다. BE 우선순위
순서에서도 `RISK_ALERT` 계열보다 낮게 위치한다.

알 수 없는 status 값은 폴백으로 `안정`을 반환한다.

구현: `src/features/watchlist/adapters.ts`에
`resolveStatusBadge(status: string): { label: string; className: string }` 추가.
`className`은 `stockStatusClassNames`에서 대응 `StockStatus` 키 기준으로 조회한다.

위험 필터 드롭다운 옵션도 이 3단계 라벨로 동작하며, 고정 옵션으로 구성한다.

### 2. 위험 필터 드롭다운

Phase 1의 시장 필터와 동일한 클라이언트 필터 패턴을 따른다. `statusFilter` state
(기본값 `''` = 전체)를 `WatchlistPage`에 추가하고, `resolveStatusBadge(row.status).label`
기준으로 필터링한다. 옵션은 `['안정', '관망', '위험 증가']` 고정으로 구성한다(현재 로드된
row에서 동적으로 추출하지 않는다). 시장 필터와 독립적으로 AND로 적용되며,
필터 변경 시 page를 1로 초기화한다.

### 3. 마지막 갱신 컬럼 (추가일 대체)

현재 테이블의 `추가일`(`item.created_at`) 컬럼을 `마지막 갱신`으로 대체하고
`asset.reference_at` 값을 표시한다. `reference_at`이 null이면 `—`을 표시한다.

`WatchlistItemAssetDto`에 `reference_at?: string | null` 필드를 추가한다.
`WatchlistAssetRow`에서 `createdAt: string` 필드를 제거하고 `referenceAt: string | null`로
교체한다. `adaptWatchlistAsset`에서 `referenceAt: item.asset.reference_at ?? null`로
전달한다.

`SortKey` 타입에서 `createdAt`을 제거하고 `sortLabels`에서 `추가일` 항목을 삭제한다.
`sortWatchlistRows`의 `createdAt` 분기도 함께 제거한다.

### 4. 변화(1D) 스파크라인 — 배치 엔드포인트 연동

`useWatchlistSparklines(range: string = '1M'): UseQueryResult<Record<string, number[]>>`를
`src/features/watchlist/queries.ts`에 추가한다.
queryKey는 `[...watchlistQueryKey, 'sparklines', range]`.
내부에서 첫 번째 관심목록 ID를 조회한 뒤
`GET /watchlists/{id}/sparklines?range={range}`를 호출하고,
`items` 배열을 `symbol → number[]`(`close`를 `parseDecimal`로 파싱)로 변환해 반환한다.
`staleTime`을 5분으로 설정해 페이지 이동 시 재조회를 억제한다.

스파크라인은 pagination과 독립된 생명주기를 가지므로 items 쿼리와 별개로 관리된다.
`WatchlistPage`에서 `useWatchlistSparklines()`를 호출하고, 각 행에 `sparklines[stock.symbol]`을
전달한다. `shared/ui`의 기존 `Sparkline` 컴포넌트를 재사용하며, 데이터가 없거나 빈 배열이면
`—`을 표시한다.

### 5. 요약 카드 전일 대비 델타

`SummaryVisual` 컴포넌트가 이미 `useWatchlistSummaryTrends`로 추세 시리즈를 읽는다.
`counts[counts.length - 1] - counts[counts.length - 2]` 계산으로 전일 대비 델타를 산출하고,
양수이면 `+N`, 음수이면 `-N`, 0이면 `±0`으로 스파크라인 하단에 표시한다.
배열 길이가 2 미만이거나 null이면 델타를 미표시한다. BE 변경은 없다.

### 6. PR #118 리뷰 논블로커 3건

**S1 — FloatingMarketCard 중복 aria-label 제거**

`FloatingMarketCard`의 `<aside aria-label="시장 요약">`에서 `aria-label`을 제거하거나
태그를 `<div>`로 교체한다. `MarketSummary`가 이미 역할을 충분히 선언하므로 wrapper 레이블이
필요 없다. 수정 후 `FloatingMarketCard.test.tsx`에서 `getAllByLabelText` 셀렉터를
`getByLabelText`로 복원한다.

**S4 — 시장 필터 변경 시 page 미초기화 수정**

`WatchlistPage`의 시장 필터(`marketFilter`) 변경 핸들러에 `setPage(1)` 한 줄을 추가한다.

**S2 — isPending을 행 단위로 국한**

`WatchlistPage`에 `removingItemId: number | null` state를 추가한다.
`onRemove` 핸들러에서 mutation 호출 전 `setRemovingItemId(itemId)`를 호출하고,
`onSettled`(또는 `onSuccess`/`onError`)에서 `setRemovingItemId(null)`로 리셋한다.
각 `RowMenu`의 `isRemoving` prop을 `removingItemId === stock.id`로 변경한다.
`useRemoveWatchlistItem`은 변경하지 않는다.

## Components

### 수정

- `src/features/watchlist/dto.ts`
  — `WatchlistItemAssetDto`에 `reference_at?: string | null` 추가

- `src/features/watchlist/adapters.ts`
  — `WatchlistAssetRow`: `createdAt` 제거, `status: string`·`referenceAt: string | null` 추가
  — `resolveStatusBadge(status: string): { label: string; className: string }` 추가
  (알 수 없는 값은 `안정`/`status-stable` 폴백)
  — `adaptWatchlistAsset`: `status`, `referenceAt` 전달, `createdAt` 삭제

- `src/features/watchlist/queries.ts`
  — `useWatchlistSparklines(range?: string): UseQueryResult<Record<string, number[]>>` 추가

- `src/pages/ui/WatchlistPage.tsx`
  — `SortKey` 타입에서 `createdAt` 제거, `sortLabels`에서 `추가일` 제거
  — `sortWatchlistRows`의 `createdAt` 분기 제거
  — 테이블 헤더: `추가일` → `마지막 갱신`, 상태 배지 컬럼·변화(1D) 컬럼 추가
  — `statusFilter` state 추가, 위험 필터 드롭다운 추가
  — `removingItemId` state 추가, `RowMenu.isRemoving`을 행 단위로 변경 (S2)
  — `setMarketFilter` 핸들러에 `setPage(1)` 추가 (S4)
  — `SummaryVisual`에 전일 대비 델타 표시 추가
  — `useWatchlistSparklines` 호출, 각 행에 스파크라인 데이터 전달

- `src/widgets/FloatingMarketCard.tsx`
  — `<aside aria-label="시장 요약">`에서 `aria-label` 제거 또는 `<div>` 교체 (S1)

### 테스트 영향

- `src/features/watchlist/adapters.test.ts`
  — `resolveStatusBadge` 단위 테스트: 7개 BE status 값 → 3단계 FE 라벨·className 매핑 각각 확인.
  픽스처의 status 리터럴에 출처 주석 `// app/domains/signals/types.py:4-13` 기재.
  — `adaptWatchlistAsset`: `status`·`referenceAt` 포함, `createdAt` 미포함 확인.

- `src/features/watchlist/queries.test.ts`
  — `useWatchlistSparklines`: 정상 응답 → `Record<string, number[]>` 반환,
  빈 `items` → `{}` 반환.

- `src/pages/ui/WatchlistPage.test.tsx`
  — 상태 배지 렌더링: `RISK_ALERT` status 행에 `위험 증가` 배지 렌더링 확인.
  — 위험 필터 select: `위험 증가` 선택 → 해당 라벨 행만 표시, 안정/관망 행 미표시.
  — 시장 필터 변경 시 page 1로 초기화 확인 (S4).
  — 삭제 isPending 격리: 종목 A 삭제 중 → 종목 A만 disabled, 종목 B 버튼 active (S2).
  — 마지막 갱신 컬럼: `reference_at` 값 표시, null → `—` 표시 확인.

- `src/widgets/FloatingMarketCard.test.tsx`
  — S1 수정 후 `getByLabelText('시장 요약')` 단일 셀렉터로 통과 확인.

## Out of Scope

- Phase 3 항목 (뉴스·AI 배지, symbol 기반 결정 기록 필터)
- BE 변경 (계약 불일치 발견 시 보고 후 중단)
- `DecisionLogPage` 내 symbol 기반 필터링 (라우트 파라미터 미존재)
- Topbar 변경
- 스파크라인 `range` 파라미터 UI (1M 고정)
- `WatchlistPage`의 `SortKey` `createdAt` 제거가 영향을 미치는 다른 파일이 있다면
  그 파일도 갱신 대상이나, 현재 확인 범위에서는 `WatchlistPage.tsx` 단일 파일에만 사용됨
