# 76 · 사이드바 시장 요약 카드 와이어링 (MarketSummary)

Status: Draft
Track: FE
Source: FE #87
Pair: BE 061(`docs/designs/061-market-index-quotes.md`) · PR #157 (머지됨)
Risk: Low

## 1. 배경

`src/widgets/MarketSummary.tsx`는 현재 위젯 내부에 인라인으로 정의된 `marketSummaries` 배열
(S&P 500·NASDAQ·KOSPI·VIX 4종)과 고정 문자열 푸터 `데이터 기준 14:31 KST`를 렌더합니다.
쿼리 연결이 없으며 `src/widgets/Sidebar.tsx`에서만 사용합니다.

BE #154·PR #157이 머지되어 `GET /market/indices` 엔드포인트가 제공됩니다. 이 설계는
`briefing` 슬라이스([[74-ai-briefing-wiring]])·`watchlist-observations` 슬라이스
([[75-watchlist-observations-wiring]])와 동일한 dto·adapter·query 패턴으로 해당 카드를
실데이터에 연동합니다.

BE 응답은 공통 envelope `{data, error, meta}`로 감싸이며 `data`는 지수 항목 리스트입니다.
응답 항목의 `value`·`change_percent`는 BE Decimal이 JSON에서 문자열로 직렬화된 값이므로
adapter에서 `parseDecimal`로 변환합니다. 또한 `change_percent`는 퍼센트 단위
(예: `"1.26"` = 1.26%)이며, `formatPercent`는 비율(0~1) 입력을 전제하므로 직접 전달하면
126%가 됩니다. 부호 붙은 변동률 표기는 별도 처리가 필요합니다.

인라인 배열은 shared mock이 아니라 위젯 내부에 정의된 사용처 자체이므로, 71·74의
"mock 정의 유지" 관례는 이 카드에 적용되지 않습니다. 인라인 배열은 제거 대상입니다.

## 2. 범위

### 포함

- 새 feature 슬라이스 `src/features/market-indices/`: dto·adapter·adapter 단위 테스트·query.
- `src/widgets/MarketSummary.tsx`: 인라인 `marketSummaries` 배열과 고정 푸터
  → `useMarketIndices()` 실데이터.
- 로딩 Skeleton / 에러 ErrorState(retry) / 빈 `indices` EmptyState 처리.
- 도메인 타입 `MarketIndex`·`MarketIndexBoard`를 `src/shared/model/domain.ts` 정의
  및 `src/shared/model/index.ts` export.

### 제외 (Out of Scope)

- 실제 외부 market data provider 연동 — BE mock 우선.
- 지수별 스파크라인·미니차트.
- `"i"` 정보 툴팁 동작.
- Sidebar 레이아웃 변경 — 카드 내부만 변경하며 사이드바 구조는 건드리지 않습니다.
- 자동 폴링·refetch 주기 설정.
- BE 변경.

## 3. 변경

### 슬라이스 배치 결정

`src/features/market-indices/`를 독립 슬라이스로 생성합니다. 위젯은 `widgets/`에 위치하나
쿼리·degradation은 위젯 내부에서 처리합니다. DashboardPage의 브리핑 카드가 `briefing` 슬라이스를
페이지 외부 위젯에서 직접 소비하는 선례와 동일한 결정입니다. market-indices는 시세 조회
전용 관심사로, 향후 다른 위젯이나 페이지에서 재사용할 가능성이 있어 공유 슬라이스로 분리합니다.

### 3.1 dto (`src/features/market-indices/dto.ts`)

- `MarketIndexQuoteDto { symbol: string; name: string; value: string; change_percent: string; reference_at: string }` —
  BE 응답 항목 그대로, snake_case·문자열 형태를 보존합니다. 4종 항목 모두 동일한
  `reference_at`을 가집니다.

### 3.2 adapters (`src/features/market-indices/adapters.ts`)

도메인 타입은 `src/shared/model/domain.ts`에 정의하고 `src/shared/model/index.ts`에서 export합니다.

- `MarketIndex { symbol: string; name: string; value: number; changePercent: number }` —
  개별 지수. `reference_at`은 board에서만 관리하므로 항목 레벨에 두지 않습니다.
- `MarketIndexBoard { indices: MarketIndex[]; referenceAt: string | null }` —
  composite 도메인 객체. `watchlist-observations`의 `{summary, items}` composite 선례를 따릅니다.

adapter 시그니처:

