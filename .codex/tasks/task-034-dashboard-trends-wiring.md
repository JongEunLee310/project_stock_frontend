# Codex Handoff Task

## Source Issue

FE #89(대시보드 브리핑 카드 미니차트 실데이터 연동). 설계
`docs/designs/77-dashboard-trends-wiring.md`. Pair: BE 062
(`docs/designs/062-dashboard-trend-series.md`) — 대응 엔드포인트는 이미 BE main에 머지됨
(BE #155, PR #156).

## Task Summary

`src/pages/ui/DashboardPage.tsx`의 Today Brief 카드 미니 시각요소 중 하드코딩
장식 데이터(`briefSparklineData`의 `spark-risk`·`spark-signal`, `importantNewsBarData`의
`bars-news`)를 BE 추이 시계열 API(`GET /dashboard/trends`)로 전환한다. 기존
`src/features/dashboard/` 슬라이스를 확장해 trend dto·adapter·query를 추가하고,
`MiniVisual`이 실 계열을 소비하도록 조정한다. `donut-cash`는 이미 실 `cashRatio`를
쓰므로 변경하지 않는다.

## Goal

완료 시 참이어야 할 것:

- `spark-risk`·`spark-signal`·`bars-news` 미니 시각요소가 `GET /dashboard/trends` 실 계열을
  렌더한다(모듈 레벨 하드코딩 상수 `briefSparklineData`·`importantNewsBarData` 제거).
- 계열 매핑: `risk_alerts`→`spark-risk`(위험 증가 종목), `review_signals`→`spark-signal`
  (검토 시그널), `important_news`→`bars-news`(중요 뉴스).
- trends 쿼리 상태는 카드 전체를 에러·로딩으로 승격시키지 않고 시각요소 슬롯 레벨에서
  독립 degradation한다(loading→작은 Skeleton, error/없음→시각요소 미노출, count 전부 0→
  0선 정상 렌더).
- `donut-cash`·summary 숫자 지표·기존 `useDashboardSummary` 분기는 변경하지 않는다.
- lint·typecheck·format·test·build 전부 통과한다.

## Background

- BE 응답 형태(공통 envelope `{data, error, meta}`의 `data`):
  `{ days: number, series: [ { key: string, data: [ { date: string, count: number } ] } ] }`.
  기존 http client(`src/shared/api/client.ts`)의 `apiGet<T>`가 envelope을 언랩해 `{data}`를 준다.
  이 엔드포인트는 인증이 필요하지만 `apiGet`을 그대로 사용한다(기존 summary 쿼리와 동일).
- 계열 3종은 고정 순서(`risk_alerts`→`review_signals`→`important_news`)로 오지만, adapter는
  순서가 아니라 **key 값으로 조회**한다(순서 비의존, 결측 key는 빈 배열 방어).
- **중요 — count는 int**: `count`는 정수로 직렬화된다. 76(MarketIndexBoard)의
  Decimal 문자열·`parseDecimal` 변환 패턴은 **적용되지 않는다**. count는 number 그대로 쓴다.
  `date`는 "YYYY-MM-DD" 문자열이나 미니차트는 값 배열만 쓰므로 date는 렌더에 쓰지 않는다.
- 결측일은 BE가 0으로 채워 반환한다(윈도우 전체 날짜 존재 보장). 별도 채움 불요.
- 참조 선례(패턴 준수): 기존 dashboard 슬라이스 `src/features/dashboard/`의 `dto.ts`·
  `adapters.ts`·`adapters.test.ts`·`queries.ts`(`useDashboardSummary`), 그리고 briefing 슬라이스
  `src/features/briefing/`. 신규 파일을 만들지 말고 기존 dashboard 파일에 trend 타입·함수를 추가한다.
- 소비 지점: `src/pages/ui/DashboardPage.tsx`.
  - 모듈 레벨 상수 `briefSparklineData`(약 101행), `importantNewsBarData`(약 113행) — 제거 대상.
  - `MiniVisual`(약 147행): 현재 `data={briefSparklineData[kind]}`·`importantNewsBarData`를 쓴다.
    `Sparkline`·`BarChart`는 `data: {value:number}[]`를 받는다(`@/shared/ui`).
  - `todayBriefCards`(약 52행)에 각 카드의 `visual` 종류가 정의돼 있다.
  - `DashboardPage`(약 373행)에서 `useDashboardSummary` 등 쿼리를 호출하고 브리핑 카드를 렌더한다.
- 도메인 타입 배치: `DashboardSummary`가 adapters.ts의 로컬 인터페이스인 반면(현행), 이 작업의
  `DashboardTrends`는 설계대로 `src/shared/model/domain.ts`에 정의하고
  `src/shared/model/index.ts`로 export한다(76 `MarketIndexBoard` 선례).
- degradation 컴포넌트: `Skeleton`(`@/shared/ui`). 시각요소 슬롯 크기(sparkline `h-14 w-24`,
  bars `h-12 w-24`)에 맞춘 작은 Skeleton을 쓴다.

## Implementation Scope

- `src/features/dashboard/dto.ts` — 기존 `DashboardSummaryDto` 아래에 추가:
  `DashboardTrendPointDto { date: string; count: number }`,
  `DashboardTrendSeriesItemDto { key: string; data: DashboardTrendPointDto[] }`,
  `DashboardTrendSeriesDto { days: number; series: DashboardTrendSeriesItemDto[] }`.
- `src/features/dashboard/adapters.ts` — 추가:
  `adaptDashboardTrends(dto: DashboardTrendSeriesDto): DashboardTrends`. 순수 함수.
  `series`에서 `risk_alerts`·`review_signals`·`important_news` key를 이름으로 찾아 각
  `data`의 `count` 배열로 매핑한다. 결측 key는 `[]`. count는 변환 없이 그대로. 기존
  `adaptDashboardSummary`·`DashboardSummary`는 건드리지 않는다.
- `src/features/dashboard/queries.ts` — 추가:
  `useDashboardTrends(): UseQueryResult<DashboardTrends>`. `GET /dashboard/trends` 단일 호출
  (쿼리스트링 없이 BE 기본 14일). `apiGet<DashboardTrendSeriesDto>` 결과를 `adaptDashboardTrends`에
  전달. `queryKey: ['dashboard', 'trends']`. 기존 `useDashboardSummary`는 그대로.
- `src/features/dashboard/adapters.test.ts` — 아래 Test Requirements 참고(기존 파일에 추가).
- `src/shared/model/domain.ts` —
  `DashboardTrends { riskAlerts: number[]; reviewSignals: number[]; importantNews: number[] }` 추가.
- `src/shared/model/index.ts` — `DashboardTrends` export(기존 export 관례 따름).
- `src/pages/ui/DashboardPage.tsx` —
  - 모듈 레벨 `briefSparklineData`·`importantNewsBarData` 상수 제거.
  - `DashboardPage`에서 `useDashboardTrends()` 호출.
  - `MiniVisual` 시그니처를 조정해 spark/bars 종류에 대해 실 계열(`number[]`)과 trends 로딩
    여부를 받아 `{ value }` 배열로 변환해 넘긴다. 계열→visual 매핑은 위 Background대로.
    - spark/bars: trends loading → 시각요소 자리에 작은 Skeleton. trends error 또는 계열
      데이터 없음(빈 배열) → 시각요소를 렌더하지 않음. 계열이 있으면(길이>0) 차트 렌더
      (count가 전부 0이어도 정상 렌더).
    - `donut-cash` 분기는 기존 `cashRatio` 연동을 그대로 유지한다.
  - summary 카드의 loading·error·empty 분기(`useDashboardSummary`)는 변경하지 않는다.

## Out of Scope

- BE 변경(별도 repo).
- `days` 선택 UI·쿼리스트링 파라미터(BE 기본 14일 고정).
- 자동 폴링·refetch 주기 설정.
- `donut-cash`·summary 숫자 지표·`useDashboardSummary` 로직 변경.
- 미니차트 외 다른 카드·섹션·페이지·Sidebar 변경.
- 기존 briefing·dashboard summary adapter/query 동작 변경.

## Protected Files

없음. 위 Implementation Scope 밖 파일은 변경하지 않는다. 특히 기존 dashboard summary·
briefing 슬라이스 동작과 DashboardPage의 미니차트 외 영역은 건드리지 않는다.

## Requirements

- 기존 dashboard 슬라이스 구조(dto/adapters/queries 분리)와 React Query·http client 관례를 따른다.
- 어댑터는 순수 함수로 두고 단위 테스트한다.
- adapter는 계열을 `key`로 조회하고 결측 key는 빈 배열로 방어한다(순서 비의존).
- `count`는 number 그대로 쓴다(`parseDecimal` 사용 금지).
- 미니차트 degradation은 시각요소 슬롯 레벨에서만 처리하고 카드 전체를 에러/로딩으로
  승격시키지 않는다.

## Test Requirements

- `src/features/dashboard/adapters.test.ts`(기존 `adaptDashboardSummary` 테스트에 추가):
  3종 key가 올바른 필드(`riskAlerts`·`reviewSignals`·`importantNews`)로 매핑됨, 계열 중
  하나의 key가 없으면 해당 필드가 빈 배열, `series: []` 입력 시 세 필드 모두 빈 배열,
  `count`가 number 그대로 보존됨(변환 없음).
- DashboardPage 테스트(`src/pages/ui/DashboardPage.test.tsx`)가 `useDashboardTrends`를 mocking해:
  trends 로딩 시 시각요소 슬롯 Skeleton 노출, trends error 또는 데이터 없음 시 시각요소
  미노출·숫자 지표 유지, trends 정상 시 실 계열 반영, 하드코딩 상수(`briefSparklineData`
  등에서 오던 값) 잔존 없음을 확인한다. 기존 `useDashboardSummary` 등 mock 관례를 따른다.

## Verification Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm format:check`
- `TZ=UTC corepack pnpm test`
- `corepack pnpm build`

## Documentation Impact

설계 `docs/designs/77-dashboard-trends-wiring.md`가 근거(이미 브랜치에 포함). 계약 정렬
문서(있다면)의 대시보드 미니차트 행 갱신은 orchestrator가 리뷰 시 처리한다.

## ADR Need

불필요. 기존 dashboard·briefing 와이어링 패턴을 따르는 읽기 전용 화면 연동이다.

## Failure Record Need

불필요.

## Risk Level

Low. 읽기 전용 조회 연동이며 BE 계약이 확정되어 있다. 주의점은 count가 int라 변환 불요·
계열 key 기반 조회(순서 비의존)·장식 degradation(카드 전체 승격 금지) 정도다.

## Expected Output

- 위 scope의 코드·테스트 변경.
- 검증 5종 통과 로그.
- 가정(계열 매핑·degradation 방식·count 미변환)과 검증 결과 보고.

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files or the summary/briefing slice behavior.
- Report assumptions and verification results.

## Stop Conditions

- BE 응답 필드·envelope 형태·계열 key가 설계와 다르면 멈추고 보고한다.
- `count`가 int가 아니라 문자열(Decimal) 단위로 확인되면 멈추고 보고한다.
