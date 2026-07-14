# Codex Handoff Task

## Source Issue

이슈 #211 — 리서치 가격 차트 폴리시 3건. 이슈 본문을 먼저 읽는다.

## Task Summary

리서치 가격 차트의 표시 문제 3건을 수정한다: 툴팁 라벨 색 대비,
1D 호버 시간 포맷, 현재가 pill의 플롯 하단 잘림.

## Goal

- 차트 호버 툴팁의 날짜·시간 라벨이 다크 배경에서 충분한 대비로
  보인다.
- 1D 차트 호버 라벨이 `YYYY-MM-DD HH:mm`(KST)로 표시되고, 일봉
  range는 기존 `YYYY-MM-DD` 표시를 유지한다.
- 현재가가 구간 최저·최고일 때도 pill 전체가 차트 영역 안에
  렌더된다.

## Implementation Scope

- `src/shared/ui/charts/LineChart.tsx`
  - 265행 `<Tooltip>`에 `chartTheme` 기반 `contentStyle`/`labelStyle`/
    `itemStyle` 적용 (배경·보더·텍스트 색을 앱 다크 톤과 정렬).
  - `labelFormatter` 주입 지점 마련: 호출부가 라벨 포맷을 넘길 수
    있게 optional prop 추가 (기존 호출부 무변경 하위호환).
  - `renderLastValueShape`/`ReferenceDot` 경로에서 pill의 y 좌표를
    플롯 영역 안으로 클램프 (`cy ± 11` 고정을 경계 보정으로 교체;
    차트 height와 margin을 고려).
- `src/shared/ui/charts/BarChart.tsx` — 거래량 툴팁에도 동일한 스타일
  적용.
- `src/pages/ui/ResearchPage.tsx` — 가격 차트 툴팁에 라벨 포맷터
  연결: date 값이 ISO datetime(intraday)이면 `YYYY-MM-DD HH:mm`(KST),
  `YYYY-MM-DD`(일봉)이면 그대로. 기존 시간 유틸(`shared/lib/format`)이
  있으면 재사용한다.
- 테스트 — 1D·일봉 라벨 포맷, 구간 최저/최고에서 pill 잘림 방지
  케이스 추가.

## Out of Scope

- BE interval 변경 (별도 이슈 #316)
- 차트 시각 디자인(색 팔레트·레이아웃) 재설계
- 다른 페이지 차트의 동작 변경 (공용 컴포넌트 스타일 개선의 기계적
  영향은 허용)

## Protected Files

없음.

## Verification

- `pnpm run format:check`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm run test`

## Constraints

- 현재 브랜치(`fix/211-chart-polish`)에서 그대로 작업한다. 새 브랜치
  생성·checkout 금지.
- 커밋은 한국어 `type: 본문` 형식으로 작성한다.
- 이 태스크 문서와 구현이 같은 PR에 함께 실린다.
