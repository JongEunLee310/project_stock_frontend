# 50 · DashboardPage 잔여 mock 실데이터 연동

상태: Draft — Codex 핸드오프 입력
스코프: DashboardPage 3개 섹션(Top Signals·Recent Decision Logs·Stocks 테이블) mock → 실 API 전환

## 1. 목표 / 스코프

`src/pages/ui/DashboardPage.tsx`는 `useDashboardSummary`(`/dashboard/summary`)로 Today
Brief 4개 KPI만 실데이터에 연결된 상태다. 나머지 3개 섹션(`mockSignals`/`mockDecisionLogs`/
`mockStocks`)은 모두 모듈 최상위에서 mock을 직접 slice·sort하는 방식으로 렌더된다.

이 작업은 이미 구축된 피처 훅(`useSignals`, `useDecisionLogs`, `useWatchlistAssets`)을
DashboardPage에 연결하고, 구 mock 도메인 타입과 신 어댑터 타입 간 렌더 갭을 해소한다.

**스코프 밖**

- Priority Queue(`mockPriorityQueue`)·AI Briefing(`mockAiBriefing`) — BE 엔드포인트 없음,
  mock 유지 + `/* TODO: BE 엔드포인트 없음 — mock 유지 */` 주석 명시
- 신규 BE 엔드포인트 요구 금지 — 기존 `/signals`, `/decision-logs`, `/watchlists` 재사용
- Today Brief(KPI) 섹션 변경 없음
- 피처 훅(`useSignals` 등) 내부 수정 없음 — DashboardPage 렌더 레이어만 변경
- `src/shared/model/domain.ts` 도메인 타입 구조 변경 없음
- 페이지네이션, infinite scroll, WebSocket

---

## 2. 연동 결정 표

| Dashboard 섹션 | 현재 상태 | BE 소스 | 처리 |
|---|---|---|---|
| Top Signals | `mockSignals` slice·sort | `GET /signals?expand=asset` (재사용 `useSignals()`) | 실연동 |
| Recent Decision Logs | `mockDecisionLogs` sort·slice | `GET /decision-logs` (재사용 `useDecisionLogs()`) | 실연동 |
| Stocks 테이블 | `mockStocks` slice | `GET /watchlists` + `/watchlists/{id}/items` (재사용 `useWatchlistAssets()`) | 실연동 |
| Priority Queue | `mockPriorityQueue` sort | 없음 | mock 유지 + 주석 |
| AI Briefing | `mockAiBriefing` | 없음 | mock 유지 + 주석 |

---

## 3. 섹션별 갭 결정

### 3.1 Top Signals

`useSignals()`가 반환하는 `Signal`(`src/features/signals/adapters.ts`)과 기존
`DashboardPage`의 `SignalCard`가 참조하는 필드가 전면 불일치한다.

**DashboardPage SignalCard 참조 필드 전수 확인 결과**

| 구 Signal 필드 (mock 기준) | 신 Signal 필드 (어댑터 반환) | 처리 방식 |
|---|---|---|
| `signal.status: StockStatus` | 없음 | `signal.riskLevel`(한글)로 대체. 색상 클래스 매핑 재정의 (`'높음'`→rose, `'중간'`→blue, 기타→amber) |
| `signal.confidence: number` | `signal.score: number` | 필드명 교체. `{signal.score}%` 렌더 |
| `signal.reasons: string[]` | `signal.reason: string` (단수) | `[signal.reason]` 단일 원소 배열로 래핑 후 기존 ul/li 유지 |
| `signal.priority: number` (정렬키) | 없음 | `createdAt` 내림차순 정렬 후 상위 3개 |
| `signal.symbol` | `signal.symbol` | 동일 |
| `signal.id` | `signal.id` | 동일 |

**폐기 필드** (신 타입에 없음, DashboardPage 렌더에서 제거)

| 필드 | 처리 |
|---|---|
| `signal.kind` | 폐기. `signalType`은 DashboardPage 미사용 |
| `signal.trendSeries` | 폐기. SignalCard에 sparkline UI 없음 |
| `signal.previousStatus`, `signal.previousConfidence` | 폐기 |
| `signal.oneMonthChangePercent` | 폐기 |

