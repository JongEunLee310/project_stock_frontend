# Codex Handoff Task

## Source Issue

FE #96(관심 종목 요약 카드 스파크라인 실데이터 연동). 설계 `docs/designs/80-watchlist-summary-sparkline-wiring.md`.
대응 BE 계약 `GET /api/v1/watchlists/{watchlist_id}/summary/trends`는 이미 머지됐다. 와이어 형태가
동형인 대시보드 추이 슬라이스(`src/features/dashboard/`, 설계 77)를 직접 미러한다.

## Task Summary

`WatchlistPage` 요약 카드 두 개의 `SummaryVisual` 스파크라인이 하드코딩 상수
`summaryLineSeries`를 렌더하는 것을 제거하고, 신규 BE 추이 계약에 실데이터로 연동한다.
watchlist 슬라이스에 추이 DTO·adapter·query 훅을 추가하고, `SummaryVisual`을 훅 데이터
소비로 재작성한다.

## Goal

완료 시 참이어야 할 것:

- `src/pages/ui/WatchlistPage.tsx`에서 하드코딩 상수 `summaryLineSeries`가 완전히 제거된다.
- `SummaryVisual`이 `useWatchlistSummaryTrends()`를 소비해 `index === 1`이면 `riskIncreasing`,
  그 외에는 `watchlistTotal` 계열의 count 배열을 스파크라인으로 렌더한다.
- 로딩 시 스파크라인 슬롯 크기(`h-10 w-20`)의 `Skeleton`을, 오류나 빈 계열이면 스파크라인을
  비표시하되 카드·페이지 전체는 정상 렌더를 유지한다(슬롯 단위 열화).
- watchlist 슬라이스에 추이 DTO 3종·adapter·`useWatchlistSummaryTrends` 훅이 추가되고,
  대시보드 dto·adapter를 import하지 않고 독립 선언한다.
- lint·typecheck·format·test·build 5종 검증이 모두 통과한다.

## Background

- 미러 대상(대시보드 추이, 이미 머지됨) — `src/features/dashboard/`:
  - `dto.ts`: `DashboardTrendPointDto{date, count}`·`DashboardTrendSeriesItemDto{key, data}`·
    `DashboardTrendSeriesDto{days, series}`.
  - `adapters.ts`: `getTrendCounts(dto, key)`가 `series.find(item => item.key === key)?.data
    .map(point => point.count) ?? []`로 계열별 count 배열을 추출, `adaptDashboardTrends`가 키별
    매핑. 이 형태를 watchlist에 그대로 이식한다.
  - `queries.ts`: `useDashboardTrends()`가 `apiGet<DashboardTrendSeriesDto>('/dashboard/trends')`
    후 adapter를 적용.
- BE 계약(확정): `GET /watchlists/{watchlist_id}/summary/trends?days=14`, auth·ownership 가드,
  응답 envelope `data` = `{ days: int, series: [{ key, data: [{ date, count }] }] }`, key는
  `watchlist_total`·`risk_increasing` 2개 고정, 날짜 오름차순·0채움·윈도우 전체, 마지막 날 값이
  현재 summary의 `total_count`·`risk_increasing_count`와 각각 일치.
- 현재 watchlist 슬라이스 구조:
  - `src/features/watchlist/queries.ts`의 `useWatchlistSummary`가 먼저 `GET /watchlists?page=1&size=20`로
    첫 watchlist를 얻고 그 id로 `GET /watchlists/${id}/summary`를 조회하며, try/catch로 실패 시
    `emptyWatchlistSummary` 빈값을 반환한다. 이 방어 패턴을 그대로 따른다.
  - `src/pages/ui/WatchlistPage.tsx`: 모듈 상단 `summaryLineSeries` 상수와 `SummaryVisual({ index })`
    컴포넌트가 하드코딩 데이터를 `UiSparkline`으로 렌더. 요약 카드 map(index 0=전체 관심 종목,
    1=위험 증가 종목)에서 `<SummaryVisual index={index} />`를 호출한다. `UiSparkline`은
    `data`로 `{ point, value }[]` 형태를 받는다.
- React Query 캐시가 동일 URL(`GET /watchlists?page=1&size=20`)을 dedup하므로 `useWatchlistSummary`와
  첫 watchlist 조회가 중복돼도 실제 네트워크 요청은 1회로 수렴한다. 공유 훅 분리 리팩터는 비범위.

## Implementation Scope

- `src/features/watchlist/dto.ts` — 추이 DTO 3종을 watchlist 슬라이스에 독립 선언(대시보드 dto
  import 금지, 와이어 형태는 동일):
  - `WatchlistTrendPointDto { date: string; count: number }`
  - `WatchlistTrendSeriesItemDto { key: string; data: WatchlistTrendPointDto[] }`
  - `WatchlistTrendSeriesDto { days: number; series: WatchlistTrendSeriesItemDto[] }`
- `src/features/watchlist/adapters.ts`:
  - 뷰 타입 `WatchlistSummaryTrendsView { watchlistTotal: number[]; riskIncreasing: number[] }`.
  - `getWatchlistTrendCounts(dto: WatchlistTrendSeriesDto, key: string): number[]` — 대시보드
    `getTrendCounts` 미러, 키 부재 시 빈 배열.
  - `adaptWatchlistSummaryTrends(dto: WatchlistTrendSeriesDto): WatchlistSummaryTrendsView` —
    `watchlist_total`·`risk_increasing` 두 계열을 각 필드에 매핑.
