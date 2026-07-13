# 설계 기록 — #48 화면별 API 연동 잔여 5화면 (Track B: VFF)

상태: Draft — Codex 핸드오프 입력. 스코프: Signals · Research · Alerts · Settings · DecisionLog 5화면.

## 1. 목표

Dashboard·Watchlist·Portfolio 3화면 연동(task-018) 이후, 나머지 5화면이 `src/shared/mock`을
직접 import하는 구조를 실제 API(`src/shared/api/client.ts`)를 **TanStack Query + 어댑터
(DTO→도메인)**로 호출하는 구조로 교체한다. 화면 컴포넌트는 FE 도메인 타입만 본다.

연동 대상 엔드포인트:

- Signals → `GET /signals?asset_id=`, `GET /signals/{id}`, `GET /stocks/{symbol}/prices`(G4)
- Research → `GET /assets?symbol=`(G6), `GET /assets/{id}/detail`·`/research-summary`·`/buy-checklist`,
  `GET /reports?asset_id=`, `GET /theses/latest`, `GET /stocks/{symbol}/prices`(G4)
- Alerts → `GET /alerts`(+read/dismiss), `GET /alert-candidates`(+read/confirm)
- Settings → `GET /auth/me`
- DecisionLog → `GET·POST /decision-logs`(G10 BE 신규 예정, 완료 전까지 로컬 임시)

## 2. 공통 구조 결정

task-018에서 확립한 구조를 그대로 이어받는다.

- **TanStack Query·QueryClientProvider**: `src/shared/api/queryClient.ts` + `src/app/App.tsx`
  래퍼는 이미 존재. 추가 설치 없음.
- **데이터 레이어 위치**: 화면별 `src/features/<screen>/` 세그먼트. 각 폴더에
  `dto.ts`·`adapters.ts`·`queries.ts`·`adapters.test.ts` 동일 구성.
- **어댑터 원칙**: `parseDecimal`·`formatKstDateTime`·`toLabel`/`riskLevelLabels`/
  `alertStatusLabels` 재사용. 어댑터는 순수·동기. 봉투 언랩은 `apiGet`/`apiPost`가 처리.
- **mutation 처리**: Alerts의 read/dismiss/confirm, DecisionLog의 POST는 `useMutation` 훅으로
  처리하되 optimistic update 없이 서버 응답 후 해당 쿼리 무효화(`queryClient.invalidateQueries`).
- **상태 처리**: `Skeleton`·`ErrorState`·`EmptyState`(`src/shared/ui`) 동일 방식.
- **API 경로 규칙**: 경로는 RELATIVE(`/signals`, `/auth/me`). `apiGet`이 `VITE_API_BASE_URL`
  (이미 `/api/v1` 포함)에 접합. `/api/v1` 접두사 중복 금지.

## 3. 화면별 매핑과 갭 결정

연동은 **출처가 있는 필드만** 실데이터로 교체. BE 출처가 없는 필드는 mock 유지 + 후속 주석.

### 3.1 Signals — `GET /signals?asset_id=`, `GET /signals/{id}`, `GET /stocks/{symbol}/prices`

**도메인 갭 — G9 Signal 모델 교체**: FE 기존 `Signal` 타입(`kind/confidence/trendSeries/
previousStatus`)을 BE 계약 필드(`signal_type/score/risk_level/reason/evidence/expires_at`)로
교체. 모멘텀 `trendSeries`는 BE 직접 제공 없음 → `GET /stocks/{symbol}/prices`(G4)의
최근 구간으로 대체.

**스파크라인 symbol 해소**: Signal에는 `asset_id`와 `symbol`(asset join 필드, 또는 별도 조회)이
있어야 한다. BE 응답에 `asset.symbol`이 없으면 signal의 `asset_id`로 `GET /assets/{id}`를
호출해 symbol을 얻고, 이 symbol로 `GET /stocks/{symbol}/prices?range=1mo&interval=1d`를
호출해 sparkline 시계열을 생성한다. G4 API가 미완성(BE 선행 필요)인 경우 sparkline은 빈
배열로 처리하고 이를 주석으로 명시한다.

