# Codex Handoff Task

## Source Issue

https://github.com/JongEunLee310/project_stock_frontend/issues/117

## Task Summary

관심 종목 페이지 Phase 2 작업이다. BE PR #235(dev 머지 완료)로 확정된 계약을 바탕으로
테이블 상태 배지 컬럼, 위험 필터 드롭다운, 마지막 갱신 컬럼(추가일 대체), 변화(1D)
스파크라인, 요약 카드 전일 대비 델타를 구현하고, PR #118 리뷰 논블로커 3건(S1 중복
aria-label, S4 시장 필터 page 미초기화, S2 isPending 전 행 공유)을 함께 정리한다.

## Goal

- 테이블에 `status` 기반 배지 컬럼이 추가되고, `NORMAL`/`WATCH`/`BUY_CANDIDATE`/
  `RISK_ALERT`/`THESIS_BROKEN`/`SELL_REVIEW`/`OVERHEATED`가 안정/관망/위험 증가 3단계 라벨로
  표시된다.
- 위험 필터 드롭다운이 3단계 라벨 기준으로 클라이언트 필터링을 수행한다.
- `추가일` 컬럼이 `마지막 갱신`으로 대체되고 `asset.reference_at` 값을 표시한다.
  null이면 `—`을 표시한다.
- 변화(1D) 컬럼에 `GET /watchlists/{id}/sparklines`에서 받은 bars 데이터로 미니 스파크라인이
  렌더링된다. 데이터가 없는 행은 `—`을 표시한다.
- 요약 카드에 전일 대비 델타(+N/-N/±0)가 표시된다.
- `FloatingMarketCard`의 중복 `aria-label="시장 요약"`이 제거된다 (S1).
- 시장 필터 변경 시 page가 1로 초기화된다 (S4).
- 관심 해제 mutation 진행 중에 해당 행의 버튼만 disabled가 되고 다른 행은 영향받지 않는다 (S2).
- `pnpm format:check` / `pnpm typecheck` / `pnpm lint` / `pnpm test` 4종 모두 통과한다.

## Background

설계 문서: `docs/designs/117-watchlist-phase2.md` — Decisions·Components·테스트 영향 확정.

구현 전 설계 문서의 Verified Facts를 실제 파일에 대해 검증하고, 불일치하면 보고 후 실계약을
우선한다.

**확인된 BE 계약 리터럴 (출처 명시)**

- `status` 가능 값(전부 대문자 문자열):
  `"NORMAL"`, `"WATCH"`, `"RISK_ALERT"`, `"THESIS_BROKEN"`, `"BUY_CANDIDATE"`, `"SELL_REVIEW"`, `"OVERHEATED"`
  (출처: BE `app/domains/signals/types.py:4-13` — `SignalType(str, Enum)` + `WATCHLIST_STATUS_NORMAL = "NORMAL"`)

- 스파크라인 엔드포인트:
  `GET /api/v1/watchlists/{watchlist_id}/sparklines?range=Literal["1M","3M","6M","1Y"]`
  → `ApiResponse[WatchlistSparklineResponse]`
  — `WatchlistSparklineResponse.items: list[{ symbol: str, bars: list[{ date: str, close: str }] }]`
  — `close`는 문자열임에 주의 (`parseDecimal`로 파싱 필요)
  (출처: BE `docs/designs/233-watchlist-row-enrichment.md` Interfaces · API 절)

- `AssetBriefResponse.reference_at: UtcDatetime | None = None`
  (출처: BE `docs/designs/233-watchlist-row-enrichment.md` Interfaces 절)

**FE 기존 패턴**

- `Sparkline` 컴포넌트: `SparklinePoint.value: number` 입력.
  `import { Sparkline as UiSparkline } from '@/shared/ui'` 패턴으로 이미 `WatchlistPage`에 import됨
  (`src/pages/ui/WatchlistPage.tsx:24`).
- `stockStatusClassNames`: `관망`·`위험 증가` 스타일이 이미 정의되어 있으므로 별도 추가 불필요
  (`src/shared/ui/stockStatus.ts:11-18`).
- `parseDecimal` 유틸: `@/shared/lib/format`에서 import, `adapters.ts`에서 이미 사용 중.
- `useWatchlistSummaryTrends`는 `WatchlistPage`에서 `SummaryVisual`을 통해 이미 호출 중이며,
  trends 시리즈의 마지막 두 값 차이로 델타를 계산한다 (BE 변경 없음).

**테스트 픽스처 주의사항**

- status 리터럴은 반드시 `"NORMAL"`, `"WATCH"` 등 대문자로 사용하고,
  출처 주석 `// app/domains/signals/types.py:4-13`을 기재한다.
