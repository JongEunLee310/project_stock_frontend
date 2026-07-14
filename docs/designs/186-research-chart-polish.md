# 186 — 리서치 차트 정비 (거래량 색·툴팁, 시간 포맷, 벤치마크 높이, 지표 설명)

Status: Handoff Ready

## 1. 배경

사용자 피드백(2026-07-14)입니다. 거래량 바가 단색이라 의미가 안 읽히고,
캡션 시각이 ISO 원문으로 노출되며, 벤치마크 토글 시 차트 영역 높이가
변하고, 밸류에이션 지표의 의미 설명이 없습니다.

- 이슈: JongEunLee310/project_stock_frontend#186
- 에픽: #152, 선행 #170 (PR #175)

## 2. 범위

포함:

- `src/shared/ui/charts/BarChart.tsx` — additive props.
- `src/pages/ui/ResearchPage.tsx` — `PriceSparkline`(거래량 색·툴팁·캡션
  포맷·벤치마크 높이), `ValuationTable`(지표 설명 툴팁).
- 시간 포맷 유틸 (`src/shared/lib/format` 계열 기존 위치 확인 후 추가).

제외: 계약 변경 없음. 기간 버튼 확장 없음.

## 3. 변경

- `BarChart` — additive optional props:
  - `getBarColor?: (point: T, index: number) => string` — recharts `Cell`로
    막대별 색 지정. 미지정 시 기존 단색.
  - `showTooltip?: boolean` + `tooltipFormatter?` — 호버 시 날짜·값 표시
    (`Tooltip isAnimationActive={false}` 기존 LineChart 패턴).
- `PriceSparkline` —
  - 거래량 바 색: 해당 일 close가 직전 유효 close보다 높으면
    `#34d399`, 낮으면 `#f87171`, 같거나 판단 불가면 기존 `#475569`.
  - 거래량 툴팁: 날짜 + `거래량 {n.toLocaleString()}`.
  - 캡션: `lastUpdatedAt`을 `YYYY-MM-DD HH:mm:ss`(로컬 시간)로 포맷.
    파싱 불가 문자열은 원문 유지. 포맷 함수는 재사용 가능한 위치에 둔다.
  - 벤치마크 모드 차트 높이를 256px(h-64)로 올려 가격 모드(범례+차트
    176+거래량 80)와 전체 높이를 맞춘다.
- `ValuationTable` — 지표명 옆 `InfoTooltip`으로 정적 설명 표시.
  설명 사전(키: metric): PER·FORWARD_PER·PSR·PBR·EV_EBITDA·PEG·
  FCF_YIELD, 사전에 없으면 툴팁 미표시.

## 4. Risks / Notes

- BarChart 신규 prop은 optional — 대시보드 등 기존 사용처 회귀 금지.
- 거래량 색은 가격 데이터(close)에서 파생 — 포인트 정렬은 이미 날짜
  오름차순인 기존 데이터 그대로 사용.

## 5. 테스트

- BarChart: getBarColor 지정 시 막대별 fill, 미지정 시 기존 렌더.
- 캡션 포맷: ISO → YYYY-MM-DD HH:mm:ss, 비파싱 문자열 원문 유지.
- 밸류에이션: 알려진 지표의 툴팁 노출, 미지정 지표 미노출.
- 검증 4종.

## 6. 관련 링크

- 이슈 #186, 에픽 #152
