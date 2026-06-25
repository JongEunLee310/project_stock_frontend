# FE#47 — 도메인 재정렬 설계 기록

상태: **설계 확정** — 2026-06-25, FE 오케스트레이터(Sonnet+VFF). OQ-1~4 코디네이터 확정 반영(2026-06-25)
의존성: BE#97 동결 계약(`docs/designs/price-series-api.md` "Frozen Contract" 섹션, 2026-06-25)
관련 계약: `docs/api/contract-alignment.md` G8·G9·C4·C5·C6·C8

---

## 1. 설계 범위

FE 도메인 모델을 BE 확정 계약 기준으로 재정의한다. 범위는 타입·어댑터(DTO→도메인 변환)·
enum 매핑까지이며, 실제 API 실연동(#48)은 범위 밖이다.

---

## 2. BE 계약 기준 도메인 재정의

### 2.1 Signal

**구(현재 FE)** → **신(BE 계약 기준)**

| 구 필드 | 구 타입 | 신 필드 | 신 타입 | 변환 비고 |
|---------|---------|---------|---------|-----------|
| `id` | `string` | `id` | `number` | BE int |
| `symbol` | `string` | `assetId` | `number` | C4: symbol 단일키 중단 |
| — | — | `symbol` | `string` | 표시·라우팅 보조(읽기 전용) |
| `kind` | `string` | `signalType` | `SignalType` | enum 영문 UPPER_SNAKE (C8) |
| `confidence` | `number` | `score` | `number` | 0–100 정수 |
| — | — | `riskLevel` | `string \| null` | BE `risk_level` 자유 문자열 확정(OQ-1). 알려진 값 HIGH/MEDIUM/LOW 한글 라벨 매핑, 미지 값은 원문 fallback |
| `message` | `string` | `reason` | `string` | |
| — | — | `evidence` | `Record<string, unknown> \| null` | BE JSON |
| `trendSeries` | `number[]` | (폐기) | — | G9: BE 출처 없음. 스파크라인은 별도 PriceSeries 소비로 교체 |
| `previousStatus` | `StockStatus` | (폐기) | — | G9: BE 출처 없음 |
| `createdAt` | `string` | `createdAt` | `string` | UTC Z, FE KST 표시(C6) |
| — | — | `expiresAt` | `string \| null` | BE `expires_at`, UTC Z |
| — | — | `isExpired` | `boolean` | BE 계산값 |
| `status` | `StockStatus` | (폐기) | — | Signal에 상태 색상 불필요 |
| — | — | `asset` | `AssetBrief \| null` | OQ-2: expand 옵셔널. `dto.asset`이 있으면 매핑, 없으면 null |

**SignalType enum** (와이어 영문, C8)

| BE 와이어 값 | FE 한글 라벨(표시 계층) |
|-------------|----------------------|
| `WATCH` | 관망 |
| `RISK_ALERT` | 위험 경보 |
| `THESIS_BROKEN` | 가설 붕괴 |
| `BUY_CANDIDATE` | 매수 후보 |
| `SELL_REVIEW` | 매도 검토 |
| `OVERHEATED` | 과열 |

**riskLevel 라벨 매핑 (OQ-1 확정)**: BE `risk_level`은 `str | None` 자유 문자열이 의도된 계약이다.
FE 도메인 타입은 `riskLevel: string | null`로 유지한다. 표시 계층에서는 `HIGH/MEDIUM/LOW`에만
한글 라벨(높음/중간/낮음)을 매핑하고, 알 수 없는 값은 원문을 그대로 표시한다.
BE enum 변경 없음.

**Signal symbol 해소 전략 (OQ-2 확정)**: `SignalResponse`에는 `asset_id`만 있고 symbol이 없다.
BE 후속 작업으로 `?expand=asset` 지원 예정이나 현재 미구현이다. FE Signal 도메인 타입과
어댑터는 다음 두 경로를 모두 지원하도록 설계한다.

- **expand 지원 시**: `SignalDto`에 `asset?: AssetBriefDto | null` 옵셔널 필드를 포함하고
  어댑터가 이를 `asset?: AssetBrief` 로 통과시킨다.
- **expand 미지원 기간(fallback)**: 뷰레이어는 이미 로드된 asset 목록(watchlist·portfolio 등)에서
  `assetId`로 symbol을 조회한다. 별도 1:1 asset fetch를 Signal마다 발사하지 않는다.

Signal 도메인 타입에 `asset?: AssetBrief` 옵셔널 필드를 추가해 두 경로를 흡수한다.
`assetId`는 항상 존재하므로 fallback이 끊기지 않는다.

**모멘텀 스파크라인 재구성**: Signal 뷰에서 스파크라인은 `PriceSeries.bars`의 최근 `close`
배열로 렌더한다. Signal 도메인 타입에는 embed하지 않으며, 뷰레이어에서
`PriceSeries` 쿼리를 별도로 소비한다(G9).

---

### 2.2 가격 시계열 (PriceSeries) — 신규

BE#97 동결 계약(`GET /api/v1/stocks/{symbol}/prices`) 기준.

**PriceBarDto** (DTO, snake_case 와이어)

| 와이어 필드 | 타입 | 비고 |
|------------|------|------|
| `date` | `string` | `YYYY-MM-DD`, 타임존 없음 |
| `open` | `string` | Decimal 문자열 |
| `high` | `string` | Decimal 문자열 |
| `low` | `string` | Decimal 문자열 |
| `close` | `string` | Decimal 문자열 |
| `adjusted_close` | `string` | Decimal 문자열 |
| `volume` | `number` | 정수 |

**PriceSeriesDto** (DTO, snake_case 와이어)

| 와이어 필드 | 타입 |
|------------|------|
| `symbol` | `string` |
| `market` | `string` |
| `currency` | `string` |
| `interval` | `string` |
| `range` | `string` |
| `source` | `string` |
| `last_updated_at` | `string` | UTC Z |
| `bars` | `PriceBarDto[]` |

**PriceBar** (FE 도메인, camelCase)

| 도메인 필드 | 타입 | 변환 |
|------------|------|------|
| `date` | `string` | `YYYY-MM-DD` 그대로 유지 — 타임존 변환 없음(오프바이원 방지) |
| `open` | `number` | `parseDecimal(dto.open)` |
| `high` | `number` | `parseDecimal(dto.high)` |
| `low` | `number` | `parseDecimal(dto.low)` |
| `close` | `number` | `parseDecimal(dto.close)` |
| `adjustedClose` | `number` | `parseDecimal(dto.adjusted_close)` |
| `volume` | `number` | 정수 그대로 |

**PriceSeries** (FE 도메인)

| 도메인 필드 | 타입 | 변환 |
|------------|------|------|
| `symbol` | `string` | 그대로 |
| `market` | `string` | 그대로 |
| `currency` | `string` | 그대로 |
| `interval` | `string` | 그대로 |
| `range` | `string` | 그대로 |
| `source` | `string` | 그대로 |
| `lastUpdatedAt` | `string` | `dto.last_updated_at` (UTC Z, FE KST 표시) |
| `bars` | `PriceBar[]` | 각 bar 변환 |

**타임존 주의**: `bars[].date`는 타임존 변환 없이 캘린더 날짜 문자열로 그대로 사용한다.
`new Date(date)` 또는 `Date.parse(date)`에 직접 넣으면 UTC 자정으로 파싱되므로
문자열 분리(`date.split('-')`) 또는 `date-fns/parseISO` 없이 split 방식을 권장한다.
`lastUpdatedAt`만 UTC instant이므로 KST 포맷 적용.

**인증 (OQ-3 확정)**: 가격 시계열은 시장데이터로 분류되어 **공개 GET(인증 불필요)**이 확정됐다.
FE fetch는 `Authorization` 헤더에 의존하지 않아야 한다. 헤더가 있어도 BE가 거부하지 않으므로
인증 클라이언트로 호출해도 무방하지만, 인증 만료·미로그인 상태에서도 차트를 표시해야 한다면
공개 클라이언트(헤더 없음)로 분리하는 것을 권장한다.

**어댑터 시그니처**

```
adaptPriceBar(dto: PriceBarDto): PriceBar
adaptPriceSeries(dto: PriceSeriesDto): PriceSeries
```

위치: `src/shared/api/adapters/priceSeriesAdapter.ts`

---

### 2.3 Stock (Watchlist 뷰모델)

현재 FE `Stock`은 단일 평면 타입이었으나, BE는 asset(기본) + assetDetail(시세) + researchSummary
(가설 상태) 를 별도 엔드포인트로 분리한다. FE는 이를 합성한 뷰모델로 재정의한다.

**AssetBriefDto (OQ-4 확정)** — watchlist `?expand=asset` 및 signals `?expand=asset`(BE 후속) 공용 축약 DTO.
`AssetDetailDto`와 다른 구조이므로 재사용 금지. 별도 어댑터/타입을 둔다.

| 와이어 필드 | 타입 | 비고 |
|------------|------|------|
| `symbol` | `string` | |
| `name` | `string` | |
| `price` | `string` | Decimal |
| `change_percent` | `string` | Decimal |
| `sector` | `string \| null` | 옵셔널 |

**AssetBrief** (FE 도메인)

| 필드 | 타입 | 변환 |
|------|------|------|
| `symbol` | `string` | |
| `name` | `string` | |
| `price` | `number` | `parseDecimal` |
| `changePercent` | `number` | `parseDecimal` |
| `sector` | `string \| null` | |

어댑터 시그니처: `adaptAssetBrief(dto: AssetBriefDto): AssetBrief`
위치: `src/shared/api/adapters/assetAdapter.ts` (기존 `adaptAssetDetail`과 같은 파일, 별도 함수)

**AssetDto** (BE `AssetResponse`)

| 와이어 필드 | 타입 |
|------------|------|
| `id` | `number` |
| `symbol` | `string` |
| `name` | `string` |
| `market` | `string` |
| `is_active` | `boolean` |
| `created_at` | `string` |

**AssetDetailDto** (BE `AssetDetailResponse`, G7 확장 포함)

| 와이어 필드 | 타입 | 비고 |
|------------|------|------|
| `id` | `number` | |
| `symbol` | `string` | |
| `name` | `string` | |
| `market` | `string` | |
| `price` | `string` | Decimal |
| `previous_close` | `string` | Decimal |
| `change` | `string` | Decimal |
| `change_percent` | `string` | Decimal |
| `currency` | `string` | |
| `sector` | `string \| null` | |
| `industry` | `string \| null` | |
| `description` | `string \| null` | |
| `as_of` | `string` | UTC Z |
| `per` | `string \| null` | G7 nullable |
| `peg` | `string \| null` | G7 nullable |
| `fifty_two_week_low` | `string \| null` | G7 nullable |
| `fifty_two_week_high` | `string \| null` | G7 nullable |
| `target_price` | `string \| null` | G7 nullable |
| `target_upside_percent` | `string \| null` | G7 nullable |

**StockViewModel** (FE 합성 뷰모델, camelCase)

| 필드 | 타입 | 출처 |
|------|------|------|
| `assetId` | `number` | `AssetDetailDto.id` |
| `symbol` | `string` | |
| `name` | `string` | |
| `market` | `string` | |
| `price` | `number` | `parseDecimal` |
| `previousClose` | `number` | `parseDecimal` |
| `change` | `number` | `parseDecimal` |
| `changePercent` | `number` | `parseDecimal` |
| `currency` | `string` | |
| `sector` | `string \| null` | |
| `per` | `number \| null` | G7 |
| `peg` | `number \| null` | G7 |
| `fiftyTwoWeekLow` | `number \| null` | G7 |
| `fiftyTwoWeekHigh` | `number \| null` | G7 |
| `targetPrice` | `number \| null` | G7 |
| `targetUpsidePercent` | `number \| null` | G7 |
| `asOf` | `string` | UTC Z, KST 표시 |

어댑터 시그니처:

```
adaptAssetDetail(dto: AssetDetailDto): StockViewModel
```

위치: `src/shared/api/adapters/assetAdapter.ts`

---

### 2.4 Alert (인박스 모델 재정의)

기존 FE `AlertRule`(규칙 빌더·채널) 전체 폐기. G8 인박스 모델로 교체.

**AlertDto** (BE `AlertResponse`)

| 와이어 필드 | 타입 |
|------------|------|
| `id` | `number` |
| `user_id` | `number` |
| `signal_id` | `number` |
| `status` | `string` | `UNREAD \| READ \| DISMISSED` |
| `created_at` | `string` | UTC Z |

**Alert** (FE 도메인)

| 필드 | 타입 | 변환 |
|------|------|------|
| `id` | `number` | |
| `userId` | `number` | |
| `signalId` | `number` | |
| `status` | `AlertStatus` | enum 매핑 |
| `createdAt` | `string` | KST 표시 |

**AlertStatus enum**

| 와이어 | FE 도메인 | 한글 라벨 |
|--------|----------|----------|
| `UNREAD` | `UNREAD` | 읽지 않음 |
| `READ` | `READ` | 읽음 |
| `DISMISSED` | `DISMISSED` | 무시됨 |

**AlertCandidateDto** (BE `AlertCandidateResponse`)

| 와이어 필드 | 타입 |
|------------|------|
| `id` | `number` |
| `user_id` | `number` |
| `candidate_type` | `string` | |
| `importance` | `string` | `LOW \| MEDIUM \| HIGH` |
| `status` | `string` | `UNREAD \| READ \| CONFIRMED` |
| `title` | `string` | |
| `message` | `string \| null` | |
| `asset_id` | `number \| null` | |
| `evidence` | `Record<string, unknown> \| null` | |
| `created_at` | `string` | UTC Z |

**AlertCandidate** (FE 도메인)

| 필드 | 타입 | 변환 |
|------|------|------|
| `id` | `number` | |
| `userId` | `number` | |
| `candidateType` | `AlertCandidateType` | enum |
| `importance` | `AlertImportance` | enum |
| `status` | `AlertCandidateStatus` | enum |
| `title` | `string` | |
| `message` | `string \| null` | |
| `assetId` | `number \| null` | |
| `evidence` | `Record<string, unknown> \| null` | |
| `createdAt` | `string` | KST 표시 |

**AlertCandidateType enum** (C8)

| 와이어 | 한글 라벨 |
|--------|----------|
| `NEWS_SURGE` | 뉴스 급증 |
| `PRICE_MOVEMENT` | 가격 변동 |
| `DISCLOSURE` | 공시 |
| `PORTFOLIO_CONCENTRATION` | 포트폴리오 집중 |
| `BUY_CHECKLIST_REQUIRED` | 매수 체크리스트 필요 |

**AlertImportance enum**

| 와이어 | 한글 라벨 |
|--------|----------|
| `HIGH` | 높음 |
| `MEDIUM` | 중간 |
| `LOW` | 낮음 |

어댑터 시그니처:

```
adaptAlert(dto: AlertDto): Alert
adaptAlertCandidate(dto: AlertCandidateDto): AlertCandidate
```

위치: `src/shared/api/adapters/alertAdapter.ts`

---

### 2.5 Portfolio

BE `PortfolioSummaryResponse` 구조를 직접 수용한다. 현재 FE가 클라이언트에서 파생하던
`cash_weight`·섹터 가중치를 BE 응답으로 교체.

**PortfolioSummaryDto** (BE `PortfolioSummaryResponse`)

| 와이어 필드 | 타입 |
|------------|------|
| `portfolio_id` | `number` |
| `concentration_threshold` | `string` | Decimal |
| `total_cost_value` | `string` | Decimal |
| `total_value` | `string` | Decimal |
| `cash_balance` | `string` | Decimal |
| `cash_weight` | `string` | Decimal |
| `has_sector_concentration` | `boolean` | |
| `positions` | `PositionWeightDto[]` | |
| `sector_weights` | `SectorWeightDto[]` | |

**PositionWeightDto**

| 와이어 필드 | 타입 |
|------------|------|
| `asset_id` | `number` |
| `quantity` | `string` | Decimal |
| `avg_buy_price` | `string` | Decimal |
| `cost_value` | `string` | Decimal |
| `market_value` | `string` | Decimal |
| `cost_weight` | `string` | Decimal |
| `weight` | `string` | Decimal |
| `exceeds_threshold` | `boolean` |

**SectorWeightDto**

| 와이어 필드 | 타입 |
|------------|------|
| `sector` | `string` |
| `market_value` | `string` | Decimal |
| `weight` | `string` | Decimal |
| `exceeds_threshold` | `boolean` |

**PortfolioSummary** (FE 도메인, camelCase)

| 필드 | 타입 | 변환 |
|------|------|------|
| `portfolioId` | `number` | |
| `concentrationThreshold` | `number` | `parseDecimal` |
| `totalCostValue` | `number` | `parseDecimal` |
| `totalValue` | `number` | `parseDecimal` |
| `cashBalance` | `number` | `parseDecimal` |
| `cashWeight` | `number` | `parseDecimal`(BE 계산값, FE 재계산 중단) |
| `hasSectorConcentration` | `boolean` | |
| `positions` | `PositionWeight[]` | 각 변환 |
| `sectorWeights` | `SectorWeight[]` | 각 변환 |

어댑터 시그니처:

```
adaptPortfolioSummary(dto: PortfolioSummaryDto): PortfolioSummary
```

위치: `src/shared/api/adapters/portfolioAdapter.ts`

---

## 3. 식별자 전환 (C4)

- 모든 도메인 타입에서 `assetId: number`를 정본 식별자로 사용한다.
- `symbol: string`은 표시(UI)·라우팅(`/research/:symbol`)·가격 시계열 쿼리(`GET /stocks/{symbol}/prices`) 보조로만 유지한다. 내부 참조 키로 쓰지 않는다.
- FE가 symbol을 통해 assetId가 필요한 경우 `GET /assets?symbol={symbol}` (G6) 를 사용한다.

---

## 4. 어댑터 계층 배치

#45(머지 완료) 어댑터 계층(`src/shared/api/`, `src/shared/lib/format/`)이 기반이다.
FE#47은 그 위에 도메인별 어댑터 파일을 추가한다.

```
src/shared/api/adapters/
  priceSeriesAdapter.ts   // PriceBarDto→PriceBar, PriceSeriesDto→PriceSeries
  assetAdapter.ts         // AssetBriefDto→AssetBrief (공용), AssetDetailDto→StockViewModel
  signalAdapter.ts        // SignalDto(+optional asset)→Signal
  alertAdapter.ts         // AlertDto→Alert, AlertCandidateDto→AlertCandidate
  portfolioAdapter.ts     // PortfolioSummaryDto→PortfolioSummary
src/shared/model/
  signal.ts               // Signal(+asset?: AssetBrief), SignalType (enum + 라벨 맵), riskLevel 라벨 맵
  priceSeries.ts          // PriceSeries, PriceBar
  stock.ts                // StockViewModel, AssetBrief (brief 타입은 asset 도메인 공용)
  alert.ts                // Alert, AlertCandidate + 관련 enum
  portfolio.ts            // PortfolioSummary, PositionWeight, SectorWeight
```

각 어댑터는 `parseDecimal`(#45 `src/shared/lib/format/`)을 사용한다.
enum 라벨 맵(`SignalType → 한글`)도 이 계층에서 관리해 화면은 라벨 맵만 참조한다.

---

## 5. 화면 영향 분석

| 화면 | 영향 | 변경 내용 |
|------|------|----------|
| Signals | 높음 | Signal 타입 전면 교체. 스파크라인 → PriceSeries 소비로 교체. kind→signalType 라벨 맵 적용. confidence→score |
| Alerts | 높음 | AlertRule 뷰 폐기. Alert + AlertCandidate 인박스 뷰로 대체. 조작(read/dismiss/confirm) 버튼 재구성 |
| Watchlist | 중간 | Stock 평면 타입 → StockViewModel 합성 뷰모델. assetId 도입 |
| Portfolio | 중간 | 클라이언트 파생 cashWeight·sectorWeights 제거, BE summary 직접 사용 |
| Research | 낮음 | assetId 식별자 도입, G7 펀더멘털 필드 추가(nullable). symbol 라우팅 유지 |
| Dashboard | 낮음 | Signal count 참조 방식 변경(signalType 기준) |
| DecisionLog | 없음(유지) | G10 BE 신규 완료 전까지 로컬 임시 유지 — #47 범위 밖 |

---

## 6. 확정 결정 (구 열린 질문 → 확정, 2026-06-25)

**OQ-1 확정 — riskLevel 자유 문자열 유지**: BE `risk_level: str | None`은 자유 문자열이 의도된
계약이며 BE 변경 없음. FE 도메인 타입은 `riskLevel: string | null`로 확정. 표시 계층에서
`HIGH/MEDIUM/LOW`에 한글 라벨을 매핑하고, 미지 값은 원문 그대로 표시한다.

**OQ-2 확정 — Signal symbol fallback + optional expand**: `SignalResponse`에 symbol 없음(asset_id만).
BE가 `?expand=asset`을 후속 추가 예정이나 현재 미구현이다. FE 설계 방향:
- Signal 도메인 타입에 `asset?: AssetBrief | null` 옵셔널 추가.
- expand 지원 후: 어댑터가 `dto.asset`을 `AssetBrief`로 변환해 Signal에 포함.
- expand 미지원 기간(fallback): 뷰레이어가 이미 로드된 asset 목록에서 `assetId`로 symbol을 조회.
  Signal마다 별도 asset fetch 발사 금지.
- `AssetBrief` 타입은 §2.3의 brief DTO와 동일 구조를 공용 사용.

**OQ-3 확정 — 가격 시계열 공개 GET**: 시장데이터 GET은 인증 없이 공개 접근 확정.
FE PriceSeries fetch는 인증 헤더 필수 의존을 피한다. 인증 클라이언트로 호출해도 BE가 거부하지 않으나,
미로그인 상태에서도 차트를 표시해야 하는 경우 공개 클라이언트로 분리한다.

**OQ-4 확정 — AssetBrief별도 DTO**: watchlist `?expand=asset`의 asset 응답은
`AssetDetailResponse`가 아닌 `AssetBriefResponse({symbol, name, price, change_percent, sector?})`다.
FE는 `AssetBriefDto` + `AssetBrief` 타입과 `adaptAssetBrief` 어댑터를 별도로 둔다.
`AssetDetailDto`와 재사용하지 않는다. 같은 brief 구조가 OQ-2 signals expand에도
재사용되므로 `assetAdapter.ts`에 공용 함수로 둔다.

---

## 7. 관련 문서

- BE#97 동결 계약: `project_stock/docs/designs/price-series-api.md`
- 계약 정렬: `project_stock/docs/api/contract-alignment.md` (양 repo 미러)
- 기존 도메인 설계: `docs/designs/6-domain-types-and-mock-data.md`
- FE 아키텍처: `docs/designs/2-frontend-architecture.md`
- 어댑터 계층 기반(#45): `src/shared/api/`, `src/shared/lib/format/`
