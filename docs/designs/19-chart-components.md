# Design — Issue 19: 차트 컴포넌트 1차 구현

> 대시보드·리서치·포트폴리오에서 재사용할 **공통 차트 컴포넌트**를 `src/shared/ui/charts`에
> 추출한다. 현재 `recharts`가 Dashboard/Watchlist/Signals 3곳에 **인라인 산재**(폭 처리 방식도
> 페이지마다 다름)하므로, 이를 공통 래퍼로 수렴시켜 부채를 정리하고 #14 포트폴리오를 차단
> 해제한다. 신규 차트 라이브러리는 도입하지 않는다(recharts 유지, ADR-003·M2 라운드 연장).

## 목적

- 다크 테마에 맞는 Sparkline·Line·Donut·Bar 차트를 단일 출처로 제공한다.
- 페이지에 흩어진 recharts 호출과 **폭 처리 불일치**(Watchlist/Dashboard 고정 `width` vs
  Signals `ResizeObserver` 측정)를 하나의 패턴으로 수렴한다.
- 결정성(jsdom)·접근성·토큰 색상을 컴포넌트 레벨에서 보장한다.

## 범위

`src/shared/ui/charts`에 차트 컴포넌트 + 공통 스타일. 3개 기존 페이지의 인라인 차트를 공통
컴포넌트로 교체하고, Research 가격 차트 자리표시를 공통 `LineChart`로 연결한다. 포트폴리오
자산 배분 차트는 컴포넌트만 제공하고 실제 배치는 #14에서 수행한다.

## 컴포넌트 책임

| 컴포넌트 | 위치 | 책임 |
| --- | --- | --- |
| `Sparkline` | `shared/ui/charts` | 라벨/축 없는 미니 추세선(Line 기반). 카드 인라인용. |
| `LineChart` | `shared/ui/charts` | 축·그리드 옵션 있는 선형 차트. 가격/추이용. |
| `DonutChart` | `shared/ui/charts` | 비율 도넛(Pie + innerRadius). 자산 배분/구성비용. |
| `BarChart` | `shared/ui/charts` | 범주형 막대. 요약 분포용. |
| `chartTheme` | `shared/ui/charts` | 공통 색(cockpit/app 토큰 파생)·여백·축 스타일 상수. |

### 공통 Props 책임 (시그니처 수준)

| Prop | 책임 |
| --- | --- |
| `data` | 차트 데이터 배열(컴포넌트별 형태). |
| `width?` / `height` | 고정 크기. 미지정 시 반응형 폭 측정으로 폴백. |
| `responsive?` | true면 컨테이너 폭을 `ResizeObserver`로 측정(미지원/SSR 폴백 상수). |
| `color?` / `tone?` | 선·막대·세그먼트 색. 기본은 `chartTheme` 토큰값. |
| `ariaLabel?` | 의미 차트는 `role="img"` + 라벨, 미지정(장식)은 `aria-hidden`. |

## 핵심 결정

1. **라이브러리**: recharts 유지(신규 의존성 없음). ResponsiveContainer는 미사용 —
   jsdom 결정성을 위해 명시 `width`/`height` 또는 자체 `ResizeObserver` 측정만 사용하고
   `isAnimationActive={false}`를 항상 적용한다(M2 라운드 관례 계승).
2. **폭 처리 수렴**: 고정 폭(`width` prop)과 반응형 폭(`responsive` + ResizeObserver,
   폴백 상수)을 **단일 컴포넌트가 모두 지원**한다. Signals의 측정 방식과 Watchlist/Dashboard의
   고정 방식이 하나의 컴포넌트로 합쳐진다(M2 이월 "스파크라인 폭 측정 수렴" 해소).
3. **접근성**: 장식 차트는 `aria-hidden`, 의미 차트는 `role="img"` + `ariaLabel`. 색만으로
   상태를 구분하지 않도록 토큰 색 대비 유지(#20 사전 정렬).
4. **채택 범위**: Dashboard/Watchlist/Signals 인라인 recharts → 공통 컴포넌트로 교체(소비처
   동작·테스트 단언 보존). Research 가격 차트 자리표시 → 공통 `LineChart` 연결(M2에서 #19로
   분리했던 항목). 포트폴리오 도넛은 컴포넌트만 제공, 배치는 #14.

## Out of Scope

- 캔들·거래량·비교지수 등 **본격 분석 차트**(후속, #19 1차 범위 밖).
- 포트폴리오 페이지(#14) 자체 구현 — 도넛 컴포넌트 제공까지만.
- 신규 차트 라이브러리 도입, 실데이터 연동(#17).
- 도메인/Mock 타입 변경(공통 컴포넌트는 표현 레이어, 기존 mock 파생만 사용).

## 테스트

- 각 차트 컴포넌트 렌더·`role`/`aria-label` 단언(`shared/ui/charts/*.test.tsx`).
- 기존 페이지 테스트(Dashboard/Watchlist/Signals/Research) 단언 유지 — 교체 후 회귀 없음.
- `TZ=UTC pnpm test`로 타임존 비의존 확인(차트는 고정 mock 파생).

## 문서 영향

- 본 설계 기록 + `.codex/tasks/task-015-chart-components.md` 핸드오프.
- 패턴 확정 시 `docs/knowledge/frontend-conventions.md`에 공통 차트 사용 규칙 반영 고려.
- 신규 라이브러리·아키텍처 변경 없음 → ADR 불필요(recharts는 ADR-003 스택 내).
