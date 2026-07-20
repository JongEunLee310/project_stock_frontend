# Codex Handoff Task

## Source Issue

이슈 #224 (F1) — 알림 API 클라이언트·`alertKeys` 재편 + 상단 요약 카드. 에픽 #133.
`gh issue view 224`, `gh issue view 133`로 맥락을 읽는다. BE 계약은 dev에 머지 완료
(alerts overview·alert-rules·alert-events·notification-channels).

## Task Summary

새 알림 관제 API의 클라이언트 기반(`alertKeys` 팩토리 + overview 쿼리/DTO/adapter)을 세우고,
상단 요약 카드 위젯을 구현한다. 규칙 목록·생성(F2 #225)과 내역·상세·채널(F3 #226)은 범위
밖이며, 본 이슈는 **overview + 요약 카드 + 사이드바 미읽음 배지 재연결**까지다.

## Goal

- `GET /api/v1/alerts/overview` 응답을 소비하는 `useAlertOverview` 쿼리 훅.
- `alertKeys` 쿼리키 팩토리 신설(overview·rules·events·channels 키를 커버, F2·F3가 확장).
- 상단 요약 카드 위젯: 활성 규칙·오늘 발생·중요도 높음·일시정지·미읽음.
- 사이드바 미읽음 배지를 새 overview `unread_count`로 재연결(구 시그널 래퍼 기반
  `useUnreadAlertSummary` 대신).
- 구 `features/alerts`의 Alerts/Candidates 인박스(`AlertsPage`)와 그 훅은 **건드리지 않는다**
  (F3에서 페이지 재구성 시 정리).

## Background

BE overview 계약(정본):

```
GET /api/v1/alerts/overview  ->  ApiResponse<AlertOverviewProjection>
AlertOverviewProjection = {
  active_rule_count: number,
  triggered_today_count: number,
  high_severity_count: number,
  paused_rule_count: number,
  unread_count: number,
  as_of: string  // ISO datetime(UTC)
}
```

FE 관례를 따른다:
- `apiGet<T>(path)`는 `{ data, meta }` 엔벨로프를 반환한다(`@/shared/api/client`). overview는
  `data`가 projection.
- DTO(snake_case) → `adapt*` → 도메인(camelCase) 패턴(`src/features/alerts/dto.ts`·
  `adapters.ts` 참고).
- 쿼리키는 기존 `src/features/alerts/queries.ts`의 `alertQueryKeys` 스타일을 따르되, 새
  엔드포인트용 `alertKeys` 팩토리를 도입한다(예: `all: ['alerts']`, `overview: () => [...]`,
  `rules`·`events`·`channels` 키도 정의해 F2·F3가 재사용).
- UI는 `@/shared/ui`의 `Card`·`Badge`·`Skeleton`·`ErrorState` 재사용. 중요도 색상은 배지에만
  제한적으로(낮음 파랑/회색·중간 주황·높음 빨강).

## Implementation Scope

- `src/features/alerts/dto.ts` — `AlertOverviewDto`(snake_case) 추가.
- `src/features/alerts/adapters.ts` — `adaptAlertOverview` + `AlertOverview` 타입(camelCase).
- `src/features/alerts/queries.ts`(또는 신규 `alertKeys.ts`) — `alertKeys` 팩토리 +
  `useAlertOverview` 훅.
- `src/widgets/`에 요약 카드 위젯(`AlertSummaryCards.tsx` 또는 폴더). loading/에러/empty 상태
  포함.
- `src/widgets/Sidebar.tsx` — 미읽음 배지를 `useAlertOverview().unreadCount`로 재연결.
- 관련 단위 테스트(adapter·훅·위젯).

## Out of Scope

- 규칙 목록/생성 UI·훅 (F2 #225).
- 최근 내역·상세·채널 UI·훅 (F3 #226).
- `AlertsPage`(구 인박스) 재구성·구 훅 제거 (F3).
- `/alerts` 페이지 통합 레이아웃 (F3).

## Protected Files

없음. `Sidebar.tsx`는 배지 소스만 교체(다른 nav 로직 유지).

## Requirements

1. `useAlertOverview`가 overview를 정확히 매핑(모든 카운트 + as_of).
2. 요약 카드가 5개 지표를 표시하고 loading/error/empty를 처리.
3. 사이드바 미읽음 배지가 overview `unread_count`를 반영.
4. 구 `AlertsPage`·`useAlerts`·`useAlertCandidates` 등은 무변경으로 계속 동작.

## Test Requirements

- `adaptAlertOverview` 단위 테스트, `useAlertOverview` 훅 테스트(기존 훅 테스트 방식 재사용),
  요약 카드 위젯 렌더 테스트(로딩/데이터/에러).
- 기존 테스트 회귀 없음.

## Verification Commands

- `pnpm format:check`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`

## Documentation Impact

- 없음(구현 이슈). 계약과 어긋나면 멈추고 가정을 보고한다.

## Risk Level

Low~Medium — 새 클라이언트 기반이라 F2·F3가 재사용할 `alertKeys`·adapter 패턴의 일관성이
중요하다.

## Expected Output

- overview DTO/adapter/훅, `alertKeys` 팩토리, 요약 카드 위젯, 사이드바 배지 재연결, 테스트.
- 지정된 현재 브랜치 `feat/224-alert-api-summary`에 커밋(자체 브랜치 생성 금지).
- 검증 4종 통과 보고.

## Rules

- Stay within scope. 구 인박스·규칙/내역/채널 UI는 건드리지 않는다.
- Do not weaken verification.
- 지정된 현재 브랜치를 유지한다. 새 브랜치 금지.
- Report assumptions and verification results.
