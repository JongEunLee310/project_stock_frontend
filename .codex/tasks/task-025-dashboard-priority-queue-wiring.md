# Codex Handoff Task

## Source Issue

- 설계 기록(정본): `docs/designs/68-dashboard-priority-queue-wiring.md`
- 페어 BE: `JongEunLee310/project_stock#124` (`/alert-candidates?expand=asset`)
- 선례: `src/features/watchlist/{dto,adapters}.ts`(nested asset expand), `src/pages/ui/SignalsPage.tsx`(riskLevel Badge), DashboardPage signals 섹션(loading/error/empty 패턴)

## Task Summary

Dashboard "우선 확인 큐"(Priority Queue) 섹션을 mock(`mockPriorityQueue`)에서 실 API `useAlertCandidates()`로 전환한다. 동시에 BE와 어긋난 alerts candidate 계약(dto/adapter/queries)을 정렬한다. BE PR #124가 `/alert-candidates?expand=asset`로 각 후보에 `asset` 객체(symbol 포함)를 제공한다.

## Goal

- alerts candidate 계약을 BE와 정렬: `message`/`importance`/nested `asset` 반영.
- `useAlertCandidates`가 `?expand=asset`로 호출, 어댑터가 `symbol`(asset.symbol)·`reason`(message)·`riskLevel`(importance) 제공.
- Dashboard Priority Queue가 서버 데이터를 단일 소스로 렌더(mock 제거), 섹션 loading/error/empty 처리.
- 검증 5종 통과 + 갱신 테스트.

## Background — 오케스트레이터가 확정한 사실 (추측 금지, 그대로 따를 것)

BE 스키마(`project_stock/app/domains/alert_candidates/schema.py`, `types.py`) 확인 결과:

