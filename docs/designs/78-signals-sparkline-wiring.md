# 78 · 시그널 스파크라인 활성화 (SignalsSparkline)

Status: Draft
Track: FE
Source: FE #90
Pair: BE 이슈 #159 · PR #160 (머지됨)
Risk: Low

## 1. 배경

`src/pages/ui/SignalsPage.tsx`의 시그널 카드는 각 종목의 단기 가격 시계열을 스파크라인으로
렌더하는 `SignalSparklineChart` 컴포넌트를 포함합니다. 현재 `useSignalSparkline`은
`enabled: false`·`initialData: []`로 비활성 상태이며, `useSignals`는
`adaptSignal(signal, [])`으로 빈 스파크라인을 전달합니다. `SignalSparklineChart`는 sparkline이
비어 있으면 "가격 시계열 대기" placeholder를 렌더하므로 모든 카드에서 placeholder만 표시됩니다.

활성화를 막는 블로커가 두 가지였습니다. 첫째, 종목별 가격 조회
(`GET /api/v1/stocks/{symbol}/prices`)에 `market`이 필수 파라미터로 요구되나 시그널 응답에
`asset.market`이 없었습니다. 둘째, FE 쿼리 경로의 `range` 값(`1mo`)이 BE에서 지원하지 않는
형식이며, 응답 형태도 `PriceSeriesResponse.bars` 중첩 구조가 아닌 bare array를 가정하여
맞지 않았습니다.

BE #159·PR #160이 머지되어 signals `?expand=asset` 응답의 `asset` 객체에 `market`이
추가되었습니다. 이로써 두 블로커가 모두 해소되었습니다. 이 설계는 해당 변경을 수용하여
스파크라인을 실데이터로 활성화하는 방법을 정의합니다.

## 2. 범위

### 포함

- `src/features/signals/dto.ts`: `SignalDto.asset`에 `market` 추가, `PriceBarDto`·`PriceSeriesDto` 정렬.
- `src/features/signals/adapters.ts`: `Signal` 도메인에 `market` 추가 및 `sparkline` 제거,
  sparkline 인자 제거, market 매핑 추가.
- `src/features/signals/queries.ts`: `useSignalSparkline` 활성화, 경로·파라미터·응답 타입 수정.
- `src/pages/ui/SignalsPage.tsx`: `SignalSparklineChart`에서 `useSignalSparkline` 직접 호출,
  페이지 레벨 더미 호출 제거.
- 행 단위 degradation 처리(loading Skeleton / error·market 없음·빈 bars → placeholder 유지).
- 기존 테스트 파일 3종(`adapters.test.ts`·`queries.test.tsx`·`SignalsPage.test.tsx`) 업데이트.

### 제외 (Out of Scope)

- BE 변경.
- `days`·`range` 선택 UI.
- 배치 시계열 엔드포인트 설계·구현.
- 우선순위 리스트(`prioritySignals`)에 스파크라인 추가.
- 미사용 `useSignalDetail`·`adaptSignalDetail` 제거 리팩터.

## 3. 변경

### 슬라이스 배치 결정

기존 `src/features/signals/` 슬라이스를 확장합니다. 가격 시계열 조회는 시그널 카드 렌더를
위한 종속 조회이므로 별도 슬라이스를 생성하지 않고 signals 슬라이스 내에서 처리합니다.
76·77 설계에서 확립된 dto·adapter·query 패턴을 그대로 따릅니다.

### 3.1 dto (`src/features/signals/dto.ts`)

- `SignalDto.asset`에 `market?: string | null` 추가 — BE #160 응답 스키마 반영.
- `PriceBarDto { close?: string | null }` — 현행 bare 형태에서 최소 필드로 정렬합니다.
  FE는 `close`만 소비하며 나머지 필드(`open`·`high`·`low`·`adjusted_close`·`volume`)는
  선택으로 둡니다.
- `PriceSeriesDto { bars: PriceBarDto[] }` 신규 추가 — `apiGet<PriceBarDto[]>` bare array
  가정을 대체합니다. BE의 `PriceSeriesResponse.bars`와 대응합니다.

### 3.2 adapters (`src/features/signals/adapters.ts`)

도메인 타입 변경:

- `Signal`에 `market: string | null` 추가 — `asset.market`에서 유래하며, 없으면 `null`입니다.
- `Signal`에서 `sparkline: number[]` 제거 — 시계열은 컴포넌트 레벨 쿼리로 조회하므로
  도메인 객체에 포함하지 않습니다.

adapter 시그니처:

- `adaptSignal(dto: SignalDto): Signal` — sparkline 인자 제거. `market`은
  `dto.asset?.market ?? null`로 매핑합니다. `readSymbol` 로직은 기존 유지.
- `adaptSignalDetail(dto: SignalDto): SignalDetail` — sparkline 인자 제거하여 `adaptSignal`과
  시그니처 일관성을 유지합니다. 함수 자체는 미사용 상태이나 이번 범위에서 시그니처 조정만 수행합니다.

### 3.3 queries (`src/features/signals/queries.ts`)

