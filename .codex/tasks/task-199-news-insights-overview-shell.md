# Codex Handoff Task

## Source Issue

JongEunLee310/project_stock_frontend#199 — 뉴스·공시 인사이트 개요 페이지 셸 (에픽 #198 1차).
설계문서: `docs/designs/198-news-insights.md`.

## Task Summary

사이드바에 '뉴스·공시' 메뉴와 `/news` 라우트를 추가하고, `NewsInsightsOverviewPage`의 레이아웃
골격을 만든다. KPI 4종·이벤트 피드·AI 브리핑은 **로컬 mock 상수**로 형태만 구성하고, 나머지
패널은 자리(placeholder)와 단계 안내를 둔다. **BE 계약 연동은 이 태스크 범위 밖(#200)**이다.

## Goal

- 사이드바에 '뉴스·공시' 항목이 리서치 다음에 노출되고 `/news`로 이동한다.
- `/news`가 `NewsInsightsOverviewPage`를 렌더한다.
- 개요 레이아웃(KPI 4종·이벤트 피드·브리핑·토픽 맵 자리·2·3차 패널 자리)이 mock으로 표시된다.

## Background

- 라우팅: `src/shared/config/navigation.ts`의 `appRoutePaths`·`navigationItems`·`AppRouteId`,
  `src/app/router.tsx`의 `appRouteObjects`(AppShell children)에 기존 패턴대로 추가한다.
- 페이지는 `src/pages/ui/`에 두고 `src/pages/index.ts`로 export(기존 페이지 패턴 준수).
- 위젯은 `src/widgets/`에 FSD 슬라이스로 둔다(기존 위젯 구조 참고).
- 기존 뉴스 위젯 `src/widgets/NewsDisclosureList`와 혼동하지 않는다 — 신규 위젯을 별도 슬라이스로.
- 색상·배지·데스크톱 우선 등 공통 UI 지침은 설계문서 "공통 UI 지침"을 따른다.

## Implementation Scope

- `src/shared/config/navigation.ts` — `news` 라우트·nav 항목 추가.
- `src/app/router.tsx` — `/news` 라우트 추가.
- `src/pages/ui/NewsInsightsOverviewPage.tsx` (+ `src/pages/index.ts` export).
- `src/widgets/InsightSummaryCards/` — KPI 4종(고중요 이벤트·감성 급변·키워드 클러스터·자금 흐름
  시그널, 각 건수 + 전일 대비). mock 상수.
- `src/widgets/RealtimeEventFeed/` — **이벤트 중심** 행(분류 배지·종목·제목 요약·중요도·감성·출처·
  시각·근거 수). mock 상수.
- `src/widgets/AgentBriefing/` — 종합 요약 + 테마별 하이라이트 불릿(불릿마다 근거 수 자리). mock.
- 토픽 맵·투자자 동향·예상 자금 흐름·이벤트 타임라인·에이전트 파이프라인 — **자리 카드 + 단계 안내**
  (구현은 #202·2·3차). 별도 위젯 슬라이스 또는 페이지 내 placeholder로.
- 각 신규 위젯·페이지에 대응하는 테스트(vitest) 최소 1개.

## Out of Scope

- BE 계약 연동(#200), 토픽 맵 시각화(#202), 토픽 상세 페이지(#203), 실시간 갱신(폴링·SSE).
- 기존 `NewsDisclosureList`·`ResearchNewsPage` 변경.
- 새 npm 의존성 추가(기존 패키지로 구현).

## Protected Files

없음.

## Requirements

- KPI·이벤트 피드·브리핑은 mock 상수로 형태를 완성한다(계약 연동 없음).
- 이벤트 피드는 문서가 아니라 **이벤트 중심** 행이며 중요도와 감성을 별도 표기한다.
- 색상만으로 상태를 표현하지 않고 텍스트 배지를 병기한다(설계 공통 UI 지침).
- 나머지 패널은 자리 + 단계 안내로 두어 후속 이슈를 명확히 한다.
- 사이드바·라우트·페이지·위젯이 기존 FSD·라우팅 패턴과 일치한다.

## Test Requirements

- 네비게이션에 '뉴스·공시' 항목이 추가됐는지(navigation 테스트 갱신 포함).
- `/news` 렌더 시 개요 페이지·KPI 4종·이벤트 피드·브리핑이 표시되는지.
- 기존 테스트를 약화하지 않는다.

## Verification Commands

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Documentation Impact

- 설계문서 `docs/designs/198-news-insights.md`와 일치. 이탈 시 문서 먼저 갱신.

## ADR Need

불요. 기존 FSD·라우팅 컨벤션을 따르는 신규 화면 추가.

## Failure Record Need

불요.

## Risk Level

Low — mock 셸, 계약 연동 없음. 라우팅·nav 추가와 기존 테스트 갱신에 주의.

## Expected Output

- navigation·router·page·widget·테스트 커밋. PR 본문에 설계문서 링크와 화면 구성 요약.
- 검증 5종(format:check·lint·typecheck·test·build) 결과 보고.

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
- 현재 체크아웃된 브랜치를 유지한다(자체 브랜치 생성 금지).