**정렬 변경**: 모듈 최상위 `const topSignals = [...mockSignals].sort(...priority...)` →
훅 결과 `signals?.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3)`
(createdAt은 어댑터에서 KST 문자열로 변환됨; 정렬은 ISO 원문이 필요하면 `useSignals`가 반환하는
`createdAt` 포맷을 확인 후 조정)

**렌더 전환 방향**: SignalCard 컴포넌트 자체는 유지. props 타입을 `Signal`(feature)으로 교체하고
내부 필드 참조 3곳(`status`→`riskLevel`, `confidence`→`score`, `reasons`→`[reason]`) 수정.
Badge 컴포넌트에는 현재 `status` prop을 전달 중이므로 `riskLevel` 문자열을 그대로 전달하거나
별도 처리 방식은 Badge 컴포넌트 현행 구현에 맞게 결정(렌더 레이어에서 해결, Badge 수정 없음이
원칙).

### 3.2 Recent Decision Logs

`useDecisionLogs()`가 반환하는 `DecisionLog`(`src/features/decision-log/adapters.ts`)과
`decisionColumns`의 참조 필드를 대조한다.

**DashboardPage decisionColumns 참조 필드 전수 확인 결과**

| 구 DecisionLog 필드 (domain.ts 기준) | 신 DecisionLog 필드 (어댑터 반환) | 처리 방식 |
|---|---|---|
| `log.createdAt: string` | `log.createdAt: string` (KST 포맷 완료) | 동일. `formatDateTime` 중복 적용 주의 — 어댑터가 이미 KST 변환했으므로 DashboardPage의 `dateTimeFormatter.format(new Date(log.createdAt))`는 파싱 실패 가능. 어댑터 출력 포맷 확인 후 `log.createdAt` 직접 표시로 단순화 필요 |
| `log.symbol: string` | `log.symbol: string` | 동일 |
| `log.decisionType: DecisionType` | `log.decisionType: string` (한글 라벨) | 동일 의미, Badge 전달 방식 유지 |
| `log.decision: string` (요약 텍스트) | 없음 | `log.rationale: string`(= BE `reason`)으로 필드명 교체. 어댑터 추가 수정 불요 |

**폐기 필드** (DashboardPage가 참조하지 않으므로 영향 없음)

`outcome`, `reviewDate`, `cognitiveRisks` — `decisionColumns`에 없으므로 이미 무해.

**정렬**: 모듈 최상위 `recentDecisionLogs = [...mockDecisionLogs].sort(...)` →
훅 결과 `decisionLogs?.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3)`

**`createdAt` 포맷 확인 필요**: 어댑터의 `formatKstDateTime` 출력이 `new Date(value)` 파싱
가능한 형태가 아닐 수 있음. "요약" 시간 셀은 어댑터 출력 문자열을 그대로 표시하는 방식으로
변경(`dateTimeFormatter.format(new Date(...))` 제거).

### 3.3 Stocks 테이블

`useWatchlistAssets()`가 반환하는 `WatchlistAssetRow`(`src/features/watchlist/adapters.ts`)와
기존 `stockColumns: TableColumn<Stock>[]`의 참조 필드를 대조한다.

**DashboardPage stockColumns 참조 필드 전수 확인 결과**

| 구 Stock 필드 | WatchlistAssetRow 필드 | 처리 방식 |
|---|---|---|
| `stock.symbol`, `stock.name` | `row.symbol`, `row.name` | 동일 |
| `stock.changePercent: number` | `row.changePercent: number \| null` | null → `"—"` fallback 추가 |
| `stock.status: StockStatus` | 없음 | **컬럼 삭제** — BE에서 제공하지 않음 |
| `stock.changeSeries: number[]` (sparkline) | 없음 | **컬럼 재정의** — 핵심 지표 컬럼 삭제 |
| `stock.per: number`, `stock.peg: number` | 없음 | **컬럼 재정의** — PER/PEG 제거 |
| `dashboardStatusBySymbol` 하드코딩 맵 | 해당 없음 | 제거 |

