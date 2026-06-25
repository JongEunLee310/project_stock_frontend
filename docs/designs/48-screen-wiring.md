# 설계기록 #48 — Dashboard · Watchlist · Portfolio API 연동

상태: **초안** — 핸드오프 task-019 입력용.

이 문서는 현재 `src/shared/mock`을 모듈 수준에서 직접 import하는 세 화면(Dashboard,
Watchlist, Portfolio)을 실제 API 호출 구조로 교체하는 변경의 형태를 기술한다.

---

## 1. 목표

- 세 화면의 mock import를 제거하고 TanStack Query 기반 서버 상태로 교체한다.
- API DTO(snake\_case, 문자열 Decimal, 영문 enum) ↔ FE 표시 값 변환을 어댑터 함수로 처리한다.
- BE 출처가 없는 FE 도메인 필드는 임의 더미값 없이 처리 방침(아래 갭 표)을 따른다.
- 기존 `src/shared/api/client.ts`의 `apiGet` + `VITE_API_BASE_URL` 경로 규약을 그대로 사용한다.

---

## 2. 공통 구조

### 2.1 TanStack Query 도입 위치

`src/app/App.tsx`에 `QueryClientProvider`와 `QueryClient`를 추가한다.
`QueryClient` 인스턴스는 `src/app/queryClient.ts`에서 생성·export한다.

```
src/app/queryClient.ts  — QueryClient 생성 (staleTime, retry 설정)
src/app/App.tsx         — QueryClientProvider 주입 (기존 AuthProvider 내측)
```

### 2.2 레이어 구조

```
페이지 컴포넌트
  └─ 쿼리 훅  (src/shared/api/hooks/)
       └─ apiGet  (src/shared/api/client.ts)
       └─ 어댑터  (src/shared/api/adapters/)
```

- **쿼리 훅**: `useQuery`를 래핑. DTO 페치 + 어댑터 호출 후 FE 도메인 값 반환.
- **어댑터**: 순수 함수. DTO → FE 도메인 변환만 담당, 네트워크 없음.
- **페이지 컴포넌트**: `isPending`/`isError`/`data` 분기 처리. Skeleton·ErrorState·EmptyState 공통 컴포넌트 사용.

### 2.3 상태 처리 원칙

| 상태 | 처리 |
| --- | --- |
| `isPending` | `<Skeleton>` 컴포넌트로 로딩 자리 표시 |
| `isError` | `<ErrorState>` 컴포넌트 표시 |
| 데이터 없음(빈 배열) | `<EmptyState>` 컴포넌트 표시 |

---

## 3. Dashboard 화면

### 3.1 호출 API

| API | 경로 | Auth |
| --- | --- | --- |
| 대시보드 집계 | `GET /api/v1/dashboard/summary` | Required |

### 3.2 DTO → FE 도메인 매핑 및 갭 표

`DashboardSummaryDto` (BE 응답 `data` 객체):

| DTO 필드 | 타입 | FE `DashboardSummary` 필드 | 처리 |
| --- | --- | --- | --- |
| `risk_alert_count` | `number` | `riskAlertCount` | 직접 매핑 |
| `important_news_count` | `number` | `importantNewsCount` | 직접 매핑 |
| `review_signal_count` | `number` | `reviewSignalCount` | 직접 매핑 |
| `cash_weight` | `string \| null` | `cashRatio` | `parseDecimal` → `* 100` (퍼센트) |
| `risk_alert_delta` | `null` (항상) | `riskAlertDelta` | `null`이면 빈 문자열 → 배지 숨김 |
| `important_news_delta` | `null` (항상) | `importantNewsDelta` | 위와 동일 |
| `review_signal_delta` | `null` (항상) | `reviewSignalDelta` | 위와 동일 |
| `cash_weight_delta` | `null` (항상) | `cashRatioDelta` | 위와 동일 |

**BE 출처 없는 FE 항목 (Dashboard)**:

| FE 항목 | 처리 방침 |
| --- | --- |
| `AiBriefing` (AI 브리핑 섹션) | mock 유지 + 컴포넌트 상단에 `// TODO #48: AI briefing API 미구현` 주석 |
| `PriorityQueueItem[]` (우선 확인 큐) | mock 유지 + 동일 주석 |
| `Signal[]` 시그널 카드 | mock 유지 + 동일 주석 |
| `DecisionLog[]` 최근 판단 기록 | mock 유지 + 동일 주석 (G10 BE 신규 예정) |
| `Stock[]` 관심 종목 상태 테이블 상위 4개 | Watchlist 훅 재사용 가능하면 사용, 없으면 mock 유지 + 주석 |

`*_delta` 4개는 API 규격상 히스토리 스냅샷 전까지 항상 `null`이므로 deltaLabel을 숨기거나 빈 문자열로 처리한다. 임의 문자열 삽입 금지.

