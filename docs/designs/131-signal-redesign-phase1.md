# Design — Issue 131: 시그널 페이지 재설계 1단계

기존 API 데이터만으로 디자인(signal.png) 레이아웃을 충실히 구현하고,
BE 신규 계약이 필요한 요소는 "준비 중" 자리표시로 처리한다.
signal_type → 카테고리 매핑을 shared 상수로 신설하여 KPI·필터·카드·레일이 단일 소스를 공유하도록 한다.

## Background

현재 `SignalsPage`는 `risk_level` 기준 KPI 3종, 버튼 2개짜리 카드, 신뢰도 수치만 있는 우선순위 레일로 구성되어 있으며 디자인과 구조가 크게 다르다. 이번 1단계는 기존 `useSignals`·`useSignalSparkline` 훅과 `Signal` 뷰 모델을 그대로 활용해 FE 셸을 완성한다. BE 신규 계약이 필요한 전일 대비 delta·변화 컬럼·최근 변경 타임라인·근거 불릿 구조화는 후속 phase로 분리한다.

## Layout Structure

라우트 `/signals`. 좌측 글로벌 내비게이션(`AppShell`)은 범위 밖이다.

```
┌─ SignalKpiRow (전체 폭) ──────────────────────────────────────┐
│  총 시그널 | 관망 유지 | 리스크 증가 | 매수 검토 가능 | 추가 리서치 필요  │
└────────────────────────────────────────────────────────────────┘

┌─ 메인 컬럼 (minmax(0,1fr)) ──┐  ┌─ 우측 레일 (≈25rem) ──────────┐
│  SignalFilters               │  │  SignalPriorityRail            │
│                              │  │  RecentChangesRail (placeholder)│
│  SignalCard grid             │  └────────────────────────────────┘
└──────────────────────────────┘
```

## Signal Category Mapping

### 위치

`src/features/signals/signalCategories.ts` 에 신설한다. `enumLabel.ts`의 `toLabel` 패턴을 따르며, 페이지·카드·레일이 이 파일만 import한다.

### SignalCategory 타입

```ts
type SignalCategory = 'WATCH' | 'RISK' | 'BUY' | 'RESEARCH'
```

### SIGNAL_CATEGORY_MAP

