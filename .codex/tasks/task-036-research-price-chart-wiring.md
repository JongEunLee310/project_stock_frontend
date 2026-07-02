# Codex Handoff Task

## Source Issue

FE #95(리서치 가격 라인차트 실데이터 활성화). 설계 `docs/designs/79-research-price-chart-wiring.md`.
Pair: BE #159·PR #160(머지됨), FE #90·PR #97(머지됨, signals에서 동일 패턴 최초 적용).

## Task Summary

`src/pages/ui/ResearchPage.tsx`의 `PriceSparkline` 라인차트를 실 가격 시계열
(`GET /stocks/{symbol}/prices`)로 활성화한다. research 슬라이스에 전용 가격 쿼리
`useResearchPriceSeries(symbol, market)`를 추가하고, `useResearchView`의 하드코딩 빈 배열
sparkline과 `ResearchView.priceSparkline` 필드를 제거한다. #90(signals)에서 확립된 패턴을
research 슬라이스에 동형으로 적용한다. research는 단일 종목 상세라 N+1이 없다.

## Goal

완료 시 참이어야 할 것:

- `PriceSparkline`이 `useResearchPriceSeries(research.symbol, research.market)`로 실 가격 시계열을
  조회해 `GET /stocks/{symbol}/prices?market={market}&range=3M&interval=1d` 응답의 `bars.close`를
  `LineChart`로 렌더한다.
- market이 없으면 조회하지 않고 기존 "가격 시계열 대기" placeholder를 유지한다.
- `ResearchView`에서 `priceSparkline` 필드가 제거되고, `adaptResearchDetail`에서 `sparkline`
  인자가 제거된다. `useResearchView`의 하드코딩 `const sparkline: number[] = []`가 사라진다.
- lint·typecheck·format·test·build 전부 통과한다.

## Background

- BE 응답 형태(공통 envelope `{data,error,meta}`의 `data`): `PriceSeriesResponse`
  `{ symbol, market, currency, interval, range, source, last_updated_at, bars: PriceBar[] }`.
  `PriceBar.close`는 문자열 Decimal. `apiGet<T>`가 envelope을 언랩해 `{data}`를 준다.
- BE `GET /api/v1/stocks/{symbol}/prices`의 `market`(`KRX|NASDAQ|NYSE`)은 **필수**, `range`는
  `1M|3M|6M|1Y`만 유효(기본 `3M`). research 라인차트는 상세 페이지 주 시각화라 넓은 구간이
  자연스러워 `range=3M`을 명시 사용한다(signals의 `1M`과 차이).
- `src/features/research/dto.ts`: `AssetLookupDto.market?: string | null`이 있고
  `AssetDetailDto extends AssetLookupDto`라 `detail.market`을 쓸 수 있다. `PriceBarDto { close?: string | null }`은
  이미 존재한다. `PriceSeriesDto`는 없어 추가한다.
- `src/features/research/adapters.ts`: `ResearchView`에 `symbol: string`·`market: string | null`·
  `priceSparkline: number[]`가 있다. `adaptResearchDetail(detail, summary, checklist, reports, thesis, sparkline)`가
  `priceSparkline: sparkline`, `market: detail.market ?? null`로 매핑한다.
- `src/features/research/queries.ts`: `useResearchView(symbol)`이 symbol→assetId 해소 후
  Promise.all로 detail/summary/checklist/reports/thesis를 조회하고 하드코딩
  `const sparkline: number[] = []`를 `adaptResearchDetail`에 넘긴다.
- `src/pages/ui/ResearchPage.tsx`: `PriceSparkline({research})`(약 58행)가 `research.priceSparkline`을
  `{ date: String(idx+1), close }` 배열로 매핑해 `LineChart`(h-44 w-full, xDataKey=date,
  yDataKey=close)에 넘기고, 비면 "가격 시계열 대기" placeholder(h-44)를 렌더한다. `research`에
  `symbol`·`market`이 있다.
- 참조 선례: FE #90 `src/features/signals/`의 `useSignalSparkline`(동일 엔드포인트·parseDecimal·
  null 필터·enabled 패턴), `parseDecimal`(`@/shared/lib/format`).

## Implementation Scope

- `src/features/research/dto.ts` — `PriceSeriesDto { bars: PriceBarDto[] }` 추가(기존 `PriceBarDto` 재사용).
- `src/features/research/adapters.ts` —
  - `ResearchView`에서 `priceSparkline: number[]` 필드 제거(`symbol`·`market`은 유지).
  - `adaptResearchDetail(detail, summary, checklist, reports, thesis): ResearchView` — `sparkline`
    인자 제거, `priceSparkline` 매핑 라인 제거. `market: detail.market ?? null` 유지.
