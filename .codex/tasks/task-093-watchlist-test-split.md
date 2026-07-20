# Codex Handoff Task

## Source Issue

이슈 #236 — `WatchlistPage.test.tsx`를 관심사별로 분할해 부하 상태 타임아웃 flakiness를
해소한다. `gh issue view 236`로 맥락과 재현 표를 읽는다.

## Task Summary

1637행·32개 테스트가 한 파일에 몰려 있는 `src/pages/ui/WatchlistPage.test.tsx`를 관심사별
파일로 나누고, 공통 fixture와 mock 설정을 헬퍼 모듈로 뽑는다. 분할 후 부하 상태에서
재현되는지 확인하고, 여전히 재현되면 `testTimeout`을 상향한다.

## Goal

- 부하 상태에서 스위트를 3회 연속 실행해 타임아웃 실패가 없다.
- 테스트 개수와 단언이 분할 전후로 보존된다.
- 파일당 관심사가 하나로 좁아져 어느 파일을 봐야 하는지 분명해진다.

## Background — 문제의 성격

실패는 모두 `Test timed out in 5000ms`다. `vite.config.ts`에 `testTimeout`이 없어 기본값
5초가 적용되는데, 이 파일은 무거운 페이지를 통째로 렌더링해 개별 테스트가 단독 실행에서도
최대 2.5초를 쓴다. 워커 경합이 생기면 예산을 넘는다.

주의할 점이 있다. **분할만으로는 해소되지 않을 수 있다.** 타임아웃은 파일이 아니라 테스트
단위로 걸리므로 파일을 나눠도 개별 테스트가 빨라지지 않고, 파일이 늘면 병렬 워커가 늘어
경합이 오히려 심해질 여지가 있다. 분할의 주된 이득은 유지보수성이다. 그래서 이 작업은
분할 후 실측으로 확인하고, 남으면 `testTimeout`을 올리는 순서로 진행한다.

## Background — 현재 파일 구조

- 1-30행 — import.
- 31-78행 — `watchlistRows` 등 데이터 fixture.
- 79-95행 — `vi.fn()` 스텁과 pending 플래그(`createAssetIsPending` 등 가변 `let`).
- 97-115행 — `vi.mock('@/shared/ui', ...)`, `vi.mock('@/features/market-indices/queries', ...)`.
- 116-329행 — 각 query 상태를 담은 가변 `let` 객체(`watchlistAssetsQueryState` 등).
- 330-512행 — 위 상태를 돌려주는 `vi.mock` 팩토리 묶음.
- 513-767행 — `beforeEach`에서 모든 상태를 초기값으로 되돌리는 리셋.
- 768-792행 — `renderWatchlist()` 헬퍼.
- 793-1637행 — `describe('WatchlistPage')`와 32개 `it`.

## Implementation Scope

### 1. 헬퍼 모듈 분리

`src/pages/ui/__tests__/watchlistPageTestUtils.ts`(경로와 이름은 저장소 관례에 맞춰 조정
가능)에 다음을 옮긴다.

- 데이터 fixture와 `vi.fn()` 스텁.
- 가변 query 상태 객체와 그 초기값.
- 상태를 초기화하는 `resetWatchlistTestState()` 함수. 현재 `beforeEach` 본문을 그대로 옮긴다.
- `renderWatchlist()` 헬퍼.
- 각 모듈의 mock 팩토리를 만들어 돌려주는 함수(예: `createWatchlistQueriesMock()`).

**`vi.mock` 호출 자체는 각 테스트 파일에 남긴다.** `vi.mock`은 파일 단위로 호이스팅되므로
헬퍼 안에서 호출하면 적용되지 않는다. 각 테스트 파일이
`vi.mock('@/features/watchlist/queries', () => createWatchlistQueriesMock())` 형태로 헬퍼의
팩토리를 참조한다. 팩토리 본문은 지연 실행되므로 정적 import한 헬퍼 바인딩을 참조해도
동작하지만, 호이스팅 시점에 값이 필요한 것(`useWatchlistAssetsMock`·`sparklineMock` 같은
`vi.hoisted` 대상)은 헬퍼에서도 `vi.hoisted`로 유지한다.

mock 대상 모듈 목록이 파일마다 다르면 상태가 어긋나므로, **모든 분할 파일이 동일한 mock
집합을 선언한다.** 중복이 부담되면 팩토리를 한 번에 등록하는 형태로 묶되, `vi.mock` 호출
자체는 각 파일에 남는다는 제약을 지킨다.

### 2. 테스트 분할