signal_type → `SignalCategory` 매핑 상수 (출처: 이슈 #131 요구사항, 사용자 승인 완료).

| signal_type | category |
|---|---|
| WATCH | WATCH |
| RISK_ALERT | RISK |
| THESIS_BROKEN | RISK |
| BUY_CANDIDATE | BUY |
| SELL_REVIEW | RESEARCH |
| OVERHEATED | RESEARCH |

매핑에 없는 signal_type은 `undefined`로 처리하여 카드에 배지를 표시하지 않는다(가정: 향후 신규 signal_type 추가 시 재검토).

### CATEGORY_META

`SignalCategory` 키별로 라벨·색상 토큰·아이콘 식별자를 보유한다.

| category | label | color token (가정) |
|---|---|---|
| WATCH | 관망 유지 | text-cockpit-text-muted / border-cockpit-border |
| RISK | 리스크 증가 | text-red-400 / border-red-400 |
| BUY | 매수 검토 가능 | text-emerald-400 / border-emerald-400 |
| RESEARCH | 추가 리서치 필요 | text-sky-400 / border-sky-400 |

색상 토큰은 구현 시 기존 cockpit 테마와 대조하여 확정한다(현재 값은 가정).

### 헬퍼 함수

`categoryOf(signalType: string): SignalCategory | undefined` — `SIGNAL_CATEGORY_MAP`에서 조회하여 반환한다.

## Component Contracts

### SignalKpiRow

```ts
interface SignalKpiRowProps {
  signals: Signal[]
}
```

- 총 시그널 카운트를 첫 번째 카드로 표시한다.
- `CATEGORY_META`를 순회하여 카테고리별 카운트와 비율(카운트/총합, 총합 0일 때 `—`)을 표시한다.
- "전일 대비" delta 자리는 `—` 또는 빈 문자열로 처리한다("준비 중").
- 기존 `SummaryCards`를 대체하며 `risk_level` 기준 집계를 제거한다.

### SignalFilters

```ts
interface SignalFiltersProps {
  category: SignalCategory | 'all'
  confidenceBand: 'all' | 'high' | 'mid' | 'low'
  market: string | 'all'
  query: string
  onCategoryChange: (v: SignalCategory | 'all') => void
  onConfidenceBandChange: (v: 'all' | 'high' | 'mid' | 'low') => void
  onMarketChange: (v: string | 'all') => void
  onQueryChange: (v: string) => void
  onReset: () => void
}
```

신뢰도 구간 경계값은 구현 시 확정한다(가정: high ≥ 70, mid 40–69, low < 40).

시장 목록은 `Signal.market` 값에서 동적으로 파생하거나, 초기에는 `['KR', 'US']`로 고정한다(가정: 실제 시장 코드 값 확인 후 결정).

### SignalCard

```ts
interface SignalCardProps {
  signal: Signal
}
```

- 헤더: 심볼 링크(`/research/:symbol`) + 회사명 + 카테고리 배지(`categoryOf(signal.signalType)` 기반) + `ConfidenceRing`.
- 본문: `signal.reason` 문자열 렌더(근거 불릿 구조화는 후속 phase).
- 하단: `SignalSparklineChart`(기존 재사용) + 1M 등락률.
- 버튼 3개: 근거 보기(`/research/:symbol`), 판단 기록(`/decision-log`), 알림 설정(`disabled`, "준비 중").
- `evidence` 필드는 현재와 동일하게 문자열로 렌더하되, 구조화 표시는 후속 phase로 이월한다.

### ConfidenceRing

기존 `ScoreRing`을 `ConfidenceRing`으로 개명하고 색상 결정 로직을 `signal.riskLevel` 기준에서 카테고리 기준으로 교체한다.

```ts
interface ConfidenceRingProps {
  score: number          // 0–100 정수, Signal.score
  category: SignalCategory | undefined
  symbol: string         // aria-label용
}
```

- 링 색상: RISK → `text-red-400`, 그 외 → `text-emerald-400`, undefined → `text-cockpit-text-muted`.
- `role="meter"`, `aria-label`, `aria-valuemin/max/now` 속성은 유지한다.

### SignalPriorityRail

```ts
interface SignalPriorityRailProps {
  signals: Signal[]
}
```

- `signal.score` 내림차순 상위 6건을 표시한다.
- 컬럼: 순위 · 심볼 · 카테고리 배지 · 신뢰도(score%).
- "변화" 컬럼은 `—`로 자리만 둔다("준비 중").

### RecentChangesRail

```ts
interface RecentChangesRailProps {}  // props 없음
```

- 전체를 "준비 중" `EmptyState`로 표시한다.
- BE 신규 계약(시그널 변경 이력) 연결 시 props가 추가된다.

## Data Derivation Rules

### 1M 등락률

`useSignalSparkline`이 반환하는 종가 배열의 첫 번째 값과 마지막 값으로 계산한다.

```
rate = (prices[last] - prices[0]) / prices[0] * 100
```

- 배열 길이가 2 미만이거나 `prices[0]`이 0이면 `null`을 반환하고 `—`로 표시한다.
- 시계열이 아직 로딩 중이면 `Skeleton`을 표시한다.
- 양수는 `text-emerald-400` + `+`, 음수는 `text-red-400`으로 표시한다(색상 토큰은 가정).

### KPI 비율

```
ratio = categoryCount / totalCount * 100
```

`totalCount`가 0이면 비율을 `—`으로 표시한다.

## Filter State Model

```ts
interface FilterState {
  category: SignalCategory | 'all'
  confidenceBand: 'all' | 'high' | 'mid' | 'low'
  market: string | 'all'
  query: string
}
```

필터→표시 시그널 파생 규칙:

1. `category !== 'all'` → `categoryOf(signal.signalType) === category` 인 시그널만 통과.
2. `confidenceBand !== 'all'` → score가 해당 구간에 속하는 시그널만 통과(경계값은 구현 시 확정).
3. `market !== 'all'` → `signal.market === market` 인 시그널만 통과.
4. `query` 비어 있지 않으면 → `symbol` 또는 `companyName`에 query가 포함된 시그널만 통과(대소문자 무시).
5. 위 조건을 모두 AND로 적용한 뒤 `signal.score` 내림차순 정렬.

필터 초기화 시 모든 필드를 초기값으로 되돌린다.

## Adapters / DTO 변경

`Signal` 뷰 모델과 `adaptSignal`은 구조를 변경하지 않는다. `signalType` 필드는 이미 존재하므로 `categoryOf` 호출만 추가하면 된다. `signalTypeLabel` 필드는 카테고리 라벨로 대체하지 않고 유지한다(하위 호환).

## "준비 중" 처리 목록

| 요소 | 처리 방식 |
|---|---|
| KPI "전일 대비" delta | `—` 텍스트 |
| 우선순위 레일 "변화" 컬럼 | `—` 텍스트 |
| RecentChangesRail 전체 | `EmptyState` ("준비 중") |
| 근거 불릿 구조화 | `signal.reason` 문자열 그대로 렌더 |
| 알림 설정 버튼 | `disabled` + "준비 중" aria-label |

## Out of Scope

- 좌측 시장 요약 사이드바 (전역 레이아웃 `AppShell` 소관).
- 전일 대비 delta · 변화 컬럼 · 최근 변경 타임라인 실데이터 (BE 신규 계약 필요).
- 근거 불릿 구조화 (BE `evidence` 필드 구조화 필요).
- `useSignals` · `useSignalSparkline` 쿼리 로직 변경.
- BE 신규 API 엔드포인트 추가.
