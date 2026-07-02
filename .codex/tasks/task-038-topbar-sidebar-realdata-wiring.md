# Codex Handoff Task

## Source Issue

FE #88(사이드바 알림 배지 실데이터 연동), FE #91(Topbar 실데이터·동작 연동). 설계
`docs/designs/81-topbar-sidebar-realdata-wiring.md`. 두 이슈 모두 신규 BE 계약 없이 기존
FE 쿼리·인증 컨텍스트로 자체 연동한다.

## Task Summary

`src/widgets/Sidebar.tsx`의 알림 메뉴 배지 리터럴 `6`을 미확인 알림 수 실데이터로 대체하고,
`src/widgets/Topbar.tsx`의 하드코딩·무동작 요소 중 이번 범위 항목(프로필 이니셜, 새로고침
재조회, 알림 버튼 네비게이션, 동기화 시각)을 실데이터·동작으로 연동한다.

## Goal

완료 시 참이어야 할 것:

- `Sidebar.tsx`에서 `alerts` 배지가 리터럴 `6` 대신 `useUnreadAlertSummary().unreadCount`를
  렌더하고, `unreadCount === 0`(로딩·오류 포함)이면 배지를 비노출한다. 네비게이션 전체는 정상
  렌더를 유지한다(슬롯 단위 열화).
- `Topbar.tsx`의 프로필 이니셜이 하드코딩 `IC` 대신 `useAuth().user`의 email에서 도출한
  대문자 1글자 이니셜을 렌더하고, `user`가 null이면 기본 폴백을 유지한다.
- `Topbar.tsx`의 새로고침 버튼(↻)이 클릭 시 `useQueryClient().invalidateQueries()`로 전체
  쿼리를 무효화하고, 동기화 시각을 현재 시각으로 갱신한다.
- `Topbar.tsx`의 알림 버튼(♧)이 클릭 시 `appRoutePaths.alerts`(`/alerts`)로 이동한다.
- `Topbar.tsx`의 고정 텍스트 `동기화 14:32`가 로컬 상태 `lastSyncedAt`(마운트 시 초기화,
  새로고침 시 갱신) 기반 KST 시:분 표시로 대체된다.
- 도움말 버튼(?)·프로필 드롭다운(⌄)은 이번 범위에서 변경하지 않는다.
- lint·typecheck·format·test·build 5종 검증이 모두 통과한다.

## Background

- #88 배지 소스(확정): 기존 훅 `useUnreadAlertSummary()`(`src/features/alerts/queries.ts`)가
  `GET /alerts?status=UNREAD`를 호출하고 `meta.total ?? data.length`로 `unreadCount`를 계산하며,
  이미 try/catch로 실패 시 `emptyUnreadAlertSummary`(`unreadCount: 0`)를 반환한다. 신규 훅을
  만들지 말고 이 훅을 재사용한다.
- 개수 소스 정합 메모: `AlertsPage`의 탭 카운트는 전체 알림 수(`useAlerts().data.length`)를
  쓰지만, 사이드바 배지는 알림 배지 의미에 맞게 미확인 수를 쓴다. 이 차이는 의도된 것이다.
- #91 프로필 소스(확정): `useAuth()`(`src/shared/auth/AuthProvider.tsx`)가 `user: MeUser | null`을
  제공한다. `MeUser`는 `{ id: number; email: string; [key: string]: unknown }`이라 username이
  보장되지 않으므로 이니셜은 email local-part의 첫 글자(대문자)를 기준으로 도출한다.
- 시각 포맷: `src/shared/lib/format/datetime.ts`에 `formatKstDate`·`formatKstDateTime`가 있으나
  시:분만 출력하는 포맷터는 없다. 동기화 시각 표시용으로 KST 시:분 포맷터를 추가할 수 있다
  (아래 Implementation Scope 참조).
- 알림 경로: `appRoutePaths.alerts = '/alerts'`(`src/shared/config/navigation.ts`). 네비게이션은
  `react-router-dom`의 `useNavigate`를 사용한다(다른 페이지에서 이미 사용 중인 패턴).