- `src/features/watchlist/queries.ts`:
  - `useWatchlistSummaryTrends(): UseQueryResult<WatchlistSummaryTrendsView>`.
  - queryKey `['watchlist', 'summary', 'trends']`.
  - queryFn: `GET /watchlists?page=1&size=20`로 첫 watchlist 확보 → 없으면 빈값
    `{ watchlistTotal: [], riskIncreasing: [] }` 반환 → `GET /watchlists/${id}/summary/trends?days=14`
    조회 → `adaptWatchlistSummaryTrends` 적용. try/catch로 API 오류 시 동일 빈값 반환
    (`useWatchlistSummary` 방어 패턴과 일관). 빈값 상수는 필요하면 슬라이스에 선언한다.
- `src/pages/ui/WatchlistPage.tsx`:
  - 모듈 상단 `summaryLineSeries` 상수 제거.
  - `SummaryVisual({ index })`를 재작성: 내부에서 `useWatchlistSummaryTrends()` 호출,
    `index === 1`이면 `riskIncreasing`, 그 외 `watchlistTotal` 계열 선택. 설계 §3.4 열화 표를
    따른다 — `isLoading`이면 `<Skeleton className="h-10 w-20" />`, 계열이 빈 배열이거나 오류이면
    스파크라인 비표시(슬롯 공백), 데이터 있으면 기존 `UiSparkline`을 기존 색상·마진·strokeWidth·
    ariaLabel 유지로 렌더. `data`는 `count` 배열을 `{ point: index, value: count }`로 매핑.
- 테스트 추가·갱신(아래 Test Requirements).

## Out of Scope

- BE 변경(별도 repo, 이미 머지됨).
- 요약 숫자 값 연동(FE #71·#80에서 완료) — `useWatchlistSummary` 동작 변경 금지.
- `days` 파라미터 선택 UI(고정 `days=14`), 주별·월별 집계.
- 카드 레이아웃·색상·아이콘 변경.
- 대시보드 dto·adapter 코드 재사용·공유 첫 watchlist 조회 훅 분리 리팩터.

## Protected Files

없음. 위 Implementation Scope 밖 파일은 변경하지 않는다. 특히 `useWatchlistSummary`·대시보드
슬라이스 동작은 건드리지 않는다. 단, 타입 변경으로 인한 기존 테스트·목 갱신은 스코프 내
필요 조치로 허용한다(아래 참고).

## Requirements

- 대시보드 추이의 dto·adapter·query 패턴을 watchlist 도메인에 독립 이식한다(대시보드 import 금지).
- 첫 watchlist 조회·실패 방어를 `useWatchlistSummary`와 동일 패턴으로 맞춘다.
- 스파크라인 열화는 슬롯 단위로 처리하고 카드·페이지 전체를 오류로 승격하지 않는다.
- 계열 매핑은 index 0 → `watchlistTotal`, index 1 → `riskIncreasing`.

## Test Requirements

- `src/features/watchlist/adapters.test.ts`:
  - `getWatchlistTrendCounts`가 `watchlist_total`·`risk_increasing` 계열 count 배열을 각각 추출.
  - 존재하지 않는 key → 빈 배열, `data`가 빈 배열 → 빈 배열.
  - 0채움 포인트(`count: 0`)를 필터링하지 않고 그대로 포함.
  - `adaptWatchlistSummaryTrends`가 `watchlistTotal`·`riskIncreasing` 두 필드를 올바르게 반환.
- `src/features/watchlist/queries.test.tsx`:
  - 첫 watchlist 조회 후 `summary/trends` 엔드포인트를 호출.
  - queryKey가 `['watchlist', 'summary', 'trends']`.
  - watchlist 목록이 비면 `summary/trends` 호출 없이 빈값 반환.
  - API 오류 시 빈값 반환(throw 없음).
  - 정상 응답이면 `adaptWatchlistSummaryTrends` 결과 반환.
- `src/pages/ui/WatchlistPage.test.tsx`:
  - 로딩 상태에서 스파크라인 슬롯에 `Skeleton` 렌더.
  - 데이터 있는 상태에서 `UiSparkline` 렌더.
  - 계열이 빈 배열이면 `UiSparkline` 비표시(카드는 정상 렌더).
  - index 0 카드는 `watchlistTotal`, index 1 카드는 `riskIncreasing` 계열 소비.
  - 기존 목이 새 훅(`useWatchlistSummaryTrends`)을 export하도록 갱신(모듈 계약 정합).

## Verification Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm format:check`
- `TZ=UTC corepack pnpm test`
- `corepack pnpm build`

## Documentation Impact

설계 `docs/designs/80-watchlist-summary-sparkline-wiring.md`가 근거(브랜치 포함). 추가 문서
갱신은 orchestrator가 리뷰 시 판단한다.

## ADR Need

불필요. 기존 대시보드 추이(설계 77)·요약 연동(설계 71) 패턴을 재사용하는 읽기 전용 연동이며
신규 아키텍처 결정이 없다.

## Failure Record Need

불필요.

## Risk Level

Low. 읽기 전용 데이터 연동이며 동형 미러 선례(대시보드 추이)가 있다. 주의점은 계열 key 매핑·
슬롯 단위 열화·첫 watchlist 조회 방어·대시보드 코드 미import 정도다.

## Expected Output

- 위 scope의 dto·adapter·query·페이지·테스트 변경.
- 검증 5종(lint·typecheck·format·test·build) 통과 로그.
- 가정(계열 매핑·열화 규칙·첫 watchlist 조회 방어)과 검증 결과 보고.

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected behavior(`useWatchlistSummary`·대시보드 슬라이스).
- Report assumptions and verification results.

## Stop Conditions

- BE `GET /watchlists/{id}/summary/trends` 응답 형태가 설계와 다르거나 계열 key가
  `watchlist_total`·`risk_increasing`이 아니면 멈추고 보고한다.
- `UiSparkline`이 `{ point, value }[]` 외 다른 data 형태를 요구하면 멈추고 보고한다.