| FE(domain)   | 와이어                                  | 변환                       |
| ------------ | --------------------------------------- | -------------------------- |
| `signalType` | `signal_type: string(UPPER_SNAKE)`      | 그대로(표시는 toLabel)     |
| `score`      | `score: string(Decimal)`                | `parseDecimal`             |
| `riskLevel`  | `risk_level: string`                    | `riskLevelLabels`로 한글화 |
| `reason`     | `reason: string`                        | 그대로                     |
| `evidence`   | `evidence: string \| null`              | null 허용                  |
| `expiresAt`  | `expires_at: string(UTC ISO)`           | `formatKstDateTime`        |
| `sparkline`  | G4 `/stocks/{symbol}/prices` close 배열 | 빈 배열 fallback(G4 선행)  |

- BE 출처 없는 mock 전용 필드(연동 제외): `confidence`(게이지) → `score`로 대체.
  `previousStatus` 델타 → 폐기. `kind` 분류 → `signalType`으로 대체.

### 3.2 Research — symbol → assetId 해소(G6) + 다중 엔드포인트 조합

**도메인 갭 — G6 symbol→asset_id 해소**: `/research/:symbol` 라우트에서 symbol을 받으므로
진입 시 `GET /assets?symbol={symbol}`로 `asset_id`를 먼저 확보한다. 이후 모든 후속 조회에
`asset_id`를 사용한다. `GET /assets?symbol=` 미지원(BE G6 미완)이면 Research 화면 전체가
의존 실패 — 어댑터에 `symbolNotFound` 에러 경로를 명시하고 `ErrorState`로 처리한다.

**다중 쿼리 조합**: `asset_id` 확보 후 4개 쿼리를 병렬 실행
(`detail`, `research-summary`, `buy-checklist`, `reports?asset_id=`). `theses/latest`는
단독 쿼리(전체 최신 가설). 가격 스파크라인은 symbol 기준 G4 경로.

| FE(domain)                | 와이어                     | 변환                               |
| ------------------------- | -------------------------- | ---------------------------------- |
| `assetId`                 | `id: int`(assets 응답)     | 그대로                             |
| `per/peg/52w/targetPrice` | `detail` nullable 확장(G7) | `parseDecimal`, null 허용          |
| `researchSummary.*`       | `research-summary` 응답    | snake_case→camelCase, Decimal 파싱 |
| `buyChecklist`            | `buy-checklist` 응답       | 그대로(구조 유지)                  |
| `reports`                 | `reports?asset_id=` 목록   | `created_at`→`formatKstDateTime`   |
| `latestThesis`            | `theses/latest`            | `created_at`→`formatKstDateTime`   |
| `priceSparkline`          | G4 close 배열              | 빈 배열 fallback(G4 선행)          |

- BE 출처 없는 mock 전용 필드: `catalysts`(G7 후속), `pricePoints`(G4 선행). mock 유지 + 주석.

### 3.3 Alerts — 인박스 모델 재정의(G8)

**도메인 갭 — G8 AlertRule 폐기·인박스 재정의**: 기존 FE `AlertRule`(규칙 빌더·채널 설정)을
**완전 폐기**하고 BE 인박스 모델로 교체. 두 목록 탭: `Alert`(시스템 생성 알림, read/dismiss
가능)과 `AlertCandidate`(확인 대기 항목, read/confirm 가능).

**mutation 설계**: read/dismiss/confirm은 모두 POST mutation. 성공 시 각 목록 쿼리 무효화
(`['alerts']`, `['alert-candidates']`). 실패 시 `ErrorState` 토스트 표시(네이티브 alert 금지).

| FE(domain)                  | 와이어                                             | 변환                       |
| --------------------------- | -------------------------------------------------- | -------------------------- |
| `alertStatus`               | `status: UNREAD \| READ \| DISMISSED`              | `alertStatusLabels` 한글화 |
| `createdAt`                 | `created_at: string(UTC ISO)`                      | `formatKstDateTime`        |
| `candidateStatus`           | `status: UNREAD \| READ \| CONFIRMED`              | toLabel 매핑               |
| `alertType / candidateType` | `alert_type / candidate_type: string(UPPER_SNAKE)` | toLabel                    |

