# 설계 기록 — #48 화면별 API 연동 (Track A: Opus)

상태: Draft — Codex 핸드오프 입력. 스코프: Dashboard · Watchlist · Portfolio 3화면.

## 1. 목표

3화면이 `src/shared/mock`을 모듈 레벨에서 직접 import하던 구조를, 실제 API
(`src/shared/api/client.ts`)를 **TanStack Query + 어댑터(DTO→도메인)**로 호출하는 구조로
교체한다. 화면 컴포넌트는 FE 도메인 타입만 본다. 와이어 계약은
`project_stock/docs/api/frontend-api-spec.md`가 단일 출처다.

연동 대상 엔드포인트:

- Dashboard → `GET /dashboard/summary` (Today Brief 4카드만)
- Watchlist → `GET /watchlists` + `GET /watchlists/{id}/items?expand=asset`
- Portfolio → `GET /portfolios` + `GET /portfolios/{id}/summary`

## 2. 공통 구조 결정

- **TanStack Query 도입**: `@tanstack/react-query` 추가. `src/app/App.tsx`의
  `RouterProvider`를 `QueryClientProvider`로 감싼다. `QueryClient`는
  `src/shared/api/queryClient.ts` 팩토리에서 생성(기본 `staleTime` 30s, `retry` 1,
  `refetchOnWindowFocus` false).
- **데이터 레이어 위치**: 화면별 `src/features/<screen>/` 세그먼트 신설. 각 폴더는
  `dto.ts`(와이어 응답 타입) · `adapters.ts`(DTO→도메인 순수 변환) · `queries.ts`
  (query 훅) · `adapters.test.ts`로 구성. 페이지는 query 훅만 import.
- **어댑터 원칙**: 기존 프리미티브 재사용 — `parseDecimal`(문자열 Decimal→number|null),
  `formatKstDateTime`, `toLabel`/`riskLevelLabels`(enum 한글화), `toTablePagination`.
  어댑터는 순수·동기. 봉투 언랩은 `apiGet`이 이미 수행(envelope→`{data,meta}`).
- **상태 처리**: 각 화면의 연동 영역에 `Skeleton`(로딩) · `ErrorState`(에러,
  `error.code`→메시지) · `EmptyState`(빈 결과)를 연결. 기존 `src/shared/ui` 컴포넌트 사용.

## 3. 화면별 매핑과 갭 결정

연동은 **출처가 있는 필드만** 실데이터로 교체하고, BE 출처가 없는 mock 전용 필드는
이번 스코프에서 **mock 유지(연동 제외)**로 명시 분리한다. 새 엔드포인트가 필요한 영역은
#48 범위 밖이다.

### 3.1 Dashboard — `GET /dashboard/summary`

| FE(domain) | 와이어 | 변환 |
| --- | --- | --- |
| `riskAlertCount` | `risk_alert_count:int` | 그대로 |
| `importantNewsCount` | `important_news_count:int` | 그대로 |
| `reviewSignalCount` | `review_signal_count:int` | 그대로 |
| `cashRatio` | `cash_weight:string\|null`(0~1) | `parseDecimal × 100`, null→0 |
| `*Delta` | `*_delta:null`(항상) | **항상 null → 증감 배지 숨김** |

- 연동 영역 = **Today Brief 4카드만**. AI 브리핑·우선확인큐·관심종목 테이블·시그널·최근
  판단기록 섹션은 BE 출처가 없거나 타 화면 소관 → **mock 유지**.
- `cash_weight` null/없음이면 `cashRatio=0`, 도넛은 0 처리. delta null → 델타 텍스트 미표시.

### 3.2 Watchlist — `GET /watchlists` → `GET /watchlists/{id}/items?expand=asset`

- 흐름: 그룹 목록 조회 → **첫 그룹** 선택 → 그 그룹의 items를 `expand=asset`으로 조회.
  (그룹 선택 UI는 스코프 밖; 단일 그룹 표시 MVP.)
- item.asset = `{ symbol, name, price(str Decimal), change_percent(str Decimal), sector? }`.

| FE 표시 행 | 와이어 | 변환 |
| --- | --- | --- |
| symbol/name | `asset.symbol`/`asset.name` | 그대로 |
| price | `asset.price` | `parseDecimal` |
| changePercent | `asset.change_percent` | `parseDecimal` |
| sector | `asset.sector?` | null→`'UNKNOWN'` |
| reason/tags/memo | item.reason/tags/memo | 그대로(보조 표시) |

- **BE 출처 없는 mock 전용 필드(연동 제외, 이번 스코프 mock 유지 또는 행에서 제거)**:
  `Stock.per/peg/status/newsRisk/valuation/aiVerdict/themeHeat/changeSeries`,
  요약 카드(`WatchlistSummaryCard`)·관찰 메모(`WatchlistObservation`)·알림 설정.
  → 연동된 자산 행은 **thin view(symbol/name/price/changePercent/sector)** 로 렌더하고,
  출처 없는 컬럼은 표시에서 제외한다. mock 전용 사이드 패널은 유지하되 주석으로 후속 표기.
