# Design — Issue 163: 가격 차트 이벤트 마커 — 실적 발표 이력 표시

BE 과거 이벤트 이력 계약(BE #282, PR #287)을 소비해 리서치 상세 가격
차트에 실적 발표 마커를 표시한다. FE #148(차트 고도화)에서 계약 부재로
제외됐던 잔여 범위다.

## BE Contract (변경 불가, 소비만)

`GET /assets/{asset_id}/events?range=1M|3M|6M|1Y` →
`{ asset_id, range, events: [{ event_date, event_type: "EARNINGS",
eps_actual, eps_estimate, eps_surprise_percent }] }`

- 과거(오늘 이하) 발표만 event_date 오름차순.
- eps 3종은 BE Decimal 직렬화 규칙에 따라 **JSON 문자열 또는 null** —
  `parseDecimal` 필수.
- title 필드 없음 — 마커 라벨은 FE가 수치로 구성한다.

## Scope Decision

- **가격 모드에서만 마커를 표시한다** — 벤치마크 비교 모드 제외로
  확정. 근거: 비교 모드는 수익률 정규화 축이라 가격 이벤트 마커의 y
  위치가 의미를 잃고, 시리즈 3개 위에 겹치면 혼잡하다.
- 1D는 차트가 이미 disabled이므로 이벤트 조회도 `1M/3M/6M/1Y`만
  (BE enum과 1:1).
- **마커 = ReferenceDot custom shape**: 해당 거래일 종가 위치의 원형
  마커. hover는 SVG `<title>`, focus는 `tabIndex` + `aria-label`로
  제공 (이슈의 접근성 요건).
- **날짜 스냅**: 발표일이 비거래일·범위 밖일 수 있으므로, 차트 포인트의
  ISO `date` 기준 event_date 이하 최근접 거래일에 스냅한다. 스냅 대상이
  없으면(차트 범위 이전) 마커를 만들지 않는다. x는 스냅된 포인트의
  `date` 문자열 그대로 사용 (category XAxis 일치 조건).

## 1. DTO — `src/features/research/dto.ts`

- `AssetEventDto` — `event_date: string` · `event_type: string` ·
  `eps_actual: string | null` · `eps_estimate: string | null` ·
  `eps_surprise_percent: string | null`
- `AssetEventHistoryDto` — `asset_id` · `range` ·
  `events: AssetEventDto[]`

## 2. Query — `src/features/research/queries.ts`

- `useAssetEvents(assetId: number | null, range: BenchmarkRange,
enabled: boolean)` — queryKey
  `['research', 'asset-events', assetId, range]`,
  `GET /assets/{assetId}/events?range={range}`. 기존 쿼리 훅 관례
  (fetch·에러 처리) 재사용.

## 3. Adapter — `src/features/research/adapters.ts` (순수 함수)

- `adaptAssetEvents(dto) -> AssetEventItem[]` — `parseDecimal` 적용,
  라벨 구성: `실적 발표 · EPS 1.52 (예상 1.48, 서프라이즈 +2.70%)`.
  null인 조각은 생략한다 (전부 null이면 `실적 발표`만). 날짜 라벨은
  `adaptCatalystTimeline`의 연도 생략 규칙을 따르지 않고 마커 라벨
  앞에 `MM.DD` 형식으로 붙인다.
- `snapEventsToChartPoints(events, points) -> ChartEventMarker[]` —
  `{ x: string, y: number, label: string }`. 스냅 규칙은 Scope
  Decision 참조. 같은 포인트에 겹치는 이벤트는 각각 유지한다.

## 4. Shared chart — `src/shared/ui/charts/LineChart.tsx`

- additive prop `markers?: Array<{ x: string; y: number;
label: string; color?: string }>` 추가.
- recharts `ReferenceDot`을 marker마다 렌더 — custom `shape`로
  `<circle>` + `<title>{label}</title>` + `tabIndex={0}` +
  `aria-label={label}` + `role="img"`. 기본 색은 amber 계열(범례와
  일치), 기존 사용처는 prop 미전달로 영향 없음.

## 5. Page — `src/pages/ui/ResearchPage.tsx`

- 가격 차트 섹션: `useAssetEvents`(가격 모드 && range !== '1D' &&
  assetId 존재 시 enabled) → adapter·스냅 → `LineChart markers` 전달.
- 범례 목록에 마커 항목 추가 (`실적 발표`).
- 벤치마크 비교 모드 분기에는 markers를 전달하지 않는다.
- 이벤트 쿼리 실패·빈 events는 마커 없이 차트만 렌더 (차트 실패로
  승격하지 않음).

## Files

신규 없음 (문서 제외). 갱신: `src/features/research/dto.ts`·
`queries.ts`·`adapters.ts`, `src/shared/ui/charts/LineChart.tsx`,
`src/pages/ui/ResearchPage.tsx`, 관련 테스트.

변경 불가: BE 계약 형태 가정 변경, 다른 페이지·차트 사용처,
`BarChart.tsx`.

## Test

- adapters 단위: 라벨 null 조합(전부 null·estimate만 null·surprise
  음수), parseDecimal 적용, 스냅 경계(발표일=거래일·비거래일→직전
  거래일·범위 이전→제외), 겹침 유지.
- LineChart: markers 렌더 시 aria-label 노출, 미전달 시 기존 렌더
  불변.
- 페이지: 가격 모드에서 마커 aria-label 존재, 벤치마크 모드에서 부재,
  이벤트 쿼리 실패 시 차트 정상 렌더.
- 픽스처는 BE 실계약 형태 (eps 3종 decimal 문자열, event_type 영문
  enum, 오름차순). id 리터럴 단언 금지, 수치 단언 출처 주석.

## Out of Scope

- 촉매(미래) 이벤트 마커, 공시 등 다른 이벤트 타입, 벤치마크 모드
  마커.
- 마커 클릭 상호작용(팝오버 등) — 후속 라운드.

## Open Questions

- 없음. 가격 모드 한정·ReferenceDot 스냅 방식·라벨 구성 규칙은 이
  문서로 확정한다.
