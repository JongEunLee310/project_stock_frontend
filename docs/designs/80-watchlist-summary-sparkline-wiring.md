# 80 · 관심 종목 요약 스파크라인 실데이터 연동 (WatchlistSummarySparkline)

Status: Draft
Track: FE
Source: FE #96
Pair: BE 계약 `GET /watchlists/{watchlist_id}/summary/trends` (머지됨)
Risk: Low
Author: value-for-fable:itsvff (Sonnet) 위임

---

## 1. 배경

`src/pages/ui/WatchlistPage.tsx`의 요약 카드 두 개(전체 관심 종목 / 위험 증가 종목) 각각에는
`SummaryVisual` 컴포넌트가 스파크라인을 렌더합니다. 현재 이 컴포넌트는 모듈 상단에 정의된
하드코딩 상수 `summaryLineSeries`를 사용하며, 실제 추이 데이터를 반영하지 않습니다.

신규 BE 계약 `GET /watchlists/{watchlist_id}/summary/trends`가 머지됨에 따라, 이 설계는
상수를 제거하고 실데이터를 스파크라인에 연동하는 방법을 정의합니다. 응답 envelope 구조
(`{days, series[{key, data[{date, count}]}]}`)는 #77 대시보드 추이 연동과 동형이므로,
대시보드 슬라이스의 dto·adapter·query 패턴을 watchlist 도메인에 독립 이식합니다.

---

## 2. 범위

### 포함

- `src/features/watchlist/dto.ts`: 추이 DTO 타입 3종 추가.
- `src/features/watchlist/adapters.ts`: 계열 추출 함수 및 반환 뷰 타입 추가.
- `src/features/watchlist/queries.ts`: `useWatchlistSummaryTrends` 훅 추가.
- `src/pages/ui/WatchlistPage.tsx`: `summaryLineSeries` 상수 제거, `SummaryVisual` 재작성.
- 기존 테스트 파일 업데이트 및 신규 테스트 케이스 추가.

### 제외 (Out of Scope)

