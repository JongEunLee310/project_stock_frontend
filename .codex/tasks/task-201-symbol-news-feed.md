# Codex Handoff Task

## Source Issue

JongEunLee310/project_stock_frontend#201 — FE: 종목별 뉴스·공시 페이지 재구성 (에픽 #198 1차 잔여).
설계문서: `docs/designs/198-news-insights.md`. BE 계약: `project_stock`의
`GET /api/v1/news-insights/events`(dev 머지 완료, `symbols` 필터 지원).

## Task Summary

PR #195의 임시 `ResearchNewsPage`(뉴스/공시 탭 + `/assets/{id}/news-disclosure`)를 새 설계의
**이벤트 중심 피드**로 재구성한다. 개요 피드(#199/#200)의 행 컴포넌트를 공유하고, `/events?symbols=`
로 종목 한정 이벤트를 가져온다. 라우트(`/research/:symbol/news`)와 리서치 카드의 더 보기 링크는
유지한다.

## Goal

- `/research/:symbol/news`가 해당 종목의 이벤트 중심 피드를 표시한다(뉴스/공시 탭 구조 제거).
- 행 스타일은 개요 피드와 **동일한 공유 컴포넌트**를 사용한다(분류·종목·이벤트 요약·중요도·감성·
  출처·시각).
- 이벤트 상세(#204)가 정착했으므로 **행에서 `/news/events/:eventId`로 이동**할 수 있다(개요 피드도
  동일하게 적용 — 공유 컴포넌트이므로 일관 동작).
- cursor 더 보기·loading·error·empty·데이터 신선도(#266 `PanelFreshness`) 유지.

## Background

- 현재 `src/pages/ui/ResearchNewsPage.tsx`는 `useAssetIdBySymbol`+`useNewsDisclosure`로
  뉴스/공시 탭을 렌더한다. 이 페이지만 교체한다.
- **`NewsDisclosureList` 위젯과 `useNewsDisclosure` query는 삭제하지 마라.** `ResearchPage`(리서치
  상세 카드)가 계속 사용한다. 이번 변경은 `ResearchNewsPage`에 한정한다.
- 공유 대상: `src/widgets/RealtimeEventFeed/RealtimeEventFeed.tsx`. 현재 props는
  `{ events, isLoading, isError, isFetchingNextPage, isFetchNextPageError, hasNextPage,
  onLoadMore, onRetry, updatedAt }`이고 제목·설명이 하드코딩("실시간 뉴스·공시 피드")돼 있다.
  이를 재사용 가능하게 확장한다:
  - `title`·`description`(옵션, 기본값은 현재 개요 문구 유지 — 개요 호출부 회귀 없게).
  - `showSymbolColumn`(옵션, 기본 true). 종목별 페이지에서는 모든 행이 같은 종목이므로 false로 숨김.
  - 제목 셀을 `/news/events/:eventId` **Link**로 만든다(접근성: 셀 전체 onClick 대신 링크 사용).
    `appRoutePaths.newsEventDetail` + `generatePath` 사용.
- `useNewsEventsQuery`(`src/features/news-insights/queries.ts`)는 현재 파라미터가 없다. **옵션
  파라미터**(`{ symbols }: { symbols?: string[] } = {}`)를 받도록 확장하고 `symbols`를 queryKey에
  포함한다. 기존 개요 호출부(`useNewsEventsQuery()`)가 그대로 동작해야 한다. 요청 시
  `symbols`는 반복 쿼리 파라미터(`symbols=AAA&symbols=BBB`)로 직렬화한다(BE는 `list[str]`).
- 폴링·신선도(#266) 규약 유지: 이벤트 피드 주기는 기존 `newsInsightsRefetchIntervals.events`(45초)
  상수를 그대로 쓰고, 페이지는 query의 `dataUpdatedAt`을 피드에 넘긴다.

## Implementation Scope

- `src/features/news-insights/queries.ts` — `useNewsEventsQuery({ symbols })` 옵션 파라미터·queryKey
  확장(기본 호출 호환 유지).
- `src/widgets/RealtimeEventFeed/RealtimeEventFeed.tsx` — `title`·`description`·`showSymbolColumn`
  옵션 props, 제목 셀 이벤트 상세 Link. 컬럼 정의를 옵션에 따라 구성(현재 정렬·너비 규칙 유지).
- `src/pages/ui/ResearchNewsPage.tsx` — 탭·`useNewsDisclosure` 사용 제거, `useNewsEventsQuery({
  symbols: [symbol] })` + 공유 피드로 재구성. 헤더(리서치로 돌아가기 링크·제목)는 유지·정리.
- 관련 테스트 갱신.

## Out of Scope

- `NewsDisclosureList` 위젯·`useNewsDisclosure` query 삭제·변경, `ResearchPage` 변경.
- 개요 페이지 레이아웃 변경(피드 공유에 따른 최소 변경만 허용). 필터 UI(중요도·감성 등) 추가.
- 새 npm 의존성. BE 계약 변경.

## Protected Files

없음.

## Requirements

- 종목별 페이지와 개요가 **같은 행 컴포넌트**를 쓴다(스타일 중복 정의 금지).
- 종목 파라미터는 대문자 정규화 등 기존 페이지 규칙을 따르고, 심볼이 없으면 안전하게 안내한다.
- 행에서 이벤트 상세로 이동 가능(링크 기반, 키보드 접근 가능).
- cursor 더 보기·부분 실패(패널 오류가 페이지 전체를 깨지 않음)·빈 상태 처리.
- 데이터 신선도 표시 유지(#266). BE 계산값 그대로 렌더, 수치 창작 금지.
- 개요 페이지 기존 동작(제목·문구·컬럼)에 회귀가 없어야 한다.

## Test Requirements

- `useNewsEventsQuery` 테스트: symbols 없는 기존 호출과 symbols 지정 호출의 요청 URL·queryKey 구분.
- `RealtimeEventFeed` 테스트: 기본(개요) 렌더 회귀, `showSymbolColumn=false`일 때 종목 컬럼 미표시,
  제목 링크가 `/news/events/:id`를 가리킴.
- `ResearchNewsPage` 테스트 갱신: 이벤트 피드 렌더, 종목 필터 전달, 로딩·오류·빈 상태, 리서치 복귀
  링크 유지. 기존 탭 기반 테스트는 새 구조에 맞게 교체한다.
- 기존 테스트를 약화하지 않는다(App.test·watchlist 테스트 유틸 등에서 `useNewsDisclosure` mock을
  쓰는 곳이 깨지지 않는지 확인).

## Verification Commands

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Documentation Impact

- 설계문서 `docs/designs/198-news-insights.md` 1차 단계(#201 종목별 뉴스 재구성)와 일치. 이탈 시 문서
  먼저 갱신.

## ADR Need

불요. 기존 FSD·query·위젯 공유 패턴을 따르는 화면 재구성.

## Failure Record Need

불요.

## Risk Level

Medium — 개요 피드 공유 컴포넌트를 확장하므로 개요 회귀 위험이 있다. 기존 임시 페이지 테스트 교체와
`useNewsDisclosure` 잔여 사용처 보존이 주의점.

## Expected Output

- query 파라미터화·피드 공유 확장·페이지 재구성·테스트 커밋(한국어 메시지). PR·push는 하지 마라.
- 검증 5종 결과 보고.

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
- 현재 체크아웃된 브랜치(feat/201-symbol-news-feed)를 유지한다(자체 브랜치 생성·push·PR 금지).
