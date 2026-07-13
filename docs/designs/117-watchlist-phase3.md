# Design: 관심 종목 페이지 완성 Phase 3 (#117)

## Status

Implemented

## Context

Phase 2 구현으로 테이블 상태 배지, 위험 필터 드롭다운, 마지막 갱신 컬럼, 변화(1D)
스파크라인, 요약 카드 전일 대비 델타가 완료됐다. Phase 3는 BE evaluations 엔드포인트
(`GET /watchlists/{id}/evaluations`)와 summary에 새로 추가된 `buy_readiness` 필드를 소비해
테이블에 평가 배지 4종 컬럼을 추가하고 요약 카드를 2장에서 4장으로 확장함으로써
이슈 #117을 완결한다.

## Verified Facts

확인 기준 — BE: `/Users/sleepyowl/Projects/project_stock` origin/dev (2026-07-08, evaluations
엔드포인트 및 buy_readiness 필드 머지 이후); FE: feat/117-watchlist-phase3 (main에서 분기,
Phase 2 완료 상태).

- `GET /api/v1/watchlists/{id}/evaluations` — `ApiResponse` envelope 내부
  `WatchlistEvaluationsResponse`:
  - `items: list[WatchlistItemEvaluationProjection]` — `symbol`, `news_risk`, `valuation_burden`,
    `theme_heat`, `ai_judgment` (모두 str Enum)
  - `needs_research_count: int`
  - `generated_at: datetime(UTC)`
  - 가능 enum 값 (출처: BE `app/domains/watchlists/types.py`):
    - `news_risk`: `"HIGH"` / `"MEDIUM"` / `"LOW"`
    - `valuation_burden`: `"HIGH"` / `"MODERATE"` / `"LOW"`
    - `theme_heat`: `"OVERHEATED"` / `"NEUTRAL"` / `"COLD"`
    - `ai_judgment`: `"RISK_INCREASING"` / `"WATCH"` / `"STABLE"`
  - LLM 기반 응답으로 수 초 지연이 발생하며, 무효 enum 항목은 BE가 skip하므로
    `items`에 없는 `symbol`이 존재할 수 있음

- `GET /api/v1/watchlists/{id}/summary`에 `buy_readiness: BuyReadinessProjection | null` 추가됨:
  - `level: str` — `"SUFFICIENT"` / `"LIMITED"` / `"RESTRICTED"`
  - `level_label: str` — 한국어 라벨 (예: `"충분"`, `"제한적"`, `"불가"`)
  - `cash_weight: decimal` → FE에서 number 파싱
  - `buy_candidate_count: int`
  - `message: str` — 한국어 투자 판단 문장
  - `portfolio_id` 쿼리 파라미터 선택, 생략 시 첫 포트폴리오 fallback; 포트폴리오 없으면 null

- `WatchlistItemDto.status: string`은 이미 `src/features/watchlist/dto.ts:63`에 존재 (Phase 2 추가)
- `WatchlistSummaryDto`는 `dto.ts:87-91`에 정의됨 — Phase 3에서 `buy_readiness` 필드 추가 필요
- `adaptWatchlistSummary`는 `adapters.ts:88-99`에서 `WatchlistSummaryView`를 반환 — `buyReadiness` 추가 필요
- `useWatchlistSummary`는 `queries.ts:74-96`에서 `/watchlists/{id}/summary`를 소비함 —
  Phase 3에서 `buy_readiness`를 추가로 파싱한다
- 테스트는 MSW가 아닌 `vi.mock('@/features/watchlist/queries', ...)` 모듈 단위 mock을 사용하며
  (`WatchlistPage.test.tsx:294`), `queries.test.tsx`는 `@/shared/api/client`를 직접 mock함 —
  MSW 핸들러 파일은 존재하지 않음
- 현재 테이블은 8개 컬럼(종목·상태·섹터·현재가·변화율·변화(1D)·마지막 갱신·액션),
  빈 상태 셀에 `colSpan={8}` 사용 (`WatchlistPage.tsx:776`)
- 요약 카드 그리드가 `grid-cols-2` 2개 카드로 구성됨 (`WatchlistPage.tsx:510`)
- `SummaryVisual`이 `index` prop으로 `riskIncreasing`/`watchlistTotal`을 구분함
  (`WatchlistPage.tsx:129-178`) — 기존 Card 0·1에만 적용, Phase 3 추가 카드는 자체 시각 요소 보유