1. **BE 필드명**: `AlertCandidateResponse`는 `message`(str | None)·`importance`·`asset_id`를 보낸다. `reason`/top-level `symbol`은 **없다**. 기존 FE dto의 `reason`/`symbol`이 버그였다. `expand=asset` 시 `asset:{symbol,name,price,change_percent,sector?}` 추가(BE #124).
2. **importance 값**: `AlertImportance` enum = `LOW`/`MEDIUM`/`HIGH` **정확히 3값**. `riskLevelLabels`(이미 `src/shared/lib/format/enumLabel.ts`에 HIGH→높음/MEDIUM→중간/LOW→낮음)로 전량 매핑되므로 `toLabel(riskLevelLabels, dto.importance) as RiskLevel` 안전. 새 맵 만들지 말 것.
3. **graceful degradation**: `?expand=asset`을 붙여도 BE #124 미머지/미배포면 `asset` 부재 → `dto.asset?.symbol`이 undefined → `symbol: null` → 링크 없이 제목만. 큐(제목·reason·riskLevel 배지)는 동작. FE 단독 머지 가능, BE #124 머지 후 링크 자동 활성화. **symbol null 가드 필수.**

## Implementation Scope

**`src/features/alerts/dto.ts`**

- `AlertCandidateDto`: `reason: string` 제거 → `message: string | null`; `importance: string` 추가; top-level `symbol` 제거(`asset_id?: number | null` 유지); `asset?: AlertCandidateAssetDto` 추가.
- 신규 `AlertCandidateAssetDto`: watchlist `WatchlistItemAssetDto`와 동형 — `{ symbol: string; name: string; price: string | null; change_percent: string | null; sector?: string | null }`.

**`src/features/alerts/adapters.ts`**

- `AlertCandidate` 인터페이스에 `riskLevel: RiskLevel` 추가(`@/shared/model`에서 `RiskLevel` import).
- `adaptAlertCandidate`: `symbol` ← `dto.asset?.symbol ?? null`; `reason` ← `dto.message ?? ''`; `riskLevel` ← `toLabel(riskLevelLabels, dto.importance) as RiskLevel`(`riskLevelLabels` import 추가). candidateType/status/createdAt 기존 유지.

**`src/features/alerts/queries.ts`**

- `useAlertCandidates`: `apiGet<AlertCandidateDto[]>('/alert-candidates?expand=asset')`로 경로 변경. 나머지 동일.

**`src/pages/ui/DashboardPage.tsx`**

- import: `mockPriorityQueue` 제거(`mockAiBriefing`은 유지 — BE 없음). `useAlertCandidates` from `@/features/alerts/queries`, `AlertCandidate` 타입 추가.
- 모듈 최상위 mock 기반 `priorityQueue` 정렬 상수 + `/* TODO: BE 엔드포인트 없음 — mock 유지 */`(priorityQueue 쪽) 제거.
- 컴포넌트: `const priorityQueueQuery = useAlertCandidates()`. 상위 3개 = riskLevel 높음→중간→낮음 정렬 후 `slice(0, 3)`(기존 riskRank {높음:0,중간:1,낮음:2} 동치).
- "우선 확인 큐" 카드: `isLoading→Skeleton` / `isError→ErrorState`(error.message + refetch) / 데이터 없음→`EmptyState` 분기 추가. **같은 파일 signals 섹션 패턴 그대로 미러.**
- 항목 렌더: 기존 번호 배지/레이아웃 유지. 종목 링크 — `item.symbol`이 있으면 `getResearchPath(item.symbol)` 링크, null이면 일반 텍스트(`<span>`)로 title. risk 배지 `<Badge riskLevel={item.riskLevel}>{item.riskLevel}</Badge>`. `item.reason` 표시.

## Out of Scope

- `/alerts`(`AlertDto`)·alert 경로 계약 — 별도 도메인, 건드리지 말 것.
- `mockAiBriefing` 등 Dashboard 다른 mock 섹션, 다른 화면.
- `useAlertCandidates` 외 mutation 훅(useReadCandidate/useConfirmCandidate) 시그니처 변경.
- AlertsPage(`src/pages/ui/AlertsPage.tsx`) 코드 변경 — adapter 변경의 수혜자(reason/symbol 정상화)이므로 그대로 두되 typecheck 깨지지 않는지 확인.
- BE 레포 변경. 공유 UI(Badge/Card 등) 시그니처 변경. 무관 리팩터.

## Protected Files

없음. `.codex/*`, `docs/designs/*`, `docs/harness/*` 수정 금지.

## Requirements

- 서버 데이터 단일 소스(mock 폴백 제거). 섹션 loading/error/empty 필수.
- BE↔화면 변환은 어댑터 책임. `symbol` null 가드(링크/텍스트 분기).
- 기존 통과 테스트를 약화하지 말 것.

## Test Requirements

- `src/features/alerts/adapters.test.ts`: candidate 케이스 입력을 신계약(`message`/`importance`/nested `asset:{symbol,...}`)으로 갱신. 단언: `reason`(message에서), `symbol`(asset.symbol에서), `riskLevel`(importance→한글). `asset` 없는 입력 → `symbol: null` 케이스 1개.
- `src/pages/ui/DashboardPage.test.tsx`: `useAlertCandidates`를 `vi.mock`(기존 useSignals 등과 동일 방식). Priority Queue 실데이터 렌더 단언(title/riskLevel). 로딩(Skeleton)·에러(ErrorState)·빈(EmptyState) 1케이스씩. 기존 mockPriorityQueue 기반 단언 제거.
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

- 설계 `docs/designs/68-dashboard-priority-queue-wiring.md` 참조. 구현 완료 후 상태 "완료/Implemented" 갱신(선택).

## ADR Need

불요. 기존 엔드포인트(expand) 소비·계약 정렬·렌더 전환, 신규 아키텍처 변경 없음.

## Failure Record Need

불요(국소 변경·회귀 테스트).

## Risk Level

Medium. alerts candidate 계약 변경이 AlertsPage에도 파급(수혜이나 typecheck 확인 필수). mock→실데이터 + symbol null 가드 주의.

## Expected Output

- 전용 브랜치 `feat/dashboard-priority-queue-wiring`(최신 main 기준, 이미 생성)에서 구현.
- dto/adapters/queries/DashboardPage + 테스트 변경 커밋(한국어 메시지).
- 검증 5종 전부 통과 로그.

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