---

## 4. Watchlist 화면

### 4.1 호출 API (순서)

| 단계 | API | 경로 | Auth |
| --- | --- | --- | --- |
| 1 | 관심목록 그룹 목록 | `GET /api/v1/watchlists?page=1&size=20` | Required |
| 2 | 첫 번째 그룹 아이템 | `GET /api/v1/watchlists/{id}/items?expand=asset&page=1&size=20&sort=priority` | Required |

호출 전략: 목록 조회 후 `data[0].id`를 사용해 아이템 조회. 목록이 비어있으면 EmptyState 표시.

### 4.2 DTO → FE 도메인 매핑 및 갭 표

`WatchlistItemWithAssetDto` (expand=asset 시):

| DTO 필드 | FE 표시용 필드 | 처리 |
| --- | --- | --- |
| `asset.symbol` | `stock.symbol` | 직접 매핑 |
| `asset.name` | `stock.name` | 직접 매핑 |
| `asset.price` | `stock.price` | `parseDecimal` |
| `asset.change_percent` | `stock.changePercent` | `parseDecimal` |
| `asset.sector` | `stock.sector` | 직접 매핑 (없으면 `"UNKNOWN"`) |
| `created_at` | `stock.lastUpdatedAt` | ISO 8601 문자열 그대로, 표시 시 KST |

**BE 출처 없는 FE `Stock` 필드 (Watchlist)**:

| 필드 | 처리 방침 |
| --- | --- |
| `per`, `peg` | 테이블 열에서 제거 (BE 미지원). `assets/{id}/detail`은 이번 스코프 밖 |
| `status` | 열에서 제거 또는 `"—"` 표시. BE `risk_level` 매핑 데이터 없음 |
| `newsRisk` | 열에서 제거 |
| `valuation` | 열에서 제거 |
| `themeHeat` | 열에서 제거 |
| `aiVerdict` | 열에서 제거 |
| `changeSeries` | Sparkline 열 제거. 가격 시계열 API(G4) 미구현 |
| `isFavorite` | 즐겨찾기 토글 UI 그대로 유지하되 상태는 로컬 state로 관리 (BE 연동은 다음 이슈) |
| `market` | `asset` 응답에 없음 → 필터 드롭다운 비활성 또는 "전체"만 표시 |

**WatchlistSummaryCard[]** (상단 4개 카드):
BE 집계 API 없음. 아이템 목록에서 FE가 카운트를 파생 계산한다(`total` meta 값 활용). `deltaLabel`은 빈 문자열로 고정, `trend`는 `"flat"`으로 고정.

**사이드 레일 (AI 관찰 메모, 빠른 알림 설정, 새로 추가된 관심종목)**:
모두 BE 출처 없음 → mock 유지 + `// TODO #48` 주석 처리.

---

## 5. Portfolio 화면

### 5.1 호출 API (순서)

| 단계 | API | 경로 | Auth |
| --- | --- | --- | --- |
| 1 | 포트폴리오 목록 | `GET /api/v1/portfolios?page=1&size=20` | Required |
| 2 | 첫 번째 포트폴리오 요약 | `GET /api/v1/portfolios/{id}/summary` | Required |

### 5.2 DTO → FE 도메인 매핑 및 갭 표

`PortfolioSummaryDto`:

| DTO 필드 | FE `Portfolio` 필드 | 처리 |
| --- | --- | --- |
| `total_value` | `totalValue` (표시용) | `parseDecimal` |
| `cash_balance` | `cash` | `parseDecimal` |
| `positions[].asset_id` | `holding.assetId` | 정수 |
| `positions[].quantity` | `holding.quantity` | `parseDecimal` → 정수 또는 소수 |
| `positions[].avg_buy_price` | `holding.avgPrice` | `parseDecimal` |
| `positions[].cost_value` | `holding.costValue` | `parseDecimal` |
| `positions[].market_value` | `holding.currentValue` | `parseDecimal` |
| `positions[].weight` | `holding.weight` | `parseDecimal → * 100` (퍼센트) |
| `sector_weights[].sector` | 섹터 익스포저 | 직접 사용 |
| `sector_weights[].weight` | 섹터 비중 | `parseDecimal → * 100` |
| `has_sector_concentration` | 집중도 경고 뱃지 표시 | boolean |

**BE 출처 없는 FE `Portfolio`/`Holding` 필드 (Portfolio)**:

