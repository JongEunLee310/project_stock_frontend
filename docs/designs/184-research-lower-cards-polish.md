# 184 — 리서치 하단 카드 정비

Status: Handoff Ready

## 1. 배경

머지된 #168·#177 이후 사용자 피드백입니다. 3열 행의 배치 순서, 행 내부
라벨 폭 불일치로 인한 배지 위치 흐트러짐, 리스크 수준 색의 약한 대비,
체크리스트의 카드 나열, 타임라인·뉴스 카테고리의 색 미구분을 정비합니다.

- 이슈: JongEunLee310/project_stock_frontend#184
- 에픽: #152

## 2. 범위

포함:

- `src/pages/ui/ResearchPage.tsx` — 3열 행 순서, RiskPanel·CoverageAxisRow
  행 grid 정렬, ChecklistPanel 테이블화, CatalystTimelinePanel·
  NewsDisclosureList 카테고리 색.
- `src/index.css` — `status-level-*` 토큰 값 조정 (신호등 계열).

제외:

- 계약·어댑터 변경 없음. 뉴스 더 보기 동작 변경 없음 (#187 별도).
- 반대 관점 내용·스타일 변경 없음 (#188 별도).

## 3. 변경

- 3열 행 순서 — `RiskPanel` → `CounterViewPanel` → `ResearchCoveragePanel`.
- 행 정렬 —
  - `CoverageAxisRow`: `li`를 `grid grid-cols-[5.5rem_auto_minmax(0,1fr)]
    items-center gap-x-2` 구성으로 바꿔 라벨 폭을 고정하고 배지 시작
    위치를 정렬한다.
  - `RiskPanel` 행: `grid grid-cols-[0.5rem_minmax(0,9rem)_auto_minmax(0,1fr)]
    items-center gap-x-2` — 불릿 | 리스크명(+근거 툴팁, truncate) |
    수준 배지 | 한 줄 설명. 배지 열이 세로로 정렬된다.
- 신호등 색 — `src/index.css`의 `status-level-*` 토큰을 신호등 계열로
  교체한다 (배지·불릿이 함께 적용받는다):
  - low: bg `#0f2e1d` · text `#34d399` · border `#059669`
  - medium: bg `#332508` · text `#fbbf24` · border `#d97706`
  - high: bg `#37151d` · text `#f87171` · border `#dc2626`
  - 이 토큰은 워치리스트 등 다른 화면의 리스크 배지도 공유하므로 전
    화면 일괄 적용이 의도된 변경이다.
- 체크리스트 — 항목 카드(label 박스)를 `divide-y` 행으로 바꾼다.
  행: 체크박스 + 항목명(semibold, label 클릭 토글 유지) + 설명
  `InfoTooltip`(호버/포커스). 설명 문단은 행에서 제거한다.
- 카테고리 색 — ResearchPage에 카테고리 라벨 → 톤 클래스 매핑 상수를
  하나 두고 타임라인 배지·점, 뉴스 카테고리 배지가 공유한다:
  실적=amber, 제품=sky, 파트너십=emerald, 규제=red, 인사=purple,
  자본=indigo, 시황·경제지표=teal, 계약=emerald, 배당=green,
  주주총회=purple, 락업 해제=rose, 콘퍼런스=indigo, 기타/미지정=neutral.
  배지: `border-{c}-400/40 bg-{c}-400/10 text-{c}-300` 계열.
  타임라인 점: 해당 색 border로 교체(`border-app-accent` 대체).

## 4. Risks / Notes

- Tailwind 동적 클래스 금지 — 매핑 상수에 완성된 클래스 문자열을
  정적으로 나열한다 (purge 안전).
- status-level 토큰 변경은 워치리스트·시그널의 기존 테스트(클래스 단언)
  영향 가능 — 의미 동일 범위에서만 보정.
- 좁은 폭에서 리스크명 9rem 고정이 부족하면 truncate + title로 보완
  (기존 패턴 유지).

## 5. 테스트

- 체크리스트: 행 렌더·토글 동작 유지, 설명 툴팁 접근.
- 카테고리 색: 알려진 카테고리에 대한 클래스 매핑, 미지정 폴백.
- 기존 리스크·커버리지·타임라인·뉴스 테스트 통과 (구조 단언 보정).
- 검증 4종: `pnpm format:check` · `pnpm typecheck` · `pnpm lint` ·
  `pnpm test -- --run`.

## 6. 관련 링크

- 이슈 #184, 에픽 #152, 선행 #168(PR #181)·#177(PR #178)
- 디자인: research.png
