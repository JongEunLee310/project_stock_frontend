# Codex Handoff Task

## Source Issue

- 설계 기록: `docs/designs/50-dashboard-realdata-wiring.md`
- 재사용 피처: `src/features/{signals,decision-log,watchlist}/{adapters,queries}.ts`
- 선례(렌더 패턴 정본): `src/pages/ui/SignalsPage.tsx`

## Task Summary

`src/pages/ui/DashboardPage.tsx`의 잔여 mock 3개 섹션(Top Signals · Recent Decision Logs · Stocks 테이블)을 이미 구축된 피처 훅(`useSignals`/`useDecisionLogs`/`useWatchlistAssets`)으로 실 API 전환한다. 구 mock 도메인 타입과 신 어댑터 타입 간 렌더 갭을 해소한다. KPI 카드(이미 `useDashboardSummary` 연동)는 건드리지 않는다.

## Goal

- Top Signals / Recent Decision Logs / Stocks 섹션이 서버 데이터를 단일 소스로 렌더(mock import 제거).
- 각 섹션 독립 로딩/에러/빈 상태(Skeleton/ErrorState/EmptyState) 처리.
- 신 어댑터 타입(`Signal`/`DecisionLog`/`WatchlistAssetRow`)으로 렌더 전환, 구 타입 참조 제거.
- 검증 5종 통과 + 갱신 테스트.

## Background — 오케스트레이터가 확정한 사실 (추측 금지, 그대로 따를 것)

설계 §6의 미해결 항목은 BE/FE 코드 확인으로 모두 확정됐다:

1. **score 범위**: BE `app/domains/signals/schema.py` → `score: int = Field(ge=0, le=100)`. 이미 0~100. 스케일링(`*100`) 불요. SignalsPage의 `normalizeScore()`(`Math.min(100, Math.max(0, Math.round(score)))`) 패턴 재사용 후 `{score}%` 렌더.
2. **Badge riskLevel**: `RiskLevel` 타입 자체가 한글 라벨(`'낮음'|'중간'|'높음'`)이다. SignalsPage 선례(`SignalsPage.tsx:186`) 그대로 `<Badge riskLevel={signal.riskLevel as '낮음' | '중간' | '높음'} />` 사용. tone 매핑 만들지 말 것. Badge 컴포넌트 수정 금지.
3. **Top Signals 정렬**: SignalsPage 선례(`SignalsPage.tsx:261`)대로 **score 내림차순** 상위 3개. `[...signals].sort((a, b) => b.score - a.score).slice(0, 3)`.
4. **createdAt 이중 포맷**: signals/decision-log 어댑터의 `createdAt`은 이미 `formatKstDateTime` 적용된 표시용 문자열이다. DashboardPage의 `dateTimeFormatter.format(new Date(...))` 재파싱을 **제거**하고 `log.createdAt`/`signal.createdAt`을 직접 표시한다.
5. **API 경로**: 클라이언트는 `/api/v1` prefix 없는 경로 호출(베이스 URL에 포함). 훅은 이미 구현됨 — 내부 수정 금지.

## Implementation Scope

**`src/pages/ui/DashboardPage.tsx` — 이 파일만 변경** (신규 파일 없음)

- import 교체:
  - 제거: `mockSignals`/`mockDecisionLogs`/`mockStocks` from `@/shared/mock`, `Signal`/`DecisionLog`/`Stock`/`StockStatus` from `@/shared/model`(대시보드 미사용분), 모듈 최상위 `dashboardStocks`/`topSignals`/`recentDecisionLogs` 상수, `dashboardStatusBySymbol` 하드코딩 맵.
  - 추가: `useSignals` from `@/features/signals/queries`, `useDecisionLogs` from `@/features/decision-log/queries`, `useWatchlistAssets` from `@/features/watchlist/queries`, 그리고 각 어댑터의 `Signal`/`DecisionLog`/`WatchlistAssetRow` 타입.
