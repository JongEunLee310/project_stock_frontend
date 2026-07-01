# Codex Handoff Task

## Source Issue

FE #90(시그널 스파크라인 활성화). 설계 `docs/designs/78-signals-sparkline-wiring.md`.
Pair: BE #159 · PR #160 — signals `?expand=asset` 응답에 `asset.market` 추가(머지됨).

## Task Summary

`src/pages/ui/SignalsPage.tsx`의 시그널 카드 스파크라인(`SignalSparklineChart`)을 실 가격
시계열로 활성화한다. 비활성 상태인 `useSignalSparkline`을 `market` 파라미터를 받아 활성화하고,
각 시그널 카드가 컴포넌트 레벨에서 자신의 가격 시계열을 조회하도록(per-row) 조정한다.
BE #160으로 signals 응답의 `asset.market`을 이제 얻을 수 있으므로, 이를 도메인에 매핑해
쿼리에 전달한다. 기존 `src/features/signals/` 슬라이스를 확장한다.

## Goal

완료 시 참이어야 할 것:

- `useSignalSparkline`이 `symbol`·`market`을 받아 활성화되고, `GET /stocks/{symbol}/prices?market={market}&range=1M&interval=1d`
  응답의 `bars`에서 `close` 값을 실 스파크라인으로 렌더한다.
- 각 시그널 카드가 자신의 시계열을 조회한다(per-row). market이 없으면 조회하지 않고
  기존 "가격 시계열 대기" placeholder를 유지한다.
- `Signal` 도메인이 `market`을 보유하고 `sparkline` 필드는 제거된다.
- 하드코딩·빈배열 잔재(`adaptSignal(signal, [])`, 페이지 레벨 `useSignalSparkline(null)` 더미)가 없다.
- lint·typecheck·format·test·build 전부 통과한다.

## Background

- BE 응답 형태(공통 envelope `{data,error,meta}`의 `data`): `PriceSeriesResponse`
  `{ symbol, market, currency, interval, range, source, last_updated_at, bars: PriceBar[] }`.
  `PriceBar { date, open, high, low, close, adjusted_close, volume }`(금액은 문자열 Decimal,
  volume은 int). FE는 `bars`의 `close`만 소비한다. `apiGet<T>`가 envelope을 언랩해 `{data}`를 준다.
- BE `GET /api/v1/stocks/{symbol}/prices`의 `market`(`KRX|NASDAQ|NYSE`)은 **필수**이고
  `range`는 `1M|3M|6M|1Y`만 유효하다. 기존 FE 경로의 `range=1mo`는 400을 유발하므로 `1M`으로 고친다.
- BE #160(머지됨)로 signals `?expand=asset` 응답의 `asset` 객체에 `market`이 추가되었다.
  따라서 `SignalDto.asset.market`을 읽을 수 있다.
- `SignalSparklineChart`는 `SignalCard` 안에서만 렌더되고, `SignalCard`는 `visibleSignals.map`
  에서만 렌더된다. 우선순위 리스트(`prioritySignals`)에는 스파크라인이 없다. 따라서 스파크라인은
  표시된 카드 수(N)만큼 필요하다. React Query가 동일 queryKey를 dedup하므로 동일 종목 중복
  렌더 시 네트워크 요청은 1회로 수렴한다.
- `parseDecimal(value): number | null`은 `@/shared/lib/format`에서 제공. `null` 방어 후 필터.
- 참조 선례: `src/features/dashboard/`·`src/features/market-indices/`의 dto·adapter·query 구조,
  Decimal 문자열 `parseDecimal` 변환(76), 미니 시각요소 degradation(77).
- `useSignalDetail`·`adaptSignalDetail`은 앱에서 미사용(테스트만 참조)이나, sparkline 인자
  제거에 따른 시그니처 정리만 수행한다(함수 제거·신규 타입 도입 금지).

## Implementation Scope

- `src/features/signals/dto.ts` —
  - `SignalDto.asset`에 `market?: string | null` 추가.
  - `PriceBarDto`는 최소 `{ close?: string | null }` 유지(나머지 필드는 선택).
  - `PriceSeriesDto { bars: PriceBarDto[] }` 추가(bare array 가정 대체).
- `src/features/signals/adapters.ts` —
  - `Signal`에 `market: string | null` 추가, `sparkline: number[]` 필드 제거.
  - `adaptSignal(dto: SignalDto): Signal` — sparkline 인자 제거. `market`은 `dto.asset?.market ?? null`.
    `readSymbol` 등 기존 로직 유지.
  - `adaptSignalDetail(dto: SignalDetailDto): Signal` — sparkline 인자만 제거(반환 타입은
    기존과 동일하게 `Signal`. 신규 `SignalDetail` 타입 도입 금지).