- `expand=asset` 미제공 시 `asset` 키 없음(하위호환) → 어댑터는 `asset` 없으면 해당 행 skip.

### 3.3 Portfolio — `GET /portfolios` → `GET /portfolios/{id}/summary`

- 흐름: 포트폴리오 목록 → **첫 포트폴리오** 선택 → summary 조회.
- summary positions = `{ asset_id, quantity, avg_buy_price, cost_value, market_value, weight, exceeds_threshold, ... }`(전부 문자열 Decimal). sector는 **집계(`sector_weights`)에만** 존재.

| FE(domain) | 와이어 | 변환 |
| --- | --- | --- |
| `Portfolio.totalValue` | `total_value` | `parseDecimal` |
| `Portfolio.cash` | `cash_balance` | `parseDecimal` |
| `Holding.quantity/avgPrice/currentValue` | position `quantity`/`avg_buy_price`/`market_value` | `parseDecimal` |
| `Holding.weight`(파생) | position `weight`(0~1) | `× 100` |
| `Holding.symbol/name` | position엔 `asset_id`만 | **`GET /assets/{asset_id}`로 식별 해소** |
| 섹터 익스포저 | `sector_weights[]` | `weight × 100`, sector null→`UNKNOWN` |

- **asset 식별 해소**: position에 symbol/name/sector가 없으므로 각 position의 `asset_id`로
  `GET /assets/{asset_id}`(auth 불요)를 병렬 조회해 symbol/name/sector를 채운다. 실패 시
  해당 행은 `asset_id` 문자열을 fallback 표시.
- **BE 출처 없는 mock 전용(연동 제외)**: `dayChangeValue`/`dayChangePercent`(가격 시계열
  G4 선행 필요), `aiBriefing`, `riskExposures`. → 해당 카드/패널은 mock 유지 + 후속 주석.
  요약 카드 중 일간손익은 출처 없음 → 숨김 또는 mock 표기.

## 4. 신규/변경 파일 (시그니처·책임만)

신규:
- `src/shared/api/queryClient.ts` — `createQueryClient(): QueryClient`.
- `src/features/dashboard/{dto,adapters,queries}.ts` + `adapters.test.ts`
  - `adaptDashboardSummary(dto: DashboardSummaryDto): DashboardSummary`
  - `useDashboardSummary(): UseQueryResult<DashboardSummary>`
- `src/features/watchlist/{dto,adapters,queries}.ts` + `adapters.test.ts`
  - `adaptWatchlistAsset(item: WatchlistItemDto): WatchlistAssetRow | null`
  - `useWatchlistAssets(): UseQueryResult<WatchlistAssetRow[]>` (그룹→items 연쇄)
- `src/features/portfolio/{dto,adapters,queries}.ts` + `adapters.test.ts`
  - `adaptPortfolioSummary(dto, assetsById): PortfolioView`
  - `usePortfolioSummary(): UseQueryResult<PortfolioView>`

변경:
- `src/app/App.tsx` — `QueryClientProvider` 추가.
- `src/pages/ui/DashboardPage.tsx` — Today Brief를 `useDashboardSummary`로, 상태 컴포넌트 연결.
- `src/pages/ui/WatchlistPage.tsx` — 자산 행을 `useWatchlistAssets`로, 상태 컴포넌트 연결.
- `src/pages/ui/PortfolioPage.tsx` — 요약/보유/섹터를 `usePortfolioSummary`로, 상태 컴포넌트 연결.
- `package.json` — `@tanstack/react-query` 의존 추가.

## 5. 테스트

- 각 `adapters.test.ts`: DTO 샘플(spec 예시 값)→도메인 매핑, null/누락/`expand` 미제공 등
  경계. 금액·비율은 `parseDecimal` 경계(빈 문자열·null) 포함. **`TZ=UTC`로 날짜 단언**.
- 기존 페이지 테스트(`*Page.test.tsx`)는 query 훅을 모킹하거나
  `QueryClientProvider` 래퍼로 갱신. 로딩/에러/빈 상태 렌더 1건씩 추가.

## 6. 스코프 밖

- 그룹/포트폴리오 선택 UI(첫 항목 고정), 페이지네이션 UI, mutation(추가/삭제/읽음).
- Signals/Research/Alerts/Settings/DecisionLog 연동(타 이슈·의존 미충족).
- 가격 시계열(G4) 의존 시각화(스파크라인 실데이터화).
- BE 출처 없는 mock 전용 영역의 제거 — 유지하고 후속 주석만.

## 7. 위험·미해결

- Portfolio asset 식별을 위한 `GET /assets/{id}` N회 호출 — position 수 적은 MVP 전제.
  과다 시 후속 batch 필요(BE 확장).
- mock 유지 영역과 실데이터 영역이 한 화면에 공존 → 시각적 일관성 주의(주석으로 경계 명시).
- `VITE_API_BASE_URL` 미설정 시 상대경로 — 데브 프록시/실서버 전제.
