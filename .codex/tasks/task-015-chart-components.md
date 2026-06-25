# Codex Handoff Task

## Source Issue

Issue 19 — `[FE] 차트 컴포넌트 1차 구현` (마일스톤 FE-M3). 설계: `docs/designs/19-chart-components.md`.

## Task Summary

다크 테마 공통 차트 컴포넌트(Sparkline / LineChart / DonutChart / BarChart)를
`src/shared/ui/charts`에 추출하고, 현재 Dashboard/Watchlist/Signals에 인라인으로 산재한
`recharts` 호출을 공통 컴포넌트로 교체한다. Research 가격 차트 자리표시를 공통 `LineChart`로
연결한다. **신규 차트 라이브러리는 추가하지 않는다(recharts 유지).**

## Goal

이 task가 완료되면 참이어야 할 것:

- `src/shared/ui/charts`에 `Sparkline`·`LineChart`·`DonutChart`·`BarChart` + 공통 스타일
  상수가 존재하고, `src/shared/ui/index.ts` barrel로 export된다.
- Dashboard·Watchlist·Signals의 인라인 recharts 차트가 공통 컴포넌트를 사용하도록 교체되고,
  기존 페이지 테스트가 그대로 통과한다(동작·접근명 보존).
- Research 상세의 가격 차트 자리표시가 공통 `LineChart`로 렌더된다.
- 폭 처리(고정 `width` vs 반응형 측정)가 공통 컴포넌트 하나로 수렴된다.
- `TZ=UTC pnpm test` 전 게이트 통과.

## Background

- recharts는 이미 ADR-003 스택 + M2 라운드에서 채택됨. Dashboard/Watchlist는 고정 `width`,
  Signals는 `ResizeObserver` 측정으로 **폭 처리 방식이 갈려 있음**(M2 이월 부채). 공통화로 수렴.
- 모든 기존 차트는 `isAnimationActive={false}`로 jsdom 결정성을 유지한다. ResponsiveContainer는
  쓰지 않는다(명시 width/height 또는 자체 ResizeObserver 측정만).
- 셸/페이지 톤은 `cockpit-*`(셸·대시보드)·`app-*`(기타 페이지) 토큰 체계. 등락 색은 현재 원시
  Tailwind(emerald/rose)라 의미 토큰화는 M2 이월 — 본 task에서 색은 prop/상수로 받되 토큰화
  강제는 하지 않는다(범위 밖).
- 장식 차트는 `aria-hidden`, 의미 차트는 `role="img"` + `aria-label`로 접근성 유지(#20 사전 정렬).

## Implementation Scope

Codex가 변경해도 되는 파일/동작:

- 신규 `src/shared/ui/charts/` — `Sparkline.tsx`·`LineChart.tsx`·`DonutChart.tsx`·`BarChart.tsx`·
  `chartTheme.ts`(공통 색/여백 상수)·각 `*.test.tsx`. 디렉터리 내 barrel(`index.ts`) 선택.
- `src/shared/ui/index.ts` — 신규 차트 컴포넌트/타입 re-export 추가(add-only).
- `src/pages/ui/DashboardPage.tsx`·`WatchlistPage.tsx`·`SignalsPage.tsx` — 인라인 recharts
  (`Sparkline`/`StockSparkline`/`SignalSparklineChart` 및 Bar/Pie/Line 호출)를 공통 컴포넌트로 교체.
- `src/pages/ui/ResearchPage.tsx` — 가격 차트 자리표시를 공통 `LineChart`로 연결.
- 페이지 테스트(`*.test.tsx`)는 **접근명/단언 보존**을 위해 필요한 최소 수정만(가능하면 무변경).

## Out of Scope

Codex가 변경하면 안 되는 것:

- 캔들·거래량·비교지수 등 본격 분석 차트(후속).
- 포트폴리오 페이지(#14) 구현 — `DonutChart` 컴포넌트 제공까지만, 페이지 배치는 하지 않음.
- 신규 차트 라이브러리/의존성 추가, 실데이터·API 연동(#17).
- 도메인/Mock 타입(`src/shared/model/*`) 변경 — 차트는 기존 mock 파생만 사용.
- 등락/상태 색의 의미 토큰화(@theme 신규 토큰) — 이월 항목.

## Protected Files

- 없음. (`src/index.css` @theme 수정 불필요 — 기존 토큰만 사용. 부득이하면 **추가만**, 값 수정 금지.)

## Requirements

기능/비기능 요구:

- 컴포넌트는 `data`와 `height`(필수), `width?`/`responsive?`/`color?`|`tone?`/`ariaLabel?`(선택)을
  받는다. `width` 지정 시 고정, 미지정 시 `responsive` 측정 폭(미지원/SSR 폴백 상수).
- `isAnimationActive={false}` 항상 적용. ResponsiveContainer 미사용.
- `ariaLabel` 지정 시 `role="img"` + 라벨, 미지정 시 컨테이너 `aria-hidden`(장식).
- 교체 후 기존 페이지의 차트 접근명(`role="img"`/`role="meter"` 등)·동작이 보존되어 테스트 회귀
  없음. Signals의 신뢰도 원형 링(`ConfidenceRing`, 자체 SVG)은 차트 컴포넌트 대상 아님 — 유지.
- 시간 표시 포매터는 기존대로 `timeZone: 'Asia/Seoul'` 고정(본 task에서 신규 시간 단언 없음).

## Test Requirements

- `src/shared/ui/charts/*.test.tsx`: 각 컴포넌트 렌더 + 의미 차트 `role="img"`/`aria-label`,
  장식 차트 `aria-hidden` 단언.
- 기존 `DashboardPage.test`·`WatchlistPage.test`·`SignalsPage.test`·`ResearchPage.test` 통과 유지.
- 신규 컴포넌트 테스트 포함 후 전체 그린.

## Verification Commands

```
pnpm format:check
pnpm lint
pnpm typecheck
TZ=UTC pnpm test
pnpm build
```

## Documentation Impact

- 설계 `docs/designs/19-chart-components.md`(동반). 구현이 설계와 어긋나면 설계 문서도 갱신.
- 공통 차트 사용 규칙은 패턴 확정 시 `docs/knowledge/frontend-conventions.md` 반영(선택).

## ADR Need

불필요. recharts는 기존 ADR-003 스택 내이며 신규 아키텍처/라이브러리 도입이 아니다(공통 컴포넌트
추출·리팩터링).

## Failure Record Need

불필요(사전). 단, 차트 교체로 기존 테스트가 깨지면 원인·해법을 PR에 기록.

## Risk Level

**Medium.** 신규 컴포넌트 자체는 저위험이나 3개 기존 페이지 + Research의 인라인 차트를 교체하므로
회귀 면이 있다. `TZ=UTC pnpm test`로 페이지 테스트 보존을 확인하고, 접근명/동작을 유지할 것.

## Expected Output

- 브랜치 `feat/fe-chart-components`에 커밋. PR base `main`, 본문에 `Closes #19`.
- PR에 변경 요약(신규 컴포넌트·교체 범위·폭 수렴 방식)과 검증 결과(전 게이트 + `TZ=UTC pnpm test`).
- 오케스트레이터(Claude)가 로컬 리뷰 후 `docs/reviews/pr-NN.md` + PR 코멘트 게시.

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
