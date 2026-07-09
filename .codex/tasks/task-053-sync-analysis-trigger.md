# Task 053: 동기화 버튼 분석 트리거 연동

## Source Issue

FE #129 — 동기화 버튼에 관심종목 분석 트리거 연동
Design: `docs/designs/129-sync-analysis-trigger.md`

- Branch: feat/129-sync-analysis-trigger (현재 브랜치 유지, 새 브랜치 생성 금지)
- Commit: 금지 — 변경만 남기고 종료 (커밋은 오케스트레이터가 수행)

## Task Summary

`src/widgets/Topbar.tsx`의 동기화 버튼 클릭 시 `POST /api/v1/worker/jobs/analysis`를 먼저 호출하여 관심종목 분석 잡을 큐잉하고, 이어서 기존 React Query 캐시 무효화를 수행합니다. 트리거 실패가 기존 새로고침 동작을 막지 않아야 합니다.

## Goal

구현 완료 시 다음이 모두 참이어야 합니다.

- 동기화 버튼 클릭 시 `POST /api/v1/worker/jobs/analysis` 요청이 캐시 무효화보다 먼저 발생한다.
- 트리거 성공 시 Topbar 동기화 영역에 "동기화 요청됨" 문구와 갱신된 시각이 표시된다.
- 429 응답 시 "잠시 후 다시 시도해 주세요 (약 60초)" 문구가 표시되고, 캐시 무효화는 그대로 수행된다.
- 네트워크·5xx 오류 시 트리거 상태 변화 없이 캐시 무효화는 그대로 수행된다.
- 검증 명령 4종이 모두 통과한다.

## Background

- BE PR #244가 머지되어 `POST /api/v1/worker/jobs/analysis`가 사용 가능하다.
- 요청 본문: `{"watchlist_id": <int>}`, 성공 응답: `{data: {job_id: string, status: "queued"}}`.
- rate limit: 사용자당 60초 1회. 초과 시 HTTP 429 + `{error: {code: "RATE_LIMIT_EXCEEDED", ...}}`.
- `src/shared/api/client.ts`의 `apiRequest`는 401 외 HTTP 상태를 별도 처리하지 않으므로, 429는 `unwrapEnvelope`가 `ApiError('RATE_LIMIT_EXCEEDED', ...)` 를 던지는 형태로 도달한다.
- `RATE_LIMIT_EXCEEDED` 코드는 현재 `src/shared/api/errorCodes.ts`에 없다.
- `watchlist_id`는 `GET /watchlists?page=1&size=20`의 `[0].id`로 취득한다 (`src/features/watchlist/queries.ts:62-65` 패턴 동일).
- `Retry-After` 헤더는 `apiRequest`가 노출하지 않으므로 사용하지 않는다. 60초는 하드코딩 문구로 처리한다.
- 상태 표시 문구는 설계 문서(`docs/designs/129-sync-analysis-trigger.md` §4.4)가 정본이다. 임의 변경 금지.
- `apiPost`에 넘기는 경로 리터럴은 `/worker/jobs/analysis`다. base URL(`VITE_API_BASE_URL`)이 `/api/v1`까지 포함하므로 `/api/v1/...`을 코드에 쓰지 않는다 (출처: `src/shared/api/client.ts:70-71`, 설계 §4.1).

## Implementation Scope

Codex가 변경할 수 있는 파일:

- `src/features/watchlist/mutations.ts` (신규): `triggerAnalysis` 함수
- `src/widgets/Topbar.tsx`: `handleRefresh` 수정, `triggerStatus` 상태 추가
- `src/widgets/Topbar.test.tsx`: 신규 테스트 케이스 추가
- `src/shared/api/errorCodes.ts`: `RATE_LIMIT_EXCEEDED` 항목 추가

## Out of Scope

Codex가 변경해서는 안 되는 항목:

