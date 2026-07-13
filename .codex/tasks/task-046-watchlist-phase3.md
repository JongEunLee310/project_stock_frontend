# Codex Handoff Task

## Source Issue

https://github.com/JongEunLee310/project_stock_frontend/issues/117

## Task Summary

관심 종목 페이지 Phase 3 작업이다. BE evaluations 엔드포인트(`GET /watchlists/{id}/evaluations`)와
summary의 `buy_readiness` 필드(이미 BE dev에 머지됨)를 소비해 테이블에 평가 배지 4종 컬럼
(뉴스 위험도·밸류에이션·테마 과열·AI 판단)을 추가하고, 요약 카드를 2장에서 4장(기존 2장 +
"추가 리서치 필요"·"신규 매수 여력")으로 확장해 이슈 #117을 완결한다.

## Goal

- 테이블에 뉴스 위험도·밸류에이션·테마 과열·AI 판단 4종 배지 컬럼이 추가된다.
  각 배지는 `GET /watchlists/{id}/evaluations`의 응답을 symbol로 매핑해 렌더링된다.
- evaluations 응답이 LLM 기반으로 느리므로 로딩 중에는 배지 셀에 Skeleton을 표시하고,
  실패하거나 map에 해당 symbol이 없으면 셀에 `—`을 표시한다. 이 두 경우 모두 테이블 전체
  렌더링이 중단되지 않는다.
- 요약 카드 "추가 리서치 필요"에 evaluations의 `needs_research_count`가 표시된다.
- 요약 카드 "신규 매수 여력"에 summary의 `buy_readiness.level_label`과 `message`가 표시된다.
  `buy_readiness`가 null이면 "포트폴리오 없음" 안내를 표시한다.
- `corepack pnpm format:check` / `corepack pnpm typecheck` / `corepack pnpm lint` /
  `corepack pnpm test` 4종 모두 통과한다.

## Background

설계 문서: `docs/designs/117-watchlist-phase3.md` — Verified Facts·Decisions·Components·테스트
영향 확정.

구현 전 설계 문서의 Verified Facts를 실제 파일에 대해 검증하고, 불일치하면 보고 후
실계약을 우선한다.

**확인된 BE 계약 리터럴 (출처 명시)**

- evaluations 엔드포인트: `GET /api/v1/watchlists/{id}/evaluations`
  → `ApiResponse[WatchlistEvaluationsResponse]`
  - `items[*].news_risk`: `"HIGH"` / `"MEDIUM"` / `"LOW"`
    (출처: BE `app/domains/watchlists/types.py`)
  - `items[*].valuation_burden`: `"HIGH"` / `"MODERATE"` / `"LOW"`
    (출처: BE `app/domains/watchlists/types.py`)
  - `items[*].theme_heat`: `"OVERHEATED"` / `"NEUTRAL"` / `"COLD"`
    (출처: BE `app/domains/watchlists/types.py`)
  - `items[*].ai_judgment`: `"RISK_INCREASING"` / `"WATCH"` / `"STABLE"`
    (출처: BE `app/domains/watchlists/types.py`)
  - LLM 기반 응답, 무효 enum 항목은 skip → items에 없는 symbol은 FE에서 `—` 처리
- summary 엔드포인트: `GET /api/v1/watchlists/{id}/summary`에 추가된
  `buy_readiness: BuyReadinessProjection | null`
  - `level`: `"SUFFICIENT"` / `"LIMITED"` / `"RESTRICTED"`
  - `level_label`: 한국어 문자열 (예: `"충분"`, `"제한적"`, `"불가"`)
  - `cash_weight`: decimal (문자열로 반환, `parseDecimal`로 파싱)
  - `buy_candidate_count`: int
  - `message`: 한국어 투자 판단 문장
  - 포트폴리오 없으면 null 반환

**FE 기존 패턴**

- `resolveStatusBadge(status: string): { label: string; className: string }` 패턴
  (`src/features/watchlist/adapters.ts:43-64`)을 4종 resolver에 그대로 적용한다.
- `useWatchlistSparklines`의 자기 해결(self-resolving) 패턴 (`queries.ts:122-149`) — 훅 내부에서
  `/watchlists?page=1&size=20`으로 watchlistId를 조회한다. `useWatchlistEvaluations`도
  동일하게 구현한다.
- `parseDecimal` 유틸: `@/shared/lib/format`에서 import, `adapters.ts`에서 이미 사용 중.
- 테스트는 MSW 없이 `vi.mock('@/features/watchlist/queries', ...)` 모듈 전체를 mock한다
  (`WatchlistPage.test.tsx:294-317`). MSW 핸들러 파일은 존재하지 않으므로 별도 갱신 지점 없음.
