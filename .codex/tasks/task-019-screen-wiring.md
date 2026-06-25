# Codex Handoff Task

## Source Issue

GitHub Issue #48 — 화면별 API 연동 (Dashboard · Watchlist · Portfolio 3화면 부분집합)

## Task Summary

Dashboard, Watchlist, Portfolio 세 화면의 mock import를 제거하고 TanStack Query + 어댑터 계층을 통해 실제 API를 호출하는 구조로 교체한다. BE 출처가 없는 FE 필드는 설계기록의 갭 표 방침에 따라 처리한다.

## Goal

다음이 모두 참이어야 완료다:

1. `DashboardPage.tsx`, `WatchlistPage.tsx`, `PortfolioPage.tsx`에서 `@/shared/mock` import가 없다.
2. 세 화면이 브라우저에서 API 응답 기반으로 렌더링된다 (빈 응답이면 EmptyState 표시).
3. `isPending` 상태에서 Skeleton, `isError`에서 ErrorState가 표시된다.
4. 어댑터 함수에 단위 테스트가 있고 모두 통과한다.
5. `pnpm lint`, `pnpm typecheck`, `TZ=UTC pnpm test`, `pnpm format:check`가 모두 통과한다.

## Background

- **설계기록**: `docs/designs/48-screen-wiring.md` — 갭 표, 파일 목록, 처리 방침 모두 여기 있다. 반드시 먼저 읽어라.
- **API 와이어 계약 단일 출처**: `../project_stock/docs/api/frontend-api-spec.md`
  - Dashboard: `GET /api/v1/dashboard/summary` — `cash_weight`는 문자열 Decimal 0~1, `*_delta` 4개는 항상 `null`
  - Watchlist: `GET /api/v1/watchlists`, `GET /api/v1/watchlists/{id}/items?expand=asset&sort=priority`
  - Portfolio: `GET /api/v1/portfolios`, `GET /api/v1/portfolios/{id}/summary`
- **계약 규약** (`docs/api/contract-alignment.md` §1 C1–C10):
  - 응답은 공통 envelope `{ data, message, error, meta }` — `apiGet`이 이미 언랩한다
  - 금액·비율: 와이어는 문자열 Decimal, 어댑터에서 `parseDecimal` 사용 (`src/shared/lib/format/decimal.ts`)
  - enum: 와이어는 영문 대문자 (`HIGH/MEDIUM/LOW`), 표시 시 `toLabel(riskLevelLabels, ...)` 사용 (`src/shared/lib/format/enumLabel.ts`)
  - datetime: 와이어 UTC, 표시는 KST — `formatKstDate` / `formatKstDateTime` 사용 (`src/shared/lib/format/datetime.ts`)
- **기존 API 클라이언트**: `src/shared/api/client.ts`의 `apiGet(path)`을 사용. path는 `/api/v1/...` 형태.
  - 예시: `apiGet<Dto[]>('/api/v1/watchlists')` — `VITE_API_BASE_URL` prefix는 client가 붙인다.
- **TanStack Query**: `@tanstack/react-query`는 이미 설치되어 있다. `npm install` 불요. import만 하라.
- **공통 UI**: `src/shared/ui/`의 `Skeleton`, `ErrorState`, `EmptyState`를 사용. 네이티브 alert/confirm 금지.
- **ADR-004**: 어댑터 계층 도입 확정. 화면 컴포넌트는 FE 도메인 타입만 본다. DTO 타입은 어댑터 파일 내부에 정의.

## Implementation Scope

아래 파일만 변경하거나 신규 생성할 수 있다:

**신규 생성**:
- `src/app/queryClient.ts` — `QueryClient` 인스턴스 (staleTime 등 기본 설정 포함)
- `src/shared/api/adapters/dashboard.ts` — Dashboard DTO → FE 도메인 어댑터 + 단위 테스트
- `src/shared/api/adapters/watchlist.ts` — Watchlist DTO → FE 도메인 어댑터 + 단위 테스트
- `src/shared/api/adapters/portfolio.ts` — Portfolio DTO → FE 도메인 어댑터 + 단위 테스트
- `src/shared/api/adapters/index.ts` — 어댑터 re-export
- `src/shared/api/hooks/useDashboardSummary.ts`
- `src/shared/api/hooks/useWatchlists.ts`
- `src/shared/api/hooks/useWatchlistItems.ts`
- `src/shared/api/hooks/usePortfolios.ts`
- `src/shared/api/hooks/usePortfolioSummary.ts`
- `src/shared/api/hooks/index.ts`
- 각 어댑터의 테스트 파일 (`adapters/dashboard.test.ts` 등)