- BE 출처 없는 mock 전용 필드: 규칙 빌더·채널 설정 일체 → 폐기(컴포넌트도 삭제 또는 빈 컴포넌트로 대체).

### 3.4 Settings — `GET /auth/me`

**단순 프로필 조회**: G11로 알림 설정 API는 불요. `auth/me` 응답의 계정 정보만 표시.

| FE(domain)  | 와이어                        | 변환                |
| ----------- | ----------------------------- | ------------------- |
| `email`     | `email: string`               | 그대로              |
| `username`  | `username: string`            | 그대로              |
| `createdAt` | `created_at: string(UTC ISO)` | `formatKstDateTime` |

- 알림 설정 UI는 규칙 빌더 폐기(G8/G11)에 따라 이번 스코프에서 제거(또는 빈 섹션 주석).

### 3.5 DecisionLog — `GET·POST /decision-logs`(G10, BE 선행 전제)

**BE 미완 전략**: G10 BE 엔드포인트가 완성되지 않은 경우 FE는 클라이언트 로컬 임시 상태
(`useState`)를 유지하고 실API 호출 경로를 별도 `queries.ts`에 구현하되 `enabled: false`로
비활성화한다. BE 완성 후 `enabled` 조건만 제거하면 연동된다.

**POST**: 새 의사결정 생성은 `useMutation`으로 `apiPost('/decision-logs', body)`. 성공 시
`['decision-logs']` 쿼리 무효화.

| FE(domain)       | 와이어(N1 확정)                               | 변환                |
| ---------------- | --------------------------------------------- | ------------------- |
| `decisionType`   | `decision_type: string(UPPER_SNAKE)` — 10종   | toLabel             |
| `decisionStatus` | `decision_status: OPEN \| REVIEWED \| CLOSED` | toLabel             |
| `createdBy`      | `created_by: USER \| AI \| SYSTEM`            | toLabel             |
| `cognitiveRisks` | `cognitive_risks: string[] \| null`           | 그대로              |
| `createdAt`      | `created_at: string(UTC ISO)`                 | `formatKstDateTime` |

## 4. 신규/변경 파일 (시그니처·책임만)

신규:

- `src/features/signals/{dto,adapters,queries}.ts` + `adapters.test.ts`
  - `SignalDto`, `PriceBarDto`, `SignalDetailDto`
  - `adaptSignal(dto: SignalDto, sparkline: number[]): Signal`
  - `useSignals(assetId?: number): UseQueryResult<Signal[]>`
  - `useSignalDetail(id: number): UseQueryResult<Signal>`
  - `useSignalSparkline(symbol: string | null): UseQueryResult<number[]>`
- `src/features/research/{dto,adapters,queries}.ts` + `adapters.test.ts`
  - `AssetLookupDto`, `AssetDetailDto`, `ResearchSummaryDto`, `BuyChecklistDto`,
    `ReportDto`, `ThesisDto`
  - `adaptResearchDetail(detail: AssetDetailDto, summary: ResearchSummaryDto, checklist: BuyChecklistDto, reports: ReportDto[], thesis: ThesisDto | null, sparkline: number[]): ResearchView`
  - `useAssetIdBySymbol(symbol: string): UseQueryResult<number>`
  - `useResearchView(symbol: string): UseQueryResult<ResearchView>`
- `src/features/alerts/{dto,adapters,queries}.ts` + `adapters.test.ts`
  - `AlertDto`, `AlertCandidateDto`
  - `adaptAlert(dto: AlertDto): Alert`
  - `adaptAlertCandidate(dto: AlertCandidateDto): AlertCandidate`
  - `useAlerts(): UseQueryResult<Alert[]>`
  - `useAlertCandidates(): UseQueryResult<AlertCandidate[]>`
  - `useReadAlert(id: number): UseMutationResult`
  - `useDismissAlert(id: number): UseMutationResult`
  - `useReadCandidate(id: number): UseMutationResult`
  - `useConfirmCandidate(id: number): UseMutationResult`
