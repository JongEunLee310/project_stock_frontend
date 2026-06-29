# 72 · Watchlist 알림 현황 와이어링

Status: Frozen
Track: FE
Pair: BE 051 (`docs/designs/051-alert-response-signal-context.md`)

## 1. 배경

WatchlistPage의 "빠른 알림 설정" 카드(`mockWatchlistAlertSettings`)는 진실된 출처가 없는 설정값
(가격 변동 ±3%, 뉴스 위험도, 테마 과열 등)입니다. 이를 제거하고, 같은 자리에 실제 alerts 데이터를
사용하는 "알림 현황" 카드로 재해석합니다([[71-watchlist-summary-wiring]] 진실값 원칙 계승).

부수적으로, FE `AlertDto`는 이미 `symbol/alert_type/title/message`를 기대하지만 BE는 그간 `signal_id`만
보내 AlertsPage(알림 인박스)가 제목·내용·종목을 비운 채 렌더하는 드리프트가 있었습니다. BE 051이
`asset_id/symbol/alert_type/message`를 채워 보내므로 본 트랙에서 어댑터를 정리해 AlertsPage 드리프트도
해소합니다.

## 2. 범위

### 포함

- "알림 현황" 카드: 미읽음 알림 수 + 최근 알림 N건(시그널 유형 라벨 · 종목 · 상대 시각).
- alerts 어댑터 정리: BE 051 실데이터 매핑, `title` FE 파생.
- `alertTypeLabels`(시그널 유형 → 한글) 라벨맵 추가.

### 제외 (mock 유지 / 제거)

- "빠른 알림 설정" 카드(`mockWatchlistAlertSettings`) — 출처 없어 **제거**(정의는 shared/mock 잔존).
- AI 관찰 메모(`mockWatchlistObservations`) — mock 유지(후속 트랙).
- 알림 임계값/선호도 설정 기능 — 신규 제품 기능이라 범위 밖.

## 3. 변경

### 3.1 dto (`src/features/alerts/dto.ts`)

- `AlertDto.title`을 `title?: string | null`로 완화(BE 미전송, FE 파생). 나머지 필드는 유지.

### 3.2 라벨 (`src/shared/lib/format/enumLabel.ts`)

- `alertTypeLabels: Record<string, string>` 추가 — 시그널 유형 와이어 → 한글:
  `WATCH`→관찰, `RISK_ALERT`→위험 경보, `THESIS_BROKEN`→논거 훼손,
  `BUY_CANDIDATE`→매수 후보, `SELL_REVIEW`→매도 검토, `OVERHEATED`→과열.

### 3.3 adapters (`src/features/alerts/adapters.ts`)

- `adaptAlert`:
  - `alertType` ← `toLabel(alertTypeLabels, dto.alert_type)`.
  - `title` ← `dto.title`가 있으면 사용, 없으면 `symbol`이 있을 때 `"{symbol} {유형라벨}"`,
    없으면 유형 라벨로 파생.
  - `message` ← `dto.message ?? ''`.
  - `symbol`/`assetId` 기존 `?? null` 방어 유지.

### 3.4 queries (`src/features/alerts/queries.ts`)

- `useUnreadAlertSummary()` 추가 — `/alerts?status=UNREAD` 호출. 응답 `meta.total`을 `unreadCount`로,
  `data` 상위 N(예: 5)건을 `adaptAlert`로 매핑해 `recent`로 반환.
  실패 시 `{ unreadCount: 0, recent: [] }`로 graceful degradation(try/catch).
- 기존 `useAlerts`/뮤테이션은 변경하지 않습니다(어댑터 정리 효과만 적용).

### 3.5 WatchlistPage (`src/pages/ui/WatchlistPage.tsx`)

- "빠른 알림 설정" 카드(`mockWatchlistAlertSettings` 그리드)를 "알림 현황" 카드로 교체:
  - 헤더: 미읽음 알림 수(`unreadCount`).
  - 본문: `recent` 목록(유형 라벨 · `symbol` · 상대 시각). 0건이면 "새 알림이 없습니다." 빈 상태.
  - 톱니 버튼 등 설정 진입 장식은 제거하거나 의미에 맞게 정리.
- `mockWatchlistAlertSettings` import/사용 제거. `mockWatchlistObservations`는 유지.

## 4. 계약·degradation

- BE 051 미배포 시: `alert_type`/`message`/`symbol`이 비어도 어댑터가 라벨 fallback·`?? ''`로 흡수하고,
  카드 쿼리 실패는 빈 요약으로 degrade해 페이지가 깨지지 않습니다. FE 단독 머지 안전.
- `mockWatchlistAlertSettings` 정의 자체는 타 화면 영향 확인 전까지 `shared/mock`에 남기고 사용만 제거합니다.

## 5. 범위 밖

- 알림 임계값/선호도 설정 기능(신규 테이블·CRUD).
- AI 관찰 메모, 알림 인박스 페이지 레이아웃 변경.
- BE 051 외 alerts 계약 변경.
