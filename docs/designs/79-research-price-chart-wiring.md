# 79 · 리서치 가격 라인차트 실데이터 활성화 (ResearchPriceChart)

Status: Draft
Track: FE
Source: FE #95
Pair: BE 이슈 #159 · PR #160 (머지됨), FE #90 · PR #97 (머지됨)
Risk: Low

## 1. 배경

`src/pages/ui/ResearchPage.tsx`는 단일 종목 상세 페이지에서 `PriceSparkline` 컴포넌트를
통해 가격 시계열 라인차트를 렌더합니다. 현재 `useResearchView` 내부에
`const sparkline: number[] = []` 하드코딩이 있으며, 이 빈 배열이
`adaptResearchDetail(..., sparkline)`을 거쳐 `ResearchView.priceSparkline`으로 전달됩니다.
`PriceSparkline`은 `data.length === 0`이면 "가격 시계열 대기" placeholder를 렌더하므로,
현재 차트 슬롯은 항상 placeholder만 표시됩니다.

블로커는 두 가지였습니다. 첫째, 가격 조회 엔드포인트(`GET /api/v1/stocks/{symbol}/prices`)에
`market`이 필수 파라미터인데, 이전 시점의 research detail 응답에 `market`이 포함되지 않았습니다.
둘째, `PriceSeriesDto`가 research 슬라이스에 정의되지 않아 응답 형태를 올바르게 타입화할 수
없었습니다.

FE #90·PR #97이 머지되어 signals 슬라이스에서 동일 엔드포인트를 `useSignalSparkline`으로
이미 활성화하였습니다. `AssetLookupDto`에는 `market?: string | null`이 존재하며,
`AssetDetailDto`가 이를 상속하므로 `detail.market`을 통해 market 값을 직접 사용할 수 있습니다.
이 설계는 #90에서 확립된 패턴을 research 슬라이스에 동형으로 적용하여 라인차트를
실데이터로 활성화하는 방법을 정의합니다.

## 2. 범위

### 포함

- `src/features/research/dto.ts`: `PriceSeriesDto` 신규 추가.
- `src/features/research/queries.ts`: `useResearchPriceSeries` 신규 추가, `useResearchView`의
  하드코딩 `sparkline` 제거 및 `adaptResearchDetail` 호출 시그니처 정리.
- `src/features/research/adapters.ts`: `ResearchView`에서 `priceSparkline` 필드 제거,
  `adaptResearchDetail`의 `sparkline` 인자 제거.
- `src/pages/ui/ResearchPage.tsx`: `PriceSparkline`에서 `useResearchPriceSeries` 직접 호출,
  loading/데이터/placeholder 분기 처리.
- 기존 테스트 파일 3종(`adapters.test.ts`·`queries.test.tsx`·`ResearchPage.test.tsx`) 업데이트.

### 제외 (Out of Scope)

- BE 변경.
- `range` 선택 UI.
- 배치 시계열 엔드포인트 설계·구현.
- symbol → assetId 해소 로직 변경.
- research 요약·체크리스트·리포트 등 가격차트 외 영역.

## 3. 변경

### 슬라이스 배치 결정

기존 `src/features/research/` 슬라이스를 확장합니다. 가격 시계열 조회는 research 상세
렌더를 위한 종속 조회이므로 별도 슬라이스를 생성하지 않고 research 슬라이스 내에서
처리합니다. #90(signals)에서 확립된 dto·adapter·query 분리 패턴을 그대로 따릅니다.

### 3.1 dto (`src/features/research/dto.ts`)

- `PriceBarDto { close?: string | null }` — 이미 존재하므로 그대로 재사용합니다.
- `PriceSeriesDto { bars: PriceBarDto[] }` 신규 추가 — `apiGet<PriceSeriesDto>`가 envelope를
  언랩한 뒤 소비할 형태입니다. BE `PriceSeriesResponse.bars`와 대응합니다.

### 3.2 adapters (`src/features/research/adapters.ts`)

도메인 타입 변경:

- `ResearchView`에서 `priceSparkline: number[]` 제거 — 시계열은 컴포넌트 레벨 쿼리로
  조회하므로 도메인 객체에 포함하지 않습니다. `symbol: string`·`market: string | null`은 유지합니다.

adapter 시그니처:

- `adaptResearchDetail(detail, summary, checklist, reports, thesis): ResearchView` — `sparkline`
  인자 제거. `market: detail.market ?? null` 매핑은 그대로 유지합니다. `priceSparkline`
  필드 매핑 라인을 제거합니다.

### 3.3 queries (`src/features/research/queries.ts`)

