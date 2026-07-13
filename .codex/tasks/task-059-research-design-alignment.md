# Codex Handoff Task

## Source Issue

#138 — 리서치 화면 완성 — research.png 디자인 정렬
`gh issue view 138 --repo JongEunLee310/project_stock_frontend`

설계 문서: `docs/designs/138-research-design-alignment.md` (반드시 먼저 읽는다)

## Task Summary

리서치 화면을 디자인 시안에 맞춰 완성한다. 기존 BE 계약만 사용한다.
헤더에 현재가·등락을 표시하고, 가격 차트에 기간 탭(1D/1M/3M/6M/1Y)을
연결하고, 로컬 상태로만 남아 있던 체크리스트·메모·관심종목을 실제 API에
연결한다.

## Goal

작업 완료 시 다음 상태여야 한다.

- 헤더에 현재가와 등락(값·퍼센트, 상승 emerald·하락 red 계열)이 표시된다.
  메트릭 타일은 시가총액 · 섹터 · 52주 범위 · 다음 실적 발표 · 평균
  목표주가 구성이다 (PER/PEG 타일 제거).
- 차트 카드에 기간 탭(1D/1M/3M/6M/1Y, 기본 3M)이 있고 선택 시 해당
  range로 재조회한다. "G4 BE 미완" 문구가 없고, 데이터가 있으면
  `차트 데이터: {source} · {lastUpdatedAt}` 캡션이 표시된다.
- "리포트" 패널이 "뉴스 및 공시 요약"으로 바뀐다.
- 체크리스트 토글 시 `PUT /assets/{id}/buy-checklist`로 저장된다
  (`checked_item_keys`에 체크된 항목 id 전체, `memo`는 현재 값 유지).
- 내 메모가 서버 `memo`로 시딩되고 입력 1초 debounce로 자동 저장된다.
  저장 성공 시 "자동 저장됨", 실패 시 "저장 실패" 표시. "로컬 입력" 라벨
  제거.
- 관심종목 버튼이 실제 등록 여부를 반영하고 토글 시 watchlist API를
  호출한다 (기존 `useAddAssetToFirstWatchlist` / `useRemoveWatchlistItem`
  재사용, 로컬 `isFavorite` 상태 제거).
- `pnpm format:check`, `pnpm typecheck`, `pnpm lint`, `pnpm test`가 전부
  통과한다.

## Background

계약 사실은 설계 문서의 Background 절을 따른다. 요점:

- detail 응답의 `price`·`previous_close`·`change`·`change_percent`·
  `currency`는 BE가 이미 반환하며 FE DTO에만 없다.
- prices range 허용값은 `1D | 1M | 3M | 6M | 1Y`다. `interval` 쿼리
  파라미터는 제거한다 (BE가 range에서 interval을 파생).
- `PUT /assets/{id}/buy-checklist` body는 `{ memo, checked_item_keys }`.
  `checked_item_keys` 허용값은 `valuation | news_overheated |
portfolio_concentration | earnings_disclosure` (BE
  `app/domains/decision_checklist/schema.py`의 `ChecklistItemKey`).
- 관심종목 훅은 `src/features/watchlist/queries.ts`에 이미 있다.

현재 브랜치 `feat/138-research-design-alignment`에서 그대로 작업한다. 새
브랜치를 만들지 않는다.

## Implementation Scope

**갱신**

- `src/features/research/dto.ts` — `AssetDetailDto` 가격 필드,
  `BuyChecklistDto`의 `memo`·`checked_item_keys`, `PriceSeriesDto` 메타
  필드 추가.
- `src/features/research/adapters.ts` — `ResearchView` 확장
  (price/change/changePercent/currency/checklistMemo), `PriceSeriesView`
  신설.
- `src/features/research/queries.ts` — `useResearchPriceSeries`에
  `range: PriceRange` 파라미터·`PriceSeriesView` 반환,
  `useSaveBuyChecklist(assetId)` mutation 신설.
- `src/pages/ui/ResearchPage.tsx` — 설계 문서의 Page 변경 절 전체.
- 테스트·msw 픽스처: `adapters.test.ts`, `queries.test.tsx`,
  `ResearchPage.test.tsx` 갱신 및 아래 Test Requirements 추가.

**변경 불가**

- `src/features/watchlist/` (훅 재사용만, 수정 금지)
- `src/shared/api/` (client·envelope)
- BE 계약 관련 이외의 페이지·위젯

## Test Requirements

- adapters: detail 가격 필드·`checklistMemo` 매핑, null 처리,
  `PriceSeriesView` 변환.
- queries: range가 쿼리스트링·queryKey에 반영, `useSaveBuyChecklist`가
  올바른 body로 PUT 호출.
- ResearchPage: 등락 표시(양·음·null), 기간 탭 전환 시 재조회, 체크 토글
  시 PUT body 검증, 메모 debounce 자동 저장(fake timers)과 저장
  성공/실패 표시, 관심종목 토글이 등록 여부에 따라 add/remove를 호출.
- 픽스처는 BE 실응답 형태를 그대로 사용한다.

## Out of Scope

- 촉매 타임라인, 비교지수 오버레이, 밸류에이션·실적 탭, 뉴스 카테고리
  배지, AI 브리핑 불릿·더보기.
- KOSPI market 매핑 정합 (현행 fallback 유지).
- BE 계약 변경.

## Rules

- 커밋은 1개로 만든다. push는 하지 않는다.
- 필요하지 않은 추상화를 추가하지 않는다.

## Verification

- `pnpm format:check`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