- 잡 진행률·완료 알림 UI
- 시그널 페이지 디자인 정렬
- BE 변경
- `src/shared/api/client.ts` — `apiRequest` 시그니처·헤더 노출 방식 변경
- `src/features/watchlist/queries.ts` — 기존 쿼리 로직 수정

## Protected Files

변경 금지 파일:

- `AGENTS.md`
- `CLAUDE.md`
- `docs/harness/`
- `.codex/task-template.md`

## Requirements

1. `handleRefresh` 실행 순서는 설계 문서 §4.3을 따른다: GET watchlist → triggerAnalysis → invalidateQueries → setLastSyncedAt.
2. 트리거 결과에 관계없이 `queryClient.invalidateQueries()`와 `setLastSyncedAt(new Date())`는 항상 실행된다.
3. `triggerStatus`는 `'idle' | 'requested' | 'rate-limited'` 타입이며, 다음 `handleRefresh` 호출 시 `'idle'`로 초기화된다.
4. 상태별 표시 문구는 설계 문서 §4.4 테이블을 정확히 따른다.
5. `src/features/watchlist/mutations.ts`의 `triggerAnalysis`는 `apiPost`를 직접 호출하고 오류를 호출자로 전파한다. 내부에서 catch하지 않는다.
6. `src/shared/api/errorCodes.ts`에 `RATE_LIMIT_EXCEEDED: '잠시 후 다시 시도해 주세요 (약 60초)'`를 추가한다.

## Test Requirements

`src/widgets/Topbar.test.tsx`에 다음 케이스를 추가한다.

- 트리거 성공 후 `invalidateQueries` 호출 및 `"동기화 요청됨"` 텍스트 렌더 확인
- 트리거 429(`RATE_LIMIT_EXCEEDED`) 후 `invalidateQueries` 호출 및 `"잠시 후 다시 시도해 주세요 (약 60초)"` 텍스트 렌더 확인
- 트리거 네트워크 오류 후 `invalidateQueries` 호출 확인 및 트리거 상태 변화 없음 확인
- 기존 동기화 시각 갱신 — 트리거 결과와 무관하게 갱신된 시각이 렌더됨 확인

기존 테스트 4건은 모두 통과를 유지해야 한다.

## Verification Commands

```
corepack pnpm format:check
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test
```

4종 모두 통과해야 한다. `format:check`를 누락하지 않는다.

## Documentation Impact

없음. 설계 문서는 이미 `docs/designs/129-sync-analysis-trigger.md`에 작성되어 있다.

## ADR Need

불필요. 기존 `apiPost`·`ApiError` 패턴을 그대로 따르며, 아키텍처 결정 변경이 없다.

## Failure Record Need

불필요. 신규 기능 추가이며 기존 패턴 내에서 구현된다.

## Risk Level

Low. BE 계약이 확정되어 있고, 트리거 실패가 기존 새로고침 동작에 영향을 주지 않도록 설계되었습니다. 테스트로 안전망을 확보합니다.

## Expected Output

- `src/features/watchlist/mutations.ts` — `triggerAnalysis` 함수 신규 작성
- `src/widgets/Topbar.tsx` — `handleRefresh`·`triggerStatus` 수정
- `src/widgets/Topbar.test.tsx` — 신규 테스트 케이스 추가
- `src/shared/api/errorCodes.ts` — `RATE_LIMIT_EXCEEDED` 항목 추가
- 검증 명령 4종 통과 결과 보고

## Rules

- 현재 브랜치(`feat/129-sync-analysis-trigger`)를 유지한다. 새 브랜치 생성 금지.
- 커밋 금지. 변경만 남기고 종료한다.
- Implementation Scope 외 파일을 수정하지 않는다.
- 상태 표시 문구(`"동기화 요청됨"`, `"잠시 후 다시 시도해 주세요 (약 60초)"`)를 임의로 변경하지 않는다.
- 검증을 약화하지 않는다.
- 가정 사항과 검증 결과를 보고한다.