- BE 변경.
- 요약 숫자 값 연동(FE #80·#71에서 이미 완료).
- `days` 파라미터 선택 UI — `days=14` 고정 사용.
- 카드 레이아웃·색상·아이콘 변경.
- 대시보드 dto·adapter 코드 재사용(import 금지, 독립 선언).

---

## 3. 설계

### 3.1 DTO (`src/features/watchlist/dto.ts`)

대시보드의 `DashboardTrendPointDto`, `DashboardTrendSeriesItemDto`, `DashboardTrendSeriesDto`와
동형이나, watchlist 슬라이스에 독립 선언합니다. 대시보드 dto를 import하지 않습니다.

| 타입                          | 필드     | 타입                            | 설명                                     |
| ----------------------------- | -------- | ------------------------------- | ---------------------------------------- |
| `WatchlistTrendPointDto`      | `date`   | `string`                        | `YYYY-MM-DD` 형식, 오름차순              |
|                               | `count`  | `number`                        | 해당 날짜의 종목 수                      |
| `WatchlistTrendSeriesItemDto` | `key`    | `string`                        | `watchlist_total` 또는 `risk_increasing` |
|                               | `data`   | `WatchlistTrendPointDto[]`      | 날짜별 포인트 배열                       |
| `WatchlistTrendSeriesDto`     | `days`   | `number`                        | 조회 윈도우 크기                         |
|                               | `series` | `WatchlistTrendSeriesItemDto[]` | 계열 배열(2개 고정)                      |

### 3.2 Adapter (`src/features/watchlist/adapters.ts`)

대시보드의 `getTrendCounts` 미러 패턴을 적용합니다.

**반환 뷰 타입**

```ts
interface WatchlistSummaryTrendsView {
  watchlistTotal: number[]
  riskIncreasing: number[]
}
```

**함수 시그니처**

| 함수                          | 시그니처                                                       | 책임                                                                                          |
| ----------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `getWatchlistTrendCounts`     | `(dto: WatchlistTrendSeriesDto, key: string) => number[]`      | `series.find(key).data.map(p => p.count)`로 계열별 count 배열 추출. 키가 없으면 빈 배열 반환. |
| `adaptWatchlistSummaryTrends` | `(dto: WatchlistTrendSeriesDto) => WatchlistSummaryTrendsView` | `watchlist_total`·`risk_increasing` 두 계열을 각 필드에 매핑하여 반환.                        |

### 3.3 Query 훅 (`src/features/watchlist/queries.ts`)

`useWatchlistSummary`의 첫 watchlist 조회 방어 패턴을 동일하게 적용합니다.

| 항목              | 내용                                                                                                                                          |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 시그니처          | `useWatchlistSummaryTrends(): UseQueryResult<WatchlistSummaryTrendsView>`                                                                     |
| queryKey          | `['watchlist', 'summary', 'trends']`                                                                                                          |
| queryFn 흐름      | `GET /watchlists?page=1&size=20` → 첫 watchlist id 확보 → `GET /watchlists/${id}/summary/trends?days=14` → `adaptWatchlistSummaryTrends` 적용 |
| 첫 watchlist 없음 | `{ watchlistTotal: [], riskIncreasing: [] }` 반환(빈값, throw 안 함)                                                                          |
| 실패 처리         | try/catch로 API 오류 시 동일 빈값 반환 — `useWatchlistSummary`의 방어 패턴과 일관                                                             |
| enabled 조건      | 별도 없음(훅 내부 try/catch로 방어)                                                                                                           |

React Query v5에서 disabled 쿼리는 `isLoading: false`입니다. 이 훅은 disabled를 사용하지
않으므로 해당 주의사항은 적용되지 않으나, 훅을 소비하는 컴포넌트에서 `isLoading` 상태를
별도로 처리해야 합니다.

### 3.4 WatchlistPage 통합 (`src/pages/ui/WatchlistPage.tsx`)

**제거**

- 모듈 상단의 `summaryLineSeries` 상수 전체.

**`SummaryVisual` 재작성**

현행 `SummaryVisual({ index })` 컴포넌트를 훅 데이터를 소비하도록 재작성합니다.
컴포넌트 내부에서 `useWatchlistSummaryTrends()`를 호출하고, `index === 1`이면
`riskIncreasing`, 그 외에는 `watchlistTotal` 계열을 사용합니다.

**열화(Degradation) 규칙**

슬롯 단위 독립 처리를 적용합니다. #78 시그널 스파크라인·#77 대시보드 추이 설계에서 확립한
원칙과 일관됩니다.

| 상태                               | 처리                                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------ |
| `isLoading: true`                  | `<Skeleton className="h-10 w-20" />` 렌더 — 기존 `UiSparkline` 슬롯(`h-10 w-20`) 크기 유지 |
| `data`의 해당 계열이 빈 배열(`[]`) | 스파크라인 비표시(placeholder 또는 슬롯 공백) — 카드 전체를 오류 상태로 승격하지 않음      |
| error                              | 동일하게 스파크라인 비표시 — 카드·페이지 전체는 정상 렌더 유지                             |
| 데이터 있음                        | `<UiSparkline data={...} />` 렌더(기존 색상·마진·strokeWidth 유지)                         |

`data` 포인트 매핑 형태는 기존과 동일합니다(`{ point: index, value: count }`).

---

## 4. 의존성 및 후속

### 의존성

- BE `GET /watchlists/{watchlist_id}/summary/trends` — 이미 머지됨.
- FE #71·#80 — 요약 숫자 연동 완료(기존 `useWatchlistSummary` 훅 변경 없음).

### 비범위 / 후속

- 첫 watchlist 조회가 `useWatchlistSummary`와 중복됩니다. 두 훅 모두 `GET /watchlists?page=1&size=20`를
  독립 호출하지만, React Query 캐시가 동일 URL을 dedup하므로 실제 네트워크 요청은 1회로
  수렴합니다. 향후 첫 watchlist id를 공유 훅으로 분리하는 리팩터는 이번 범위에서 제외합니다.
- watchlist가 없는 사용자는 두 카드 모두 스파크라인 슬롯이 공백으로 표시됩니다. 이는
  요약 숫자가 0으로 표시되는 기존 열화 동작과 일관됩니다.

---

## 5. 테스트

실제 코드는 작성하지 않으며, 검증 항목만 정의합니다.

### `src/features/watchlist/adapters.test.ts`

- `getWatchlistTrendCounts`가 `watchlist_total` 계열의 count 배열을 올바르게 추출함.
- `getWatchlistTrendCounts`가 `risk_increasing` 계열의 count 배열을 올바르게 추출함.
- 존재하지 않는 key를 전달하면 빈 배열(`[]`)을 반환함.
- `data` 배열이 비어 있으면 빈 배열을 반환함.
- 0채움 포인트(`count: 0`)가 그대로 배열에 포함됨(필터링하지 않음).
- `adaptWatchlistSummaryTrends`가 `watchlistTotal`·`riskIncreasing` 두 필드를 올바르게 반환함.

### `src/features/watchlist/queries.test.tsx`

- `useWatchlistSummaryTrends`가 첫 watchlist 조회 후 `summary/trends` 엔드포인트를 호출함.
- queryKey가 `['watchlist', 'summary', 'trends']` 형태임.
- watchlist 목록이 비어 있으면 `summary/trends` 호출 없이 빈값 반환함.
- API 오류 시 빈값 반환(throw 없음).
- 정상 응답이면 `adaptWatchlistSummaryTrends` 결과를 반환함.

### `src/pages/ui/WatchlistPage.test.tsx`

- `isLoading: true` 상태에서 스파크라인 슬롯에 `Skeleton`이 렌더됨.
- 데이터 있는 상태에서 `UiSparkline`이 렌더됨.
- 계열이 빈 배열인 상태에서 `UiSparkline`이 렌더되지 않음(카드는 정상 렌더).
- `summaryLineSeries` 상수 관련 코드가 컴포넌트 트리에 존재하지 않음.
- index 0 카드는 `watchlistTotal` 계열을 소비하고, index 1 카드는 `riskIncreasing` 계열을
  소비함.