`describe('WatchlistPage')`의 32개 테스트를 다음 다섯 갈래로 나눈다. 파일명은 저장소 관례를
따르되 관심사가 드러나게 한다.

- **표시·레이아웃** — 구조 렌더링, KPI 카드 불릿, 헤더 툴팁 지표 가이드, 관찰 메모 토글,
  스파크라인 로딩·렌더·빈 시리즈.
- **테이블·셀** — 컬럼과 종목 셀, 평가 배지 로딩·실패·심볼 누락, 매수 여력 fallback, USD
  원화 환산과 fx 실패.
- **필터·페이지네이션** — 검색, 시장 필터, 위험 상태 필터, 필터 변경 시 페이지 초기화,
  서버 페이지네이션과 페이지 크기.
- **종목 추가 모달** — 조회 자산 선택·추가, 미등록 자산 생성 후 추가, 포커스 트랩, Escape,
  제출 중 Escape 무시, 추가 실패, 시장 검증 실패, 빈 조회 결과.
- **행 액션·상태** — 항목 삭제와 pending 비활성화, 리서치 이동, 로딩·에러·빈 상태, 최근
  관심종목 빈 상태, 관찰 로딩·에러·null·빈 상태.

각 파일은 `describe`로 관심사를 감싸고 `beforeEach(resetWatchlistTestState)`를 호출한다.

### 3. 실측 확인

분할 후 부하 상태에서 스위트를 3회 연속 실행한다. 부하는 다음과 같이 준다.

```
for i in $(seq 1 12); do (while :; do :; done) & done
LOADPIDS=$(jobs -p)
# 여기서 corepack pnpm test 를 3회 실행
kill $LOADPIDS
```

3회 모두 타임아웃 실패가 없으면 분할만으로 끝난 것이다. 한 번이라도 재현되면
`vite.config.ts`의 `test.testTimeout`을 올린다. 값은 관측된 최장 테스트 소요를 근거로 정하고,
근거가 되는 수치를 보고에 적는다. 임의로 큰 값을 넣지 않는다.

## Out of Scope

- 테스트 단언 내용 변경. 분할은 이동이며 커버리지를 유지한다. 중복이라고 판단되는 단언도
  임의로 지우지 않는다.
- `PortfolioPage.test.tsx`·`DecisionLogPage.test.tsx` 분할. 같은 위험대이지만 이번 범위 밖이다.
- 프로덕션 코드 변경. `WatchlistPage.tsx`를 비롯한 `src/` 아래 구현 파일은 건드리지 않는다.
- CI workflow 변경.
- vitest pool·워커 수 설정 변경. 재현이 남으면 `testTimeout`만 조정한다.

## Protected Files

- `src/pages/ui/WatchlistPage.tsx`와 그 외 모든 프로덕션 코드.
- `.github/workflows/` 아래 전부.

## Requirements

1. 분할 후 테스트 총 개수가 32개로 보존된다.
2. 공통 fixture와 리셋 로직이 헬퍼 한 곳에 있고 파일마다 복사되지 않는다.
3. 각 분할 파일이 단독으로도 통과한다.
4. 부하 상태 3회 연속 실행에서 타임아웃 실패가 없다.
5. 분할만으로 해소됐는지, `testTimeout` 상향이 필요했는지 보고에 명시한다.

## Verification Commands

- `pnpm format:check`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- 위 부하 스크립트를 이용한 3회 반복 실행.

## Documentation Impact

없음(테스트 구조 개선). `testTimeout`을 상향한 경우 그 근거 수치를 PR 본문에 남길 수 있도록
보고에 포함한다.

## Risk Level

Medium — 단언 자체는 옮기기만 하지만 `vi.mock` 호이스팅과 가변 상태 공유 때문에 분할이
까다롭다. 상태 리셋이 파일 간에 새면 테스트가 서로 간섭한다. 각 파일 단독 실행 통과를
반드시 확인한다.

## Expected Output

- 헬퍼 모듈과 분할된 테스트 파일들, 필요 시 `vite.config.ts`의 `testTimeout`.
- 지정된 현재 브랜치에 커밋. 자체 브랜치 생성 금지.
- 검증 4종 통과와 부하 3회 실행 결과 보고. 분할만으로 끝났는지 여부를 명시한다.

## Rules

- Stay within scope. 프로덕션 코드와 단언 내용은 건드리지 않는다.
- Do not weaken verification. 테스트를 지워서 통과시키지 않는다.
- 지정된 현재 브랜치를 유지한다. 새 브랜치 금지.
- Report assumptions and verification results.