- `queries.test.tsx`는 `vi.mock('@/shared/api/client', ...)` 직접 mock 패턴 사용 — 새
  `useWatchlistEvaluations` 테스트도 동일 패턴으로 작성한다.

**테스트 픽스처 주의사항**

- evaluations enum 리터럴은 반드시 대문자 원문 그대로 사용하고
  출처 주석 `// app/domains/watchlists/types.py`를 기재한다.
- `cash_weight`는 decimal 문자열임에 주의 (`"0.25"` 형식, `parseDecimal`로 파싱).

## Implementation Scope

설계 문서 `docs/designs/117-watchlist-phase3.md`의 Components 절을 그대로 따른다.

**수정 파일:**

- `src/features/watchlist/dto.ts`
  — `WatchlistItemEvaluationDto` 추가: `symbol`, `news_risk`, `valuation_burden`,
  `theme_heat`, `ai_judgment` (모두 `string`)
  — `WatchlistEvaluationsResponseDto` 추가: `items: WatchlistItemEvaluationDto[]`,
  `needs_research_count: number`, `generated_at: string`
  — `BuyReadinessDto` 추가: `level: string`, `level_label: string`, `cash_weight: string`,
  `buy_candidate_count: number`, `message: string`
  — `WatchlistSummaryDto`에 `buy_readiness?: BuyReadinessDto | null` 추가

- `src/features/watchlist/adapters.ts`
  — `WatchlistEvaluationRow` 인터페이스 추가:
  `symbol: string`, `newsRisk: string`, `valuationBurden: string`, `themeHeat: string`,
  `aiJudgment: string`
  — `WatchlistEvaluationMap` type alias 추가: `Record<string, WatchlistEvaluationRow>`
  — `BuyReadinessView` 인터페이스 추가:
  `level: string`, `levelLabel: string`, `cashWeight: number`, `buyCandidateCount: number`,
  `message: string`
  — `WatchlistSummaryView`에 `buyReadiness: BuyReadinessView | null` 추가
  — `resolveNewsRiskBadge(value: string): { label: string; className: string }` 추가:
  `HIGH` → `{ label: '높음', className: ... }` (위험 색상);
  `MEDIUM` → `{ label: '중간', ... }` (경고 색상);
  `LOW` → `{ label: '낮음', ... }` (안전 색상);
  폴백 → `{ label: '중간', ... }` (중립 색상)
  — `resolveValuationBadge(value: string)` 추가:
  `HIGH` → `'고평가'`(위험); `MODERATE` → `'적정'`(중립); `LOW` → `'저평가'`(안전);
  폴백 → `'적정'`(중립)
  — `resolveThemeHeatBadge(value: string)` 추가:
  `OVERHEATED` → `'과열'`(위험); `NEUTRAL` → `'중립'`(중립); `COLD` → `'냉각'`(안전);
  폴백 → `'중립'`(중립)
  — `resolveAiJudgmentBadge(value: string)` 추가:
  `RISK_INCREASING` → `'위험 증가'`(위험); `WATCH` → `'관망'`(경고);
  `STABLE` → `'안정'`(안전); 폴백 → `'안정'`(안전)
  — `adaptWatchlistEvaluations(dto: WatchlistEvaluationsResponseDto): { map: WatchlistEvaluationMap; needsResearchCount: number }` 추가:
  `items`를 `symbol` 키로 reduce해 map 생성, `needs_research_count` 전달
  — `adaptBuyReadiness(dto: BuyReadinessDto): BuyReadinessView` 추가:
  camelCase 변환 + `cash_weight`는 `parseDecimal`로 파싱 (null이면 0으로 fallback)
  — `adaptWatchlistSummary` 수정:
  `buyReadiness: dto.buy_readiness ? adaptBuyReadiness(dto.buy_readiness) : null` 추가

- `src/features/watchlist/queries.ts`
  — `WatchlistEvaluationsResult` 타입 추가:
  `{ map: WatchlistEvaluationMap; needsResearchCount: number }`
  — `useWatchlistEvaluations(): UseQueryResult<WatchlistEvaluationsResult>` 추가:
  queryKey `[...watchlistQueryKey, 'evaluations']`,
  staleTime `10 * 60 * 1000`,
  첫 번째 관심목록 ID 조회 후 `GET /watchlists/{id}/evaluations` 호출,
  `adaptWatchlistEvaluations`로 변환
  — `emptyWatchlistSummary`에 `buyReadiness: null` 추가

