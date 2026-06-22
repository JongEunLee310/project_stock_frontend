# Codex Handoff Task — task-008: Watchlist 관심 종목 페이지 (이슈 8)

## Source Issue

- 이슈 8. `[FE] Watchlist 관심 종목 페이지 구현` (Closes #8)
- 설계 기록: `docs/designs/8-watchlist-page.md`
- 의존(머지됨): task-006 Table(`shared/ui/Table`, PR #29), task-007 도메인·Mock 확장(PR #30)
- 기반 브랜치: `feat/fe-watchlist-page`(최신 `main`에서 분기, 본 설계·핸드오프 커밋 포함)

## Task Summary

`WatchlistPage`를 플레이스홀더에서 실제 화면으로 교체한다. `mockStocks` 기반으로 검색·필터·정렬,
요약 카드, 관심 종목 테이블(상태/위험도 배지·행 액션·행 클릭 이동)을 구현한다.

## Goal

- `/watchlist`에서 NVDA/AAPL/TSLA/MSFT 등 mock 종목이 테이블로 표시된다.
- 각 행에 상태·변화율·뉴스 위험도·밸류에이션·AI 판단이 보인다.
- 검색·시장·위험도 필터·정렬 UI가 동작해 표시 행을 좁힌다.
- 종목(행 또는 심볼) 클릭 시 `/research/:symbol`로 이동한다.
- 기존 공통 컴포넌트(`Table`/`Badge`/`Button`/`Input`/`Card`)를 재사용한다.

## Background

- 기존 `WatchlistPage`는 `PagePlaceholder` 래퍼 한 줄(`src/pages/ui/WatchlistPage.tsx`).
- 데이터: `mockStocks`(`src/shared/mock/domain.ts`) — `Stock`에 `market`/`status`/`changePercent`/
  `newsRisk`(`RiskLevel`)/`valuation`(`ValuationLevel`)/`aiVerdict` 포함.
- `Table<T>`: `columns`(`key`/`header`/`cell`/`align`/`sortable`), `rows`, `getRowKey`, `rowAction`,
  `pagination`, `emptyMessage`/`loadingMessage` 지원(`src/shared/ui/Table.tsx`).
- `Badge`는 `status`(StockStatus) 또는 `riskLevel`(RiskLevel) 중 하나로 색상 자동 매핑.
- 라우트: `appRoutePaths.research = '/research/:symbol'`. 이동은 `react-router-dom`의 `useNavigate` 또는
  `Link` 사용. research 네비 매칭은 prefix `/research`로 이미 동작.
- 컨벤션: `docs/knowledge/frontend-conventions.md` — 공통 컴포넌트 우선, 네이티브 다이얼로그 금지.

## Implementation Scope

- `src/pages/ui/WatchlistPage.tsx` 구현(플레이스홀더 제거).
- 페이지 하위 조립 요소(요약 카드 그룹, 필터 바)는 재사용 신호가 약하면 페이지 내부 또는 페이지
  디렉터리 하위 파일로 둔다. 2곳 이상 재사용/도메인 표현이면 적절 레이어(`widgets`/`features`/`entities`)로 분리.
- 검색·필터·정렬은 클라이언트 `useState` + `useMemo` 파생으로 처리.
- 필요한 배럴(`src/pages/index.ts` 등) export 정리.

## Out of Scope

- 실제 API·서버 상태 관리(이슈 17), 차트(이슈 19), Loading/Empty/Error 공통 상태 컴포넌트 신설(이슈 18 —
  본 페이지는 `Table` 기본 empty/loading만 사용).
- 다른 페이지(Signals/Research/Decision Log/Dashboard) 구현.
- 도메인 타입·Mock 구조 변경(`shared/model`·`shared/mock`). 표시에 필요한 읽기만.
- 공통 UI 프리미티브 대규모 신설. (드롭다운/Select가 꼭 필요하고 기존에 없으면, 과도한 추상화 없이
  최소 구현하되 새 공통 컴포넌트 추가 여부는 보고 후 진행.)

## Protected Files

없음.

## Requirements

- 관심 종목 테이블: 컬럼 = 심볼/이름, 시장, 현재가, 변화율, 상태(`Badge status`),
  뉴스 위험도(`Badge riskLevel`), 밸류에이션, AI 판단. 변화율은 부호별 색상(상승/하락) 표시.
- 검색: 심볼/이름 부분 일치(대소문자 무시).
- 필터: 시장, 뉴스 위험도(`riskLevels`). 정렬: 변화율·현재가 등 수치 기준 + 방향 토글.
- 요약 카드: 종목 수, 위험('높음') 종목 수, 상승/하락 종목 수 등 mock 파생 집계 표시(`Card` 재사용).
- 행 액션: 행별 액션(최소 "리서치 보기"). 네이티브 `alert/confirm/prompt` 금지 — 네비게이션/인앱 UI.
- 종목 클릭 → `/research/<symbol>` 이동.
- 접근성: 테이블 `aria-label`, 인터랙티브 요소 키보드 접근 가능.
- 현재 단계 불필요한 추상화 금지. 기존 디자인 토큰·클래스 패턴(`app-*`) 재사용.

## Test Requirements

- `src/pages/ui/WatchlistPage.test.tsx`(또는 동등 위치) 추가:
  - mock 종목(NVDA/AAPL/TSLA) 표시.
  - 상태·변화율·뉴스 위험도·밸류에이션·AI 판단 셀 렌더.
  - 검색/필터 입력이 표시 행을 좁힌다(예: 검색어 입력 후 특정 종목만 남음).
  - 종목 클릭/행 액션이 `/research/:symbol` 경로로 이동(라우터 렌더 또는 navigate mock으로 검증).
- 기존 테스트 전부 통과 유지.

## Verification Commands

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

> CI는 `format:check`(Prettier)를 강제한다. 커밋 전 변경 파일에 한정해 `prettier --write`로 포맷을 맞춘다.
> `pnpm format`은 저장소 전체를 건드리니 변경 파일에 한정할 것.

## Documentation Impact

- 신규 ADR·실패 기록 불필요.
- 페이지 구현이 설계와 벗어나면 `docs/designs/8-watchlist-page.md`를 갱신해 동기화.

## ADR Need

불필요. 기존 아키텍처(FSD)·공통 컴포넌트 위 페이지 조립이며 신규 아키텍처 결정 없음.

## Failure Record Need

불필요.

## Risk Level

Low~Medium. UI 한정(페이지 레이어), 도메인·Mock·공통 컴포넌트 불변. 다만 필터/정렬/이동 상호작용과
테스트가 포함돼 단순 표시보다 범위가 넓다.

## Expected Output

- 변경: `src/pages/ui/WatchlistPage.tsx`(+ 필요 시 페이지 하위 조립 파일·배럴), 페이지 테스트.
- `feat/fe-watchlist-page` 브랜치에서 PR 1건(`Closes #8`).
- 변경 파일·검증 결과·가정(필터/정렬 기본값, 행 액션 구성, 새 컴포넌트 추가 여부) 보고.

## Rules

- 기반 브랜치 `feat/fe-watchlist-page`에서 작업(최신 `main` 기반). 범위 내 유지, 검증 약화 금지.
- 공통 컴포넌트 우선: 기존 `shared/ui`를 재사용하고 일회성 인라인 UI를 지양한다.
- 네이티브 다이얼로그 금지. 알림·확인이 필요하면 인앱 UI/네비게이션.
- 도메인·Mock·다른 페이지는 손대지 않는다.
- 가정·검증 결과 보고.