- `src/features/signals/queries.ts` —
  - `useSignalSparkline(symbol: string | null, market: string | null): UseQueryResult<number[]>`
    활성화: `enabled: Boolean(symbol && market)`, `queryKey: ['signals','sparkline',symbol,market]`,
    경로 `/stocks/${symbol}/prices?market=${market}&range=1M&interval=1d`,
    `apiGet<PriceSeriesDto>`로 호출해 `data.bars`의 `close`를 `parseDecimal`로 변환·`null` 필터하여
    `number[]` 반환. `symbol`은 `encodeURIComponent` 적용.
  - `useSignals`·`useSignalDetail`은 `adaptSignal(signal)`·`adaptSignalDetail(signal)`로 정리
    (sparkline 인자 제거).
- `src/pages/ui/SignalsPage.tsx` —
  - `SignalSparklineChart`가 `useSignalSparkline(signal.symbol, signal.market)`을 직접 호출.
  - 페이지 레벨 더미 `useSignalSparkline(null)`(약 237행) 제거.
  - degradation(행 단위): loading → 슬롯 크기(h-10) `Skeleton`; error·market 없음·빈 bars →
    기존 "가격 시계열 대기" placeholder 유지(카드 전체를 에러로 승격하지 않음); 데이터 있으면
    `Sparkline` 렌더. `SignalSparklineChart`는 더 이상 `signal.sparkline`을 읽지 않는다.

## Out of Scope

- BE 변경(별도 repo).
- `days`·`range` 선택 UI, 배치 시계열 엔드포인트.
- 우선순위 리스트(`prioritySignals`)에 스파크라인 추가.
- 미사용 `useSignalDetail`·`adaptSignalDetail` 함수 제거, 신규 도메인 타입 도입.
- 시그널 목록 필터·정렬·점수 링 등 스파크라인 외 UI.

## Protected Files

없음. 위 Implementation Scope 밖 파일은 변경하지 않는다.

## Requirements

- 기존 signals 슬라이스 구조(dto/adapters/queries 분리)와 React Query·http client 관례를 따른다.
- 어댑터는 순수 함수로 두고 단위 테스트한다.
- `range`는 `1M` 고정, `market`은 필수 파라미터로 전달한다.
- `close`는 문자열 Decimal이므로 `parseDecimal`로 변환하고 `null`은 필터한다.
- degradation은 스파크라인 슬롯(행) 레벨에서만 처리하고 카드 전체를 에러/로딩으로 승격하지 않는다.

## Test Requirements

- `src/features/signals/adapters.test.ts`: `adaptSignal(dto)` 호출(sparkline 인자 없음),
  `asset.market` → `Signal.market` 매핑, `asset.market` 부재 시 `null`, 기존 필드 매핑 불변.
  fixture asset에 `market` 추가. `adaptSignalDetail` 시그니처 조정 반영.
- `src/features/signals/queries.test.tsx`: `useSignalSparkline`이 `PriceSeriesDto.bars`의
  `close`를 `parseDecimal`로 파싱해 number 배열 반환, `market`/`symbol`이 `null`이면
  비활성(`enabled:false`, apiGet 미호출), `close`가 `null`인 bar는 필터됨.
- `src/pages/ui/SignalsPage.test.tsx`: mock row에 `market` 추가·`sparkline` 도메인 필드 제거,
  `useSignalSparkline` mock으로 loading(Skeleton 노출)·데이터(Sparkline 렌더)·빈 bars 또는
  market null(placeholder 유지) 분기 검증. 기존 페이지 관심사 단언은 불변.

## Verification Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm format:check`
- `TZ=UTC corepack pnpm test`
- `corepack pnpm build`

## Documentation Impact

설계 `docs/designs/78-signals-sparkline-wiring.md`가 근거(브랜치 포함). 계약 정렬 문서의
signals 스파크라인 행 갱신은 orchestrator가 리뷰 시 판단한다.

## ADR Need

불필요. 기존 signals 슬라이스·가격 시계열 계약을 따르는 읽기 전용 화면 연동이다.

## Failure Record Need

불필요.

## Risk Level

Low. 읽기 전용 조회 연동이며 BE 계약이 확정되어 있다. 주의점은 per-row 쿼리(React Query
dedup 전제)·`market` 필수·`range=1M`·`close`는 Decimal 문자열 변환·행 단위 degradation
(카드 전체 승격 금지) 정도다.

## Expected Output

- 위 scope의 코드·테스트 변경.
- 검증 5종 통과 로그.
- 가정(per-row 조회·market 필수·range 1M·degradation 방식)과 검증 결과 보고.

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files or existing signals list/filter behavior.
- Report assumptions and verification results.

## Stop Conditions

- BE 응답 필드·envelope 형태가 설계와 다르면(예: `bars` 없음, `close` 필드명 상이) 멈추고 보고한다.
- `market`을 도메인에 실을 경로가 없으면(예: `asset.market`이 응답에 없음) 멈추고 보고한다.