- `adaptMarketIndexBoard(dtos: MarketIndexQuoteDto[]): MarketIndexBoard` — 순수 함수.
  - `indices`는 각 dto를 `MarketIndex`로 매핑합니다. `value`·`change_percent`는
    `parseDecimal`로 number 변환하며, 반환값이 `null`이면 `0`으로 방어합니다.
  - `referenceAt`은 첫 항목의 `reference_at`을 사용합니다. 빈 배열이면 `null`로 설정합니다.

### 3.3 queries (`src/features/market-indices/queries.ts`)

- `useMarketIndices(): UseQueryResult<MarketIndexBoard>` —
  `GET /market/indices` 단일 호출입니다. watchlist-observations와 달리 first-entity 해소
  단계가 없어 쿼리 구조가 단순합니다. 인증이 불요하지만 기존 `apiGet`을 그대로 사용합니다.
  envelope `data` 배열을 `adaptMarketIndexBoard`에 전달합니다.
  - `queryKey: ['market', 'indices']`

### 3.4 MarketSummary (`src/widgets/MarketSummary.tsx`)

- 인라인 `marketSummaries` 배열 선언과 고정 푸터 문자열을 제거합니다.
- `useMarketIndices()` 결과를 소비합니다.
- **로딩**: 카드 내부를 Skeleton으로 교체합니다.
- **에러**: ErrorState를 렌더하며 `onRetry`로 쿼리를 재시도합니다.
- **빈 `indices`**: EmptyState를 렌더합니다.
- **정상**:
  - `changePercent >= 0` → emerald(상승) / 그 외 → rose(하락). 부호로만 결정하며
    기존 mock의 VIX `trend: 'up'` 불일치 quirk는 승계하지 않습니다.
  - `value`는 `formatMoney(value, { maximumFractionDigits: 2 })`로 표기합니다.
  - 변동률은 `formatPercent(changePercent / 100, 2)`에 양수면 `'+'` 접두를 붙여 표기합니다
    (`formatPercent`는 비율 입력 전제이므로 `/100` 변환이 필수입니다 — §4 참조).
  - 푸터는 `board.referenceAt`을 `formatKstDateTime`으로 표기합니다. `referenceAt`이
    `null`이면 푸터를 렌더하지 않습니다.

## 4. Risks / Notes

**formatPercent 비율-단위 함정**: `change_percent`는 퍼센트 단위 문자열입니다(예: `"1.26"` =
1.26%). `parseDecimal("1.26")` → `1.26`을 `formatPercent`에 그대로 전달하면 `×100` 처리로
126%가 됩니다. 반드시 `changePercent / 100`을 전달해야 합니다. adapter 단위 테스트에서
이 변환을 검증합니다.

**tone 엄격 결정**: `changePercent >= 0`이면 emerald(up), 그 외이면 rose(down)으로 고정합니다.
VIX는 통상 역방향 의미를 가지지만 UI 표현은 수치 부호에만 의존합니다. 기존 mock의 VIX
`trend: 'up'`은 컨텍스트에 의존한 수동 설정이었으므로 실데이터 전환 시 승계하지 않습니다.

**parseDecimal null 방어**: BE가 정상 응답을 반환하는 한 `value`·`change_percent`가 비어 있을
가능성은 낮습니다. 그러나 adapter에서 `null` 반환 시 `0`으로 방어하여 렌더 오류를 방지합니다.
이는 에러 상태로 처리하지 않습니다.

## 5. 테스트

### adapter 단위 테스트 (`src/features/market-indices/adapters.test.ts`)

`src/features/briefing/adapters.test.ts` 형식을 그대로 따릅니다.

- `value`·`change_percent` parseDecimal 변환 정상 케이스.
- 빈 배열 입력 → `{ indices: [], referenceAt: null }` 반환.
- `parseDecimal` 반환이 `null`인 경우 `0` 방어 처리.
- `referenceAt`이 첫 항목의 `reference_at`으로 설정됨.
- `reference_at`이 개별 `MarketIndex`에 노출되지 않음.

### MarketSummary 렌더 분기

- 로딩·에러(retry)·빈 `indices`·정상 케이스별 렌더 분기를 확인합니다.
- `changePercent >= 0` → emerald, `< 0` → rose 분기.
- `referenceAt: null` → 푸터 비노출.
- 인라인 `marketSummaries` 배열 및 고정 푸터 문자열이 잔존하지 않음을 확인합니다.

## 6. 관련 링크

- [[74-ai-briefing-wiring]] — dto·adapter·query 슬라이스 구조 선례
- [[75-watchlist-observations-wiring]] — composite adapter(`{summary, items}`) 선례
- BE 이슈 #154, BE PR #157 — `GET /market/indices` 구현 (머지됨)
- BE 설계 `docs/designs/061-market-index-quotes.md`
- FE 이슈 #87 — 본 작업 이슈
