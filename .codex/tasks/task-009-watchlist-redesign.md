# Codex Handoff Task — task-009: Watchlist 시안 보강 (이슈 8)

## Source Issue

- 이슈 8. `[FE] Watchlist 관심 종목 페이지 구현` — 시안(`watchlist.png`) 기반 보강 (Refs #8)
- 설계 기록: `docs/designs/8-watchlist-page.md`(시안 반영 목표 설계)
- 의존(머지 필요): **PR #31(task-008 기본 Watchlist)이 `main`에 머지된 뒤** 그 위에서 작업.
- 기반 브랜치: `feat/fe-watchlist-redesign`(PR #31 머지된 최신 `main` 기반으로 rebase/분기,
  본 설계 커밋 포함).

## Task Summary

PR #31의 기본 Watchlist를 시안 수준으로 보강한다. 도메인/Mock을 확장하고(테마 과열·마지막 갱신·
즐겨찾기 등), 요약 KPI 카드 4종, 테이블 컬럼 확장(즐겨찾기·로고·테마 과열·마지막 갱신·행 메뉴),
AI 관찰 우측 레일을 구현한다. **차트(스파크라인·도넛·막대)는 이슈 19로 분리** — 본 task는 자리표시/
수치만 둔다.

## Goal

- `/watchlist`가 시안 구조(툴바·요약 카드 4·확장 테이블·AI 관찰 레일)를 갖춘다.
- 테이블에 즐겨찾기(★, mock 표시)·종목 로고(심볼 이니셜 대체)·테마 과열·마지막 갱신·행 케밥 메뉴가 보인다.
- 요약 카드 4종이 라벨·값·전일 대비 델타와 함께 표시된다(미니 시각화 자리는 자리표시).
- AI 관찰 레일(관찰 메모·추가된 관심 종목·알림 설정 미리보기)이 표시된다.
- 종목/행/행 메뉴에서 `/research/:symbol`로 이동한다. 기존 필터·검색·정렬은 유지하고 **필터 초기화**·
  **종목 추가** 버튼을 추가한다(추가 버튼은 자리/후속 동작).
- 기존 공통 컴포넌트를 최대 재사용한다.

## Background

- 베이스라인: PR #31의 `src/pages/ui/WatchlistPage.tsx`(검색·시장/위험 필터·정렬·요약 카드·
  `Table<Stock>`·심볼 Link·행 액션). 본 task는 이를 **대체·확장**한다.
- `Table<T>`: `columns`/`rows`/`getRowKey`/`rowAction`/`pagination`/`emptyMessage` 지원
  (`src/shared/ui/Table.tsx`). 헤더 도구·행 메뉴는 `Table` 외부 래핑 또는 `rowAction`/컬럼으로 구성.
- `Badge`: `status`(StockStatus) 또는 `riskLevel`(RiskLevel) 매핑. 테마 과열은 `RiskLevel`이므로
  `Badge riskLevel`로 표시 가능.
- 도메인: `Stock`/`RiskLevel`/`ValuationLevel`/`AiBriefing` 등은 `src/shared/model`에 존재.
- 컨벤션: `docs/knowledge/frontend-conventions.md` — 공통 컴포넌트 우선, **네이티브 다이얼로그 금지**.
- 확정 결정(설계 "결정" 절): 로고=심볼 이니셜 대체, 즐겨찾기=mock `isFavorite` 표시 위주,
  정렬=단일 키+방향.

## Implementation Scope

### A. 도메인·Mock 확장 (`src/shared/model`, `src/shared/mock`)