- sparklines 응답의 `close` 필드는 `"134.52"` 형식의 문자열이다.

## Implementation Scope

설계 문서의 Components 절을 그대로 따른다.

**수정 파일:**

- `src/features/watchlist/dto.ts`
  — `WatchlistItemAssetDto`에 `reference_at?: string | null` 추가

- `src/features/watchlist/adapters.ts`
  — `WatchlistAssetRow`에서 `createdAt: string` 제거, `status: string`·`referenceAt: string | null` 추가
  — `resolveStatusBadge(status: string): { label: string; className: string }` 추가:
  `NORMAL` → `{ label: '안정', className: stockStatusClassNames['안정'] }`;
  `WATCH`·`BUY_CANDIDATE` → `{ label: '관망', ... }`;
  `RISK_ALERT`·`THESIS_BROKEN`·`SELL_REVIEW`·`OVERHEATED` → `{ label: '위험 증가', ... }`;
  폴백 → `{ label: '안정', ... }`
  — `adaptWatchlistAsset`: `status: item.status`, `referenceAt: item.asset.reference_at ?? null` 추가,
  `createdAt` 제거

- `src/features/watchlist/queries.ts`
  — `useWatchlistSparklines(range: string = '1M'): UseQueryResult<Record<string, number[]>>` 추가:
  queryKey `[...watchlistQueryKey, 'sparklines', range]`,
  `staleTime: 5 * 60 * 1000`,
  첫 번째 관심목록 ID 조회 후 `/watchlists/{id}/sparklines?range={range}` 호출,
  `items`를 `symbol → number[]`(parseDecimal 파싱)로 변환

- `src/pages/ui/WatchlistPage.tsx`
  — `SortKey` 타입에서 `createdAt` 제거, `sortLabels`에서 `createdAt: '추가일'` 제거
  — `sortWatchlistRows`의 `createdAt` 분기 제거
  — 테이블 헤더: `'추가일'` → `'마지막 갱신'`, 상태 배지 컬럼(`'상태'`)·변화(1D) 컬럼(`'변화(1D)'`) 추가
  — `statusFilter: string` state 추가 (기본값 `''`)
  — 위험 필터 드롭다운: `['안정', '관망', '위험 증가']` 고정 옵션, 변경 시 `setPage(1)`
  — `setMarketFilter` 핸들러에 `setPage(1)` 추가 (S4)
  — `removingItemId: number | null` state 추가,
  `onRemove` 핸들러에서 `setRemovingItemId(itemId)` 후 mutation 호출,
  mutation의 `onSettled`에서 `setRemovingItemId(null)`,
  `RowMenu.isRemoving`을 `removingItemId === stock.id`로 변경 (S2)
  — `useWatchlistSparklines()` 호출, 각 행에 스파크라인 데이터 전달
  — `SummaryVisual`에 전일 대비 델타 표시 추가 (배열 길이 2 이상일 때만)
  — `visibleStocks` 필터링에 `statusFilter` 조건 추가

- `src/widgets/FloatingMarketCard.tsx`
  — `<aside aria-label="시장 요약">`에서 `aria-label` 제거 또는 `<div>`로 교체 (S1)

**테스트 파일:**

- `src/features/watchlist/adapters.test.ts`
  — `resolveStatusBadge` 단위 테스트: 7개 status 값 각각 → 3단계 라벨·className 확인.
  픽스처 status 리터럴에 출처 주석 기재.
  — `adaptWatchlistAsset` 갱신: `status`·`referenceAt` 포함, `createdAt` 미포함 확인.

- `src/features/watchlist/queries.test.ts`
  — `useWatchlistSparklines` 단위 테스트:
  정상 응답(2개 종목) → `{ AAPL: [134, 136], NVDA: [450, 460] }` 형태 반환;
  빈 `items` 배열 → `{}` 반환.

- `src/pages/ui/WatchlistPage.test.tsx`
  — `RISK_ALERT` status 행에 `위험 증가` 배지 렌더링 확인.
  — 위험 필터 `위험 증가` 선택 → RISK_ALERT 라벨 행만 표시, 안정/관망 행 미표시.
  — 시장 필터 변경 → page가 1로 초기화 확인 (S4).
  — 삭제 진행 중 해당 행만 disabled, 타 행 버튼 active 확인 (S2).
  — `reference_at` null 행의 `마지막 갱신` 셀에 `—` 렌더링 확인.

- `src/widgets/FloatingMarketCard.test.tsx`
  — S1 수정 후 `getByLabelText('시장 요약')` 단일 셀렉터로 통과 확인.
  (`getAllByLabelText` → `getByLabelText` 복원)

## Out of Scope