- `src/features/settings/{dto,adapters,queries}.ts` + `adapters.test.ts`
  - `MeDto`
  - `adaptMe(dto: MeDto): UserProfile`
  - `useMe(): UseQueryResult<UserProfile>`
- `src/features/decision-log/{dto,adapters,queries}.ts` + `adapters.test.ts`
  - `DecisionLogDto`, `CreateDecisionLogDto`
  - `adaptDecisionLog(dto: DecisionLogDto): DecisionLog`
  - `useDecisionLogs(): UseQueryResult<DecisionLog[]>` (`enabled: !!BE_READY` 조건)
  - `useCreateDecisionLog(): UseMutationResult`

변경:

- `src/pages/ui/SignalsPage.tsx` — query 훅 연결, Signal 모델 교체 반영, sparkline BE 미완 시 빈 배열 처리.
- `src/pages/ui/ResearchPage.tsx` — `useResearchView`로 다중 쿼리 조합. symbol→assetId 해소.
- `src/pages/ui/AlertsPage.tsx` — AlertRule/채널 UI 제거, 인박스 탭(Alerts/Candidates)으로 교체.
- `src/pages/ui/SettingsPage.tsx` — `useMe`로 프로필 영역 연동. 알림 설정 섹션 주석 처리.
- `src/pages/ui/DecisionLogPage.tsx` — `useDecisionLogs`·`useCreateDecisionLog` 연결.
  BE 미완 시 로컬 임시 상태 병행.

## 5. 테스트

- 각 `adapters.test.ts`: spec 예시 DTO→도메인 매핑, null/누락 경계, Decimal 파싱 경계,
  날짜 단언은 **`TZ=UTC`**.
- Signals: sparkline 빈 배열 fallback, `asset.symbol` 없을 때 asset 조회 경로.
- Research: `symbolNotFound` 에러 경로, `GET /assets?symbol=` 빈 결과, 다중 쿼리 중 1개
  실패 시 전체 `ErrorState`.
- Alerts: read/dismiss/confirm mutation 성공→쿼리 무효화, 빈 인박스 `EmptyState`.
- DecisionLog: `enabled: false` 시 빈 결과 처리, POST mutation 성공→목록 갱신.
- 기존 테스트 회귀 없음.

## 6. 스코프 밖

- Dashboard·Watchlist·Portfolio 연동 재작업.
- 신규 차트 컴포넌트 추가(기존 컴포넌트 재사용).
- Optimistic update, infinite scroll, WebSocket.
- G4(가격 시계열) BE 미완성 상태에서 sparkline 실데이터화.
- G10 BE 미완성 상태에서 DecisionLog 서버 영속화(enabled 조건 제거는 BE 완성 후).
- `src/shared/model` 도메인 타입 구조 변경.
- `src/shared/lib/format`·`src/shared/api/*` 프리미티브 시그니처 변경.
- AlertRule 규칙 빌더/채널 설정 재구현(G8/G11 폐기 확정).

## 7. 위험·미해결

- **G4 선행 의존(N4)**: `GET /stocks/{symbol}/prices` BE 미완 시 Signals·Research 스파크라인은
  빈 배열. BE 완성 전 FE 연동은 항상 빈 배열 경로를 먼저 구현하고 주석으로 명시한다.
- **G6 선행 의존**: `GET /assets?symbol=` BE 미완 시 Research 화면 전체가 진입 불가. 에러
  경로(`symbolNotFound`)와 `ErrorState` 처리는 필수.
- **G10 선행 의존**: `POST /decision-logs` BE 미완 시 `enabled: false` + 로컬 임시 유지로
  화면 자체는 동작. 실API 연동은 BE 완성 시 조건 제거만으로 활성화.
- **Signal 모델 이관**: 기존 FE `Signal` 타입 사용처가 Signals 페이지 외에도 있을 수 있음
  → 타입 변경 전 `grep` 전수 확인 후 일괄 교체.
- **AlertRule 폐기 범위**: 규칙 빌더 컴포넌트 삭제 시 라우트·import 의존 연쇄 확인 필요.
- mock 유지 영역과 실데이터 영역 공존 → 후속 주석으로 경계 명시 필수.