## Decisions

### 1. 평가 배지 enum → 한국어 라벨·색상 매핑

4종 enum 각각에 대해 `adapters.ts`에 resolver 함수를 추가한다. 기존
`resolveStatusBadge` 패턴(`{ label: string; className: string }` 반환)을 그대로 따른다.
알 수 없는 값에는 중립 폴백을 반환하며 런타임 에러를 발생시키지 않는다.

| 필드               | enum 값           | FE 라벨   | 색상 방향     |
| ------------------ | ----------------- | --------- | ------------- |
| `news_risk`        | `HIGH`            | 높음      | 위험(rose)    |
|                    | `MEDIUM`          | 중간      | 경고(amber)   |
|                    | `LOW`             | 낮음      | 안전(emerald) |
|                    | 폴백              | 중간      | 중립(slate)   |
| `valuation_burden` | `HIGH`            | 고평가    | 위험(rose)    |
|                    | `MODERATE`        | 적정      | 중립(slate)   |
|                    | `LOW`             | 저평가    | 안전(emerald) |
|                    | 폴백              | 적정      | 중립(slate)   |
| `theme_heat`       | `OVERHEATED`      | 과열      | 위험(rose)    |
|                    | `NEUTRAL`         | 중립      | 중립(slate)   |
|                    | `COLD`            | 냉각      | 안전(emerald) |
|                    | 폴백              | 중립      | 중립(slate)   |
| `ai_judgment`      | `RISK_INCREASING` | 위험 증가 | 위험(rose)    |
|                    | `WATCH`           | 관망      | 경고(amber)   |
|                    | `STABLE`          | 안정      | 안전(emerald) |
|                    | 폴백              | 안정      | 안전(emerald) |

`className`은 Tailwind 유틸리티 클래스를 직접 사용한다. 기존
`stockStatusClassNames`는 `안정`/`관망`/`위험 증가` 3단계에 최적화되어 있으므로 새 4단계
색상에는 맞지 않아 별도 매핑을 정의한다.

### 2. 평가 데이터 구조: symbol 키 맵

`WatchlistEvaluationRow` 인터페이스와 `WatchlistEvaluationMap = Record<string, WatchlistEvaluationRow>` 타입을 정의해 symbol 키 조회를 O(1)로 처리한다. `WatchlistPage`에서
`evaluations.map[stock.symbol]`로 참조하며, symbol이 map에 없으면 4개 배지 셀 모두 `—`을
표시한다.

### 3. `useWatchlistEvaluations` 훅 설계

기존 `useWatchlistSparklines`와 동일한 자기 해결(self-resolving) 패턴을 따른다: 훅 내부에서
`/watchlists?page=1&size=20`으로 첫 목록 ID를 조회한 뒤 `/watchlists/{id}/evaluations`를
호출한다. `WatchlistPage`에 watchlistId를 별도로 노출할 필요가 없고, `queries.ts`의 기존
관례에 부합한다.

`staleTime: 10 * 60 * 1000`(10분) — 스파크라인(5분)보다 길게 설정한다. LLM 기반 응답은
짧은 주기 재조회 의미가 없으며 수 초 지연 비용을 감안해 억제한다.

쿼리 실패 시 `WatchlistPage`는 빈 map(`{}`)과 `needsResearchCount: 0`으로 폴백해
테이블 렌더링 중단을 방지한다.

### 4. 평가 컬럼 로딩·실패 UX

- 로딩 중: 4개 배지 셀 각각에 `<Skeleton className="h-4 w-12" />`를 표시한다.
- 실패·symbol 누락: 셀을 `—`으로 표시하며 페이지 에러 상태로 전환하지 않는다.
- 두 경우 모두 기존 items 컬럼(종목·상태·현재가 등)은 정상 렌더링을 유지한다.

### 5. 테이블 컬럼 배치

4개 평가 배지 컬럼(뉴스 위험도 → 밸류에이션 → 테마 과열 → AI 판단)을 기존 `상태` 컬럼
바로 뒤에 추가한다. 컬럼 수가 8 → 12로 증가하므로 `colSpan`을 12로 갱신한다.

