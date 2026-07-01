# 75 · AI 관찰 메모 와이어링 (WatchlistPage)

Status: Draft
Track: FE
Pair: BE 060(`docs/designs/060-watchlist-observations.md`)

## 1. 배경

WatchlistPage의 "AI 관찰 메모" 카드가 `mockWatchlistObservations`(`src/shared/mock/domain.ts`)를
렌더합니다. BE #153·PR #158이 머지되어 `GET /watchlists/{watchlist_id}/observations` 엔드포인트가
제공됩니다. 이 설계는 briefing 슬라이스([[74-ai-briefing-wiring]])와 동일한 dto·adapter·query 패턴으로
해당 카드를 실데이터에 연동합니다.

BE 응답은 공통 envelope `{data, error, meta}`로 감싸이며 `data`는 `summary`(요약 문자열)와
`items`(심볼별 노트 배열)로 구성됩니다. 현재 도메인 타입 `WatchlistObservation`(`id`, `text`의
평면 구조)은 이 계약과 맞지 않으므로, 새로운 도메인 타입 `WatchlistObservations`를 정의합니다.

## 2. 범위

### 포함

- 새 feature 슬라이스 `src/features/watchlist-observations/`: dto·adapter·query.
- WatchlistPage "AI 관찰 메모" 카드: `mockWatchlistObservations` 사용 → `useWatchlistObservations()` 실데이터.
- 카드 렌더 구조 변경: 평면 리스트 → `summary` 리드 문단 + 심볼별 노트 리스트.

### 제외 (mock 유지 / 후속)

- `mockWatchlistObservations` 정의(`src/shared/mock/domain.ts`)·`WatchlistObservation` 타입
  (`src/shared/model/domain.ts`) — 정의 자체는 삭제하지 않고 WatchlistPage의 사용처만 제거합니다
  (71·74 관례).
- `generated_at` 화면 노출 — 도메인 타입에 포함하지 않고 adapter에서 버립니다(briefing 선례).
  표시가 필요해지면 후속에서 뷰 전용 타입으로 확장합니다.
- 기존 watchlist 슬라이스(`src/features/watchlist/`) 파일 — 변경 없습니다.
- 페이지네이션·무한스크롤·캐시 재생성 UX — 본 트랙 밖입니다.

## 3. 변경

### 슬라이스 배치 결정

`src/features/watchlist/`에 합치지 않고 `src/features/watchlist-observations/`를 별도 슬라이스로
생성합니다. observation은 AI 생성 콘텐츠로, watchlist 아이템·요약과 관심사가 독립적입니다. 기존
슬라이스에 추가하면 dto·adapter·query가 비대해지고 두 도메인의 관심사가 혼재됩니다. briefing이
portfolio와 별도 슬라이스인 것과 동일한 근거입니다.

### 3.1 dto (`src/features/watchlist-observations/dto.ts`)

- `WatchlistObservationItemDto { symbol: string; note: string }` — BE 응답 `items` 요소 그대로.
- `WatchlistObservationsDto { summary: string; items: WatchlistObservationItemDto[]; generated_at: string }` —
  `/watchlists/{id}/observations` 응답 `data` 필드.
- `ObservationsWatchlistDto { id: number }` — watchlist 목록 조회 시 id 추출에 사용하는 최소 dto
  (briefing의 `BriefingPortfolioDto` 패턴).

### 3.2 adapters (`src/features/watchlist-observations/adapters.ts`)

- `adaptWatchlistObservations(dto: WatchlistObservationsDto): WatchlistObservations` — `summary`·`items`
  를 그대로 전달하고 `generated_at`은 버립니다. `items`가 `null`·`undefined`이면 빈 배열로 방어합니다.

도메인 타입 (`src/shared/model/domain.ts` 또는 슬라이스 내 export):

- `WatchlistObservationItem { symbol: string; note: string }`
- `WatchlistObservations { summary: string; items: WatchlistObservationItem[] }`

기존 `WatchlistObservation { id: string; text: string }`은 삭제하지 않고 유지합니다.

### 3.3 queries (`src/features/watchlist-observations/queries.ts`)

- `useWatchlistObservations(): UseQueryResult<WatchlistObservations | null>` —
  `useWatchlistAssets`·`useWatchlistSummary`와 동일하게 `/watchlists?page=1&size=20` 조회 후
  `watchlists[0].id`를 취해 `/watchlists/{id}/observations`를 호출하고 `adaptWatchlistObservations`를
  적용합니다. watchlist가 없으면 `null`을 반환합니다(쿼리를 비활성하지 않고 null 반환으로 통일,
  `usePortfolioBriefing` 선례).

### 3.4 WatchlistPage (`src/pages/ui/WatchlistPage.tsx`)

약 691~724행 "AI 관찰 레일" aside 카드를 다음과 같이 교체합니다.

- `mockWatchlistObservations` import·사용과 `/* BE 출처가 없는 ... */` 주석을 제거합니다.
- `useWatchlistObservations()` 결과를 사용합니다.
- **로딩**: 카드 내부를 스켈레톤으로 교체합니다(`watchlistSummaryQuery` 로딩 처리 선례).
- **에러·null(watchlist 없음)**: 카드를 비노출하거나 안내 문구로 degradation합니다. mock으로
  되돌리지 않습니다.
- **빈 items**: `summary`는 존재하므로 요약 문단만 렌더하고 노트 리스트를 생략하거나 빈 상태를
  표시합니다.
- **정상**: `observations.summary`를 리드 문단으로, `observations.items`를 심볼(`item.symbol`)
  키와 노트(`item.note`) 리스트로 렌더합니다. 현재 `<li>{observation.text}</li>` 단일 구조에서
  변경됩니다.

## 4. 테스트

### adapter 단위 테스트 (`src/features/watchlist-observations/adapters.test.ts`)

`src/features/briefing/adapters.test.ts` 형식을 그대로 따릅니다.

- `summary`·`items` 필드 매핑 정상 케이스.
- `items`가 `null`이면 빈 배열로 fallback.
- `generated_at`이 도메인 타입에 노출되지 않음.

### WatchlistPage 렌더 분기

- `useWatchlistObservations` mock 기준 로딩·에러·null(watchlist 없음)·빈 items·정상 케이스별 렌더
  분기를 확인합니다.
- 정상 케이스에서 `summary` 문단과 심볼별 노트 리스트가 렌더됨을 검증합니다.
- `mockWatchlistObservations`를 사용하는 코드가 남아 있지 않음을 확인합니다.

## 5. 관련 링크

- [[71-watchlist-summary-wiring]] — watchlist 첫 조회 패턴 선례
- [[74-ai-briefing-wiring]] — dto·adapter·query 슬라이스 구조 선례
- BE 이슈 #153, BE PR #158 — `GET /watchlists/{watchlist_id}/observations` 구현
- FE 이슈 #86 — 본 작업 이슈