- `DashboardPage()` 내 훅 호출: `useSignals()`, `useDecisionLogs()`, `useWatchlistAssets()`.
- 각 섹션 렌더에 `isLoading→Skeleton` / `isError→ErrorState` / 데이터 없음→`EmptyState` 분기 추가(KPI 섹션·SignalsPage 동일 패턴 재사용).
- **Top Signals**: score 내림차순 상위 3개. `SignalCard` props 타입을 feature `Signal`로 교체, 내부 참조 수정 — `status→riskLevel`(Badge), `confidence→score`(normalizeScore), `reasons→[reason]`(단일 원소 배열로 기존 ul/li 유지). 폐기 필드(`kind`/`trendSeries`/`previousStatus`/`previousConfidence`/`oneMonthChangePercent`) 렌더 제거.
- **Recent Decision Logs**: createdAt 내림차순 상위 3개(어댑터 createdAt 문자열 정렬은 SignalsPage `localeCompare` 패턴 사용). `decisionColumns`를 feature `DecisionLog` 타입으로 교체, "요약" 셀 `log.decision→log.rationale`, 시간 셀 `new Date()` 재파싱 제거 후 `log.createdAt` 직접 표시. `decisionType`은 한글 라벨로 이미 제공 — Badge 전달 유지.
- **Stocks 테이블**: `stockColumns`를 `TableColumn<WatchlistAssetRow>[]`로 재정의(3컬럼) — ①종목(`symbol`+`name`+링크, 기존 `StockIdentity` 재사용), ②가격(`price: number|null`, null→`"—"`), ③변화 1D(`changePercent: number|null`, null→`"—"`, 색상 클래스 null 가드). 제공 없는 컬럼(status/PER/PEG/sparkline) 제거. 다른 곳에서 미참조 시 `StockSparkline` 헬퍼 정리.

## Out of Scope

- Priority Queue(`mockPriorityQueue`)·AI Briefing(`mockAiBriefing`) — BE 엔드포인트 없음. mock 유지 + `/* TODO: BE 엔드포인트 없음 — mock 유지 */` 주석.
- KPI(Today Brief) 섹션 변경.
- 피처 훅(`useSignals`/`useDecisionLogs`/`useWatchlistAssets`) 및 어댑터/DTO 내부 수정.
- `src/shared/model/domain.ts` 도메인 타입 구조 변경(미사용된 구 mock 타입은 남겨둠).
- Badge/Table 등 `src/shared/ui` 컴포넌트 시그니처 변경.
- BE 레포 변경. 무관한 리팩터링.

## Protected Files

없음. `.codex/*`, `docs/decisions/*`, `docs/harness/*` 수정 금지.

## Requirements

- 서버 데이터 단일 소스(mock 폴백 제거). 섹션별 loading/error/empty 분기 필수.
- BE↔화면 변환은 어댑터 책임(이미 구현) — 페이지는 어댑터 타입만 소비.
- `null` 가능 필드(`price`/`changePercent`)는 `"—"` fallback.
- 기존 통과 테스트를 약화하지 말 것.

## Test Requirements

`src/pages/ui/DashboardPage.test.tsx`:
- 3개 훅(`useSignals`/`useDecisionLogs`/`useWatchlistAssets`)을 `vi.mock`으로 모킹. fixture는 feature 어댑터 타입 기준(signal fixture에 `symbol` 포함 — aria-label 셀렉터 유지).
- 변경 단언: PER/PEG/status(`'60.3'`/`'1.32'`/`'관망'`) 제거 → `WatchlistAssetRow` 기준 `price`/`changePercent` 단언. signal `confidence`→`score`(`{score}%`), decision `decision`→`rationale`.
- 추가: 각 섹션 로딩(Skeleton)·에러(ErrorState)·빈(EmptyState) 1케이스씩.
- 시간 단언은 `TZ=UTC`.

## Verification Commands

```
pnpm lint
pnpm typecheck
pnpm format:check
TZ=UTC pnpm test
pnpm build
```

(포맷은 변경 파일만 `pnpm format`. `format:check`는 전체 게이트.)

## Documentation Impact

- 설계 기록 `docs/designs/50-dashboard-realdata-wiring.md` 참조.
- 구현 완료 후 설계 문서 상태 헤더를 "완료/Implemented"로 갱신(선택).

## ADR Need

불요. 기존 엔드포인트 클라이언트 조합·렌더 전환, 신규 의존성/아키텍처 변경 없음.

## Failure Record Need

불요(국소 변경·회귀 테스트로 방지).

## Risk Level

Medium. mock→실데이터 전환으로 데이터 소스가 바뀌고 구/신 타입 갭 해소 필요. Stocks 컬럼 축소·테스트 단언 갱신에 주의.

## Expected Output

- 전용 브랜치 `feat/dashboard-realdata-wiring`(최신 `main` 기준, 이미 생성)에서 구현.
- `DashboardPage.tsx` + `DashboardPage.test.tsx` 변경 커밋.
- 검증 5종 전부 통과 로그.

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