- `src/pages/ui/WatchlistPage.tsx`
  — `useWatchlistEvaluations` import 추가
  — `watchlistEvaluationsQuery` 호출 추가
  — 테이블 헤더 배열에 `'뉴스 위험도'`, `'밸류에이션'`, `'테마 과열'`, `'AI 판단'` 추가
  (`'상태'` 바로 뒤, 목업 순서)
  — 각 행(stock)에 4개 배지 셀 추가:
  `watchlistEvaluationsQuery.isLoading` → Skeleton,
  `evaluationRow` 없거나 isError → `—`,
  정상 → `resolveNewsRiskBadge`·`resolveValuationBadge`·`resolveThemeHeatBadge`·
  `resolveAiJudgmentBadge` 결과로 배지 렌더링
  — `colSpan={8}` → `colSpan={12}` 갱신
  — 카드 그리드 className: `md:grid-cols-2` → `md:grid-cols-2 xl:grid-cols-4`
  — `summaryIconClassNames`·`summaryIcons` 배열에 Card 2·3 항목 추가
  — Card 2("추가 리서치 필요") 렌더링 추가:
  값 자리에 `watchlistEvaluationsQuery.data?.needsResearchCount ?? 0`,
  isLoading → Skeleton, isError → `—`
  — Card 3("신규 매수 여력") 렌더링 추가:
  `summary.buyReadiness` 존재 시 `levelLabel`을 대형 텍스트, `message`를 보조 문구로 표시;
  null 시 `"포트폴리오 없음"` 표시
  — `summary` fallback 객체에 `buyReadiness: null` 추가

**테스트 파일:**

- `src/features/watchlist/adapters.test.ts`
  — `resolveNewsRiskBadge` 단위 테스트: `"HIGH"`/`"MEDIUM"`/`"LOW"`/폴백 → 라벨·className 확인.
  픽스처 리터럴에 출처 주석 `// app/domains/watchlists/types.py` 기재.
  — `resolveValuationBadge`, `resolveThemeHeatBadge`, `resolveAiJudgmentBadge` 각각 동일 구조.
  — `adaptWatchlistEvaluations`:
  2개 종목 items → 각 symbol이 map 키에 존재 확인;
  items에 없는 symbol이 map에 없음 확인;
  `needsResearchCount` 값 전달 확인.
  — `adaptWatchlistSummary`:
  `buy_readiness` 객체 있는 경우 `buyReadiness` 필드 포함 확인;
  `buy_readiness: null`인 경우 `buyReadiness: null` 확인.

- `src/features/watchlist/queries.test.tsx`
  — `useWatchlistEvaluations`:
  정상 응답(2개 종목) → `map`에 두 symbol 존재, `needsResearchCount` 일치 확인;
  빈 `items` → `map: {}`, `needsResearchCount: 0` 확인.
  `apiGet` mock 패턴은 기존 `useWatchlistSparklines` 테스트와 동일하게 작성.

- `src/pages/ui/WatchlistPage.test.tsx`
  — `watchlistEvaluationsQueryState` 변수 추가:
  ```
  {
    data: {
      map: {
        NVDA: {
          symbol: 'NVDA',
          newsRisk: 'HIGH',       // app/domains/watchlists/types.py
          valuationBurden: 'HIGH', // app/domains/watchlists/types.py
          themeHeat: 'OVERHEATED', // app/domains/watchlists/types.py
          aiJudgment: 'RISK_INCREASING', // app/domains/watchlists/types.py
        },
        AAPL: {
          symbol: 'AAPL',
          newsRisk: 'LOW',
          valuationBurden: 'MODERATE',
          themeHeat: 'NEUTRAL',
          aiJudgment: 'STABLE',
        },
      },
      needsResearchCount: 2,
    },
    isLoading: false,
    isError: false,
    error: null,
  }
  ```
  — `vi.mock('@/features/watchlist/queries', ...)` 블록에
  `useWatchlistEvaluations: () => watchlistEvaluationsQueryState` 추가.
  — 배지 렌더링: NVDA 행에 `높음` 배지 표시 확인 (news_risk HIGH → 높음).
  — 로딩 중: `isLoading: true` 시 기존 items 컬럼은 정상, 배지 셀에만 Skeleton 표시 확인.
  — 실패: `isError: true`, `data: undefined` 시 배지 셀 `—` 표시, 테이블 렌더링 유지 확인.
  — symbol 누락: map에 없는 TSLA 행 배지 셀 `—` 표시 확인.
  — "추가 리서치 필요" 카드: `needsResearchCount: 2` → 카드에 `2` 표시 확인.
  — "신규 매수 여력" 카드: `buyReadiness.levelLabel: '제한적'`·`message` 표시 확인.
  — "신규 매수 여력" 카드 null: `watchlistSummaryQueryState.data.buyReadiness = null` 시
  "포트폴리오 없음" 표시 확인.
  — `watchlistSummaryQueryState.data`에 `buyReadiness` 필드 추가:
  ```
  buyReadiness: {
    level: 'LIMITED',       // app/domains/watchlists/types.py
    levelLabel: '제한적',
    cashWeight: 0.12,
    buyCandidateCount: 1,
    message: '현금 비중이 낮아 신규 매수 여력이 제한적입니다.',
  }
  ```

