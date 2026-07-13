# 설계 기록: 이슈 #68 Dashboard 우선 확인 큐 실 API 전환

## 1. 배경 / 현황

Dashboard "우선 확인 큐"(Priority Queue) 섹션은 현재 `mockPriorityQueue`(정적 배열)로 렌더된다. 모듈 최상위에서 정렬 후 slice 없이 전체를 표시하며, 로딩·에러·빈 상태 분기가 없다.

BE PR #124(머지 대기)가 `/alert-candidates`에 `?expand=asset` 쿼리파라미터를 추가해 각 후보 항목에 `asset:{symbol,name,price,change_percent,sector?}`를 포함시킨다. 이 필드가 있으면 FE에서 종목 research 딥링크를 걸 수 있다.

동시에 현재 `AlertCandidateDto`와 BE 실제 계약 사이에 3건의 불일치가 확인됐다. 본 설계는 Priority Queue 전환과 계약 갭 해소를 함께 처리한다.

## 2. 연결 결정

`useAlertCandidates` 쿼리를 DashboardPage에 도입해 Priority Queue를 실 API로 전환한다.

- 상위 3개 항목 선택: `riskLevel` 기준 높음 → 중간 → 낮음 정렬 후 `slice(0, 3)`. 기존 mock 정렬 로직(`riskRank = {높음:0, 중간:1, 낮음:2}`)과 동치이므로 표시 순서 보장.
- 로딩·에러·빈 분기: 동일 파일 시그널 섹션(579~610행) 패턴을 그대로 미러.
- 종목 링크: `item.symbol` null 가드 — symbol이 있으면 `getResearchPath(item.symbol)` Link, null이면 일반 텍스트(title). risk 배지는 `<Badge riskLevel={item.riskLevel}>{item.riskLevel}</Badge>`.

**BE #124 미머지 시 저하(graceful degradation) 정책**: `?expand=asset`을 쿼리에 포함하더라도 BE가 아직 지원하지 않으면 응답에 `asset` 필드가 없다. adapter는 `symbol ← dto.asset?.symbol ?? null`로 처리하므로 `item.symbol`이 `null`이 되고, 링크 없이 제목만 텍스트로 표시된다. 큐 자체(title, reason, riskLevel 배지)는 정상 렌더된다. **이 동작을 의도적 저하로 설계에 확정한다.** FE 단독 머지가 가능하며 BE #124 머지 이후 자동으로 링크가 활성화된다.

## 3. 타입 갭 해소

현 `AlertCandidateDto`와 BE 실계약 간 불일치를 정렬한다.

### 3-1. 계약 갭 요약

| 항목          | 현 FE (`dto.ts`)                    | BE 실계약                               |
| ------------- | ----------------------------------- | --------------------------------------- |
| `reason`      | `reason: string`                    | `message: string \| null`               |
| `symbol` 위치 | top-level `symbol?: string \| null` | `expand=asset` 시 `asset.symbol`만 존재 |
| `importance`  | 없음                                | `importance: string`                    |
| `asset`       | 없음                                | `expand=asset` 시 `asset: {...}`        |

### 3-2. `AlertCandidateAssetDto` (신규)

`WatchlistItemAssetDto`(`src/features/watchlist/dto.ts:8`)와 동형으로 alerts 도메인 내에 정의한다.

```ts
// src/features/alerts/dto.ts
interface AlertCandidateAssetDto {
  symbol: string
  name: string
  price: string | null
  change_percent: string | null
  sector?: string | null
}
```

### 3-3. `AlertCandidateDto` 수정 사항

- `reason: string` → `message: string | null`
- `symbol?: string | null` 제거 (`asset_id?: number | null` 유지)
- `importance: string` 추가
- `asset?: AlertCandidateAssetDto` 추가

### 3-4. `AlertCandidate` 인터페이스 및 `adaptAlertCandidate` 수정 사항

`AlertCandidate` 인터페이스 변경:

- `reason: string` → `reason: string` 유지(표시 필드명은 FE 도메인 언어 유지), 값 소스를 `dto.message`로 전환
- `symbol: string | null` 유지, 소스를 `dto.asset?.symbol ?? null`로 전환
- `riskLevel: RiskLevel` 신규 추가 (`RiskLevel` = `'높음' | '중간' | '낮음'`, `src/shared/model/riskLevel.ts:3`)

`adaptAlertCandidate` 매핑 변경:

- `symbol` ← `dto.asset?.symbol ?? null`
- `reason` ← `dto.message ?? ''`
- `riskLevel` ← `toLabel(riskLevelLabels, dto.importance) as RiskLevel`
  - `riskLevelLabels`는 `src/shared/lib/format/enumLabel.ts`의 기존 상수 재사용 (`HIGH→높음 / MEDIUM→중간 / LOW→낮음`)
  - `as RiskLevel` 캐스트는 BE `importance` 값이 HIGH/MEDIUM/LOW로 한정됨을 전제. 미매핑 값이 오면 `toLabel` fallback으로 원문 영문 그대로 반환하므로 Badge 렌더가 비결정적이 됨 → 리스크 섹션 참조