- `useSignalSparkline(symbol: string | null, market: string | null): UseQueryResult<number[]>` —
  - `enabled: Boolean(symbol && market)` — market이 없으면 호출하지 않습니다.
  - `queryKey: ['signals', 'sparkline', symbol, market]`
  - 경로: `/stocks/${symbol}/prices?market=${market}&range=1M&interval=1d`
  - `apiGet<PriceSeriesDto>`로 호출하여 envelope `data.bars`를 소비합니다.
  - `bars`의 각 `close`를 `parseDecimal`로 number 변환하고 `null`을 필터링하여
    `number[]`로 반환합니다.
- `useSignals`와 `useSignalDetail`은 `adaptSignal(signal)`·`adaptSignalDetail(signal)` 형태로
  정리합니다(sparkline 인자 제거).

### 3.4 페이지 (`src/pages/ui/SignalsPage.tsx`)

- `SignalSparklineChart` 내부에서 `useSignalSparkline(signal.symbol, signal.market)`을 직접
  호출합니다(컴포넌트 레벨, per-row). `SignalCard` → `SignalSparklineChart` 경로를 통해
  `signal.market`을 전달합니다.
- 페이지 레벨의 `useSignalSparkline(null)` 더미 호출(line 237)을 제거합니다.
- degradation은 행 단위로 독립 처리합니다:
  - loading → h-10 슬롯 크기 `Skeleton` 렌더.
  - error, `market: null`로 인한 `enabled: false`, 빈 bars → 기존 "가격 시계열 대기"
    placeholder 유지. 카드 전체를 에러 상태로 승격하지 않습니다.
  - 데이터 있음 → `Sparkline` 렌더.

## 4. Risks / Notes

**N+1 요청**: `SignalCard`가 렌더되는 수(N)만큼 `useSignalSparkline` 호출이 발생합니다.
단, React Query는 동일 `queryKey`에 대한 중복 호출을 dedup하므로 동일 종목이 목록에 중복
등장하더라도 실제 네트워크 요청은 1회로 수렴합니다. 현재 BE에 배치 시계열 엔드포인트가
없으므로 per-row 호출이 실용적 선택입니다. 지연·캐시·행 단위 degradation의 이점도 있습니다.
배치 엔드포인트가 추가되면 이 결정을 재검토합니다.

**market 없음 degradation**: BE #160 이전에 저장된 시그널이나 `expand=asset` 없이 조회된
항목은 `asset.market`이 `null`일 수 있습니다. 이 경우 `useSignalSparkline`이 `enabled: false`로
비활성되어 placeholder를 유지합니다. 카드 자체는 정상 렌더이므로 사용자 경험에 영향을 주지
않습니다.

**range 값 유효성**: BE는 `range`로 `1M|3M|6M|1Y`만 허용합니다. 기존 쿼리의 `1mo`는 BE에서
400을 반환합니다. 이 설계는 `1M`을 고정 사용합니다.

**parseDecimal null 필터**: `close`가 `null|undefined`인 bar는 변환 후 필터링하여 number
배열에서 제거합니다. 이는 에러로 처리하지 않으며, 결과가 빈 배열이면 placeholder를 유지합니다.
76 설계의 `parseDecimal` null 방어 패턴([[76-market-indices-wiring]] §4 참조)과 동일한
방어 원칙을 적용합니다.

## 5. 테스트

### adapters.test.ts (`src/features/signals/adapters.test.ts`)

- `adaptSignal`에 sparkline 인자가 없음을 확인합니다.
- `dto.asset.market`이 `Signal.market`으로 매핑됨.
- `asset.market`이 없거나 `null`이면 `Signal.market`이 `null`로 설정됨.
- `Signal`에 `sparkline` 필드가 존재하지 않음을 타입 레벨에서 확인합니다.
- `adaptSignalDetail` sparkline 인자 제거 검증.

### queries.test.tsx (`src/features/signals/queries.test.tsx`)

- `useSignalSparkline`이 `PriceSeriesDto.bars`의 `close`를 `parseDecimal`로 파싱하여
  number 배열을 반환함.
- `market`이 `null`이면 `enabled: false`로 쿼리가 실행되지 않음.
- `symbol`이 `null`이면 동일하게 비활성.
- `close`가 `null`인 bar는 결과 배열에서 필터링됨.
- queryKey가 `['signals', 'sparkline', symbol, market]` 형태임.

### SignalsPage.test.tsx (`src/pages/ui/SignalsPage.test.tsx`)

- mock row에 `market` 추가 및 `sparkline` 도메인 필드 제거.
- `useSignalSparkline` mock으로 로딩(Skeleton 노출)·데이터 있음(Sparkline 렌더)·빈 bars
  (placeholder 유지) 분기를 각각 검증합니다.
- `market: null`인 row에서 placeholder가 유지됨을 확인합니다.
- 페이지 레벨 `useSignalSparkline(null)` 더미 호출이 잔존하지 않음을 확인합니다.

## 6. 관련 링크

- [[76-market-indices-wiring]] — Decimal 문자열 `parseDecimal` 변환 선례
- [[77-dashboard-trends-wiring]] — 미니 시각요소 degradation 원칙 선례
- BE 이슈 #159, BE PR #160 — signals `?expand=asset` 응답에 `asset.market` 추가 (머지됨)
- FE 이슈 #90 — 본 작업 이슈
