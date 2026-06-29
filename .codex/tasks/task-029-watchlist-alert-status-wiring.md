# Codex Handoff Task

## Source Issue

설계: `docs/designs/72-watchlist-alert-status-wiring.md` (Frozen). BE 페어: 051 / BE #task-117.

## Task Summary

WatchlistPage의 "빠른 알림 설정" 카드(`mockWatchlistAlertSettings`)를 제거하고, 실제 alerts 데이터를
사용하는 "알림 현황" 카드(미읽음 수 + 최근 알림)로 교체합니다. 더불어 alerts 어댑터를 BE 051 실데이터에
맞게 정리해 AlertsPage 드리프트를 해소합니다.

## Goal

- "알림 현황" 카드가 미읽음 알림 수와 최근 알림 N건(유형 라벨 · 종목 · 상대 시각)을 실데이터로 표시.
- `adaptAlert`가 BE 051의 `alert_type`/`message`/`symbol`을 매핑하고 `title`을 FE에서 파생.
- `mockWatchlistAlertSettings` 사용 제거(정의는 shared/mock 잔존).

## Background — 오케스트레이터가 확정한 사실

- 설계 72가 정본이며 동결됨.
- BE 051 응답(`AlertResponse`)은 기존 필드에 더해 `asset_id`, `symbol`, `alert_type`(=signal_type),
  `message`(=signal.reason)를 포함한다. `title`은 BE가 보내지 않으므로 FE가 파생한다.
- 카드는 `/alerts?status=UNREAD`를 호출해 `meta.total`을 미읽음 수로, `data` 상위 N건을 최근 알림으로 쓴다.
- BE 051 미배포 시: 어댑터 라벨 fallback·`?? ''`과 쿼리 try/catch 빈 폴백으로 흡수한다(FE 단독 머지 안전).
- AI 관찰 메모(`mockWatchlistObservations`)는 유지한다. 알림 임계값/선호도 설정 기능은 범위 밖.

## Implementation Scope

- `src/features/alerts/dto.ts`
  - `AlertDto.title`을 `title?: string | null`로 완화.
- `src/shared/lib/format/enumLabel.ts`
  - `alertTypeLabels` 추가: `WATCH`→관찰, `RISK_ALERT`→위험 경보, `THESIS_BROKEN`→논거 훼손,
    `BUY_CANDIDATE`→매수 후보, `SELL_REVIEW`→매도 검토, `OVERHEATED`→과열.
- `src/features/alerts/adapters.ts`
  - `adaptAlert`: `alertType`=`toLabel(alertTypeLabels, dto.alert_type)`,
    `title`=`dto.title` 우선, 없으면 `symbol` 결합 또는 유형 라벨로 파생,
    `message`=`dto.message ?? ''`, `symbol`/`assetId` 기존 방어 유지.
- `src/features/alerts/queries.ts`
  - `useUnreadAlertSummary()` 추가: `/alerts?status=UNREAD` 호출, `meta.total`→`unreadCount`,
    `data` 상위 N(5)→`recent`(`adaptAlert`). 실패 시 `{ unreadCount: 0, recent: [] }`.
- `src/pages/ui/WatchlistPage.tsx`
  - "빠른 알림 설정" 카드를 "알림 현황" 카드로 교체(미읽음 수 + recent 목록 + 0건 빈 상태).
  - `mockWatchlistAlertSettings` import/사용 제거.

## Out of Scope

- `mockWatchlistObservations` 변경(유지).
- `shared/mock/domain.ts`의 `mockWatchlistAlertSettings` 정의 자체 삭제(정의는 남기고 사용만 제거).
- 기존 `useAlerts`/뮤테이션 로직, AlertsPage 레이아웃 변경(어댑터 정리 효과만 적용).
- 알림 임계값/선호도 설정 기능(신규).

## Protected Files

없음.

## Requirements

- BE 051 미배포/호출 실패 시 빈 알림 현황으로 graceful 처리.
- 카드 로딩/빈 상태 처리.
- typecheck/lint/format 통과.

## Test Requirements

- `adaptAlert`: `alert_type` 라벨 매핑, `title` 파생(미전송 시 유형/심볼 기반), `message`/`symbol` 폴백.
- `useUnreadAlertSummary` 또는 카드 렌더: 미읽음 수 표시, recent 목록 표시, 0건 빈 상태, 실패 시 빈 폴백.
- `mockWatchlistAlertSettings`가 더 이상 WatchlistPage에서 렌더되지 않음을 확인.
- 기존 alerts/AlertsPage 테스트가 어댑터 변경 후에도 통과(필요 시 갱신).

## Verification Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm format:check`
- `TZ=UTC corepack pnpm test`
- `corepack pnpm build`

## Documentation Impact

- `docs/designs/72-watchlist-alert-status-wiring.md` 추가됨(정본).
- 이 핸드오프 문서 추가.

## ADR Need

불요. 기존 alerts 소비 확장, 신규 아키텍처 결정 없음.

## Failure Record Need

불요. 국소 변경, 회귀는 테스트로 커버.

## Risk Level

Low. 페이지 국소 변경 + 어댑터 정리, graceful degradation 유지.

## Expected Output

- 위 5개 파일 변경 + 테스트.
- 브랜치 `feat/watchlist-alert-status-wiring`에 커밋(한국어 메시지).

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
