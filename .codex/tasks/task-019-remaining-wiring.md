# Codex Handoff Task

## Source Issue

JongEunLee310/project_stock_frontend#48 — [계약정렬] 화면별 API 연동 (§4). 본 핸드오프는
**Signals·Research·Alerts·Settings·DecisionLog 잔여 5화면**을 다룬다. 설계기록:
`docs/designs/48-remaining-wiring.md`.

## Task Summary

5화면을 `src/shared/mock` 직접 import에서 실제 API(`src/shared/api/client.ts`) 기반
TanStack Query + 어댑터(DTO→도메인) 연동으로 교체한다. TanStack Query·QueryClientProvider는
task-018에서 이미 도입되어 있으므로 추가 설치 없음.

## Goal

완료 시 참:

- `src/features/{signals,research,alerts,settings,decision-log}` 세그먼트가 각각
  `dto.ts`·`adapters.ts`·`queries.ts`·`adapters.test.ts`로 구성된다.
- SignalsPage가 `useSignals`(+`useSignalSparkline`)로 렌더되고, Signal 모델이 BE 계약
  필드(`signalType/score/riskLevel/reason/evidence/expiresAt`)로 교체된다.
- ResearchPage가 symbol→assetId 해소(`useAssetIdBySymbol`) 후 `useResearchView`(다중 쿼리
  조합)로 렌더된다.
- AlertsPage에서 AlertRule/채널 빌더 UI가 제거되고 인박스 탭(Alerts/Candidates)으로 교체된다.
  read/dismiss/confirm mutation이 동작한다.
- SettingsPage가 `useMe`로 프로필 영역을 렌더하고, 알림 설정 섹션은 주석 처리된다.
- DecisionLogPage가 `useDecisionLogs`·`useCreateDecisionLog`를 연결하되, BE 미완 시
  `enabled: false` + 로컬 임시 상태로 동작한다.
- 각 연동 영역에 `Skeleton`(로딩)·`ErrorState`(에러)·`EmptyState`(빈 결과)가 연결된다.
- `pnpm lint && pnpm typecheck && TZ=UTC pnpm test && pnpm format:check`가 모두 통과한다.

## Background

- 와이어 계약 단일 출처: `project_stock/docs/api/frontend-api-spec.md`. 응답은 공통 envelope
  `{data,message,error,meta}`이며 `apiGet`/`apiPost`(`src/shared/api/client.ts`)가 언랩해
  `{data,meta}` 반환. 인증 헤더·401 lazy refresh는 client 내부 처리.
- 금액·비율은 문자열 Decimal(`"195.64"`), enum은 영문 UPPER_SNAKE, datetime은 와이어 UTC /
  표시 KST(`formatKstDateTime`).
- 재사용 프리미티브(`src/shared/lib/format`): `parseDecimal`, `formatMoney`, `formatPercent`,
  `formatKstDate(Time)`, `toLabel`, `riskLevelLabels`, `alertStatusLabels`.
- 상태 컴포넌트: `src/shared/ui`의 `Skeleton`·`ErrorState`·`EmptyState`.
- **API 경로 규칙(중요)**: 경로는 반드시 RELATIVE(`/signals`, `/auth/me`). `apiGet`이
  `VITE_API_BASE_URL`(이미 `/api/v1` 포함)에 접합. `/api/v1` 접두사를 경로에 직접 쓰면
  이중 접두사 버그가 발생하므로 절대 쓰지 않는다.
- **도메인 갭**: BE 출처 없는 필드는 임의 더미값으로 채우지 말 것. mock 유지 + 후속 주석.
- 기존 wired 패턴 참고: `src/features/dashboard/{dto,adapters,queries}.ts` + `adapters.test.ts`.

### 주요 선행 의존 (BE 미완 시 처리 방법)

- **G4(가격 시계열)**: `GET /stocks/{symbol}/prices` 미완 시 Signals·Research sparkline은
  빈 배열(`[]`) fallback + 주석으로 `// G4 BE 미완 — sparkline 비활성` 명시.
- **G6(symbol→asset_id)**: `GET /assets?symbol=` 미완 시 Research 진입 불가. `ErrorState`로
  처리. 에러 경로 구현은 필수.
- **G10(decision-logs)**: `GET·POST /decision-logs` 미완 시 `useDecisionLogs`는
  `enabled: false`로 비활성화하고 로컬 임시 `useState` 병행. 주석으로
  `// G10 BE 미완 — enabled: false` 명시.

## Implementation Scope

설계기록 §4 파일 목록을 따른다.

### 신규 세그먼트

**`src/features/signals/`**

