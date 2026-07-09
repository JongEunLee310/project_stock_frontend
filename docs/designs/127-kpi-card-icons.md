# Design: watchlist KPI 카드 아이콘 개편 (#127)

- Status: Approved
- Issue: https://github.com/JongEunLee310/project_stock_frontend/issues/127
- Author: Claude Code (orchestrator)

## Problem

관심 종목 페이지 KPI 카드 4장의 아이콘이 텍스트 글리프(`▱ ▣ ⌕ ↗`)이고 카드 우상단
원형 칩에 배치되어 있어, 제목과 시각적으로 분리되고 실제 의미(북마크·경고·리서치·
이력)를 전달하지 못한다.

## Decisions

- react-icons(`react-icons/lu`, Lucide 세트)를 도입한다. 프로젝트에 아이콘
  라이브러리가 없고, Lucide는 shadcn 계열 스타일과 일관된다.
- 아이콘은 카드 우상단 원형 칩을 제거하고 카드 제목 왼쪽에 글머리(bullet)처럼
  인라인 배치한다.
- 카드별 아이콘 매핑:
  - 전체 관심 종목: `LuBookmark`
  - 위험 증가 종목: `LuTriangleAlert` — 고평가 배지 indicator(`⚠︎`)와 동일 계열
  - 추가 리서치 필요: `LuSearch`
  - 신규 매수 여력: `LuHistory`
- 기존 원형 칩의 색상 코딩(blue/rose/amber/emerald)은 아이콘 텍스트 색으로 유지한다.
- 아이콘은 장식 요소이므로 `aria-hidden="true"`를 유지한다.

## Affected Files

- `package.json` — react-icons 의존성 추가
- `src/pages/ui/WatchlistPage.tsx` — `summaryIcons`/`summaryIconClassNames` 글리프
  상수를 아이콘 컴포넌트 매핑으로 교체, KPI 카드 헤더 레이아웃 변경(우상단 칩 제거,
  제목 왼쪽 인라인)
- `src/pages/ui/WatchlistPage.test.tsx` — KPI 카드 제목 옆 svg 아이콘 렌더링 단언

## Out of Scope

- KPI 카드 외 영역(테이블·aside·툴바)의 글리프 교체
- 아이콘 라이브러리 전면 마이그레이션

## Verification

- `corepack pnpm format:check` / `typecheck` / `lint` / `test`
