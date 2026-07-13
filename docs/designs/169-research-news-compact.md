# 169 — 뉴스 및 공시 요약: 최신 3건 + 더보기, 카테고리 배지 선행

Status: Handoff Ready

## 1. 배경

현재 `NewsDisclosurePanel`은 응답의 전체 항목을 요약 문단·감성/중요도
배지까지 포함해 나열하므로 카드가 하단 4열 행에서 가장 길어집니다.
research.png 디자인은 최신 3건을 [카테고리 배지] 제목 한 줄 + 출처·시각으로
압축해 보여주고, 카드 하단 "더보기"로 나머지를 펼칩니다.

- 이슈: JongEunLee310/project_stock_frontend#169
- 에픽: #152 (디자인 정밀화 단계)

## 2. 범위

포함:

- `src/pages/ui/ResearchPage.tsx`의 `NewsDisclosurePanel`·`NewsDisclosureList`.

제외:

- 계약·어댑터 변경 없음 (BE#268 뉴스/공시 분리 유지, 탭 구분 유지).
- 항목 본문의 한국어 표기는 BE 데이터 소관.

## 3. 변경

- `NewsDisclosurePanel` — `isExpanded` 상태를 추가한다. 기본(접힘)에서는
  활성 탭의 최신 3건만 표시하고, 항목이 3건을 넘으면 카드 하단에
  기존 워치리스트 패턴과 같은 "더 보기 ›" 토글 버튼을 둔다 (카드 단위
  접기/펴기 — 문단별 클램프 금지). 펼치면 전체 항목 + "접기" 토글.
- `NewsDisclosureList` — `variant: 'compact' | 'full'`(또는 boolean prop)을
  받는다.
  - compact: [카테고리 배지] 제목 한 줄(truncate) + 출처 · 시각 한 줄.
    요약 문단·감성/중요도 배지는 렌더하지 않는다. 항목 테두리 박스는
    제거하거나 구분선 수준으로 가볍게 한다.
  - full: 기존 구성(요약·감성/중요도 배지 포함)을 유지한다.
- 카테고리 배지가 없는 항목은 배지 없이 제목부터 시작한다.
- 탭 전환 시 `isExpanded`는 초기화(접힘)한다.

## 4. Risks / Notes

- 제목 truncate는 `<a>`에 적용하므로 접근성상 전체 제목이 title 속성 또는
  aria-label로 접근 가능해야 한다.
- 항목이 3건 이하이면 더보기 버튼을 렌더하지 않는다.

## 5. 테스트

- compact 기본 상태에서 4건 이상 데이터일 때 3건만 렌더 + 더보기 버튼 노출.
- 더보기 클릭 시 전체 렌더·접기로 복귀.
- 3건 이하일 때 더보기 버튼 미노출.
- 기존 탭 전환·에러·빈 상태 테스트 유지.
- 검증 4종: `pnpm format:check` · `pnpm typecheck` · `pnpm lint` · `pnpm test -- --run`.

## 6. 관련 링크

- 이슈 #169, 에픽 #152
- 디자인: research.png (로컬 참고 이미지)
- 참고: 워치리스트 카드의 "더 보기 ›" 토글 패턴