- `src/features/research/queries.ts` —
  - `useResearchPriceSeries(symbol: string | null, market: string | null): UseQueryResult<number[]>`
    추가: `enabled: Boolean(symbol && market)`, `queryKey: ['research','price-series',symbol,market]`,
    경로 `/stocks/${symbol}/prices?market=${market}&range=3M&interval=1d`, `apiGet<PriceSeriesDto>`로
    `data.bars`의 `close`를 `parseDecimal` 변환·`null` 필터하여 `number[]` 반환. `symbol`은
    `encodeURIComponent` 적용.
  - `useResearchView`에서 하드코딩 `sparkline` 변수·`adaptResearchDetail` 해당 인자 제거.
- `src/pages/ui/ResearchPage.tsx` —
  - `PriceSparkline`가 `useResearchPriceSeries(research.symbol, research.market)`를 직접 호출.
  - degradation(차트 슬롯 레벨): loading → h-44 슬롯 크기 `Skeleton`; error·market 없음·빈 bars →
    기존 "가격 시계열 대기" placeholder 유지(페이지 전체를 에러로 승격하지 않음); 데이터 있으면
    hook의 `number[]`를 `{ date: String(idx+1), close }`로 매핑해 기존 `LineChart`에 전달.

## Out of Scope

- BE 변경(별도 repo).
- `range` 선택 UI, 배치 시계열 엔드포인트.
- symbol → assetId 해소 로직 변경.
- research 요약·체크리스트·리포트·헤더 등 가격차트 외 영역.

## Protected Files

없음. 위 Implementation Scope 밖 파일은 변경하지 않는다.

## Requirements

- 기존 research 슬라이스 구조(dto/adapters/queries 분리)와 React Query·http client 관례를 따른다.
- `range=3M` 고정, `market` 필수 파라미터로 전달한다.
- `close`는 문자열 Decimal이므로 `parseDecimal`로 변환하고 `null`은 필터한다.
- degradation은 차트 슬롯 레벨에서만 처리하고 페이지 전체를 에러/로딩으로 승격하지 않는다.

## Test Requirements

- `src/features/research/adapters.test.ts`: `adaptResearchDetail` 호출에 `sparkline` 인자 없음,
  `ResearchView`에 `priceSparkline` 필드 부재, `detail.market` → `ResearchView.market` 매핑,
  `detail.market` 부재 시 `null`. 기존 필드 매핑 불변.
- `src/features/research/queries.test.tsx`: `useResearchPriceSeries`가 `bars.close`를 parseDecimal
  파싱해 number 배열 반환, `market`·`symbol` null 시 비활성(apiGet 미호출), `close` null bar 필터,
  queryKey `['research','price-series',symbol,market]`. `useResearchView`가 sparkline 로직 없이 동작.
- `src/pages/ui/ResearchPage.test.tsx`: `useResearchView` mock의 ResearchView에서 `priceSparkline`
  제거, `useResearchPriceSeries` mock으로 loading(Skeleton)·데이터(LineChart)·빈 배열 또는
  market null(placeholder 유지) 분기 검증. 기존 페이지 관심사 단언 불변.

## Verification Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm format:check`
- `TZ=UTC corepack pnpm test`
- `corepack pnpm build`

## Documentation Impact

설계 `docs/designs/79-research-price-chart-wiring.md`가 근거(브랜치 포함). 계약 정렬 문서의
research 가격차트 행 갱신은 orchestrator가 리뷰 시 판단한다.

## ADR Need

불필요. 기존 research 슬라이스·가격 시계열 계약을 따르는 읽기 전용 화면 연동이다.

## Failure Record Need

불필요.

## Risk Level

Low. 단일 종목 읽기 전용 조회이며 BE 계약이 확정되어 있고 #90에서 동일 패턴이 검증됐다.
주의점은 `market` 필수·`range=3M`·`close` Decimal 문자열 변환·차트 슬롯 degradation 정도다.

## Expected Output

- 위 scope의 코드·테스트 변경.
- 검증 5종 통과 로그.
- 가정(range 3M·market 필수·degradation 방식)과 검증 결과 보고.

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files or existing research view/summary behavior.
- Report assumptions and verification results.

## Stop Conditions

- BE 응답 필드·envelope 형태가 설계와 다르면(예: `bars` 없음, `close` 필드명 상이) 멈추고 보고한다.
- `ResearchView`에 `market`을 실을 경로가 없으면(예: `detail.market` 미노출) 멈추고 보고한다.
