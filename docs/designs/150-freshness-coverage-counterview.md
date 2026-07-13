# Design — Issue 150: 데이터 신선도·분석 커버리지·반대 관점 표시

BE #271(project_stock PR #275, dev 머지됨)의 두 계약을 리서치 상세에
연결한다. 목적은 AI 판단의 신뢰 맥락 제공이다 — 오래된 데이터가 최신
분석처럼 보이는 문제와 AI 확증 편향을 방지한다.

## Background — BE 계약

**1. `GET /assets/{asset_id}/research-coverage`** (신규 소비)

응답: `{ asset_id, axes: CoverageAxis[] }`

- `axes`는 항상 5개, 고정 순서: NEWS / PRICE / EARNINGS / VALUATION /
  DISCLOSURE.
- `CoverageAxis` 필드: `axis`(enum 5값) · `status`(`COLLECTED` /
  `NOT_COLLECTED`) · `last_updated_at`(UTC datetime | null — 해당 축
  데이터가 마지막으로 갱신된 시각, `updated_at` 최댓값 파생) ·
  `item_count`(int).
- NEWS·PRICE는 실데이터 파생, EARNINGS·VALUATION·DISCLOSURE는 수집
  파이프라인 미준비로 현재 항상 `NOT_COLLECTED`·null·0.
- 인증 필수, 자산 미존재 404 `ASSET_NOT_FOUND`.
- 커버리지 비율(예: 2/5)은 FE에서 파생한다 (BE는 축 목록만 반환).

**2. `research-summary` 응답의 `counter_view: string[]`** (additive 확장)

- 현재 stance에 반대되는 근거 불릿 2~3개 (결정적 mock). 기존
  `useResearchView`가 이미 research-summary를 조회하므로 신규 요청 없음.

## DTO — `src/features/research/dto.ts`

- `ResearchCoverageDto` — 위 응답 형태 그대로.
- `ResearchSummaryDto`에 `counter_view?: string[] | null` 추가.

## Adapters — `src/features/research/adapters.ts`

- `CoverageAxisItem` — `{ axis: string, axisLabel: string,
  isCollected: boolean, lastUpdatedAt: string | null, itemCount: number }`.
  - axis 라벨 매핑 (신규 상수): NEWS 뉴스 / PRICE 가격 / EARNINGS 실적 /
    VALUATION 밸류에이션 / DISCLOSURE 공시. 알 수 없는 값은 axis 원문
    폴백.
  - `lastUpdatedAt`은 `formatKstDateTime` 적용.
- `adaptResearchCoverage(dto): CoverageAxisItem[]` — 순서는 응답 순서
  유지 (BE가 고정 순서 보장).
- `ResearchView`에 `counterView: string[]` 추가 —
  `adaptResearchDetail`에서 `summary.counter_view ?? []`.

## Queries — `src/features/research/queries.ts`

- `useResearchCoverage(assetId: number | undefined):
  UseQueryResult<CoverageAxisItem[]>` — `enabled: assetId != null`,
  queryKey `['research', 'coverage', assetId]`. `useCatalystTimeline`과
  같은 카드 독립 조회 패턴 (실패가 페이지를 막지 않음).

## Page — `src/pages/ui/ResearchPage.tsx`

- **데이터 신선도·커버리지 카드 (신규)** — aside(우측 컬럼) 핵심 리스크
  카드 아래에 추가한다. 카드 제목 "데이터 커버리지".
  - 헤더 우측에 확보율 배지: `{collected}/{전체 축 수} 확보` (FE 파생).
  - 축별 행: `axisLabel` + 상태 배지(수집됨/미수집) + 수집됨이면
    `갱신 {lastUpdatedAt} · {itemCount}건`, 미수집이면 "데이터 없음".
  - 상태: 로딩 스켈레톤, 오류 시 카드 내 ErrorState(재시도). 축 5개는
    항상 오므로 EmptyState 불필요.
- **반대 관점 카드 (신규)** — aside의 AI 브리핑 카드 바로 아래에
  추가한다 (스탠스·브리핑과 나란히 읽히도록). 카드 제목 "반대 관점".
  - `research.counterView` 불릿 목록. AI 확증 편향 방지 목적임을 알리는
    한 줄 보조 문구를 카드 상단에 둔다.
  - 빈 배열이면 EmptyState("반대 관점 데이터가 없습니다.").
  - 별도 쿼리가 없으므로 카드 자체 로딩·오류 상태는 없다 (페이지 로딩에
    포함).

## Test / msw

- adapters: axis 라벨 매핑·알 수 없는 axis 폴백, `NOT_COLLECTED`의
  null·0 처리, `counter_view` 부재 시 빈 배열 폴백.
- queries: `useResearchCoverage` 경로·enabled 조건.
- ResearchPage: 커버리지 카드 렌더(확보율 배지·축 행·미수집 표시), 카드
  오류 격리(페이지 나머지 렌더 유지), 반대 관점 불릿 렌더·빈 상태.
- 픽스처는 BE 실응답 형태 (NEWS·PRICE COLLECTED + 나머지 3축
  NOT_COLLECTED 혼합 케이스 포함).

## Out of Scope

- 벤치마크 비교 시계열·차트 고도화 (#148 — BE 계약 후속).
- 밸류에이션·실적 탭 활성화 (#149 — BE #270 후).
- EARNINGS·VALUATION·DISCLOSURE 축의 실데이터 (BE 실수집 후속).
- BE 변경.

## Open Questions

- 없음. 카드 배치(aside: 브리핑 → 반대 관점 → 리스크 → 커버리지)는 이
  문서로 확정한다.