- 열화 원칙: 스파크라인·요약 연동(#77·#78·#80)에서 확립한 슬롯 단위 열화와 일관되게, 위젯
  일부 데이터가 없거나 오류여도 위젯·페이지 전체를 오류로 승격하지 않는다.

## Implementation Scope

- `src/widgets/Sidebar.tsx`:
  - `useUnreadAlertSummary()`를 호출하고, `alerts` 항목 배지의 리터럴 `6`을 `unreadCount`로 대체.
  - `unreadCount`가 0이거나 미정의(로딩·오류)면 배지 `<span>`을 렌더하지 않는다(비노출).
  - 배지 노출 시 기존 스타일·레이아웃(`ml-auto grid h-6 w-6 ...`)은 유지한다.
- `src/widgets/Topbar.tsx`:
  - 프로필 이니셜: `useAuth().user`의 email에서 대문자 1글자 이니셜을 도출해 하드코딩 `IC` 대체.
    `user`가 null이면 기본 폴백(기존 표시 또는 중립 값)을 유지. 이니셜 도출 로직은 컴포넌트
    내부의 작은 순수 함수 또는 인라인으로 처리한다.
  - 새로고침 버튼(↻): `useQueryClient().invalidateQueries()` 연결. 클릭 시 `lastSyncedAt` 갱신.
  - 알림 버튼(♧): `useNavigate()`로 `appRoutePaths.alerts` 이동. 카운트는 표시하지 않는다.
  - 동기화 시각: 로컬 상태 `lastSyncedAt`(초기값 마운트 시 현재 시각, 새로고침 시 현재 시각).
    KST 시:분 포맷으로 표시. 고정 텍스트 `14:32` 제거.
- `src/shared/lib/format/datetime.ts`(허용, 선택):
  - 시:분 전용 포맷터가 필요하면 `formatKstTime(iso: string): string`를 기존 포맷터와 동일한
    `Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', hour: ..., minute: '2-digit' })`
    패턴으로 추가한다. 인라인 포맷으로 충분하면 추가하지 않아도 된다.
- 테스트 추가·갱신(아래 Test Requirements).

## Out of Scope

- BE 변경(별도 repo).
- 도움말 버튼(?)·프로필 드롭다운(⌄) 동작 정의 — 별도 UX 필요, 현행 유지.
- 신규 전역 "last sync" 상태·컨텍스트 등 추상화 도입.
- 신규 알림 카운트 훅 생성(`useUnreadAlertSummary` 재사용).
- `AlertsPage`·알림 슬라이스 동작 변경.
- 카드·네비게이션 레이아웃·색상·아이콘 변경(배지 비노출 조건 외).

## Protected Files

없음. 위 Implementation Scope 밖 파일은 변경하지 않는다. 특히 `useUnreadAlertSummary`·
`AlertsPage`·알림 슬라이스 동작은 건드리지 않는다. 단, 위젯이 새 훅·네비게이션을 호출하게
되면서 필요한 기존 테스트·목 갱신은 스코프 내 필요 조치로 허용한다.

## Requirements

- 알림 배지는 미확인 수(`useUnreadAlertSummary().unreadCount`)를 쓰고 0건이면 비노출한다.
- 프로필 이니셜은 email local-part 첫 글자 대문자, `user` null이면 폴백.
- 새로고침은 `invalidateQueries()` 전체 무효화 + 동기화 시각 갱신.
- 알림 버튼은 `/alerts`로 이동하며 카운트를 표시하지 않는다.
- 동기화 시각은 로컬 상태 기반 KST 시:분 표시이며 새 전역 추상화를 도입하지 않는다.
- 위젯 열화는 슬롯 단위로 처리하고 위젯·페이지 전체를 오류로 승격하지 않는다.

## Test Requirements

- `src/widgets/Sidebar.test.tsx`(신규):
  - `useUnreadAlertSummary`를 목으로 대체. `unreadCount > 0`이면 배지에 해당 수가 렌더됨.
  - `unreadCount === 0`이면 배지가 렌더되지 않음(네비게이션은 정상 렌더).
  - (선택) 로딩·오류 상태에서 배지 비노출.
- `src/widgets/Topbar.test.tsx`(신규):
  - `useAuth`를 목으로 대체. `user.email`에서 도출한 대문자 이니셜이 렌더됨.
  - `user`가 null이면 기본 폴백 이니셜이 렌더됨.
  - 새로고침 버튼 클릭 시 `invalidateQueries`가 호출됨(`QueryClient` 목 또는 spy).
  - 알림 버튼 클릭 시 `/alerts`로 네비게이션 발생(`useNavigate` 목 또는 라우터 렌더 후 경로 확인).
  - 동기화 시각이 하드코딩 `14:32`가 아니라 `lastSyncedAt` 기반 시각으로 렌더됨(시:분 형식 확인).
- 라우터·QueryClient가 필요한 위젯 테스트는 기존 테스트(예: `src/widgets/MarketSummary.test.tsx`,
  페이지 테스트)의 provider 래핑 패턴을 따른다.

## Verification Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm format:check`
- `TZ=UTC corepack pnpm test`
- `corepack pnpm build`

## Documentation Impact

설계 `docs/designs/81-topbar-sidebar-realdata-wiring.md`가 근거(브랜치 포함). 추가 문서 갱신은
orchestrator가 리뷰 시 판단한다.

## ADR Need

불필요. 기존 훅·인증 컨텍스트·라우팅을 재사용하는 읽기 전용/네비게이션 연동이며 신규
아키텍처 결정이 없다.

## Failure Record Need

불필요.

## Risk Level

Low. 신규 BE 계약이 없고 기존 훅·컨텍스트를 재사용하는 위젯 계층 연동이다. 주의점은 배지
0건 비노출, 이니셜 폴백, 동기화 시각 로컬 상태, 알림 버튼 카운트 미표시(사이드바 배지와 중복
회피) 정도다.

## Expected Output

- 위 scope의 Sidebar·Topbar(및 선택적 datetime 포맷터)·테스트 변경.
- 검증 5종(lint·typecheck·format·test·build) 통과 로그.
- 가정(이니셜 도출 규칙·동기화 시각 소스·배지 열화 규칙)과 검증 결과 보고.

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected behavior(`useUnreadAlertSummary`·`AlertsPage`·알림 슬라이스).
- Report assumptions and verification results.

## Stop Conditions

- `useUnreadAlertSummary`가 `unreadCount`를 제공하지 않거나 시그니처가 다르면 멈추고 보고한다.
- `useAuth().user`에서 email을 얻을 수 없어 이니셜 도출이 불가하면 멈추고 보고한다.
- `appRoutePaths.alerts`가 존재하지 않으면 멈추고 보고한다.