최종 컬럼 순서: 종목 | 상태 | 뉴스 위험도 | 밸류에이션 | 테마 과열 | AI 판단 | 섹터 |
현재가 | 변화율 | 변화(1D) | 마지막 갱신 | (액션)

### 6. 요약 카드 2장 → 4장 확장

기존 2장(전체 관심 종목, 위험 증가 종목)은 내용·형식 변경 없이 유지하고 2장을 뒤에 추가한다.
카드 그리드를 `md:grid-cols-2 xl:grid-cols-4`로 변경해 wide 레이아웃에서 4장이 한 줄에
배치된다.

**Card 2 — 추가 리서치 필요**: 값 자리에 `evaluationsQuery.data?.needsResearchCount`(없으면 `0`),
추세 시각화는 없음. evaluations 로딩 중 Skeleton 표시, 실패 시 `—`.

**Card 3 — 신규 매수 여력**: 값 자리에 `summary.buyReadiness?.levelLabel`(예: `"제한적"`),
보조 문구로 `summary.buyReadiness?.message` 표시. `buy_readiness`가 null이면 `"포트폴리오 없음"`
안내를 표시한다. 투자 판단 문구가 주인공이므로 `levelLabel`이 대형 텍스트 위치를 차지하며
숫자 대신 문자열이다.

`SummaryVisual`은 기존 Card 0·1에만 적용한다. Card 2·3은 자체 표현 요소를 가지므로
`SummaryVisual`을 렌더링하지 않는다. `summaryIconClassNames`·`summaryIcons` 배열에 Card 2·3
항목(색상·아이콘)을 추가한다.

현재 `summary` fallback 객체와 `emptyWatchlistSummary`에 `buyReadiness: null`을 추가한다.

## Components

### 수정

- `src/features/watchlist/dto.ts`
  — `WatchlistItemEvaluationDto`: `symbol: string`, `news_risk: string`, `valuation_burden: string`,
  `theme_heat: string`, `ai_judgment: string`
  — `WatchlistEvaluationsResponseDto`: `items: WatchlistItemEvaluationDto[]`,
  `needs_research_count: number`, `generated_at: string`
  — `BuyReadinessDto`: `level: string`, `level_label: string`, `cash_weight: string`,
  `buy_candidate_count: number`, `message: string`
  — `WatchlistSummaryDto`에 `buy_readiness?: BuyReadinessDto | null` 추가

- `src/features/watchlist/adapters.ts`
  — `WatchlistEvaluationRow`: `symbol: string`, `newsRisk: string`, `valuationBurden: string`,
  `themeHeat: string`, `aiJudgment: string`
  — `WatchlistEvaluationMap` type alias: `Record<string, WatchlistEvaluationRow>`
  — `BuyReadinessView`: `level: string`, `levelLabel: string`, `cashWeight: number`,
  `buyCandidateCount: number`, `message: string`
  — `WatchlistSummaryView`에 `buyReadiness: BuyReadinessView | null` 추가
  — `resolveNewsRiskBadge(value: string): { label: string; className: string }` 추가
  — `resolveValuationBadge(value: string): { label: string; className: string }` 추가
  — `resolveThemeHeatBadge(value: string): { label: string; className: string }` 추가
  — `resolveAiJudgmentBadge(value: string): { label: string; className: string }` 추가
  — `adaptWatchlistEvaluations(dto: WatchlistEvaluationsResponseDto): { map: WatchlistEvaluationMap; needsResearchCount: number }` 추가
  — `adaptBuyReadiness(dto: BuyReadinessDto): BuyReadinessView` 추가
  — `adaptWatchlistSummary` 수정: `buyReadiness: dto.buy_readiness ? adaptBuyReadiness(dto.buy_readiness) : null`

- `src/features/watchlist/queries.ts`
  — `WatchlistEvaluationsResult` 타입: `{ map: WatchlistEvaluationMap; needsResearchCount: number }`
  — `useWatchlistEvaluations(): UseQueryResult<WatchlistEvaluationsResult>` 추가:
  queryKey `[...watchlistQueryKey, 'evaluations']`,
  staleTime `10 * 60 * 1000`,
  첫 번째 관심목록 ID 조회 후 `/watchlists/{id}/evaluations` 호출,
  `adaptWatchlistEvaluations`로 변환
  — `emptyWatchlistSummary`에 `buyReadiness: null` 추가

