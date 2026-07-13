# 168 — 핵심 리스크·데이터 커버리지 헤더 없는 테이블형 재구성

Status: Handoff Ready

## 1. 배경

핵심 리스크와 데이터 커버리지의 내부 항목이 각각 테두리 카드
(`rounded-control border bg-app-surface-muted p-3/4`)로 쌓여 있어 위아래
공간을 과도하게 차지합니다. #177의 3열 배치 이후 카드 폭이 좁아져 더
두드러집니다. research.png 디자인은 헤더 없는 테이블 느낌의 행 배치를
사용합니다.

- 이슈: JongEunLee310/project_stock_frontend#168
- 에픽: #152 (디자인 정밀화 단계)

## 2. 범위

포함:

- `src/pages/ui/ResearchPage.tsx`의 `RiskPanel`·`CoverageAxisRow`(및
  `ResearchCoveragePanel`의 목록 래퍼).

제외:

- 계약·어댑터 변경 없음.
- 카드 위치·grid(#177) 변경 없음. 카드 헤더 요약(리스크 수준 배지,
  n/m 확보 배지)은 유지.

## 3. 변경

- `RiskPanel` — 리스크 항목 카드를 행 배치로 바꾼다.
  - `ul`을 `divide-y divide-app-border`로 바꾸고 `li`는 `py-2.5
    first:pt-0 last:pb-0` 수준의 수직 패딩만 갖는다 (테두리·배경 제거).
  - 행 구성: 불릿 점(수준 색) + 리스크명(semibold) + 수준 배지 + 한 줄
    설명(text-app-text-muted, truncate 또는 1행 유지).
  - 근거(evidence)가 있는 행은 리스크명 옆에 `InfoTooltip`
    (`src/shared/ui/InfoTooltip.tsx`)을 배치해 호버/포커스 시 근거
    목록을 표시한다. content는 `ul list-disc` 그대로 재사용.
  - 설명(description)은 truncate 시 전체 내용을 툴팁 content에 함께
    포함해 유실을 막는다.
- `CoverageAxisRow` — 카드를 행으로 바꾼다.
  - 행 구성: 축 라벨(semibold) | 수집 상태 배지 | 갱신·건수 텍스트
    (`갱신 {date} · {n}건` 또는 `데이터 없음`)를 한 행에 배치한다.
  - 목록 래퍼도 `divide-y` 패턴으로 통일한다.

## 4. Risks / Notes

- `InfoTooltip`은 cockpit-* 토큰을 사용한다. 리서치 페이지(app-* 토큰)
  에서 시각 이질감이 크면 className으로 버튼 색만 보정하고, 패널 토큰
  교체 같은 컴포넌트 개편은 하지 않는다.
- 좁은 폭(3열 배치)에서 행 내부 요소가 줄바꿈될 수 있으므로 flex-wrap
  허용으로 겹침을 방지한다.

## 5. 테스트

- 리스크: 근거 있는 항목에서 툴팁 트리거 노출·포커스 시 근거 텍스트
  표시, 근거 없는 항목에서 트리거 미노출.
- 커버리지: 수집/미수집 행의 배지·텍스트 렌더 유지.
- 기존 RiskPanel·Coverage 테스트가 카드 구조 단언이면 행 구조 기준으로
  보정.
- 검증 4종: `pnpm format:check` · `pnpm typecheck` · `pnpm lint` ·
  `pnpm test -- --run`.

## 6. 관련 링크

- 이슈 #168, 에픽 #152, 선행 #177 (3열 배치)
- 디자인: research.png (로컬 참고 이미지)
