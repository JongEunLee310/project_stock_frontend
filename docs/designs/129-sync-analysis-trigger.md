# 129 · 동기화 버튼 분석 트리거 연동

Status: Draft
Track: FE
Source: FE #129
Risk: Low
Author: value-for-fable:itsvff (Sonnet) 위임

---

## 1. 배경

`src/widgets/Topbar.tsx`의 동기화 버튼(`handleRefresh`)은 현재 `queryClient.invalidateQueries()`로 React Query 캐시만 무효화합니다. BE PR #244에서 분석 잡 큐잉 엔드포인트가 확정되었으므로, 버튼 클릭 시 트리거 요청을 먼저 보내고 기존 캐시 무효화를 이어서 수행하도록 연동합니다.

---

## 2. BE 계약 (BE PR #244 기준)

| 항목       | 내용                                                                              |
| ---------- | --------------------------------------------------------------------------------- |
| 엔드포인트 | `POST /api/v1/worker/jobs/analysis`                                               |
| 인증       | Bearer 토큰 필수 (`apiPost` 기본값 `auth: true` 적용)                             |
| 요청 본문  | `{"watchlist_id": <int>}`                                                         |
| 성공 응답  | `{data: {job_id: string, status: "queued"}}` (공통 엔벨로프)                      |
| rate limit | 사용자당 60초 1회                                                                 |
| 429 응답   | HTTP 429 + `Retry-After: 60` 헤더 + `{error: {code: "RATE_LIMIT_EXCEEDED", ...}}` |

잡은 비동기 큐잉이며 완료 대기는 없습니다. `job_id` 수신 시점을 "동기화 요청됨" 상태의 기준으로 사용합니다.

---

## 3. 범위

### 포함

- `src/features/watchlist/mutations.ts` (신규): `triggerAnalysis` 함수
- `src/widgets/Topbar.tsx`: `handleRefresh` 수정, `triggerStatus` 상태 추가
- `src/widgets/Topbar.test.tsx`: 신규 테스트 케이스 추가
- `src/shared/api/errorCodes.ts`: `RATE_LIMIT_EXCEEDED` 코드 항목 추가

### 제외 (Out of Scope)

- 잡 진행률·완료 알림 UI
- 시그널 페이지 디자인 정렬 (별도 이슈)
- BE 변경

---

## 4. 설계

### 4.1 `src/features/watchlist/mutations.ts` (신규)

```
triggerAnalysis(watchlistId: number): Promise<{ job_id: string; status: 'queued' }>
```

`apiPost<{ job_id: string; status: 'queued' }>('/worker/jobs/analysis', { watchlist_id: watchlistId })`를 호출하고 `.data`를 반환하는 책임만 가집니다. 오류 전파는 호출자(`handleRefresh`)에서 처리합니다.

경로 리터럴 주의: `apiRequest`의 base URL(`VITE_API_BASE_URL`)이 `/api/v1`까지 포함하므로, 코드에 넘기는 경로는 `/worker/jobs/analysis`입니다 (`/watchlists?page=1&size=20` 관례와 동일, 출처: `src/shared/api/client.ts:70-71`). §2의 `POST /api/v1/worker/jobs/analysis`는 와이어 레벨 표기입니다.

### 4.2 `watchlist_id` 취득

`handleRefresh` 내에서 `apiGet<WatchlistDto[]>('/watchlists?page=1&size=20')`으로 첫 번째 watchlist ID를 조회합니다. 이는 `src/features/watchlist/queries.ts:62-65`의 기존 패턴과 동일합니다.

| 조건                    | 처리                                      |
| ----------------------- | ----------------------------------------- |
| `data[0]` 존재          | `watchlist_id = data[0].id`로 트리거 호출 |
| `data[0]` 없음          | 트리거 건너뜀, 캐시 무효화는 그대로 수행  |
| GET 실패 (네트워크·5xx) | 트리거 건너뜀, 캐시 무효화는 그대로 수행  |

### 4.3 `handleRefresh` 실행 순서

1. `triggerStatus`를 `'idle'`로 초기화
2. `GET /watchlists?page=1&size=20` 호출로 `watchlist_id` 취득
3. `watchlist_id`가 있으면 `triggerAnalysis` 호출, 결과에 따라:
   - 성공: `triggerStatus = 'requested'`
   - `RATE_LIMIT_EXCEEDED`: `triggerStatus = 'rate-limited'`
   - 그 외 오류 (네트워크·5xx): `triggerStatus` 변경 없음 (silent)
4. 단계 2~3 결과와 무관하게 `queryClient.invalidateQueries()` 호출
5. `setLastSyncedAt(new Date())` 갱신

캐시 무효화(4단계)와 동기화 시각 갱신(5단계)은 트리거 성공·실패에 관계없이 항상 실행됩니다.

### 4.4 상태 표시 (`triggerStatus`)

`triggerStatus: 'idle' | 'requested' | 'rate-limited'` 로컬 상태로 관리합니다. 자동 복원 타이머는 도입하지 않으며, 다음 `handleRefresh` 호출 시 `'idle'`로 초기화됩니다.

| `triggerStatus`  | 동기화 영역 표시 문구                  | 동기화 시각(`HH:mm`)    |
| ---------------- | -------------------------------------- | ----------------------- |
| `'idle'`         | `동기화`                               | 표시                    |
| `'requested'`    | `동기화 요청됨`                        | 표시 (갱신된 시각 유지) |
| `'rate-limited'` | `잠시 후 다시 시도해 주세요 (약 60초)` | 표시하지 않음           |

"요청됨"·"잠시 후 다시 시도해 주세요 (약 60초)" 문구는 Codex가 임의로 변경하지 않습니다. 이 설계 문서를 정본으로 사용합니다.

### 4.5 `src/shared/api/errorCodes.ts` 보완

`RATE_LIMIT_EXCEEDED` 항목이 없어 `messageForErrorCode`가 코드 원문을 반환합니다. `'RATE_LIMIT_EXCEEDED': '잠시 후 다시 시도해 주세요 (약 60초)'`를 추가합니다.

`handleRefresh`는 catch된 오류의 `code` 속성이 `'RATE_LIMIT_EXCEEDED'`인지로 429를 판별합니다. `apiRequest`가 원시 `Response`를 노출하지 않으므로 `Retry-After` 헤더 값은 사용하지 않습니다.

---

## 5. 의존성

- `apiGet`, `apiPost` — `src/shared/api/client.ts` 기존 함수, 변경 없음
- `WatchlistDto` — `src/features/watchlist/dto.ts` 기존 타입, 변경 없음
- `ApiError` — `src/shared/api/envelope.ts` 기존 클래스, 변경 없음

---

## 6. 테스트

실제 코드는 작성하지 않으며 검증 항목만 정의합니다.

### `src/widgets/Topbar.test.tsx`

- 트리거 성공 → `invalidateQueries` 호출 확인, `"동기화 요청됨"` 텍스트 렌더 확인
- 429 응답 → `invalidateQueries` 호출 확인, `"잠시 후 다시 시도해 주세요 (약 60초)"` 텍스트 렌더 확인
- 네트워크 오류 → `invalidateQueries` 호출 확인, 트리거 상태 텍스트 변화 없음
- 기존 동기화 시각 갱신 — 트리거 결과와 무관하게 `lastSyncedAt`이 갱신되어 새 시각 렌더 확인

### `src/features/watchlist/mutations.test.ts` (신규, 선택)

범위 판단은 Codex에 위임합니다. 필수는 Topbar 통합 테스트이며, `triggerAnalysis` 단위 테스트는 Codex가 필요하다고 판단하면 추가합니다.
