# Design — Issue 148: 가격 차트 고도화 — 거래량·이동평균·벤치마크 비교

리서치 상세 가격 탭을 시안 수준으로 고도화한다. 목적은 "가격만
올랐는지, 시장 전체보다 강했는지"를 구분할 수 있게 하는 것이다.
BE #270(PR #277)의 `benchmark-comparison` 계약과 기존 가격 계약의
미사용 필드(date·volume)를 활용한다.

## Scope Decision

- **이벤트 마커는 이 PR에서 제외**한다. 촉매 계약(#269)은 오늘 이후
  이벤트만 반환해 과거 축인 가격 차트에 얹을 데이터가 없다. 과거
  이벤트 계약(실적 발표 이력 등)이 생기는 실수집 라운드에서 후속으로
  다룬다.
- **기간 선택은 현행 유지** (1D/1M/3M/6M/1Y). BE 가격 range와 일치하며
  확장 근거가 아직 없다. 벤치마크 계약은 1D를 지원하지 않으므로 1D에서
  비교 모드를 비활성화한다.
- 이동평균은 **MA20 단일**로 시작한다 (다중 창은 후속). FE가 표시
  구간의 bars에서 파생하므로 창 크기 미만 구간은 선이 그려지지 않는다
  (leading null 허용).

## Background — 사용 계약 (모두 기존, BE 변경 없음)

- `GET /stocks/{symbol}/prices?market=&range=` — `bars[]`에 `date` ·
  `close` · `volume`이 이미 있으나 FE가 close만 소비 중.
- `GET /assets/{asset_id}/benchmark-comparison?range=` (PR #277) —
  `series` 3개 고정 순서 ASSET·INDEX·SECTOR_ETF, 각
  `{ kind, label, points: [{ date, return_percent }] }`. 세 시리즈 날짜
  축 일치, `return_percent`는 기간 시작 대비 누적 수익률(첫 포인트 0).
  range enum `1M/3M/6M/1Y`.

## Shared UI — `src/shared/ui/charts/LineChart.tsx`

- 다중 시리즈 지원을 additive로 추가한다: `series?: Array<{ dataKey,
  color, strokeWidth?, strokeDasharray? }>` prop. 지정 시 `yDataKey`
  단일 렌더 대신 시리즈별 `<Line>`을 렌더한다. **기존 단일 시리즈
  API(yDataKey·color)는 불변** — 기존 소비처(대시보드 등) 수정 없음.
- 범례는 LineChart에 넣지 않는다 — 페이지 쪽에서 시리즈 라벨·색상
  스와치를 렌더한다 (기존 컴포넌트 단순성 유지).

## DTO / Adapters — `src/features/research/`

- `PriceBarDto`에 `date?: string | null` · `volume?: number | null`
  추가 (BE 실계약 필드, additive).
- `PriceSeriesView`를 `points: Array<{ date: string, close: number,
  volume: number | null, ma20: number | null }>` 중심으로 확장
  (`closes`는 유지하거나 points에서 파생 — 소비처가 PriceSparkline
  뿐이므로 교체 허용).
  - `ma20`은 adapter에서 파생: 직전 20개 close 단순 평균, 20개 미만
    구간은 null. 파생 함수는 순수 함수로 분리 (`withMovingAverage`
    같은 시그니처, adapter 파일 내).
- `BenchmarkComparisonDto` — PR #277 응답 형태 그대로.
- `BenchmarkSeriesItem` — `{ kind: string, label: string, points:
  [{ date, returnPercent: number }] }`,
  `adaptBenchmarkComparison(dto): BenchmarkSeriesItem[]` — 순서는 응답
  순서 유지. kind 라벨 병기는 label 필드를 그대로 쓴다 (BE가 표시명
  제공).

## Queries — `src/features/research/queries.ts`

- `useBenchmarkComparison(assetId, range, enabled)` — 카드 독립 조회
  패턴, `enabled: assetId != null && enabled` (비교 모드 ON일 때만
  조회). queryKey `['research', 'benchmark', assetId, range]`. range
  타입은 `'1M' | '3M' | '6M' | '1Y'` (1D 제외 — 별도 타입).

## Page — `src/pages/ui/ResearchPage.tsx` (가격 탭 패널)

- **비교 토글** — 기간칩 행 우측에 "벤치마크 비교" 토글 버튼
  (`aria-pressed`). 1D 선택 중에는 disabled + 짧은 안내. 비교 ON 상태
  에서 1D로 바꾸면 비교 OFF로 되돌린다.
- **가격 모드 (비교 OFF, 기본)** —
  - 메인 차트: close 라인 + MA20 라인(보조 색·점선) 다중 시리즈.
    범례(현재가·MA20)를 차트 위에 표시. Tooltip 활성화.
  - 거래량 서브차트: 메인 차트 아래 BarChart(높이 축소, 축 최소화),
    volume 데이터가 전부 null이면 생략.
  - x축은 실제 date 사용 (기존 index 문자열 대체).
- **비교 모드 (비교 ON)** —
  - `benchmark-comparison`의 세 시리즈를 다중 시리즈 라인으로 렌더
    (수익률 %, 첫 포인트 0). 범례는 각 시리즈 label(자산 심볼 ·
    NASDAQ 100 · 섹터 ETF).
  - 거래량·MA는 표시하지 않는다 (수익률 축).
  - 로딩 스켈레톤, 오류 시 패널 내 ErrorState(재시도) — 실패해도 비교
    OFF로 돌아가면 가격 모드는 정상 동작.
- 기존 "차트 데이터: {source} · {lastUpdatedAt}" 캡션은 가격 모드에서
  유지, 비교 모드에서는 mock 계약임을 드러내는 별도 캡션 없이 생략.

## Test / msw

- adapters: MA20 파생(20개 미만 null·경계값), date·volume 매핑,
  benchmark adapt 순서 유지.
- LineChart: series prop 렌더(라인 수), 기존 단일 시리즈 회귀 없음.
- queries: `useBenchmarkComparison` 경로·enabled 게이트.
- ResearchPage: 토글 aria-pressed 전환, 1D에서 토글 disabled·ON 상태
  해제, 비교 모드 세 시리즈 범례 렌더, 거래량 서브차트 렌더·전부 null
  이면 생략, 비교 모드 오류 격리(가격 모드 복귀 정상).
- 픽스처는 BE 실응답 형태 (enum·label 영문 유지, 첫 포인트 0).

## Out of Scope

- 이벤트 마커 (과거 이벤트 계약 부재 — 실수집 라운드 후속).
- 기간 선택 확장, 다중 이동평균, 캔들 차트.
- BE 변경, 밸류에이션·실적 탭(#149 완료분) 변경.

## Open Questions

- 없음. 이벤트 마커 제외와 MA20 단일, 1D 비교 비활성은 이 문서로
  확정한다.