**재정의 후 stockColumns (3컬럼)**

| 컬럼 | 표시 필드 | 비고 |
|---|---|---|
| 종목 | `row.symbol` + `row.name` + 링크 | 동일 구조 유지 |
| 가격 | `row.price: number \| null` | null → `"—"` |
| 변화(1D) | `row.changePercent: number \| null` | null → `"—"`, 색상 클래스 조건 null 처리 추가 |

`StockSparkline` 컴포넌트와 `StockIdentity` 컴포넌트 중 `StockIdentity`는 재사용. `StockSparkline`은
이 페이지에서 사용하지 않게 됨(다른 곳 참조 없으면 해당 함수 제거 또는 주석 유지).

---

## 4. 신규/변경 파일

신규 파일 없음. 피처 훅은 이미 구축됨.

**`src/pages/ui/DashboardPage.tsx`** — 이 파일만 변경

변경 항목 (시그니처·책임):

- import 교체:
  - `Signal` from `@/shared/model` 제거 → `Signal` from `@/features/signals/adapters`
  - `DecisionLog` from `@/shared/model` 제거 → `DecisionLog` from `@/features/decision-log/adapters`
  - `Stock` from `@/shared/model` 제거 → `WatchlistAssetRow` from `@/features/watchlist/adapters`
  - `mockSignals`, `mockDecisionLogs`, `mockStocks` import 제거
  - `useSignals` from `@/features/signals/queries` 추가
  - `useDecisionLogs` from `@/features/decision-log/queries` 추가
  - `useWatchlistAssets` from `@/features/watchlist/queries` 추가

- 제거:
  - 모듈 최상위 `const dashboardStocks`, `const topSignals`, `const recentDecisionLogs` 상수 (훅 호출로 대체)
  - `dashboardStatusBySymbol` 하드코딩 맵
  - `StockStatus` import

- `DashboardPage()` 함수 내 훅 추가:
  - `const signalsQuery = useSignals()` — 책임: `/signals?expand=asset` 조회
  - `const decisionLogsQuery = useDecisionLogs()` — 책임: `/decision-logs` 조회
  - `const watchlistQuery = useWatchlistAssets()` — 책임: watchlist 첫 번째 목록 + items 조합

- 각 섹션 렌더 분기 추가 (Skeleton/ErrorState/EmptyState 패턴, Today Brief와 동일 구조):
  - Signals 섹션: `signalsQuery.isLoading` → Skeleton, `signalsQuery.isError` → ErrorState, 데이터 있을 때 상위 3개 렌더
  - Decision Logs 섹션: `decisionLogsQuery.isLoading/isError/data` 3분기
  - Stocks 섹션: `watchlistQuery.isLoading/isError/data` 3분기

- `SignalCard` props 타입: `{ signal: Signal }` (feature Signal로 교체), 내부 참조 수정
  - `signal.status` → `signal.riskLevel`
  - `signal.confidence` → `signal.score`
  - `signal.reasons` → `[signal.reason]`

- `stockColumns`: `TableColumn<WatchlistAssetRow>[]` 재정의 (3컬럼)

- `decisionColumns`: `TableColumn<DecisionLog>[]`(feature 타입)로 교체, `log.decision` → `log.rationale`

---

## 5. 테스트 계획

### `src/pages/ui/DashboardPage.test.tsx`

기존 테스트는 `useDashboardSummary`만 `vi.mock`하고 나머지 3개 섹션은 실제 mock 상수를 그대로
사용한다. 훅 연동 후 3개 훅도 모킹이 필요하다.

**추가 mock 선언**

```
vi.mock('@/features/signals/queries', () => ({ useSignals: () => signalsQueryState }))
vi.mock('@/features/decision-log/queries', () => ({ useDecisionLogs: () => decisionLogsQueryState }))
vi.mock('@/features/watchlist/queries', () => ({ useWatchlistAssets: () => watchlistQueryState }))
```

각 `*QueryState`는 `beforeEach`에서 feature 어댑터 타입 기준 fixture로 초기화. 날짜 단언은
`TZ=UTC`.

