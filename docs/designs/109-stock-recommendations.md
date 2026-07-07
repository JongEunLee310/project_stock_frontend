# Design: 종목 추천 화면 (#109)

## Status

Implemented

## Context

BE 추천 API(`project_stock#222`, PR #225 머지 완료)의 계약이 확정되어, 추천 종목과 근거를
표시하고 원클릭으로 관심종목에 추가하는 화면을 만든다. 종목 추가 플로우(#108,
`feat/108-add-stock-flow`)의 mutation·쿼리 무효화 패턴을 재사용한다.

## BE Contract (확정, origin/dev 기준)

- `GET /api/v1/watchlists/{watchlist_id}/recommendations` — envelope `ApiResponse` 래핑
- 응답 projection (`app/domains/watchlists/schema.py`):
  - `WatchlistRecommendationsResponse`: `recommendations: StockRecommendationProjection[]`, `generated_at: datetime`
  - `StockRecommendationProjection`: `symbol: str`, `name: str`, `rationale: str`, `reference_metrics: str[]`
- 추천은 최대 5개, 후보가 없으면 빈 배열. 응답에 `asset_id`는 없다.
- 서버가 LLM을 호출하므로 응답 지연이 수 초 이상일 수 있다.

## Decisions

- **배치**: 새 라우트 대신 `WatchlistPage` 하단에 추천 섹션(Card)을 추가한다. 추천은
  관심종목 컨텍스트에 종속되고, 라우트·사이드바 추가는 이 이슈 범위를 넘는다.
- **호출 시점**: 페이지 진입 시 자동 호출하지 않고 "추천 받기" 버튼으로 수동 트리거한다.
  LLM 호출 비용과 지연 때문이다.
- **관심종목 추가**: 응답에 `asset_id`가 없으므로 `GET /assets?symbol=` 검색 후 심볼
  정확 일치 항목의 `id`로 기존 `useAddAssetToFirstWatchlist`를 호출한다. 후보는 모두
  등록된 active 종목이므로 일치 항목이 존재해야 하며, 없으면 항목 단위 오류로 표시한다.
- **watchlist 선택**: 기존 패턴과 동일하게 첫 번째 watchlist를 사용한다.

## Components

- `src/features/watchlist-recommendations/dto.ts` — `StockRecommendationDto`, `WatchlistRecommendationsDto`
- `src/features/watchlist-recommendations/queries.ts` — `useWatchlistRecommendations` (수동 트리거)
- `src/features/watchlist-recommendations/WatchlistRecommendationsSection.tsx` — 섹션 UI
  (초기/로딩/빈/오류 상태, 항목별 추가 버튼·추가됨·오류 표시)
- `src/pages/ui/WatchlistPage.tsx` — 섹션 삽입

## States

- 초기: "추천 받기" 버튼만 표시
- 로딩: Skeleton 또는 로딩 표시 (LLM 지연 안내 문구)
- 빈: 추천 후보 없음 안내
- 오류: ErrorState + 재시도
- 항목: 기본 → 추가 중 → 추가됨(비활성) / 추가 실패(항목 내 메시지)

## Out of Scope

- 새 라우트·사이드바 항목 추가
- BE 변경, 추천 품질 튜닝
- 종목 추가 모달(#108) 변경
