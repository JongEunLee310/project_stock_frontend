# Codex Handoff Task

## Source Issue

JongEunLee310/project_stock_frontend#48 — [계약정렬] 화면별 API 연동 (§4). 본 핸드오프는
**Dashboard·Watchlist·Portfolio 3화면만** 다룬다(실험 스코프). 설계기록:
`docs/designs/48-screen-wiring.md`.

## Task Summary

3화면을 `src/shared/mock` 직접 import에서 실제 API(`src/shared/api/client.ts`) 기반
TanStack Query + 어댑터(DTO→도메인) 연동으로 교체한다.

## Goal

완료 시 참:

- `@tanstack/react-query`가 추가되고 `App.tsx`가 `QueryClientProvider`로 감싸진다.
- Dashboard의 Today Brief 4카드가 `GET /dashboard/summary` 응답으로 렌더된다.
- Watchlist의 자산 행이 `GET /watchlists` + `/watchlists/{id}/items?expand=asset`로 렌더된다.
- Portfolio의 요약·보유·섹터가 `GET /portfolios` + `/portfolios/{id}/summary`로 렌더된다.
- 각 연동 영역에 로딩(`Skeleton`)·에러(`ErrorState`)·빈(`EmptyState`) 상태가 연결된다.
- `pnpm lint && pnpm typecheck && pnpm test && pnpm format:check`가 모두 통과한다.

## Background

- 와이어 계약 단일 출처: `project_stock/docs/api/frontend-api-spec.md`. 응답은 공통 envelope
  `{data,message,error,meta}`이며 `apiGet`(`src/shared/api/client.ts`)이 언랩해 `{data,meta}`
  반환. 인증 헤더·401 lazy refresh는 client가 처리(`auth` 기본 true).
- 금액·비율은 **문자열 Decimal**(`"195.64"`, `cash_weight`는 0~1). enum은 영문 UPPER_SNAKE.
  datetime은 와이어 UTC / 표시 KST.
- 재사용 프리미티브(`src/shared/lib/format`): `parseDecimal(str)→number|null`,
  `formatMoney`, `formatPercent`, `formatKstDate(Time)`, `toLabel`/`riskLevelLabels`.
  페이징: `src/shared/api/paging.ts`의 `toTablePagination`.
- 상태 컴포넌트는 `src/shared/ui`의 `Skeleton`·`ErrorState`·`EmptyState` 사용.
- **도메인 갭(중요)**: 일부 mock 필드는 BE 출처가 없다. 설계기록 §3의 갭 표를 그대로 따른다.
  출처 없는 영역은 **연동하지 말고 mock 유지 + 후속 주석**으로 남긴다.

## Implementation Scope

설계기록 §4 파일 목록을 따른다. 신규:

- `src/shared/api/queryClient.ts` — `createQueryClient()`(staleTime 30s, retry 1, refetchOnWindowFocus false).
- `src/features/dashboard/{dto,adapters,queries}.ts` + `adapters.test.ts`.
- `src/features/watchlist/{dto,adapters,queries}.ts` + `adapters.test.ts`.
- `src/features/portfolio/{dto,adapters,queries}.ts` + `adapters.test.ts`.

변경:

- `src/app/App.tsx`(QueryClientProvider 추가), 3개 `*Page.tsx`(query 훅 연결 + 상태 처리),
  `package.json`(@tanstack/react-query), 필요 시 해당 `*Page.test.tsx`(query 래퍼/모킹 갱신).

매핑·갭 처리:

- **Dashboard**: Today Brief 4카드만 연동. `cash_weight`(0~1 str|null)→`cashRatio`(`parseDecimal×100`,
  null→0). `*_delta`는 항상 null → 증감 텍스트/배지 숨김. 나머지 섹션 mock 유지.
- **Watchlist**: 그룹 목록→**첫 그룹**→items `expand=asset`. asset 행은 thin view
  (symbol/name/price/changePercent/sector). `asset` 키 없는 item은 skip. sector null→`UNKNOWN`.
  per/peg/status/aiVerdict 등 출처 없는 컬럼은 표시 제외, mock 사이드 패널은 유지.
- **Portfolio**: 목록→**첫 포트폴리오**→summary. `total_value`/`cash_balance`/position 필드
  `parseDecimal`. `weight`(0~1)→`×100`. position엔 asset_id만 있으므로 `GET /assets/{asset_id}`
  (auth 불요) 병렬 조회로 symbol/name/sector 해소(실패 시 asset_id fallback). `sector_weights`로
  섹터 익스포저. dayChange·aiBriefing·riskExposures는 출처 없음 → mock 유지/숨김.

## Out of Scope

- Signals/Research/Alerts/Settings/DecisionLog 연동, mutation(추가/삭제/읽음).
- 그룹·포트폴리오 선택 UI(첫 항목 고정), 페이지네이션 UI, 가격 시계열(G4) 시각화 실데이터화.
- BE 출처 없는 mock 전용 영역의 삭제(유지·주석만). 도메인 타입(`src/shared/model`) 구조 변경.
- 어댑터/포맷 프리미티브(`src/shared/lib/format`, `src/shared/api/*`) 시그니처 변경.

## Protected Files

없음(`.codex/**`, `docs/harness/**`, ADR/FAILURE 수정 금지).

## Requirements

- 화면 컴포넌트는 FE 도메인/뷰 타입만 본다(DTO snake_case 직접 노출 금지).
- 어댑터는 순수·동기. fetch/엔벨로프 언랩은 query 훅·client 경계에서만.
- 네이티브 다이얼로그(alert/confirm) 금지. 인앱 상태 컴포넌트 사용.
- 출처 없는 필드를 임의 더미값으로 채우지 말 것 — 숨기거나 mock 유지 + 주석.

## Test Requirements

- 각 `adapters.test.ts`: spec 예시 DTO→도메인 매핑, null/누락/`expand` 미제공/빈 목록 경계,
  `parseDecimal` 빈 문자열·null 경계. 날짜 단언은 **`TZ=UTC`**.
- 3개 `*Page.test.tsx`는 query 훅 모킹 또는 `QueryClientProvider` 래퍼로 통과시키고,
  로딩/에러/빈 상태 렌더를 최소 1건씩 검증.
- 기존 테스트 회귀 없음.

## Verification Commands

```
pnpm install
pnpm lint
pnpm typecheck
TZ=UTC pnpm test
pnpm format:check
```

`pnpm format` 전체 실행 금지(전 repo 리포맷 노이즈). 포맷이 필요하면 **변경 파일만** prettier.

## Documentation Impact

`docs/designs/48-screen-wiring.md`(본 설계, 갱신 불요). 신규 ADR/spec 변경 없음(연동만).

## ADR Need

불요 — 아키텍처 결정(어댑터 계층·TanStack Query 채택)은 ADR-004에서 이미 확정. 본 작업은 그 적용.

## Failure Record Need

불요 — 예견된 구현 작업.

## Risk Level

Medium — 신규 라이브러리(TanStack Query) 도입 + provider 변경 + 다수 페이지·테스트 수정.
범위는 3화면으로 한정.

## Expected Output

설계기록 §4의 신규/변경 파일. 모든 검증 명령 통과. 가정·미해결(특히 출처 없는 필드 처리)
보고.

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