- Phase 3 항목 (뉴스·AI 배지, symbol 기반 결정 기록 필터)
- BE 변경 (계약 불일치 발견 시 보고 후 중단)
- `DecisionLogPage` 내 symbol 기반 필터링 (라우트 파라미터 미존재)
- Topbar 변경
- 스파크라인 `range` 파라미터 UI (1M 고정, range select 미추가)
- `useRemoveWatchlistItem` hook 자체 변경 (S2 수정은 `WatchlistPage` state만 변경)

## Protected Files

없음. 보호 파일을 수정하지 않는다.

## Requirements

- `resolveStatusBadge`는 알 수 없는 status 값에 대해 `안정` 레이블과 `status-stable` 클래스를
  반환한다(폴백). 런타임 에러를 발생시켜서는 안 된다.
- 스파크라인 데이터가 없는 종목 셀은 `—`을 표시하고, 빈 배열이어도 에러를 발생시키지 않는다.
  `useWatchlistSparklines` 쿼리 실패 시에도 테이블 렌더링이 중단되지 않는다.
- `reference_at`이 null인 경우 `마지막 갱신` 컬럼에 `—`을 표시한다.
- 요약 카드 델타: trends 배열 길이가 2 미만이거나 null이면 델타를 미표시한다.
- S2: 삭제 mutation 진행 중에 해당 행(`removingItemId === stock.id`)의 관심 해제 버튼만
  `disabled`가 되며, 다른 행의 버튼은 active 상태를 유지한다.
- 시장 필터와 위험 필터는 독립적으로 AND로 적용된다. 두 필터가 모두 설정된 경우 두 조건을
  모두 충족하는 행만 표시된다.
- 기존 테스트를 약화하거나 삭제하지 않는다. 커버리지는 현행 수준 이상을 유지한다.
- `WatchlistItemDto`에 `status: string` 필드가 없다면 `dto.ts`에 추가 후 진행한다.

## Test Requirements

- `resolveStatusBadge`: 7개 BE status 값 → 3단계 FE 라벨 매핑 단위 테스트.
  픽스처 status 리터럴에 출처 주석 `// app/domains/signals/types.py:4-13` 기재.
- `adaptWatchlistAsset`: `status` 전달, `referenceAt` 전달, `createdAt` 미포함 단위 테스트.
- `useWatchlistSparklines`: 정상 응답 → `Record<string, number[]>` 반환, 빈 items → `{}`.
- `WatchlistPage` 상태 배지: `RISK_ALERT` status 행에 `위험 증가` 배지 렌더링 확인.
- `WatchlistPage` 위험 필터: `위험 증가` 선택 → 해당 라벨 행만 표시, 안정/관망 행 미표시.
- `WatchlistPage` 시장 필터 page 초기화: 시장 필터 변경 → page가 1로 초기화 (S4).
- `WatchlistPage` 삭제 isPending 격리: 종목 A 삭제 중 → 종목 A만 disabled, 종목 B 버튼 active (S2).
- `FloatingMarketCard`: S1 수정 후 `getByLabelText('시장 요약')` 단일 셀렉터 통과.

## Verification Commands

- `pnpm format:check`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`

(참고: prettier 미준수 시 개별 파일 대상 `pnpm prettier --write <파일>`로 정리.
repo 전체 `pnpm format`은 샌드박스에서 EPERM 실패 전례가 있다.)

## Documentation Impact

- `docs/designs/117-watchlist-phase2.md` — 구현 완료 후 Status를 `Implemented`로 갱신한다.

## ADR Need

불필요. 기존 BE 계약 활용이고 신규 외부 의존성이 없다.

## Failure Record Need

불필요.

## Risk Level

Medium — `WatchlistAssetRow.createdAt` 제거로 기존 테스트 픽스처 갱신 범위가 있다.
스파크라인 배치 조회와 items 조회가 별도 생명주기를 가져 로딩 상태 처리가 복잡해지며,
스파크라인 쿼리 오류 시 테이블 렌더링이 중단되지 않도록 주의가 필요하다.

## Expected Output

- 변경·신규 파일 목록 보고
- 검증 4종 실행 결과 보고
- BE 계약 대조 결과 보고 (특히 status 값 대소문자, sparklines 응답 형태, close 타입 확인)
- `WatchlistItemDto.status` 필드 존재 여부 확인 결과 보고
- 가정·잔여 위험 보고

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
- `main` 브랜치의 최신 커밋을 기반으로 `feat/117-watchlist-phase2` 브랜치를 생성해
  작업한다. PR은 `main`을 대상으로 한다.
- 커밋하지 않는다 (커밋은 오케스트레이터가 별도 지시한다).
- BE 계약 불일치 발견 시 중단하고 보고한다.
