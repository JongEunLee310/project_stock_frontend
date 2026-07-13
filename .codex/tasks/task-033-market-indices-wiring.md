# Codex Handoff Task

## Source Issue

FE #87(사이드바 시장 요약 카드 실데이터 연동). 설계
`docs/designs/76-market-indices-wiring.md`. Pair: BE 061
(`docs/designs/061-market-index-quotes.md`) — 대응 엔드포인트는 이미 BE main에 머지됨
(BE #154, PR #157).

## Task Summary

`src/widgets/MarketSummary.tsx`의 하드코딩 `marketSummaries` 배열과 고정 푸터
`데이터 기준 14:31 KST`를 BE 시장 지수 API(`GET /market/indices`)로 전환한다. briefing·
watchlist-observations 슬라이스와 동일한 dto·adapter·query 패턴으로 신규 feature 슬라이스를
추가하고, 위젯의 인라인 배열을 실데이터로 교체한다.

## Goal

완료 시 참이어야 할 것:

- MarketSummary 카드가 `GET /market/indices` 실데이터를 렌더한다(인라인 `marketSummaries`
  배열·고정 푸터 문자열 제거).
- 각 지수의 `value`·변동률(`change_percent`)·`name`을 렌더하고, 변동 부호로 tone(상승/하락)을
  결정한다.
- 푸터 기준 시각을 응답의 `reference_at`로 대체한다.
- 로딩은 스켈레톤, 에러는 재시도 가능한 ErrorState, 빈 목록은 EmptyState로 degradation한다
  (mock 복귀 없음).
- lint·typecheck·format·test·build 전부 통과한다.

## Background

- BE 응답 형태(공통 envelope `{data, error, meta}`의 `data`)는 지수 항목 **리스트**다:
  `[{ symbol: string, name: string, value: string, change_percent: string, reference_at: string }]`.
  기존 http client(`src/shared/api/client.ts`)의 `apiGet<T>`가 envelope을 언랩해 `{data}`를 준다.
  이 엔드포인트는 **인증 불요**지만 `apiGet`을 그대로 사용한다.
- **중요1 — Decimal 직렬화**: BE Decimal은 JSON에서 **문자열**로 직렬화된다(기존 dto
  `score`·`close`·`target_price`가 모두 `string`인 선례). 따라서 `value`·`change_percent`는
  문자열이며 adapter에서 `parseDecimal`로 number 변환한다(`src/shared/lib/format`).
- **중요2 — change_percent 단위**: `change_percent`는 **퍼센트 단위**다(예: `"1.26"` =
  1.26%). `formatPercent(value, digits)`는 **비율(0~1) 입력**을 전제해 내부에서 ×100 하므로
  `formatPercent(changePercent, 2)`로 그대로 넘기면 126%가 된다. 반드시 `changePercent / 100`을
  전달하고, 양수면 `'+'` 접두를 붙인다.
- `name`은 BE가 제공한다("S&P 500"·"NASDAQ Composite"·"KOSPI"·"VIX"). 4종 항목 모두 동일한
  `reference_at`을 가진다.
- 참조 선례(반드시 패턴 준수): briefing 슬라이스 `src/features/briefing/`와
  watchlist-observations 슬라이스 `src/features/watchlist-observations/`의 `dto.ts`·
  `adapters.ts`·`adapters.test.ts`·`queries.ts`. 특히 관찰메모 adapter가 **리스트/객체 전체를
  받아 composite 도메인 객체를 반환**하는 형태를 미러링한다.
- 소비 지점: `src/widgets/MarketSummary.tsx`(약 1~7행 인라인 `marketSummaries` 배열,
  46행 부근 고정 푸터 `데이터 기준 14:31 KST`). 이 위젯은 `src/widgets/Sidebar.tsx`에서만
  사용되며 props가 없다. **shared mock 정의는 없다**(배열이 위젯 내부 인라인). 따라서 71·74의
  "mock 정의 유지" 관례는 적용되지 않으며 인라인 배열은 제거 대상이다.
- 포맷 유틸(`src/shared/lib/format`): `formatMoney(number, opts?)`(ko-KR),
  `formatPercent(ratio, digits?)`(비율 입력!), `parseDecimal(string)→number|null`,
  `formatKstDateTime(iso)`.
- 도메인 타입 배치: `AiBriefing`·`WatchlistObservations`와 동일하게 신규 도메인 타입을
  `src/shared/model/domain.ts`에 정의하고 `src/shared/model/index.ts`로 export한다.
- degradation 컴포넌트: WatchlistPage가 쓰는 Skeleton(로딩)·ErrorState(`onRetry` 포함)·
  EmptyState 선례를 따른다.

## Implementation Scope

- `src/features/market-indices/dto.ts` —
  `MarketIndexQuoteDto { symbol: string; name: string; value: string; change_percent: string;
  reference_at: string }`. snake_case·문자열 보존.
- `src/features/market-indices/adapters.ts` —
  `adaptMarketIndexBoard(dtos: MarketIndexQuoteDto[]): MarketIndexBoard`. 순수 함수.
  각 dto를 `MarketIndex`로 매핑(`value`·`change_percent`는 `parseDecimal`, `null`이면 `0`
  방어), `referenceAt`은 첫 항목의 `reference_at`(빈 배열이면 `null`). `reference_at`은
  개별 `MarketIndex`에 두지 않는다.
- `src/features/market-indices/queries.ts` —
  `useMarketIndices(): UseQueryResult<MarketIndexBoard>`. `GET /market/indices` 단일 호출
  (first-entity 해소 없음), `apiGet<MarketIndexQuoteDto[]>` 결과를 `adaptMarketIndexBoard`에
  전달. `queryKey: ['market', 'indices']`.
- `src/features/market-indices/adapters.test.ts` — 아래 Test Requirements 참고.
- `src/shared/model/domain.ts` —
  `MarketIndex { symbol: string; name: string; value: number; changePercent: number }`,
  `MarketIndexBoard { indices: MarketIndex[]; referenceAt: string | null }` 추가.
- `src/shared/model/index.ts` — 신규 타입 export(기존 export 관례 따름).
- `src/widgets/MarketSummary.tsx` — 인라인 `marketSummaries` 배열·고정 푸터 제거,
  `useMarketIndices()` 연동. 로딩·에러·빈 목록·정상 렌더 분기 처리. 정상 렌더 시:
  - tone: `changePercent >= 0` → 상승(emerald) / 그 외 → 하락(rose). **부호로만** 결정하며
    기존 mock의 VIX `trend: 'up'` quirk는 승계하지 않는다.
  - `value`: `formatMoney(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })`
    (기존 "5,278.40" 2자리 표기 유지).
  - 변동률: `formatPercent(changePercent / 100, 2)`에 양수면 `'+'` 접두.
  - 푸터: `referenceAt`을 `formatKstDateTime`으로 표기하고, `referenceAt`이 `null`이면
    푸터를 렌더하지 않는다.

## Out of Scope

- 실제 외부 market data provider 연동(BE mock 우선).
- 지수별 스파크라인·미니차트, `"i"` 정보 툴팁 동작.
- Sidebar 레이아웃 변경 — 카드 내부만 변경하고 사이드바 구조는 건드리지 않는다.
- 자동 폴링·refetch 주기 설정.
- briefing·watchlist-observations 등 기존 슬라이스 파일 변경.
- BE 변경(별도 repo).

## Protected Files

없음. 위 Implementation Scope 밖 파일은 변경하지 않는다. 특히 기존 feature 슬라이스와
Sidebar 레이아웃은 건드리지 않는다.

## Requirements

- 기존 feature 슬라이스 구조(dto/adapters/queries 분리)와 React Query·http client 관례를 따른다.
- 어댑터는 순수 함수로 두고 단위 테스트한다.
- degradation은 mock 복귀가 아니라 Skeleton/ErrorState/EmptyState로 처리한다.
- `formatPercent`에는 반드시 `changePercent / 100`을 전달한다(위 Background 중요2).
- 변동률 tone·부호는 `changePercent` 수치 부호에만 의존한다.

## Test Requirements

- `src/features/market-indices/adapters.test.ts`(briefing `adapters.test.ts` 형식):
  `value`·`change_percent` parseDecimal 변환 정상 케이스, 빈 배열 입력 →
  `{ indices: [], referenceAt: null }`, `parseDecimal` 반환이 `null`인 경우 `0` 방어,
  `referenceAt`이 첫 항목의 `reference_at`으로 설정됨, `reference_at`이 개별 `MarketIndex`에
  노출되지 않음.
- MarketSummary 테스트가 있으면(없으면 신설) `useMarketIndices`를 mocking해 로딩·에러·빈 목록·
  정상 렌더 분기와 tone(양수 emerald / 음수 rose)·`referenceAt: null` 시 푸터 비노출을 확인하고,
  인라인 `marketSummaries` 배열·고정 푸터 문자열이 잔존하지 않음을 검증한다.

## Verification Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm format:check`
- `TZ=UTC corepack pnpm test`
- `corepack pnpm build`

## Documentation Impact

설계 `docs/designs/76-market-indices-wiring.md`가 근거(이미 브랜치에 포함). 계약 정렬
문서(있다면)의 시장 요약 행 갱신은 orchestrator가 리뷰 시 처리한다.

## ADR Need

불필요. 기존 briefing·observations 와이어링 패턴을 따르는 읽기 전용 화면 연동이다.

## Failure Record Need

불필요.

## Risk Level

Low. 읽기 전용 조회 연동이며 BE 계약이 확정되어 있다. 주의점은 Decimal 문자열 파싱·
`change_percent` 퍼센트 단위(formatPercent 비율 함정)·composite 도메인 매핑·degradation
처리 정도다.

## Expected Output

- 위 scope의 코드·테스트 변경.
- 검증 5종 통과 로그.
- 가정(빈 목록 처리·degradation 방식·formatPercent 변환)과 검증 결과 보고.

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files or the briefing/watchlist-observations slices.
- Report assumptions and verification results.

## Stop Conditions

- BE 응답 필드·envelope 형태가 설계와 다르면 멈추고 보고한다.
- `change_percent`가 퍼센트 단위가 아니라 비율(0~1) 단위로 확인되면 멈추고 보고한다.
