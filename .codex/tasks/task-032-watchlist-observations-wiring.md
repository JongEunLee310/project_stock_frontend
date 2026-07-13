# Codex Handoff Task

## Source Issue

FE #86(watchlist AI 관찰 메모 카드 실데이터 연동). 설계
`docs/designs/75-watchlist-observations-wiring.md`. Pair: BE 060
(`docs/designs/060-watchlist-observations.md`) — 대응 엔드포인트는 이미 BE main에 머지됨
(BE #153, PR #158).

## Task Summary

WatchlistPage의 "AI 관찰 메모" 카드를 `mockWatchlistObservations` mock에서 BE 관찰 메모
API(`GET /watchlists/{watchlist_id}/observations`)로 전환한다. briefing 슬라이스와 동일한
dto·adapter·query 패턴으로 신규 feature 슬라이스를 추가하고, 카드의 mock 사용을 실데이터로
교체한다.

## Goal

완료 시 참이어야 할 것:

- WatchlistPage "AI 관찰 메모" 카드가 `GET /watchlists/{id}/observations` 실데이터를 렌더한다
  (`mockWatchlistObservations` 사용·주석 제거).
- 응답의 `summary`를 리드 문단으로, `items`(심볼별 노트)를 리스트로 렌더한다.
- 로딩은 스켈레톤, 에러·watchlist 없음(null)은 mock 복귀 없이 degradation, 빈 `items`는 요약
  문단만 표시한다.
- lint·typecheck·format·test·build 전부 통과한다.

## Background

- BE 응답 형태(공통 envelope `{data, error, meta}`의 `data`):
  `{ summary: string, items: [{ symbol: string, note: string }], generated_at: string }`.
  기존 http client(`src/shared/api/client.ts`)의 `apiGet<T>`가 envelope을 언랩해 `{data}`를 준다.
  빈 watchlist면 `items`는 빈 배열, `summary`는 존재한다.
- 참조 선례(반드시 패턴 준수): briefing 슬라이스 `src/features/briefing/`의 `dto.ts`·
  `adapters.ts`·`adapters.test.ts`·`queries.ts`. 특히 `usePortfolioBriefing()`가 "첫 포트폴리오
  조회 후 briefing 호출, 없으면 null 반환"하는 흐름을 그대로 미러링한다.
- watchlist id 해소: `src/features/watchlist/queries.ts`의 `useWatchlistSummary`·
  `useWatchlistAssets`가 `apiGet<WatchlistDto[]>('/watchlists?page=1&size=20')` →
  `watchlists[0].id`를 쓴다. observations도 동일하게 첫 watchlist를 쓴다.
- 소비 지점: `src/pages/ui/WatchlistPage.tsx`의 "AI 관찰 레일" aside 카드(약 691~724행).
  현재 `mockWatchlistObservations.map(observation => <li>{observation.text}</li>)`로 렌더하고
  `{/* BE 출처가 없는 관찰 메모는 후속 API까지 mock을 유지한다. */}` 주석이 붙어 있다.
- 도메인 타입 배치: `AiBriefing`·`WatchlistObservation`과 동일하게 신규 도메인 타입을
  `src/shared/model/domain.ts`에 정의하고 `src/shared/model/index.ts`로 export한다.

## Implementation Scope

- `src/features/watchlist-observations/dto.ts` —
  `WatchlistObservationItemDto { symbol: string; note: string }`,
  `WatchlistObservationsDto { summary: string; items: WatchlistObservationItemDto[];
generated_at: string }`, watchlist id 추출용 최소 dto
  `ObservationsWatchlistDto { id: number }`(briefing의 `BriefingPortfolioDto` 패턴).
- `src/features/watchlist-observations/adapters.ts` —
  `adaptWatchlistObservations(dto: WatchlistObservationsDto): WatchlistObservations`.
  `summary`·`items` 매핑, `items ?? []` 방어, `generated_at` 버림.
- `src/features/watchlist-observations/queries.ts` —
  `useWatchlistObservations(): UseQueryResult<WatchlistObservations | null>`.
  `/watchlists?page=1&size=20` → `watchlists[0].id` → `/watchlists/{id}/observations` 호출 후
  `adaptWatchlistObservations` 적용. watchlist 없으면 `null` 반환(`usePortfolioBriefing` 선례).
- `src/features/watchlist-observations/adapters.test.ts` — 아래 Test Requirements 참고.
- `src/shared/model/domain.ts` —
  `WatchlistObservationItem { symbol: string; note: string }`,
  `WatchlistObservations { summary: string; items: WatchlistObservationItem[] }` 추가.
  기존 `WatchlistObservation { id; text }`은 삭제하지 않는다.
- `src/shared/model/index.ts` — 신규 타입 export(기존 export 관례 따름).
- `src/pages/ui/WatchlistPage.tsx` — "AI 관찰 메모" 카드의 `mockWatchlistObservations` 사용·
  주석 제거, `useWatchlistObservations()` 연동. 로딩·에러·null·빈 items·정상 렌더 분기 처리
  (같은 페이지의 `watchlistSummaryQuery` 렌더 분기가 선례).

## Out of Scope

- `mockWatchlistObservations` 정의(`src/shared/mock/domain.ts`)·`WatchlistObservation` 타입
  (`src/shared/model/domain.ts`) 제거 — 정의는 유지하고 WatchlistPage 사용처만 제거한다
  (71·74 관례). 다른 화면이 mock을 참조하는지 확인해 사용처가 남으면 그대로 둔다.
- `generated_at` 화면 표시 — 도메인 타입에 포함하지 않고 adapter에서 버린다.
- 기존 watchlist 슬라이스(`src/features/watchlist/`) 파일 변경.
- 페이지네이션·무한스크롤·"더 보기" 동작 확장, 캐시 재생성 UX.
- BE 변경(별도 repo).

## Protected Files

없음. 위 Implementation Scope 밖 파일은 변경하지 않는다. 특히 briefing 슬라이스와 기존
watchlist 슬라이스는 건드리지 않는다.

## Requirements

- 기존 feature 슬라이스 구조(dto/adapters/queries 분리)와 React Query·http client 관례를 따른다.
- 어댑터는 순수 함수로 두고 단위 테스트한다.
- degradation은 mock 복귀가 아니라 카드 비노출 또는 안내 문구로 처리한다.
- 카드 렌더가 평면 리스트에서 `summary` 리드 문단 + 심볼별 노트 리스트 구조로 바뀐다. 노트
  리스트의 key는 `item.symbol`을 쓴다.

## Test Requirements

- `src/features/watchlist-observations/adapters.test.ts`(briefing `adapters.test.ts` 형식):
  `summary`·`items` 매핑 정상 케이스, `items`가 `null`이면 빈 배열 fallback, `generated_at`이
  도메인 타입에 노출되지 않음.
- WatchlistPage 테스트가 있으면 `useWatchlistObservations`를 mocking해 로딩·에러·null·빈 items·
  정상 렌더 분기를 확인하고, `mockWatchlistObservations`를 사용하는 코드가 남지 않음을 검증한다
  (기존 페이지 테스트 관례).

## Verification Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm format:check`
- `TZ=UTC corepack pnpm test`
- `corepack pnpm build`

## Documentation Impact

설계 `docs/designs/75-watchlist-observations-wiring.md`가 근거(이미 브랜치에 포함). 계약 정렬
문서(있다면)의 관찰 메모 행 갱신은 orchestrator가 리뷰 시 처리한다.

## ADR Need

불필요. 기존 briefing 와이어링 패턴을 따르는 읽기 전용 화면 연동이다.

## Failure Record Need

불필요.

## Risk Level

Low. 읽기 전용 조회 연동이며 BE 계약이 확정되어 있다. 주의점은 envelope 언랩·watchlist id
해소·degradation 처리·카드 렌더 구조 변경 정도다.

## Expected Output

- 위 scope의 코드·테스트 변경.
- 검증 5종 통과 로그.
- 가정(watchlist 없음 처리·degradation 방식·mock 사용처 잔존 여부)과 검증 결과 보고.

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files or the briefing/watchlist slices.
- Report assumptions and verification results.

## Stop Conditions

- BE 응답 필드·envelope 형태가 설계와 다르면 멈추고 보고한다.
- watchlist id 해소가 기존 `useWatchlistSummary` 방식과 맞지 않으면 멈춘다.