- `useResearchPriceSeries(symbol: string | null, market: string | null): UseQueryResult<number[]>` —
  - `enabled: Boolean(symbol && market)` — market이 없으면 호출하지 않습니다.
  - `queryKey: ['research', 'price-series', symbol, market]`
  - 경로: `/stocks/${symbol}/prices?market=${market}&range=3M&interval=1d`
  - `apiGet<PriceSeriesDto>`로 호출하여 `data.bars`를 소비합니다.
  - 각 `bar.close`를 `parseDecimal`(`@/shared/lib/format`)로 변환하고 `null`을 필터링하여
    `number[]`로 반환합니다.
- `useResearchView`에서 하드코딩 `sparkline` 변수와 `adaptResearchDetail`의 해당 인자를 제거합니다.

### 3.4 페이지 (`src/pages/ui/ResearchPage.tsx`)

- `PriceSparkline({ research })` 내부에서 `useResearchPriceSeries(research.symbol, research.market)`을
  직접 호출합니다(컴포넌트 레벨).
- degradation은 차트 슬롯 단위로 독립 처리합니다:
  - loading → h-44 슬롯 크기 `Skeleton` 렌더.
  - error, `market: null`로 인한 `enabled: false`, 빈 bars → 기존 "가격 시계열 대기"
    placeholder(h-44) 유지. 페이지 전체를 에러 상태로 승격하지 않습니다.
  - 데이터 있음 → hook의 `number[]`를 `{ date: String(idx + 1), close }` 배열로 매핑하여
    기존 `LineChart`(h-44 w-full, xDataKey=date, yDataKey=close)에 전달합니다.

## 4. Risks / Notes

**range 3M 선택 근거**: signals 스파크라인(#90)은 단기 추세 확인 목적으로 `range=1M`을
사용합니다. research 라인차트는 종목 상세 페이지의 주 시각화 요소로, 단기보다 넓은 구간이
사용자에게 더 유의미한 맥락을 제공합니다. BE 기본값이 `3M`이므로 파라미터 명시는 선택이나,
의도를 명확히 하기 위해 `range=3M`을 명시적으로 전달합니다. 향후 range 선택 UI가 추가되면
이 고정값을 상태로 교체합니다.

**N+1 없음**: research는 단일 종목 상세 페이지이므로 `useResearchPriceSeries`는 최대 1회
호출됩니다. #90 signals 목록의 per-row 호출 패턴과 달리 N+1 문제가 발생하지 않습니다.

**market 없음 degradation**: `detail.market`이 `null`이면 `useResearchPriceSeries`가
`enabled: false`로 비활성되어 placeholder를 유지합니다. 가격차트 외 나머지 research 정보는
정상 렌더이므로 사용자 경험에 영향을 주지 않습니다.

**parseDecimal null 필터**: `close`가 `null | undefined`인 bar는 변환 후 필터링합니다. 결과가
빈 배열이면 placeholder를 유지합니다. 76 설계의 `parseDecimal` null 방어 패턴과 동일한
원칙을 적용합니다.

## 5. 테스트

### adapters.test.ts (`src/features/research/adapters.test.ts`)

- `adaptResearchDetail`에 `sparkline` 인자가 없음을 확인합니다.
- `ResearchView`에 `priceSparkline` 필드가 존재하지 않음을 타입 레벨에서 확인합니다.
- `detail.market`이 `ResearchView.market`으로 매핑됨.
- `detail.market`이 `null`이면 `ResearchView.market`이 `null`로 설정됨.

### queries.test.tsx (`src/features/research/queries.test.tsx`)

- `useResearchPriceSeries`가 `PriceSeriesDto.bars`의 `close`를 `parseDecimal`로 파싱하여
  number 배열을 반환함.
- `market`이 `null`이면 `enabled: false`로 쿼리가 실행되지 않음.
- `symbol`이 `null`이면 동일하게 비활성.
- `close`가 `null`인 bar는 결과 배열에서 필터링됨.
- `queryKey`가 `['research', 'price-series', symbol, market]` 형태임.
- `useResearchView`가 `sparkline` 관련 로직 없이 `adaptResearchDetail`을 호출함.

### ResearchPage.test.tsx (`src/pages/ui/ResearchPage.test.tsx`)

- `useResearchView` mock의 반환 `ResearchView`에서 `priceSparkline` 필드를 제거합니다.
- `useResearchPriceSeries` mock으로 loading(Skeleton 노출)·데이터 있음(LineChart 렌더)·빈
  배열(placeholder 유지) 분기를 각각 검증합니다.
- `market: null`인 경우 placeholder가 유지됨을 확인합니다.

## 6. 관련 링크

- [[78-signals-sparkline-wiring]] — 직접 선례, 동일 가격 시계열 엔드포인트 패턴 적용
- [[76-market-indices-wiring]] — `parseDecimal` 변환 선례
- BE 이슈 #159, BE PR #160 — 가격 시계열 엔드포인트 `market` 파라미터 및 envelope 구조 확정
- FE 이슈 #90, FE PR #97 — signals 슬라이스에서 동일 패턴 최초 적용 (머지됨)
- FE 이슈 #95 — 본 작업 이슈
