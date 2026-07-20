# Codex Handoff Task

## Source Issue

이슈 #226 (F3) — 최근 알림 내역·상세(근거)·채널 설정 + `/alerts` 페이지 통합 레이아웃.
에픽 #133. `gh issue view 226`, `gh issue view 133`으로 맥락을 읽는다. 설계 근거는 BE repo의
`docs/designs/alert-rule-event-unified.md`(§8 API·§13 상세·§14 채널)와 ADR-013 §13·§14·§24.
BE 계약은 dev/main에 머지 완료(alert-events·notification-channels).

## Task Summary

알림 관제 페이지의 마지막 조각이다. 규칙(설정)과 결과(내역)를 시각적으로 분리한 통합
레이아웃으로 `/alerts` 페이지를 재구성하고, 최근 내역 패널·알림 상세(근거)·채널 설정 위젯을
신설한다. F1(요약 카드)·F2(규칙 테이블·빌더)가 만든 조각을 이 페이지가 조립한다.

구 인박스(`AlertsPage`의 Alerts/Candidates 탭 UI)는 새 통합 레이아웃으로 대체된다.

## Goal

- 통합 페이지: **요약(F1) → 규칙·설정(F2) → 내역·결과(신규) → 채널(신규)** 순, 규칙과 내역을
  시각적으로 분리.
- 최근 내역 패널: 발생 시각·대상·규칙·메시지·중요도·전달 상태·읽음. 읽음 처리 후
  `alertKeys.events`·`alertKeys.overview` invalidate.
- 알림 상세: 발생 조건·현재값·임계값·이전값·근거(evidence)·관련 대상.
- 채널 설정 패널: 채널 목록·추가(APP 기본, EMAIL은 이메일 입력).

## Background — BE 계약(정본)

모든 응답은 `{ data, meta }` 엔벨로프. 경로 접두사 `/api/v1`은 client가 처리.

### alert-events (`/alert-events`)

```
GET  /alert-events?severity=&read=&target_type=&page=&size=&sort=
                                   -> ApiResponse<AlertEventProjection[]> (paginated)
POST /alert-events/read            body {alert_ids:number[]}(최소1) -> AlertEventProjection[]
GET  /alert-events/{id}            -> AlertEventDetailProjection
POST /alert-events/{id}/read       -> AlertEventProjection
```

- `sort` 허용: `-triggered_at`(기본)·`triggered_at`·`severity`·`-severity`·`id`·`-id`.
- `read` 필터는 boolean(`true`=읽음만, `false`=안읽음만, 미지정=전체). `severity`·`target_type`은 enum.

`AlertEventProjection`(snake):

```
id, rule_id, user_id: number
target_type: string   // SYMBOL|WATCHLIST|PORTFOLIO|TOPIC|MARKET
target_id: string | null
asset_id: number | null
title, message: string
severity: string      // LOW|MEDIUM|HIGH|CRITICAL
read_at: string | null   // ISO(UTC), null이면 안읽음
triggered_at: string     // ISO(UTC)
```

`AlertEventDetailProjection` = 위 + 다음 두 필드:

```
triggered_value: object
evidence: object[]
```

`triggered_value`는 단일/복합에 따라 형태가 다르다:
- 단일: `{ metric: string, current: any, previous: any|null, threshold: any }`
- 복합(all): `{ conditions: [ {metric, current, previous, threshold}, ... ] }`

`evidence`는 `kind`별로 필드가 다른 열린 dict 배열이다(예):
- `{ kind:"PRICE", symbol, market, previous_close, current_close, as_of }`
- `{ kind:"SIGNAL_SNAPSHOT", asset_id, snapshot_date, signal_id, score }`
- `{ kind:"PORTFOLIO_POSITION", portfolio_id, asset_id, weight, market_value }`
- `{ kind:"EARNINGS_EVENT", asset_id, symbol, market, event_date }`

상세 렌더링은 **evidence 스키마를 하드코딩하지 말고** `kind`를 헤더로, 나머지 키-값을 라벨로
일반 렌더한다(알려진 kind는 한국어 라벨 부여, 미지의 kind도 키-값으로 안전 표시). `triggered_value`는
지표·현재값·임계값·이전값으로 표시하되, `previous`가 null이면 생략한다. `metric`은 F2의 metric
라벨을 재사용한다.

### notification-channels (`/notification-channels`)

```
GET  /notification-channels        -> NotificationChannelProjection[]  // 최초 조회 시 APP 채널 lazy 생성
POST /notification-channels         body {channel_type, configuration} -> NotificationChannelProjection (201)
```

`NotificationChannelProjection`: `id, user_id, channel_type, configuration(object), enabled, verified_at(nullable)`.
생성 규칙(BE): `APP`은 configuration 불필요. `EMAIL`은 `configuration.email`이 유효한 이메일이어야
함(아니면 422). `DISCORD`·`SLACK`은 현재 거부(422). 따라서 채널 추가 UI는 **APP·EMAIL만** 노출한다.

## FE 관례 (반드시 따를 것)

- F1의 `alertKeys` 팩토리를 그대로 확장한다(`alertKeys.events(filters)`·`alertKeys.channels()`).
  F1·F2와 동일하게 DTO(snake)→`adapt*`→도메인(camel), `apiGet`/`apiPost` 엔벨로프.
- 내역 읽음/채널 추가 성공 시 관련 키를 invalidate한다(읽음 → `events`·`overview`, 채널 추가 →
  `channels`).
- UI 프리미티브 `@/shared/ui` 재사용: 내역 목록은 `Table`(정렬·페이지네이션) 또는 카드 리스트,
  상세는 drawer/panel(F2 빌더의 자체 오버레이 패턴 참고, 공용 프리미티브 신설 금지), 중요도·전달
  상태는 `Badge`, 로딩 `Skeleton`, 에러 `ErrorState`, 빈 상태 `EmptyState`.
