# Design — Issue 138: 리서치 화면 완성 (research.png 디자인 정렬)

리서치 화면을 research.png 시안에 맞춰 완성한다. 기존 BE 계약만 사용하고
(신규 BE 작업 없음), 로컬 상태로만 남아 있던 체크리스트·메모·관심종목을
실제 API에 연결한다. #137(로드 실패 수정, PR #139)이 선행한다.

## Background — 계약 확인 결과

- `GET /assets/{id}/detail` — `price`, `previous_close`, `change`,
  `change_percent`, `currency` 필드를 이미 반환한다 (FE DTO에 미반영 상태).
- `GET /stocks/{symbol}/prices?market=&range=&interval=` — range는
  `1D | 1M | 3M | 6M | 1Y` 지원 (BE `_RANGE_COUNTS`). 응답에 `currency`,
  `source`, `last_updated_at`, `bars[]` 포함. market은
  `KRX | NASDAQ | NYSE` Literal.
- `PUT /assets/{id}/buy-checklist` — body `{ memo: string | null,
  checked_item_keys: ChecklistItemKey[] }`. `ChecklistItemKey`는
  `valuation | news_overheated | portfolio_concentration |
  earnings_disclosure` (BE `app/domains/decision_checklist/schema.py`).
  GET/PUT 응답 모두 `memo`, `checked_item_keys`, `is_complete`,
  `decided_at`을 포함한다.
- 관심종목 — `useWatchlistAssets`, `useAddAssetToFirstWatchlist`,
  `useRemoveWatchlistItem`이 `src/features/watchlist/queries.ts`에 이미
  존재한다. 신규 엔드포인트 불필요.

## DTO 변경 — `src/features/research/dto.ts`

- `AssetDetailDto` — `price`, `previous_close`, `change`, `change_percent`,
  `currency` (모두 `string | null` optional) 추가.
- `BuyChecklistDto` — `memo?: string | null`,
  `checked_item_keys?: string[] | null` 추가.
- `PriceSeriesDto` — `currency?: string | null`, `source?: string | null`,
  `last_updated_at?: string | null` 추가 (기존 `bars` 유지).

## Adapters — `src/features/research/adapters.ts`

- `ResearchView` — `price: number | null`, `change: number | null`,
  `changePercent: number | null`, `currency: string | null`,
  `checklistMemo: string | null` 추가.
- `adaptResearchDetail` — 위 필드 매핑 추가 (`parseDecimal` 재사용).
- `PriceSeriesView` 신설 — `{ closes: number[], currency: string | null,
  source: string | null, lastUpdatedAt: string | null }`.

## Queries — `src/features/research/queries.ts`

- `useResearchPriceSeries(symbol, market, range: PriceRange)` —
  `PriceRange = '1D' | '1M' | '3M' | '6M' | '1Y'`. range를 쿼리스트링과
  queryKey에 반영하고 반환 타입을 `UseQueryResult<PriceSeriesView>`로
  교체한다. `interval` 파라미터는 제거한다 (BE가 range에서 파생).
- `useSaveBuyChecklist(assetId: number)` —
  `PUT /assets/{assetId}/buy-checklist` mutation. body는
  `{ memo, checked_item_keys }`. onSuccess에서 `['research', symbol]`
  무효화 대신 응답으로 캐시를 직접 갱신하지 않고, 단순 무효화로 동기화한다.

## Page 변경 — `src/pages/ui/ResearchPage.tsx`

- **HeaderCard** — 심볼·회사명 옆에 현재가와 등락(`change`,
  `changePercent`)을 표시한다. 상승 `text-emerald-*` 계열, 하락
  `text-red-*` 계열, null이면 `-`. 메트릭 타일을 디자인 구성으로 교체:
  시가총액 · 섹터 · 52주 범위 · 다음 실적 발표 · 평균 목표주가
  (PER/PEG 타일 제거).
- **차트 카드** — 기간 탭(1D/1M/3M/6M/1Y, 기본 3M)을 추가하고 선택값을
  `useResearchPriceSeries`에 전달한다. "G4 BE 미완" 안내 문구를 제거하고,
  차트 하단에 `차트 데이터: {source} · {lastUpdatedAt}` 캡션을 표시한다
  (null이면 캡션 생략).
- **뉴스 및 공시 요약** — `ReportsPanel` 제목을 "뉴스 및 공시 요약"으로
  바꾸고 출처·시각 표기를 유지한다.
- **의사결정 체크리스트** — 토글 시 `useSaveBuyChecklist`로 저장한다
  (체크된 항목 id 전체를 `checked_item_keys`로 전송, memo는 현재 값 유지).
  서버 GET 응답의 `checked` / `checked_item_keys`를 초기값으로 사용하고,
  기존 로컬 전용 상태(`localChecklist`)는 저장 성공 후 무효화로 대체한다.
- **내 메모** — 서버 `memo`를 초기값으로 시딩하고, 입력 후 1초 debounce로
  자동 저장한다 (`memo`와 현재 `checked_item_keys`를 함께 전송). 저장
  성공 시 "자동 저장됨" 표시, 실패 시 "저장 실패" 표시. "로컬 입력" 라벨은
  제거한다.
- **관심종목 버튼** — `useWatchlistAssets`로 현재 자산의 등록 여부와
  itemId를 판정하고, `useAddAssetToFirstWatchlist` /
  `useRemoveWatchlistItem`으로 토글한다. 로컬 `isFavorite` 상태를 제거한다.

## Mock / Test

- msw 핸들러(테스트 픽스처)에 detail 가격 필드·checklist `memo`·prices
  메타 필드·`PUT buy-checklist`를 추가한다. 픽스처는 BE 실응답 형태를
  따른다.
- 갱신: adapters(가격·메모 매핑, PriceSeriesView), queries(range 반영,
  mutation body), ResearchPage(등락 표시·기간 탭 전환·체크 토글 저장 호출·
  메모 debounce 자동 저장·관심종목 토글) 테스트.

## Out of Scope

- 촉매 타임라인 (BE 계약 부재 — 후속 이슈).
- 비교지수 오버레이, 밸류에이션·실적 탭 (BE 계약 부재).
- 뉴스 카테고리 배지(실적/제품/파트너십/규제 — BE 필드 부재).
- AI 브리핑 불릿 서식·더보기 (research-summary body 문단 유지).
- KOSPI 자산의 market 매핑 정합 (prices Literal 불일치는 현행 fallback
  유지).
- BE 계약 변경.

## Open Questions

- 없음. 메모 자동 저장 debounce 1초, 기간 탭 기본값 3M은 이 문서로
  확정한다.
