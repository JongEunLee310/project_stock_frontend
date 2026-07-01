# 77 · 대시보드 브리핑 카드 미니차트 실데이터 연동 (DashboardTrends)

Status: Draft
Track: FE
Source: FE #89
Pair: BE 062(`docs/designs/062-dashboard-trend-series.md`) · PR #156 (머지됨)
Risk: Low

## 1. 배경

`src/pages/ui/DashboardPage.tsx`의 Today Brief 카드 4종은 각 카드에 미니 시각요소
(`MiniVisual`)를 렌더합니다. 카드 visual 종류는 `spark-risk`·`bars-news`·`spark-signal`·
`donut-cash` 4종입니다.

현재 `spark-risk`·`spark-signal`은 모듈 레벨 하드코딩 상수 `briefSparklineData`를,
`bars-news`는 `importantNewsBarData`를 사용합니다(장식 데이터). `donut-cash`만 이미
`useDashboardSummary`에서 파생된 실 `cashRatio`를 사용합니다. 카드의 숫자 지표
(`riskAlertCount` 등)는 이미 `useDashboardSummary`를 통해 실데이터를 표시하고 있으므로,
미니차트만 장식으로 남아 있는 불일치 상태입니다.

BE 062·PR #156이 머지되어 `GET /dashboard/trends` 엔드포인트가 제공됩니다. 이 설계는
`risk_alerts`·`review_signals`·`important_news` 3종 계열을 각 카드의 미니 시각요소와
연동하는 방법을 정의합니다. 사용자 결정에 따라 미니차트는 제거하지 않고 유지하며
실데이터로 교체합니다.

`MiniVisual`은 `data: {value:number}[]` 형태로 `Sparkline`·`BarChart`·`DonutChart`에
데이터를 전달하며, 세 시각요소 컴포넌트는 모두 `@/shared/ui`에서 제공됩니다.

## 2. 범위

### 포함

- 기존 `src/features/dashboard/` 슬라이스 확장: dto·adapters·queries에 trend 관련
  타입·함수 추가.
- 도메인 타입 `DashboardTrends`를 `src/shared/model/domain.ts`에 정의하고
  `src/shared/model/index.ts`에서 export.
- `src/pages/ui/DashboardPage.tsx`: `briefSparklineData`·`importantNewsBarData`
  하드코딩 상수 제거 및 `MiniVisual` 시그니처 조정.
- trends 쿼리 상태에 따른 시각요소 레벨 독립 degradation 처리.

### 제외 (Out of Scope)

- BE 변경.
- `days` 파라미터 선택 UI (쿼리스트링 없이 BE 기본값 14 사용).
- 자동 폴링·refetch 주기 설정.
- `donut-cash`·summary 숫자 지표 로직 변경.
- Sidebar 및 다른 페이지 변경.

## 3. 변경

### 슬라이스 배치 결정

새 슬라이스를 생성하지 않고 기존 `src/features/dashboard/` 슬라이스를 확장합니다.
trends는 dashboard 도메인 내 계열 조회로, summary와 동일한 관심사 경계에 속합니다.
dto·adapters·queries에 trend 타입·함수를 추가하되, summary 전용 기존 파일·함수는
건드리지 않습니다.

### 3.1 dto (`src/features/dashboard/dto.ts`)

기존 `DashboardSummaryDto` 아래에 trend 관련 타입을 추가합니다.

- `DashboardTrendPointDto { date: string; count: number }` — 단일 날짜 데이터 포인트.
  `count`는 정수(int)로 직렬화되므로 문자열 변환이 불요합니다.
- `DashboardTrendSeriesItemDto { key: string; data: DashboardTrendPointDto[] }` —
  단일 계열. 계열 key는 `risk_alerts`·`review_signals`·`important_news` 3종입니다.
- `DashboardTrendSeriesDto { days: number; series: DashboardTrendSeriesItemDto[] }` —
  BE `data` envelope 내부 최상위 타입.

### 3.2 adapters (`src/features/dashboard/adapters.ts`)

도메인 타입은 `src/shared/model/domain.ts`에 정의하고 `src/shared/model/index.ts`에서 export합니다.

- `DashboardTrends { riskAlerts: number[]; reviewSignals: number[]; importantNews: number[] }` —
  각 필드는 해당 계열의 `count` 값 배열입니다.

adapter 시그니처:

- `adaptDashboardTrends(dto: DashboardTrendSeriesDto): DashboardTrends` — 순수 함수.
  - `series` 배열에서 각 key(`risk_alerts`·`review_signals`·`important_news`)를 이름으로
    조회하여 `data`의 `count` 배열로 매핑합니다. 계열 순서에 의존하지 않고 key로 조회합니다.
  - 해당 key가 없으면 빈 배열 `[]`로 방어합니다.
  - `count`는 int이므로 `parseDecimal` 변환이 불요하며 그대로 사용합니다.