**변경 대상 단언**

| 기존 테스트 케이스 | 변경 내용 |
|---|---|
| `renders watchlist status with research links and PER/PEG metrics` | 테스트명 변경. `within(table).getByText('60.3')`, `within(table).getByText('1.32')`, `within(table).getByText('관망')` 단언 제거. 대신 `WatchlistAssetRow` fixture 기준 `price`, `changePercent` 단언으로 교체 |
| `renders top signals with confidence values` | signal fixture를 `Signal`(feature 타입) 기준으로 교체. `'86%'`→`score` fixture값, `signal.status` 기반 aria-label 유지 여부 확인 필요 (`aria-label={signal.symbol + ' 대시보드 시그널'}` — symbol은 그대로라 영향 없음). 색상 클래스 단언이 있다면 `riskLevel` 기준으로 교체 |
| `renders recent decision logs with symbols and decision types` | `log.decision` 기반 "요약" 단언 → `log.rationale` fixture값으로 교체. `'보유 유지'`, `'매도 검토'` 단언은 `decisionType`이 한글 라벨로 그대로 제공되므로 fixture 일치 시 유지 가능 |

**로딩/에러/빈 상태 테스트 추가** (각 섹션 1케이스씩)

- Signals Skeleton 렌더 확인, ErrorState 텍스트, EmptyState 텍스트
- Decision Logs: 동일 패턴
- Stocks: 동일 패턴

---

## 6. 위험·미해결

- **`createdAt` 이중 포맷**: `useDecisionLogs` 어댑터가 반환하는 `createdAt`은 이미 `formatKstDateTime` 적용된 한글 표기 문자열이다. DashboardPage의 `dateTimeFormatter.format(new Date(log.createdAt))`은 이 포맷을 재파싱하므로 실패할 수 있다. 구현 전 어댑터 출력값 확인 후 DashboardPage 시간 포맷 셀을 `log.createdAt` 직접 표시로 단순화 여부를 결정한다. `useSignals` createdAt도 동일 검토 필요.

- **`score` 범위 불일치**: `Signal.score`는 `parseDecimal(dto.score)`의 결과로 BE 값에 따라 0~1 범위일 수 있다. DashboardPage는 `{signal.score}%`로 렌더하므로 0~1 범위면 시각적으로 의미 없는 값이 표시된다. BE `score` 컬럼의 실제 범위를 확인하고 0~1이면 `Math.round(score * 100)`으로 변환하는 뷰 레벨 처리를 추가한다.

- **Badge 컴포넌트 호환성**: 기존 SignalCard는 `<Badge status={signal.status}>` 형태로 `StockStatus` 값을 전달한다. 신 타입에서는 `riskLevel` 한글 문자열(`'높음'`/`'중간'`/`'낮음'`/`'미지정'`)을 전달하게 된다. Badge 컴포넌트가 `riskLevel` prop을 지원하는지, 또는 `status` prop에 임의 문자열을 넣어도 fallback 렌더되는지 확인 후 결정한다.

- **`useWatchlistAssets` 빈 watchlist 케이스**: 사용자 watchlist가 없으면 첫 번째 watchlist가 없어 빈 배열을 반환한다. Stocks 섹션의 EmptyState 처리로 이미 커버되나, "워치리스트를 먼저 생성하세요" 안내 문구가 필요한지는 UX 결정 사항.

- **상위 3개 signals 정렬 기준**: `createdAt` 내림차순(최신 시그널 우선)이 기본 제안이나, BE가 `score`(신뢰도) 내림차순을 더 자연스러운 Dashboard 순서로 볼 수 있다. `score` 범위 확인 후 정렬 기준을 최종 결정한다.

- **테스트의 `aria-label` 의존성**: `renders top signals with confidence values`는 `getByRole('article', { name: 'NVDA 대시보드 시그널' })` 셀렉터를 사용한다. `aria-label={signal.symbol + ' 대시보드 시그널'}` 형태이므로 symbol이 fixture에 있으면 유지된다. fixture에 symbol을 포함해야 한다.