- `dto.ts`: `SignalDto`, `PriceBarDto`, `SignalDetailDto`
- `adapters.ts`:
  - `adaptSignal(dto: SignalDto, sparkline: number[]): Signal`
  - `adaptSignalDetail(dto: SignalDetailDto, sparkline: number[]): Signal`
- `queries.ts`:
  - `useSignals(assetId?: number): UseQueryResult<Signal[]>`
  - `useSignalDetail(id: number): UseQueryResult<Signal>`
  - `useSignalSparkline(symbol: string | null): UseQueryResult<number[]>`
- `adapters.test.ts`

**`src/features/research/`**

- `dto.ts`: `AssetLookupDto`, `AssetDetailDto`, `ResearchSummaryDto`, `BuyChecklistDto`,
  `ReportDto`, `ThesisDto`
- `adapters.ts`:
  - `adaptResearchDetail(detail, summary, checklist, reports, thesis, sparkline): ResearchView`
  - `adaptReport(dto: ReportDto): ReportItem`
  - `adaptThesis(dto: ThesisDto): ThesisItem`
- `queries.ts`:
  - `useAssetIdBySymbol(symbol: string): UseQueryResult<number>`
  - `useResearchView(symbol: string): UseQueryResult<ResearchView>`
- `adapters.test.ts`

**`src/features/alerts/`**

- `dto.ts`: `AlertDto`, `AlertCandidateDto`
- `adapters.ts`:
  - `adaptAlert(dto: AlertDto): Alert`
  - `adaptAlertCandidate(dto: AlertCandidateDto): AlertCandidate`
- `queries.ts`:
  - `useAlerts(): UseQueryResult<Alert[]>`
  - `useAlertCandidates(): UseQueryResult<AlertCandidate[]>`
  - `useReadAlert(): UseMutationResult`
  - `useDismissAlert(): UseMutationResult`
  - `useReadCandidate(): UseMutationResult`
  - `useConfirmCandidate(): UseMutationResult`
- `adapters.test.ts`

**`src/features/settings/`**

- `dto.ts`: `MeDto`
- `adapters.ts`: `adaptMe(dto: MeDto): UserProfile`
- `queries.ts`: `useMe(): UseQueryResult<UserProfile>`
- `adapters.test.ts`

**`src/features/decision-log/`**

- `dto.ts`: `DecisionLogDto`, `CreateDecisionLogBody`
- `adapters.ts`: `adaptDecisionLog(dto: DecisionLogDto): DecisionLog`
- `queries.ts`:
  - `useDecisionLogs(): UseQueryResult<DecisionLog[]>` (G10 미완 시 `enabled: false`)
  - `useCreateDecisionLog(): UseMutationResult`
- `adapters.test.ts`

### 변경 페이지

- `src/pages/ui/SignalsPage.tsx` — `useSignals`·`useSignalSparkline` 연결, Signal 모델
  교체(`signalType/score/riskLevel/reason/evidence/expiresAt`), sparkline 빈 배열 처리.
- `src/pages/ui/ResearchPage.tsx` — `useResearchView` 연결(symbol→assetId 해소 포함),
  `ErrorState`(`symbolNotFound`), 다중 쿼리 로딩 통합.
- `src/pages/ui/AlertsPage.tsx` — AlertRule/채널 빌더 UI 제거, 인박스 탭 구조로 교체.
  mutation 버튼(읽음/무시/확인) 연결.
- `src/pages/ui/SettingsPage.tsx` — `useMe` 연결, 알림 설정 섹션 주석 처리(`// G11 폐기`).
- `src/pages/ui/DecisionLogPage.tsx` — `useDecisionLogs`·`useCreateDecisionLog` 연결.
  G10 미완 시 로컬 임시 `useState` 병행.

### 어댑터 필드 매핑 요약

**Signal**: `signal_type`→`signalType`(toLabel), `score`→`score`(parseDecimal),
`risk_level`→`riskLevel`(riskLevelLabels), `reason`/`evidence` 직접, `expires_at`→`expiresAt`
(formatKstDateTime), sparkline = G4 close 배열(빈 배열 fallback).

**Research**: symbol→assetId(`assets?symbol=`), `per/peg/target_price` nullable
(parseDecimal), `created_at`→formatKstDateTime, `buy-checklist`·`research-summary` 구조
보존, `theses/latest` null 허용.

**Alert**: `status`(UNREAD/READ/DISMISSED)→alertStatusLabels, `alert_type`→toLabel,
`created_at`→formatKstDateTime.

