# 166 — 리서치 상세 레이아웃 재배치 (우측 열 축소·하단 빈 공간 제거)

Status: Handoff Ready

## 1. 배경

PR #165에서 차트 카드가 aside 높이만큼 늘어나는 stretch 문제는 제거했지만,
우측 aside에 카드 4장(AI 브리핑·반대 관점·핵심 리스크·데이터 커버리지)이 쌓여
있어 좌우 열 높이 차이가 크고, xl 브레이크포인트에서 차트 열 아래에 빈 공간이
넓게 남습니다. research.png 디자인은 차트 옆 우측 열에 AI 브리핑과 핵심 리스크
2장만 배치합니다.

- 이슈: JongEunLee310/project_stock_frontend#166
- 에픽: #152 (디자인 정밀화 단계)

## 2. 범위

포함:

- `src/pages/ui/ResearchPage.tsx`의 상세 레이아웃 grid 재배치만 다룹니다.

제외:

- 카드 내부 콘텐츠 구조 변경 (#167 헤더, #168 리스크 테이블, #169 뉴스, #170 차트, #171 스타일).
- 신규 데이터·계약 변경 없음.

## 3. 변경

레이아웃 구성 (xl 기준):

```text
[HeaderCard]
[PriceChartCard (2fr)] | [aside (1fr): AI 브리핑 / 핵심 리스크]
[반대 관점 (1fr)] | [데이터 커버리지 (1fr)]        ← 신규 2열 행
[뉴스 | 촉매 타임라인 | 체크리스트 | 내 메모]      ← 기존 4열 행 유지
```

- `ResearchPage` return부 — aside에서 `CounterViewPanel`·`ResearchCoveragePanel`을
  제거하고, 차트 grid 아래에 2열 grid 행(`md:grid-cols-2`)을 신설해 그 안으로 이동한다.
- 기존 컴포넌트 시그니처는 변경하지 않는다 (`CounterViewPanel({ items })`,
  `ResearchCoveragePanel({ assetId })` 그대로 재사용).
- section deep-link 앵커(`researchSectionIds.briefing`·`risks`)는 aside 안에
  그대로 남으므로 영향 없음. `news`·`checklist`는 하단 행 유지로 영향 없음.
- 이동한 2열 행의 카드는 좌우 높이 균형을 위해 `h-full`을 적용할지 확인한다
  (기존 하단 4열 행과 동일 패턴).

## 4. Risks / Notes

- aside가 2장으로 줄어도 브리핑+리스크 합이 차트 열보다 길 수 있다. 이 경우에도
  PR #165의 `xl:items-start`가 유지되므로 차트 카드가 다시 늘어나지는 않는다.
  잔여 여백은 #168(리스크 테이블형 압축)·#170(차트 고도화)에서 추가로 줄인다.
- 밸류에이션·실적 탭에서는 왼쪽이 더 길어질 수 있으나 items-start로 대칭 동작.

## 5. 테스트

- 기존 `ResearchPage.test.tsx`가 반대 관점·데이터 커버리지 렌더를 검증하고 있다면
  위치 이동 후에도 통과해야 한다 (쿼리 기준이 DOM 순서에 의존하면 수정).
- 신규 테스트: 반대 관점·커버리지 섹션이 여전히 렌더되는지 확인하는 수준이면 충분.
- 검증 4종: `pnpm format:check` · `pnpm typecheck` · `pnpm lint` · `pnpm test -- --run`.

## 6. 관련 링크

- 이슈 #166, 에픽 #152
- PR #165 (선행 — stretch 제거)
- 디자인: research.png (로컬 참고 이미지)
