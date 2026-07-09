# Task 052: watchlist KPI 카드 아이콘 개편

- Issue: #127
- Design: docs/designs/127-kpi-card-icons.md
- Branch: feat/127-kpi-card-icons (현재 브랜치 유지, 새 브랜치 생성 금지)
- Commit: 금지 — 변경만 남기고 종료 (커밋은 오케스트레이터가 수행)

## Goal

관심 종목 페이지 KPI 카드 4장의 글리프 아이콘(`▱ ▣ ⌕ ↗`)을 react-icons(Lucide)
아이콘으로 교체하고, 카드 우상단 원형 칩 대신 카드 제목 왼쪽에 글머리처럼 배치한다.

## Preconditions

- react-icons 5.7.0은 이미 설치되어 있다 (`react-icons/lu`에서 import).
- 사용할 아이콘: `LuBookmark`(전체 관심 종목), `LuTriangleAlert`(위험 증가 종목),
  `LuSearch`(추가 리서치 필요), `LuHistory`(신규 매수 여력).

## Steps

1. `src/pages/ui/WatchlistPage.tsx`
   - `summaryIcons`(글리프 배열)와 `summaryIconClassNames`(원형 칩 배경+텍스트 색)를
     아이콘 컴포넌트 + 텍스트 색 클래스 매핑으로 교체한다. 색상 코딩은 기존
     blue-300/rose-300/amber-200/emerald-200 텍스트 색만 유지하고 배경 칩은 제거한다.
   - KPI 카드 4곳(summaryCards map 2장, 추가 리서치 필요, 신규 매수 여력)의 헤더에서
     우상단 원형 칩 `<span>`을 제거하고, 제목 `<span>` 안에서 제목 텍스트 왼쪽에
     아이콘을 인라인 렌더링한다 (`flex items-center gap-2`, 아이콘 `aria-hidden="true"`).
2. `src/pages/ui/WatchlistPage.test.tsx`
   - KPI 카드 제목 4개 각각에 대해 제목 요소와 같은 헤더 컨테이너 안에 svg 아이콘이
     렌더링됨을 단언하는 테스트를 추가한다.

## Verification

- `corepack pnpm format:check`
- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `corepack pnpm test`

## Constraints

- KPI 카드 외 영역의 글리프(검색 ⌕, 정렬 ↕ 등)는 건드리지 않는다.
- 새 의존성 추가 금지 (react-icons는 이미 추가됨).