- `Stock` 확장: `themeHeat: RiskLevel`, `lastUpdatedAt: string`, `isFavorite: boolean`.
  (스파크라인용 `changeSeries?: number[]`는 선택 — 추가 시 표시는 하지 않음, #19 대비 데이터만.)
- 신규 모델(필드는 설계 기록 따름, 현재 요구 필드만):
  - `WatchlistSummaryCard` — `label`·`value`·`deltaLabel`(전일 대비)·`trend`('up'|'down'|'flat' 등).
  - `WatchlistObservation` — 관찰 메모 항목(`text`). (기존 `AiBriefing` 재사용이 맞으면 그걸 사용.)
  - `RecentWatchlistItem` — `symbol`·`name`·`status`(StockStatus)·`addedAt`.
  - `WatchlistAlertSetting` — `label`·`value`(임계값 미리보기 문자열).
- `index.ts` 배럴에 신규 타입 export.
- Mock: `mockStocks`에 신규 필드(`themeHeat`/`lastUpdatedAt`/`isFavorite`) **빠짐없이** 채움.
  신규 mock 추가: `mockWatchlistSummary`(카드 4), `mockWatchlistObservations`,
  `mockRecentWatchlist`(3개 이상), `mockWatchlistAlertSettings`. 모두 `satisfies`.

### B. 페이지·UI (`src/pages`, 필요 시 `widgets`/`entities`/`shared/ui`)

- `WatchlistPage` 보강: 툴바(+필터 초기화·종목 추가), 요약 카드 4, 확장 테이블, AI 관찰 레일.
- 종목 셀: 로고 자리에 **심볼 이니셜**(단색 배경 원/사각 + 첫 글자) + 티커 + 이름.
- 즐겨찾기 ★: `isFavorite` 표시(채움/빈 별). 토글은 로컬 상태로 즉시 반영 가능(영속화 불필요).
- 테이블 컬럼: ★ · 종목 · 상태 · 변화율(1D)(±%, 스파크라인 자리) · 뉴스 위험도 · 밸류에이션 ·
  테마 과열 · AI 판단 · 마지막 갱신 · ⋮(행 메뉴).
- 행 케밥 메뉴(⋮): 리서치 보기·결정 기록·관심 해제 등 인앱 메뉴(드롭다운). **네이티브 다이얼로그 금지.**
- 테이블 카드 헤더 도구: 열 설정·내보내기·전체화면 — **자리/후속**(클릭 동작은 stub 또는 비활성, 시각만).
- AI 관찰 레일: 관찰 메모·추가된 관심 종목·알림 설정 미리보기 카드.

## Out of Scope

- **차트 렌더(스파크라인·도넛·막대) = 이슈 19.** 자리표시/수치만.
- 실제 API·서버 상태(이슈 17), Loading/Empty/Error 공통 상태 컴포넌트 신설(이슈 18, `Table` 기본만).
- **종목 추가·내보내기·전체화면·관찰 메모 편집·알림 설정**의 실제 동작(각 후속 이슈). 본 task는 UI/
  네비게이션·자리까지.
- 다른 페이지(Signals/Research/Decision Log/Dashboard).

## Protected Files

없음.

## Requirements

- 시안 구조 충족: 툴바·요약 카드 4·확장 테이블·AI 관찰 레일.
- 테이블 신규 컬럼(테마 과열·마지막 갱신)과 즐겨찾기·로고(이니셜)·행 메뉴 표시.
- 검색(심볼/이름)·시장·위험도 필터·정렬(단일 키+방향)·**필터 초기화** 동작.
- 상태/뉴스 위험도/테마 과열은 `Badge` 재사용. 변화율 부호별 색상.
- 종목/행/행 메뉴 → `/research/<symbol>` 이동.
- 네이티브 `alert/confirm/prompt` 금지 — 행 메뉴·확인은 인앱 UI.
- 접근성: 테이블 `aria-label`, 메뉴/버튼 키보드 접근, 별 토글 `aria-pressed` 등.
- 신규 공통 컴포넌트(드롭다운 메뉴·Select 등)가 필요하면 `shared/ui`에 재사용 가능하게 만들되 과도한
  추상화 금지. 추가 시 보고.
- 현재 요구 필드·동작만. 불필요한 추상화 금지.

## Test Requirements

- `src/shared/mock` 테스트 확장: 신규 stock 필드 유효성(`riskLevels`에 `themeHeat` 포함,
  `lastUpdatedAt`/`isFavorite` 존재), `mockRecentWatchlist.length >= 3`, 요약 카드 4개.
- `src/pages/ui/WatchlistPage.test.tsx` 확장: 신규 컬럼(테마 과열·마지막 갱신)·즐겨찾기·요약 카드 4·
  AI 관찰 레일 렌더; 필터 초기화 동작; 종목/행 메뉴에서 `/research/:symbol` 이동.
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

- 구현이 설계와 벗어나면 `docs/designs/8-watchlist-page.md` 갱신.
- `src/shared/README.md`의 도메인·Mock 설명에 신규 모델 한두 줄 반영.

## ADR Need

불필요. 기존 FSD·공통 컴포넌트 위 페이지 보강 + 기존 도메인 점진 확장. 신규 아키텍처 결정 없음.

## Failure Record Need

불필요.

## Risk Level

Medium. 도메인/Mock 확장 + 페이지 대폭 보강 + 신규 공통 컴포넌트(드롭다운 메뉴) 가능성. 범위가 넓어
컬럼·레일·상호작용·테스트가 많다. 차트는 분리해 위험을 낮춤.

## Expected Output

- 변경: `src/shared/model/`(domain 확장 + index), `src/shared/mock/`(domain 확장 + index + 테스트),
  `src/pages/ui/WatchlistPage.tsx`(+ 하위 조립·필요 시 `widgets`/`entities`/`shared/ui` 신규), 페이지 테스트,
  `src/shared/README.md`.
- `feat/fe-watchlist-redesign` 브랜치에서 PR 1건(`Refs #8`; #31이 #8을 Close하므로 본 PR은 보강).
- 변경 파일·검증 결과·가정(신규 컴포넌트 추가 여부, 행 메뉴 항목, 카드 수치 근거) 보고.

## Rules

- **PR #31이 `main`에 머지된 뒤** 최신 `main` 기반에서 작업(브랜치 `feat/fe-watchlist-redesign`).
- 차트는 구현하지 않는다(#19). 자리표시/수치만.
- 공통 컴포넌트 우선, 네이티브 다이얼로그 금지, 도메인 신규 필드는 기존 mock에 반드시 채운다.
- 범위 내 유지, 검증 약화 금지. 가정·검증 결과 보고.