**AlertCandidate**: `status`(UNREAD/READ/CONFIRMED)→toLabel, `candidate_type`→toLabel,
`created_at`→formatKstDateTime.

**Settings(Me)**: `email`/`username` 직접, `created_at`→formatKstDateTime.

**DecisionLog**: `decision_type`(10종 UPPER_SNAKE)→toLabel, `decision_status`
(OPEN/REVIEWED/CLOSED)→toLabel, `created_by`(USER/AI/SYSTEM)→toLabel,
`cognitive_risks: string[]|null` 직접, `created_at`→formatKstDateTime.

## Out of Scope

- Dashboard·Watchlist·Portfolio 연동 재작업(task-018 완료 범위).
- 신규 차트 컴포넌트 추가(기존 재사용만).
- Optimistic update, infinite scroll, WebSocket.
- G4 미완 상태에서 sparkline 실데이터화(enabled 전환 시 활성화).
- G10 미완 상태에서 서버 영속화 확정(enabled 전환 시 활성화).
- `src/shared/model` 도메인 타입 구조 변경.
- `src/shared/lib/format`·`src/shared/api/*` 프리미티브 시그니처 변경.
- AlertRule 규칙 빌더·채널 설정 재구현(G8/G11 폐기 확정).
- `src/shared/api/queryClient.ts`·`src/app/App.tsx` QueryClientProvider 재수정.

## Protected Files

없음(`.codex/**`, `docs/harness/**`, ADR/FAILURE 파일 수정 금지).

## Requirements

- 화면 컴포넌트는 FE 도메인/뷰 타입만 본다(DTO snake_case 직접 노출 금지).
- 어댑터는 순수·동기. fetch/봉투 언랩은 query 훅·client 경계에서만.
- API 경로는 RELATIVE만. `/api/v1` 접두사 금지.
- 네이티브 다이얼로그(alert/confirm) 금지. 인앱 상태 컴포넌트 사용.
- BE 출처 없는 필드를 임의 더미값으로 채우지 말 것 — mock 유지 + 후속 주석.
- G4/G6/G10 미완 경로를 빈 배열·ErrorState·enabled=false로 처리하고 코드에 주석 명시.
- mutation 성공 시 해당 queryKey로 `invalidateQueries` 실행.

## Test Requirements

- 각 `adapters.test.ts`: spec 예시 DTO→도메인 매핑, null/누락 경계, parseDecimal 빈 문자열·null
  경계, enum toLabel 매핑. 날짜 단언은 반드시 **`TZ=UTC`**.
- Signals: sparkline 빈 배열 fallback, SignalDto 필수 필드 누락 경계.
- Research: `GET /assets?symbol=` 빈 결과 → symbolNotFound 에러 경로. 다중 쿼리 조합 어댑터
  정합성.
- Alerts: read/dismiss/confirm mutation 호출 후 쿼리 무효화 확인. 빈 목록 EmptyState.
- DecisionLog: `enabled: false` 시 빈 결과, POST mutation 파라미터 형태 검증.
- 기존 테스트 회귀 없음.

## Verification Commands

```
pnpm install
pnpm lint
pnpm typecheck
TZ=UTC pnpm test
pnpm format:check
```

`pnpm format` 전체 실행 금지. 포맷이 필요하면 **변경 파일만** prettier로 실행.

## Documentation Impact

`docs/designs/48-remaining-wiring.md`(본 설계, 갱신 불요). `docs/api/contract-alignment.md`
변경 없음(구현만). 신규 ADR·spec 변경 없음.

## ADR Need

불요 — 어댑터 계층·TanStack Query 채택은 ADR-004 확정. Signal 모델 교체(G9)·Alert 인박스
재정의(G8)는 `contract-alignment.md`에서 결정 완료. 본 작업은 그 적용.

## Failure Record Need

불요 — 예견된 구현 작업. G4/G6/G10 미완 의존성은 설계 단계에서 이미 식별·처리됨.

## Risk Level

Medium — 다수 화면 동시 수정 + Signal/Alert 모델 교체(기존 타입 사용처 연쇄) + BE 미완
의존성 3개(G4/G6/G10) 관리. 단, 각 화면의 독립성이 높아 개별 실패가 타 화면에 전파되지 않음.

## Expected Output

설계기록 §4의 신규/변경 파일. 모든 검증 명령 통과. 가정·미해결(특히 G4/G6/G10 미완 처리,
Signal 타입 사용처 일괄 교체 범위) 보고.

커밋 메시지: `feat: 화면별 API 연동 잔여 5화면 (#48, Track B)`
브랜치: `feat/48-remaining-vff` (신규 커밋만, push 없음)

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