- `candidateType`, `status`, `createdAt` 매핑 방식 유지

### 3-5. `useAlertCandidates` 경로 변경

`src/features/alerts/queries.ts`:

- `apiGet<AlertCandidateDto[]>('/alert-candidates')` → `apiGet<AlertCandidateDto[]>('/alert-candidates?expand=asset')`
- 쿼리키 변경 없음

## 4. 파일 변경 (시그니처)

### `src/features/alerts/dto.ts`

```
+ interface AlertCandidateAssetDto
  AlertCandidateDto: reason 제거, message/importance/asset 추가, symbol 제거
```

### `src/features/alerts/adapters.ts`

```
  AlertCandidate: symbol/reason 소스 변경, riskLevel: RiskLevel 추가
  adaptAlertCandidate(dto: AlertCandidateDto): AlertCandidate — 매핑 3건 변경
```

### `src/features/alerts/queries.ts`

```
  useAlertCandidates(): UseQueryResult<AlertCandidate[]>
    — apiGet 경로에 ?expand=asset 추가
```

### `src/pages/ui/DashboardPage.tsx`

```
imports:
  - mockPriorityQueue 제거 (mockAiBriefing 유지)
  + useAlertCandidates, AlertCandidate from @/features/alerts

모듈 최상위:
  - const priorityQueue (115~120행) 및 /* TODO: BE 없음 */ 주석 제거

컴포넌트 내:
  + const candidatesQuery = useAlertCandidates()
  + const topCandidates: AlertCandidate[] — riskLevel 정렬 후 slice(0, 3)

"우선 확인 큐" 카드 렌더:
  - priorityQueue.map(...) 제거
  + candidatesQuery.isLoading → <Skeleton ...>
  + candidatesQuery.isError → <ErrorState ... onRetry={refetch}>
  + topCandidates.length === 0 → <EmptyState>
  + topCandidates.map(item => ...) — symbol null 가드 포함
```

## 5. 테스트 계획

### `src/features/alerts/adapters.test.ts`

기존 `adaptAlertCandidate` 케이스를 신계약 입력으로 갱신:

- 입력: `{message, importance, asset: {symbol, ...}}` 구조
- 단언: `reason`(← `message`), `symbol`(← `asset.symbol`), `riskLevel`(← `importance` 변환) 검증
- 추가 케이스: `asset` 없을 때 `symbol`이 `null`임을 단언 (BE #124 미머지 저하 시나리오)

### `src/pages/ui/DashboardPage.test.tsx`

- `useAlertCandidates` vi.mock 추가
- 케이스 1(실데이터): 3건 반환 → Priority Queue 항목 제목 렌더 단언
- 케이스 2(로딩): `isLoading=true` → Skeleton 표시 단언
- 케이스 3(에러): `isError=true` → ErrorState 표시 단언
- 케이스 4(빈): 빈 배열 → EmptyState 표시 단언
- 기존 `mockPriorityQueue` 기반 단언 제거

### `src/pages/ui/AlertsPage.tsx`

candidate adapter 변경(`reason`/`symbol` 정상화)의 수혜자이나 코드 변경 없음. 별도 테스트 케이스 추가 불필요 — 기존 AlertsPage 테스트가 통과하면 충분.

## 6. 범위 밖 / 리스크

### 범위 밖

- `/alerts` (AlertDto, alert 경로) — 별도 도메인, 본 이슈 미포함
- `mockAiBriefing` 및 다른 mock 섹션 — BE 엔드포인트 없음, 유지
- BE PR #124 내용 — 별도 PR
- 검증 명령(`pnpm lint`, `pnpm typecheck`, `TZ=UTC pnpm test`, `pnpm build`) — 핸드오프에서 실행

### 리스크

**R1. `importance` 미매핑 시 Badge 비결정적 렌더**: BE가 HIGH/MEDIUM/LOW 외 값을 보내면 `toLabel` fallback이 원문 영문을 반환하고 `as RiskLevel` 캐스트가 유지되어 Badge가 예상 스타일 없이 렌더된다. BE 계약에 importance enum이 고정돼 있는지 핸드오프 전 확인 권장. 필요 시 `fallback='낮음'` 추가.

**R2. BE #124 미머지 + 기존 `/alert-candidates` 응답 구조 변동**: BE가 현재 `reason` 필드를 반환 중이라면 `dto.message`가 `undefined`가 되어 `reason: ''`로 표시된다. BE 현행 필드명을 핸드오프 시 재확인한다.

**R3. `alertQueryKeys.candidates` 캐시 공유**: DashboardPage와 AlertsPage가 동일 쿼리키를 공유하므로 한쪽 refetch가 양쪽 UI를 갱신한다 — 의도된 동작으로 판단하나 명시.