### 3.3 queries (`src/features/dashboard/queries.ts`)

- `useDashboardTrends(): UseQueryResult<DashboardTrends>` —
  `GET /dashboard/trends` 단일 호출입니다. `days` 파라미터가 없으므로 쿼리스트링을
  생략하고 BE 기본값(14일)을 사용합니다. `apiGet<DashboardTrendSeriesDto>`로 호출하며
  envelope `data`를 `adaptDashboardTrends`에 전달합니다.
  - `queryKey: ['dashboard', 'trends']`

### 3.4 MiniVisual · DashboardPage (`src/pages/ui/DashboardPage.tsx`)

`useDashboardTrends()` 결과를 `DashboardPage`에서 소비합니다.

- 모듈 레벨 하드코딩 상수 `briefSparklineData`·`importantNewsBarData`를 제거합니다.
- `MiniVisual`이 카드 visual 종류와 일치하는 실 계열(`number[]`)과 trends 로딩 여부를
  받아 `{value:number}[]`로 변환해 `Sparkline`·`BarChart`에 넘기도록 시그니처를 조정합니다.
  `donut-cash` 분기는 기존 `cashRatio` 연동을 그대로 유지합니다.
- **degradation**: trends 쿼리 상태는 카드 전체를 에러·로딩으로 승격시키지 않고
  시각요소 슬롯 레벨에서 독립 처리합니다.
  - trends loading → 시각요소 슬롯에 작은 Skeleton.
  - trends error 또는 데이터 없음 → 시각요소를 렌더하지 않음(숫자 지표는 유지).
  - count가 전부 0인 계열도 정상 차트로 렌더합니다(0선). 이는 에러가 아닙니다.
- summary 카드 자체의 loading·error·empty 분기는 기존 `useDashboardSummary`가 계속
  관장하며 이번 변경 대상이 아닙니다.

## 4. Risks / Notes

**장식 degradation 원칙**: 미니 시각요소는 카드의 accent 장식이며 숫자 지표가 주
콘텐츠입니다. trends 쿼리 실패 시 숫자 지표가 정상이면 카드 전체를 에러 상태로 표시하지
않습니다. 이 결정은 `useDashboardSummary`와 `useDashboardTrends`가 독립 쿼리로 분리되어
있어 자연스럽게 지원됩니다.

**count는 int — parseDecimal 불요**: BE가 `count`를 int로 직렬화합니다. 76
(`MarketIndexBoard`)의 `parseDecimal` 변환 패턴은 이 설계에 적용되지 않습니다. adapter
테스트에서 count가 숫자로 그대로 전달됨을 확인합니다.

**key 기반 조회로 계열 순서 비의존**: BE 응답은 3종 계열이 고정 순서(`risk_alerts`→
`review_signals`→`important_news`)로 오지만, adapter는 순서가 아닌 `key` 값으로 조회합니다.
BE 계열 순서 변경에 영향받지 않으며, 결측 key는 빈 배열로 방어합니다.

## 5. 테스트

### adapter 단위 테스트 (`src/features/dashboard/adapters.test.ts`)

기존 `adaptDashboardSummary` 테스트 파일에 추가합니다.

- 3종 key(`risk_alerts`·`review_signals`·`important_news`)가 올바른 필드로 매핑됨.
- 계열 중 하나의 key가 없으면 해당 필드가 빈 배열로 방어됨.
- `series: []` 빈 배열 입력 시 세 필드 모두 빈 배열.
- `count`가 number 그대로 전달되며 변환 없이 보존됨.

### DashboardPage 렌더 분기

- trends loading → 시각요소 슬롯에 Skeleton이 노출됨.
- trends error 또는 데이터 없음 → 시각요소가 렌더되지 않고 숫자 지표는 유지됨.
- trends 정상 → `spark-risk`·`spark-signal`·`bars-news` 시각요소에 실 계열이 반영됨.
- `briefSparklineData`·`importantNewsBarData` 하드코딩 상수가 잔존하지 않음.
- `donut-cash`는 변경 없이 기존 `cashRatio` 경로를 유지함.

## 6. 관련 링크

- [[74-ai-briefing-wiring]] — dto·adapter·query 슬라이스 구조 선례
- [[76-market-indices-wiring]] — 동일 sprint 와이어링, 슬라이스 배치 결정 선례
- BE 이슈 #155, BE PR #156 — `GET /dashboard/trends` 구현 (머지됨)
- BE 설계 `docs/designs/062-dashboard-trend-series.md`
- FE 이슈 #89 — 본 작업 이슈