- `src/pages/ui/WatchlistPage.tsx`
  — `useWatchlistEvaluations` import 추가
  — `watchlistEvaluationsQuery` 호출 추가
  — 테이블 헤더: `상태` 뒤에 `뉴스 위험도`, `밸류에이션`, `테마 과열`, `AI 판단` 추가 (목업 순서)
  — 각 행에 4개 배지 셀 추가: evaluations map miss → `—`, 로딩 중 → Skeleton
  — `colSpan={8}` → `colSpan={12}` 갱신
  — 카드 그리드 className: `md:grid-cols-2` → `md:grid-cols-2 xl:grid-cols-4`
  — `summaryIconClassNames`·`summaryIcons` 배열에 Card 2·3 항목 추가
  — Card 2·3 렌더링 추가 (기존 summaryCards.map 바깥 또는 summaryCards 타입 확장)
  — Card 3 렌더 분기: `buyReadiness` 존재 시 `levelLabel`+`message`, null 시 "포트폴리오 없음"
  — `summary` fallback 객체에 `buyReadiness: null` 추가

### 테스트 영향

- `src/features/watchlist/adapters.test.ts`
  — `resolveNewsRiskBadge`: `HIGH`/`MEDIUM`/`LOW`/폴백 → 라벨·className 단위 테스트.
  픽스처 enum 리터럴에 출처 주석 `// app/domains/watchlists/types.py` 기재.
  — `resolveValuationBadge`: `HIGH`/`MODERATE`/`LOW`/폴백 단위 테스트 (동일 주석).
  — `resolveThemeHeatBadge`: `OVERHEATED`/`NEUTRAL`/`COLD`/폴백 단위 테스트.
  — `resolveAiJudgmentBadge`: `RISK_INCREASING`/`WATCH`/`STABLE`/폴백 단위 테스트.
  — `adaptWatchlistEvaluations`: 정상 items → map 반환, `needsResearchCount` 전달 확인,
  items에 없는 symbol이 map에 존재하지 않음 확인.
  — `adaptWatchlistSummary`: `buy_readiness` 있는 경우 `buyReadiness` 필드 포함,
  null인 경우 `buyReadiness: null` 확인.

- `src/features/watchlist/queries.test.tsx`
  — `useWatchlistEvaluations`: 정상 응답 → `map`·`needsResearchCount` 반환,
  빈 `items` → `map: {}` 반환.

- `src/pages/ui/WatchlistPage.test.tsx`
  — `watchlistEvaluationsQueryState` mock 상태 추가:
  `{ data: { map: { NVDA: { symbol: 'NVDA', newsRisk: 'HIGH', ... }, ... }, needsResearchCount: 2 }, isLoading: false, isError: false, ... }`
  — `vi.mock('@/features/watchlist/queries', ...)` 블록에
  `useWatchlistEvaluations: () => watchlistEvaluationsQueryState` 추가.
  — 배지 렌더링: `newsRisk: 'HIGH'`인 NVDA 행에 `높음` 배지 렌더링 확인.
  — 로딩 중: `isLoading: true` 시 배지 셀에 스켈레톤 표시, 기존 `상태`·`현재가` 셀은 정상 확인.
  — 실패: `isError: true` 시 배지 셀에 `—` 표시, 테이블 렌더링 유지 확인.
  — symbol 누락: map에 없는 symbol 행 배지 셀 `—` 표시 확인.
  — "추가 리서치 필요" 카드: `needsResearchCount` 값이 카드에 표시 확인.
  — "신규 매수 여력" 카드: `buyReadiness.levelLabel`·`message` 표시 확인.
  — "신규 매수 여력" 카드 null: `buyReadiness: null` 시 "포트폴리오 없음" 표시 확인.

## Out of Scope

- 빠른 감시 설정 패널 (FE #120, BE #237 계약 후)
- 열 설정·내보내기·전체화면
- evaluations 수동 새로고침 버튼
- `buy_readiness` portfolio_id 선택 UI (쿼리 파라미터 생략 고정)
- BE 변경 (계약 불일치 발견 시 보고 후 중단)
