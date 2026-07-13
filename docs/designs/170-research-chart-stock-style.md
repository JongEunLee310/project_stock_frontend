# 170 — 가격 차트 주식 스타일 고도화

Status: Handoff Ready

## 1. 배경

현재 가격 차트는 일반 라인 차트 스타일(좌측 축·별도 거래량 차트)이라
research.png의 증권 서비스형 차트(영역 그라데이션·우측 가격축·현재가
라벨·하단 통합 거래량)와 인상이 크게 다릅니다.

- 이슈: JongEunLee310/project_stock_frontend#170
- 에픽: #152 (디자인 정밀화 단계)

## 2. 범위

포함:

- `src/shared/ui/charts/LineChart.tsx` — additive props 확장.
- `src/pages/ui/ResearchPage.tsx`의 `PriceSparkline` 렌더 구성.

제외:

- 기간 버튼 확장(5D·YTD·3Y·5Y)은 BE 계약 필요로 제외 (별도 BE 이슈).
- 라이브러리 교체 금지 (Recharts 유지).
- 밸류에이션·실적 탭, 벤치마크 데이터 로직, dto/adapters/queries 변경 없음.

## 3. 변경

- `LineChart` — 내부 루트를 `RechartsLineChart`에서 `ComposedChart`로
  전환한다 (`Line` 자식은 그대로 동작). additive props:
  - `areaSeries?: { dataKey; color; gradientOpacityFrom?; gradientOpacityTo? }`
    — 해당 시리즈를 그라데이션 채움 `Area`(선 포함)로 렌더. `<defs>`의
    `linearGradient` id는 컴포넌트 인스턴스별 고유값 사용.
  - `yAxisOrientation?: 'left' | 'right'` — 기본 'left'로 기존 렌더 유지.
  - `lastValueLabel?: { dataKey: string; color?: string }` — 마지막 유효
    포인트 위치에 현재가 pill(ReferenceDot custom shape 또는 커스텀
    label)을 표시.
  - 모든 신규 prop은 optional이며 미지정 시 기존 렌더와 동일해야 한다
    (대시보드·워치리스트 등 다른 사용처 회귀 금지).
- `PriceSparkline` —
  - 가격 모드: close 시리즈를 `areaSeries`로 렌더(#5fa8ff, 위→아래
    그라데이션), MA20은 기존 점선 `Line` 유지, `yAxisOrientation='right'`,
    `lastValueLabel`로 현재가 pill 표시.
  - 거래량 `BarChart`를 가격 차트 바로 아래 붙여(mt-3 → mt-0 수준, 좌우
    margin 동일) 통합된 인상으로 구성하고, x축 눈금은 하단(거래량)에만
    표시해 중복을 없앤다. 거래량이 없으면 가격 차트에 x축 눈금 표시.
  - 범례(가격 모드)를 좌상단 유지하되 심볼 · 마지막 종가 · 등락(색상)을
    함께 표시한다 (데이터는 이미 로드된 priceSeries.points 마지막 값 사용).
  - 벤치마크 모드도 `yAxisOrientation='right'`로 통일한다.
  - 하단 "차트 데이터: {source} · {시각}" 캡션 유지.

## 4. Risks / Notes

- `ComposedChart` 전환 시 기존 prop 계약(series·markers·margin·showAxes 등)
  과 시각 결과가 유지되어야 한다. 기존 LineChart 테스트가 이를 검증한다.
- YAxis width(48)는 우측 배치에서도 동일하게 적용한다. 우측 축일 때
  margin.right와 겹치지 않는지 확인한다.
- 현재가 pill은 마지막 값이 null인 시리즈(휴장 구간)에서 마지막 유효
  포인트로 폴백한다.

## 5. 테스트

- LineChart: areaSeries·yAxisOrientation·lastValueLabel 미지정 시 기존
  스냅샷/렌더 동등성, 지정 시 렌더 크래시 없음 + gradient/축 방향 확인.
- PriceSparkline 관련 기존 테스트(범례·기간 전환·벤치마크) 통과, 범례
  값 표시 단언 보정.
- 검증 4종: `pnpm format:check` · `pnpm typecheck` · `pnpm lint` · `pnpm test -- --run`.

## 6. 관련 링크

- 이슈 #170, 에픽 #152, 선행 #148 (차트 기능 고도화)
- 디자인: research.png (로컬 참고 이미지)