## Out of Scope

- 빠른 감시 설정 패널 (FE #120, BE #237 계약 후)
- 열 설정·내보내기·전체화면
- evaluations 수동 새로고침 버튼
- `buy_readiness` portfolio_id 선택 UI (쿼리 파라미터 생략 고정)
- BE 변경 (계약 불일치 발견 시 보고 후 중단)

## Protected Files

없음. 보호 파일을 수정하지 않는다.

## Requirements

- 4종 badge resolver는 알 수 없는 enum 값에 대해 폴백 라벨과 className을 반환한다.
  런타임 에러를 발생시키지 않는다.
- evaluations 쿼리 실패 또는 symbol 누락 시 해당 셀만 `—`을 표시하며, 테이블 전체 렌더링이
  중단되지 않는다.
- evaluations 로딩 중에는 배지 셀에만 Skeleton을 표시하며, 기존 상태·현재가·변화율 등
  items 기반 컬럼은 정상 렌더링을 유지한다.
- "신규 매수 여력" 카드에서 `buy_readiness`가 null이면 "포트폴리오 없음" 안내를 표시한다.
- 기존 테스트를 약화하거나 삭제하지 않는다. 커버리지는 현행 수준 이상을 유지한다.
- `emptyWatchlistSummary`에 `buyReadiness: null` 추가가 누락되면 TypeScript 컴파일 에러가
  발생한다. 반드시 포함한다.

## Test Requirements

- `resolveNewsRiskBadge`/`resolveValuationBadge`/`resolveThemeHeatBadge`/`resolveAiJudgmentBadge`:
  각 enum 가능 값 전체 + 폴백 → 라벨·className 매핑 단위 테스트.
  픽스처 리터럴에 출처 주석 `// app/domains/watchlists/types.py` 기재.
- `adaptWatchlistEvaluations`: symbol 매핑, needsResearchCount 전달, map miss 확인.
- `adaptWatchlistSummary`: `buyReadiness` 포함/null 두 케이스.
- `useWatchlistEvaluations`: 정상 응답 → map+count 반환, 빈 items → empty map.
- `WatchlistPage` 배지 렌더링: NVDA `news_risk: 'HIGH'` 행에 `높음` 배지 표시.
- `WatchlistPage` evaluations 로딩 중: 배지 셀 Skeleton, 기존 컬럼 정상.
- `WatchlistPage` evaluations 실패: 배지 셀 `—`, 테이블 유지.
- `WatchlistPage` "추가 리서치 필요" 카드: `needsResearchCount` 값 표시.
- `WatchlistPage` "신규 매수 여력" 카드: `levelLabel`·`message` 표시 / null → 안내 표시.

## Verification Commands

- `corepack pnpm format:check`
- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `corepack pnpm test`

(prettier 미준수 시 해당 파일만 `corepack pnpm prettier --write <파일>`로 정리.
repo 전체 `pnpm format`은 샌드박스에서 EPERM 실패 전례가 있다.)

## Documentation Impact

- `docs/designs/117-watchlist-phase3.md` — 구현 완료 후 Status를 `Implemented`로 갱신한다.

## ADR Need

불필요. 기존 BE 계약 소비이며 신규 외부 의존성이 없다.

## Failure Record Need

불필요.

## Risk Level

Medium — evaluations 쿼리는 LLM 기반 지연이 있으며, 로딩 중 기존 테이블 렌더링 유지를
보장하는 조건 분기가 필요하다. `WatchlistSummaryView`에 `buyReadiness` 필드 추가로
기존 테스트 픽스처 갱신 범위가 발생한다.

## Expected Output

- 변경·신규 파일 목록 보고
- 검증 4종 실행 결과 보고
- BE 계약 대조 결과 보고 (특히 enum 값 대소문자, `buy_readiness` 필드 구조, `cash_weight` 타입 확인)
- 가정·잔여 위험 보고

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
- 현재 브랜치 `feat/117-watchlist-phase3`에서 작업한다. 새 브랜치를 생성하지 않는다.
- 커밋하지 않는다 (커밋은 오케스트레이터가 별도 지시한다).
- BE 계약 불일치 발견 시 중단하고 보고한다.