- 날짜는 기존 `formatKstDateTime`(adapters에서), 중요도 색상은 배지에만 제한(F1·F2와 일관).
- `conditionText`(F2)는 규칙 조건 번역용이다. 상세의 `triggered_value`는 조건이 아니라 발생값이므로
  별도 표기(지표/현재/임계/이전)로 렌더한다 — `conditionText`를 억지로 재사용하지 않는다.

## Implementation Scope

- `src/features/alerts/dto.ts` — `AlertEventDto`·`AlertEventDetailDto`·`NotificationChannelDto` 추가.
- `src/features/alerts/adapters.ts` — `adaptAlertEvent`·`adaptAlertEventDetail`·`adaptNotificationChannel` + 도메인 타입.
- `src/features/alerts/queries.ts` — `useAlertEvents(filters)`·`useAlertEvent(id)`·
  `useMarkAlertEventRead`·`useMarkAlertEventsRead`(bulk)·`useNotificationChannels`·`useCreateNotificationChannel`.
- `src/widgets/alert-history-panel/` — 최근 내역 패널(필터·페이지네이션·읽음·행 클릭 시 상세 열기).
- `src/widgets/alert-detail/` — 알림 상세(triggered_value·evidence·대상). drawer/panel.
- `src/widgets/notification-channel-panel/` — 채널 목록·추가(APP·EMAIL).
- `src/pages/ui/AlertsPage.tsx` — 통합 레이아웃으로 재구성(요약→규칙→내역→채널).
- 관련 단위 테스트.

## Out of Scope

- 시그널 카드 → Rule Builder deep-link (#134, 별도).
- 채널 검증(verify) 플로우·DISCORD/SLACK.
- BE 미지원 지표 3종(NEWS_RISK·THEME_HEAT·AI_JUDGMENT) 관련 특수 처리 — 내역은 발생한 이벤트만
  표시하므로 영향 없음.

## Protected Files / 주의

- **`useAlertCandidates`는 제거 금지** — `DashboardPage.tsx`(우선순위 큐)가 사용 중이다.
- 구 인박스 전용 훅(`useAlerts`·`useReadAlert`·`useDismissAlert`·`useReadCandidate`·
  `useConfirmCandidate`)은 페이지 재구성으로 미참조가 될 수 있다. 안전하게 미참조가 확인되면 해당
  훅과 테스트를 제거해 dead code를 남기지 않아도 되고(정리), 판단이 서지 않으면 그대로 두어도 된다.
  단 위 `useAlertCandidates`와 `useAlertOverview`(F1)·규칙 훅(F2)은 유지한다.
- F1 `AlertSummaryCards`·F2 `AlertRuleTable`·`AlertRuleBuilder`는 그대로 조립만 한다(계약 변경 금지).
- `Sidebar` 미읽음 배지는 이미 overview 기반(F1)이라 무변경.

## Requirements

1. 통합 페이지가 요약→규칙→내역→채널 순으로 배치되고, 규칙(설정) 영역과 내역(결과) 영역이
   시각적으로 명확히 분리된다.
2. 내역 패널이 severity·read·target_type 필터와 정렬·페이지네이션을 지원하고, 개별/일괄 읽음 처리
   후 `events`·`overview`가 갱신된다.
3. 상세가 triggered_value(지표·현재·임계·이전)와 evidence(kind별 근거)와 대상을 표시한다. evidence
   스키마를 하드코딩하지 않고 일반 렌더한다.
4. 채널 패널이 목록을 보여주고 APP·EMAIL 추가를 지원한다(EMAIL은 이메일 입력·검증). 추가 후
   `channels` 갱신.
5. 구 인박스 UI가 새 레이아웃으로 대체되고, `DashboardPage`는 무변경으로 계속 동작한다.

## Test Requirements

- `adaptAlertEvent`·`adaptAlertEventDetail`·`adaptNotificationChannel` 단위 테스트.
- 내역 훅·읽음 뮤테이션(invalidate 호출)·채널 생성 훅 테스트.
- 내역 패널(로딩/데이터/빈/에러·읽음·상세 열기), 상세(단일·복합 triggered_value·evidence 렌더),
  채널 패널(목록·APP/EMAIL 추가·EMAIL 검증) 위젯 테스트.
- 페이지 통합 렌더 테스트(4개 영역 존재). 기존 테스트 회귀 없음.

## Verification Commands

- `pnpm format:check`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`

## Documentation Impact

- 없음(구현 이슈). 계약과 어긋나면 멈추고 가정을 보고한다.

## Risk Level

Medium — 3개 신규 위젯 + 페이지 재구성 + 구 인박스 대체가 한 번에 들어간다. evidence/triggered_value의
열린 스키마를 안전하게 일반 렌더하는 것과, `useAlertCandidates`를 보존하며 구 인박스만 정리하는
경계가 중요하다.

## Expected Output

- 이벤트·채널 DTO/adapter/쿼리·뮤테이션, 내역 패널·상세·채널 패널 위젯, 통합된 `AlertsPage`, 테스트.
- 지정된 현재 브랜치(아래)에 커밋. 자체 브랜치 생성 금지.
- 검증 4종 통과 보고.

## Rules

- Stay within scope. deep-link(#134)·채널 verify·DISCORD/SLACK는 건드리지 않는다.
- `useAlertCandidates`·`DashboardPage`를 깨지 않는다.
- Do not weaken verification.
- 지정된 현재 브랜치를 유지한다. 새 브랜치 금지.
- evidence 스키마를 하드코딩하지 않는다(일반 렌더 + 알려진 kind 라벨).
- Report assumptions and verification results.