| 필드 | 처리 방침 |
| --- | --- |
| `holding.name` | 테이블 "종목명" 열: `asset_id` 숫자 표시 또는 열 제거. `GET /assets/{id}` 개별 조회는 이번 스코프 밖 |
| `holding.sector` | `sector_weights`의 sector 정보는 있으나 position별 sector 없음 → 테이블 "섹터" 열 제거 |
| `holding.dailyChangePercent` | BE 미지원 → "일간 변화" 열 제거 |
| `portfolio.dayChangeValue` | BE 미지원 → "일간 손익" SummaryCard 숨김 |
| `portfolio.dayChangePercent` | BE 미지원 → 위와 동일 |
| `portfolio.aiBriefing` | BE 미지원 → AI 브리핑 카드 mock 유지 + `// TODO #48` 주석 |
| `portfolio.riskExposures` | BE 미지원 → 리스크 노출 분석 카드 mock 유지 + `// TODO #48` 주석 |

"일간 손익" SummaryCard를 숨길 때, 4-card 그리드는 3-card 레이아웃으로 축소하거나
해당 카드를 `null` 렌더로 처리한다. 임의 0 값 삽입 금지.

---

## 6. 신규/변경 파일 목록

| 파일 | 신규/변경 | 책임 |
| --- | --- | --- |
| `src/app/queryClient.ts` | 신규 | `QueryClient` 인스턴스 생성 및 export |
| `src/app/App.tsx` | 변경 | `QueryClientProvider` 주입 |
| `src/shared/api/adapters/dashboard.ts` | 신규 | `DashboardSummaryDto → DashboardSummary` 어댑터 |
| `src/shared/api/adapters/watchlist.ts` | 신규 | `WatchlistDto[]`, `WatchlistItemDto[] → Stock[]` 어댑터 |
| `src/shared/api/adapters/portfolio.ts` | 신규 | `PortfolioSummaryDto → Portfolio` 어댑터 |
| `src/shared/api/adapters/index.ts` | 신규 | 어댑터 re-export |
| `src/shared/api/hooks/useDashboardSummary.ts` | 신규 | `useQuery` + dashboard 어댑터 |
| `src/shared/api/hooks/useWatchlists.ts` | 신규 | `useQuery` + watchlists 목록 |
| `src/shared/api/hooks/useWatchlistItems.ts` | 신규 | `useQuery(watchlistId)` + items 어댑터 |
| `src/shared/api/hooks/usePortfolios.ts` | 신규 | `useQuery` + portfolios 목록 |
| `src/shared/api/hooks/usePortfolioSummary.ts` | 신규 | `useQuery(portfolioId)` + portfolio 어댑터 |
| `src/shared/api/hooks/index.ts` | 신규 | 훅 re-export |
| `src/pages/ui/DashboardPage.tsx` | 변경 | mock import 제거, 훅 사용, 갭 처리 주석 |
| `src/pages/ui/WatchlistPage.tsx` | 변경 | mock import 제거, 훅 사용, 갭 열 제거 |
| `src/pages/ui/PortfolioPage.tsx` | 변경 | mock import 제거, 훅 사용, 갭 카드 숨김 |

`src/shared/api/adapters/index.ts`와 `hooks/index.ts`는 선택적이나 작성을 권장.

---

## 7. 테스트 방침

- 어댑터 함수는 단위 테스트를 작성한다 (`*.test.ts`). 입력: DTO 픽스처, 검증: 변환 결과 형태.
- 쿼리 훅은 `msw` 없이 어댑터가 커버하므로 훅 테스트는 이번 스코프 밖.
- 기존 페이지 컴포넌트 테스트(`DashboardPage.test.tsx` 등)가 mock import를 전제로 작성된 경우 API 훅을 vi.mock으로 교체한다.

---

## 8. 스코프 밖

- Dashboard 외 화면의 AiBriefing, Signal, DecisionLog, PriorityQueue API 연동
- Watchlist 아이템 추가·삭제·즐겨찾기 서버 반영
- Portfolio 보유 종목명·섹터 enrichment (`GET /assets/{id}` 개별 조회)
- 가격 시계열 API (G4) — 미구현
- Decision Log API (G10) — BE 신규 예정
- 서버 페이징 연결 (Table 컴포넌트 서버 페이지네이션)
- SignalsPage, ResearchPage, DecisionLogPage, AlertsPage 연동

---

## 9. 위험

| 위험 | 내용 |
| --- | --- |
| 포트폴리오 없음 | `/portfolios` 응답이 빈 배열이면 summary를 호출할 수 없다. EmptyState로 처리한다. |
| 관심목록 없음 | `/watchlists` 응답이 빈 배열이면 items 호출 없이 EmptyState 표시. |
| `cash_weight` null | Dashboard `cashRatio`는 `null` 허용. 표시 시 `"—"` fallback. |
| Watchlist 테이블 열 제거 | 기존 테스트가 열 헤더를 assert하면 실패한다. 테스트 업데이트 필요. |
| PortfolioPage 구조 변경 | `dayChangeValue`/`dayChangePercent` 제거로 `PortfolioPageView` props 시그니처가 변경될 수 있다. |