**변경**:
- `src/app/App.tsx` — `QueryClientProvider` 추가
- `src/pages/ui/DashboardPage.tsx` — mock import 제거, 훅 사용, 갭 TODO 주석
- `src/pages/ui/WatchlistPage.tsx` — mock import 제거, 훅 사용, 열 제거
- `src/pages/ui/PortfolioPage.tsx` — mock import 제거, 훅 사용, 갭 카드 처리
- 기존 페이지 테스트 파일 (mock import 전제 부분 교체 필요한 경우)

## Out of Scope

다음은 절대 변경하지 않는다:

- `src/shared/mock/` 파일들 — mock은 삭제하지 않는다. 단 세 화면의 import만 제거한다.
- `src/shared/model/domain.ts` — 도메인 타입 변경 없음. 타입이 부족하면 어댑터 내부에 DTO 타입을 정의한다.
- `src/shared/api/client.ts`, `src/shared/api/envelope.ts` — 기존 API 클라이언트 수정 없음
- `src/shared/lib/format/` — 기존 format 함수 수정 없음. 필요한 건 import해서 쓴다.
- SignalsPage, ResearchPage, DecisionLogPage, AlertsPage, LoginPage — 스코프 밖
- 가격 시계열 (G4), Decision Log API (G10) 연동
- 서버 페이징 연결 (Table 컴포넌트 페이지네이션)
- 즐겨찾기 서버 반영, 관심목록 추가·삭제 mutation

## Protected Files

변경 금지:

- `.codex/**`
- `docs/harness/**`
- `docs/decisions/ADR-*.md`
- `docs/failures/**`

## Requirements

**Dashboard**:
- `GET /api/v1/dashboard/summary` 호출 결과로 4개 카드(위험 증가 종목, 중요 뉴스, 검토 시그널, 현금 비중)를 렌더한다.
- `cash_weight`는 `parseDecimal(dto.cash_weight) * 100`으로 퍼센트 변환한다. `null`이면 `"—"` 표시.
- `*_delta` 4개는 API 규격상 항상 `null`이므로 deltaLabel 표시를 숨긴다 (임의 문자열 삽입 금지).
- AiBriefing, PriorityQueueItem, Signal, DecisionLog, 상위 4개 종목 섹션은 mock 유지 + `// TODO #48: [항목명] API 미구현` 주석.

**Watchlist**:
- `GET /api/v1/watchlists` → 첫 번째 그룹 id 추출 → `GET /api/v1/watchlists/{id}/items?expand=asset&page=1&size=20&sort=priority` 호출.
- 목록 응답이 빈 배열이면 EmptyState 표시, items 호출하지 않는다.
- 테이블에서 BE 출처 없는 열(PER, PEG, 상태, 뉴스 위험도, 밸류에이션, 테마 과열, AI 판단, Sparkline)은 제거한다. 남는 열: 종목(symbol/name), 변화(changePercent), 마지막 갱신, 행 메뉴.
- 상단 4개 WatchlistSummaryCard는 `meta.total`을 전체 종목 수로 쓰고 나머지 카드는 mock 유지 + `// TODO #48` 주석. `deltaLabel`은 빈 문자열, `trend`는 `"flat"`.
- 사이드 레일(AI 관찰 메모, 빠른 알림 설정, 새로 추가된 관심종목)은 mock 유지 + `// TODO #48` 주석.
- 즐겨찾기 토글은 로컬 state 유지 (서버 반영 불요).
- 시장 필터는 items에 market 필드가 없으므로 비활성화하거나 "전체"만 표시.

