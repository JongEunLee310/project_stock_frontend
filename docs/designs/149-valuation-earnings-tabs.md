# Design — Issue 149: 밸류에이션·실적 탭 — 역사적 위치·컨센서스 대비

BE #270(project_stock PR #277, dev 머지됨)의 두 계약을 리서치 상세 차트
카드의 disabled 탭 두 개(#142에서 자리만 둠)에 연결한다. 핵심은 지표 값
단독이 아니라 "과거 대비 어느 구간인지"와 "컨센서스 대비 실제"를 함께
보여 주는 것이다 ("높음/낮음" 단정 대신 역사적 구간 표시).

벤치마크 오버레이는 #148 별도 라운드다. 이 PR은 탭 두 개만 다룬다.

## Background — BE 계약

**1. `GET /assets/{asset_id}/valuation-metrics`**

응답: `{ asset_id, profile, highlighted_metrics, metrics }`

- `profile`: `FINANCIAL` / `HIGH_GROWTH` / `DEFICIT` / `DIVIDEND` /
  `GENERAL` (종목 성격).
- `highlighted_metrics: string[]` — profile별 우선 지표 (metric enum 값).
- `metrics`: 항상 7개 고정 순서 — `PER` / `FORWARD_PER` / `PSR` / `PBR`
  / `EV_EBITDA` / `PEG` / `FCF_YIELD`. 각 항목
  `{ metric, value: decimal str | null, five_year_median: decimal str |
null, percentile: int | null }`. 산출 불가(적자 등)면 null.

**2. `GET /assets/{asset_id}/earnings-summary`**

응답: `{ asset_id, quarters, guidance, segments }`

- `quarters`: 최근 4분기 오름차순.
  `{ period("2025Q4"), revenue, operating_income, eps,
revenue_yoy_percent | null, operating_margin_percent,
eps_estimate | null, eps_surprise_percent | null }` (금액류 decimal
  str).
- `guidance: string | null` — 한국어 요약 문장.
- `segments`: `{ name, revenue_share_percent, yoy_growth_percent }[]`.
  빈 배열 허용.

공통: 인증 필수, 자산 미존재 404 `ASSET_NOT_FOUND`.

## DTO — `src/features/research/dto.ts`

- `ValuationMetricsDto`, `EarningsSummaryDto` — 위 응답 형태 그대로.

## Adapters — `src/features/research/adapters.ts`

- `ValuationMetricItem` — `{ metric: string, metricLabel: string,
value: number | null, fiveYearMedian: number | null,
percentile: number | null, isHighlighted: boolean }`.
  - metric 라벨 매핑 (신규 상수): PER `PER` / FORWARD_PER `Forward PER`
    / PSR `PSR` / PBR `PBR` / EV_EBITDA `EV/EBITDA` / PEG `PEG` /
    FCF_YIELD `FCF 수익률`. 알 수 없는 값은 metric 원문 폴백.
  - `isHighlighted`는 `highlighted_metrics` 포함 여부에서 파생.
- `ValuationView` — `{ profileLabel: string, metrics:
ValuationMetricItem[] }`.
  - profile 라벨 매핑: FINANCIAL 금융 / HIGH_GROWTH 고성장 / DEFICIT
    적자 전환 관찰 / DIVIDEND 배당 / GENERAL 일반. 알 수 없는 값 폴백.
- `adaptValuationMetrics(dto): ValuationView` — 순서는 응답 순서 유지.
- `EarningsQuarterItem` — `{ period, revenue, operatingIncome, eps:
number, revenueYoyPercent: number | null, operatingMarginPercent:
number, epsEstimate: number | null, epsSurprisePercent: number |
null }` (`parseDecimal` 적용).
- `EarningsView` — `{ quarters: EarningsQuarterItem[], guidance:
string | null, segments: { name, revenueSharePercent,
yoyGrowthPercent }[] }`.
- `adaptEarningsSummary(dto): EarningsView`.

## Queries — `src/features/research/queries.ts`

- `useValuationMetrics(assetId, enabled)` ·
  `useEarningsSummary(assetId, enabled)` — 카드 독립 조회 패턴.
  `enabled: assetId != null && enabled` (탭이 활성일 때만 조회 — 진입
  시 불필요한 요청 방지). queryKey `['research', 'valuation', assetId]`
  / `['research', 'earnings', assetId]`.

## Page — `src/pages/ui/ResearchPage.tsx` (PriceChartCard)

- 탭 상태 도입: `'price' | 'valuation' | 'earnings'`, 기본 `price`.
  disabled·"준비 중" 제거.
- **ARIA (PR #154 S1 요건)**: 세 탭 모두 `id`와 `aria-controls`를 갖고,
  각 tabpanel은 대응 탭을 `aria-labelledby`로 참조한다.
  `aria-selected`는 활성 탭만 true.
- **밸류에이션 탭 패널** — 지표 표(행 7개, 고정 순서):
  - 열: 지표명(강조 지표는 Badge 등으로 표시) · 현재 값 · 5년 중앙값 ·
    역사적 위치.
  - 역사적 위치는 백분위 수치를 "하위 nn%" / "상위 nn%" 텍스트로 표기
    (50 초과면 상위 (100-n)%, 이하면 하위 n%). 단정 라벨("고평가")은
    쓰지 않는다.
  - value null이면 값·중앙값·위치 모두 "-" (적자 등 산출 불가).
  - 표 상단에 `종목 성격: {profileLabel}` 캡션.
- **실적 탭 패널** —
  - 분기 표(행 4개, 오름차순): 분기 · 매출(YoY%) · 영업이익 · 마진% ·
    EPS(컨센서스 대비) — surprise 양수 "상회 +n%" emerald · 음수
    "하회 -n%" red · estimate null이면 "-".
  - 가이던스: guidance 문장 한 줄 블록 (null이면 생략).
  - 사업부문: name · 매출 비중% · YoY% 목록 (빈 배열이면 생략).
- 두 패널 공통 상태: 로딩 스켈레톤, 오류 시 패널 내 ErrorState(재시도),
  탭 전환 시 가격 차트 패널과 동일한 tabpanel 컨테이너 규칙.
- 금액 표기는 기존 `formatCurrency` 계열 포맷터 재사용 (통화는 asset
  detail의 `currency`).

## Test / msw

- adapters: metric·profile 라벨 매핑과 폴백, `isHighlighted` 파생,
  null 필드 처리, decimal 문자열 파싱.
- queries: 두 훅의 경로·enabled 조건 (탭 비활성 시 미조회).
- ResearchPage: 탭 전환 렌더(aria-selected·aria-controls 연결), 밸류
  표의 "하위/상위 nn%" 표기·null "-" 처리·강조 지표 표시, 실적 표의
  상회/하회 표시·guidance·segments 렌더, 패널 오류 격리.
- 픽스처는 BE 실응답 형태 (DEFICIT null 케이스, surprise 양·음 혼재
  포함). `axis`류 enum 값은 영문 유지 (PR #159 B1 선례).

## Out of Scope

- 벤치마크 오버레이·거래량·이동평균·이벤트 마커 (#148).
- 가격 탭 내부 변경 (기간칩·차트 로직 불변).
- BE 변경.

## Open Questions

- 없음. 백분위의 "하위/상위 nn%" 텍스트 표기와 탭 활성 시점 조회
  (enabled 게이트)는 이 문서로 확정한다.
