# 185 — 리서치 헤더 정비 (AI 스탠스 디자인 정렬·지표 2행 재배치)

Status: Handoff Ready

## 1. 배경

사용자 피드백(2026-07-14)과 research.png 기준입니다. AI 투자 스탠스
박스를 디자인 이미지의 컴팩트 구성으로 맞추고, 지표 그리드를 2행
(1행 2개·2행 3개)으로 재배치합니다.

- 이슈: JongEunLee310/project_stock_frontend#185
- 에픽: #152, 선행 #179 (PR #182)

## 2. 범위

포함: `src/pages/ui/ResearchPage.tsx`의 `HeaderCard`.
제외: 계약 변경 없음. 최고·최저 목표 주가 병기는 BE 컨센서스 계약
(project_stock#295) 확정 후 후속.

## 3. 변경

- AI 투자 스탠스 박스 — 세로 중앙 정렬 컴팩트 구성으로 바꾼다:
  - 1행: 'AI 투자 스탠스' 라벨 (xs muted, 가운데)
  - 2행: 스탠스 배지 (기존 accent 톤, 조금 크게 — px-3 py-1 text-sm)
  - 3행: '신뢰도 n%' 텍스트 + 기존 InfoTooltip(근거·권고) 유지
  - 컨테이너: `flex flex-col items-center justify-center gap-2 text-center`
- 지표 그리드 — 기존 단일 `dl`(2×3)을 두 행으로 재배치한다:
  - 1행(`grid-cols-2`): 시가총액 · 52주 범위
  - 2행(`grid-cols-3`): 섹터 · 다음 실적 발표 · 평균 목표주가
  - dt/dd 스타일(xs muted 라벨, sm semibold 값)은 유지. 하나의 `dl` 안에
    두 grid div를 두거나 dl을 분리하되 시맨틱(dt/dd 짝)을 지킨다.

## 4. Risks / Notes

- 스탠스 배지 확대는 Badge 베이스(text-xs) 위 className override로만
  적용한다 (공용 규격 변경 금지).
- 지표 grid 열 수 변경으로 xl 4열 헤더 grid의 마지막 열 폭(19rem)은
  유지한다 — 최소 폭 확대 금지 (PR #173 B1 재발 방지).

## 5. 테스트

- 기존 헤더 테스트(지표 라벨·값, 스탠스 배지·신뢰도, 툴팁) 통과 유지,
  구조 단언만 보정.
- 검증 4종.

## 6. 관련 링크

- 이슈 #185, 에픽 #152, BE project_stock#295
- 디자인: research.png