**Portfolio**:
- `GET /api/v1/portfolios` → 첫 번째 포트폴리오 id → `GET /api/v1/portfolios/{id}/summary` 호출.
- 목록이 빈 배열이면 EmptyState.
- 총 자산 카드: `parseDecimal(summary.total_value)`, 현금 비중 카드: `parseDecimal(summary.cash_balance)` / total\_value.
- 일간 손익 SummaryCard는 BE 미지원이므로 렌더하지 않는다 (임의 0 삽입 금지).
- 보유 종목 테이블: symbol, quantity, avgPrice, currentValue(market\_value), weight 열만. 종목명·섹터·일간 변화 열 제거.
- 자산 배분 DonutChart와 섹터 익스포저는 `positions`와 `sector_weights`로 렌더한다. `sector_weights.weight`는 0~1 비율이므로 `* 100` 변환 후 사용.
- AI 브리핑 카드, 리스크 노출 분석 카드는 mock 유지 + `// TODO #48: [항목] API 미구현` 주석.

**공통**:
- `isPending` → `<Skeleton>`, `isError` → `<ErrorState>`. `isError`는 `error.message`를 포함할 수 있으면 포함한다.
- 네이티브 `alert()`/`confirm()` 사용 금지.

## Test Requirements

- 각 어댑터 파일마다 `.test.ts`를 작성한다.
  - `dashboard.test.ts`: `cash_weight: "0.18"` → `cashRatio ≈ 18`, `*_delta: null` → `riskAlertDelta === ""` (또는 null 처리 일관성 확인)
  - `watchlist.test.ts`: expand=asset 픽스처 → `symbol`, `name`, `price`, `changePercent` 변환
  - `portfolio.test.ts`: `total_value: "2056.4"` → `totalValue ≈ 2056.4`, `cash_weight: "0.048..."` → cashRatio 변환, weight `0~1` → `* 100` 변환
- 기존 페이지 테스트가 mock import를 전제로 작성된 경우, mock import 대신 훅을 `vi.mock`으로 교체해 기존 assert 범위를 유지한다.
- 시간 관련 테스트는 `TZ=UTC` 환경에서 실행한다 (아래 검증 명령 참조).

## Verification Commands

아래 명령을 순서대로 실행하여 모두 통과해야 한다:

```bash
pnpm install
pnpm lint
pnpm typecheck
TZ=UTC pnpm test
pnpm format:check
```

`pnpm format`(전체 포맷) 실행 금지. 변경한 파일만 Prettier를 통해 포맷하라:

```bash
npx prettier --write <변경된_파일들>
```

## Documentation Impact

- 이 핸드오프 완료 후 `docs/designs/48-screen-wiring.md`에 "구현 완료" 상태 업데이트는 오케스트레이터가 한다. Codex는 수정하지 않는다.
- `docs/knowledge/frontend-conventions.md`에 TanStack Query 훅 위치 규약이 없으면 추가 검토 대상이지만 이번 핸드오프 스코프 밖이다.

## ADR Need

불필요. TanStack Query 도입은 ADR-004에서 이미 결정됐다. 이 작업은 ADR-004의 구현이다.

## Failure Record Need

불필요. 새로운 실패 패턴이 없다.

## Risk Level

**중간**. 이유: 세 화면 동시 변경이고, BE 출처 없는 필드 처리가 UI 구조에 영향을 준다. 그러나 기존 클라이언트/어댑터 인프라가 있고 변경 범위가 설계기록으로 명확히 경계 지어져 있다.

## Expected Output

- PR: `feat/48-screen-wiring` 브랜치에서 `feat/fe-foundation-setup` 대상으로 생성.
- 변경 파일: `docs/designs/48-screen-wiring.md`에 열거된 신규/변경 파일.
- 검증: `pnpm lint`, `pnpm typecheck`, `TZ=UTC pnpm test`, `pnpm format:check` 통과 결과 첨부.

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
- `pnpm format` 전체 실행 금지 — 변경 파일만 prettier.
- mock 파일(`src/shared/mock/`)은 삭제하지 않는다. 세 화면의 import만 제거한다.
- BE 출처 없는 필드에 임의 더미 값(0, 빈 배열, 임의 문자열)을 삽입하지 않는다. 설계기록의 갭 표 방침(열 제거 / 카드 숨김 / TODO 주석)을 따른다.
