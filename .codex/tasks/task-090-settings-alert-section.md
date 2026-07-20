# Codex Handoff Task

## Source Issue

이슈 #233 — `/settings`에 알림 설정 영역을 신설하고 규칙·채널 위젯을 이관한다.
`gh issue view 233`로 맥락을 읽는다. 근거는 ADR-014 §1·§3(BE 저장소
`docs/decisions/ADR-014-settings-consolidation-and-alerts-split.md`, PR
JongEunLee310/project_stock#342로 머지 완료). ADR-014 적용 3단계 중 1단계다.

## Task Summary

설정 성격의 기능을 `/settings` 한곳에 모으기로 한 결정에 따라, 지금 `AlertsPage`가 들고 있는
알림 규칙 관리와 채널 설정을 `SettingsPage`로 옮긴다. 위젯은 그대로 재사용하고 배치와 상태
소유자만 바꾼다.

## Goal

- `/settings`에서 알림 규칙 조회·생성·수정·복제·일시정지와 채널 설정이 모두 동작한다.
- `/settings?builder=create&symbol=TSLA` 진입 시 Rule Builder가 prefill과 함께 열린다.
- `/settings`가 도메인별 영역으로 나뉘는 골격을 갖춰, 이후 다른 도메인 설정이 같은 형태로
  추가될 수 있다.

## Background — 현재 코드

- `src/pages/ui/SettingsPage.tsx` — 프로필 카드 하나만 있다. 65행에 과거 알림 설정 섹션을
  제거했다는 주석이 남아 있는데, 이번 작업으로 상황이 바뀌므로 그 주석은 지운다.
- `src/pages/ui/AlertsPage.tsx` — 네 영역(`Overview`·`Settings`·`Results`·`Delivery`)을 세로로
  쌓고 있다. 이 중 `Settings`(규칙)와 `Delivery`(채널)가 이관 대상이다.
  - `BuilderState`(`{ mode, rule, prefill }`) 상태와 `setBuilderState` 호출부.
  - `useSearchParams`로 `builder=create`·`symbol=`을 읽어 create 모드로 열고
    `setSearchParams({}, { replace: true })`로 쿼리를 제거하는 `useEffect`.
  - "새 규칙 만들기" 버튼.
  - `AlertRuleTable`의 `onEdit`·`onDuplicate` 핸들러.
  - `AlertRuleBuilder`·`NotificationChannelPanel` 렌더링.
- 이관 대상 위젯: `@/widgets/alert-rule-table`, `@/widgets/alert-rule-builder`,
  `@/widgets/notification-channel-panel`.
- 라우트는 `appRoutePaths.settings`(`/settings`, `src/shared/config/navigation.ts`)로 이미
  존재한다. 라우터는 react-router-dom v7.

## Implementation Scope

- `src/pages/ui/SettingsPage.tsx`
  - 알림 설정 영역을 추가한다. 기존 프로필 카드와 나란히 두되, 도메인별 영역임이 드러나는
    구조로 만든다. 영역 제목과 설명을 두고, 이후 다른 도메인 설정이 같은 골격으로 붙을 수
    있게 한다.
  - 규칙 영역에 `AlertRuleTable`과 "새 규칙 만들기" 버튼을, 채널 영역에
    `NotificationChannelPanel`을 배치한다.
  - `AlertsPage`에 있던 `BuilderState` 상태·핸들러·`AlertRuleBuilder` 렌더링을 그대로 옮긴다.
  - 쿼리 파라미터 기반 builder 오픈 `useEffect`를 옮긴다. 소비 후 쿼리를 제거하는 동작과
    prefill 구성(`{ templateType: 'NEWS_RISK_HIGH', targetId: symbol }`)은 그대로 유지한다.
  - 기존 프로필 로딩·에러 처리 분기를 깨지 않는다. 프로필 조회가 로딩이거나 실패해도 알림
    설정 영역이 의미 있게 동작하도록 배치를 정한다. 프로필 실패 시 화면 전체가
    `ErrorState`로 대체되는 현재 구조를 유지할지 알림 영역은 남길지 판단하고, 판단 근거를
    보고한다.
- 필요하면 위젯 인덱스의 재노출 정도만 손본다.

## Out of Scope

- `AlertsPage`에서 규칙·채널 영역을 제거하는 작업. 2단계 이슈 #234에서 한다. 이번 작업
  이후 두 화면에 잠시 공존해도 무방하며, `AlertsPage`는 건드리지 않는다.
- Signals deep-link 목적지 변경. 3단계 이슈 #235에서 한다.
- 위젯 내부 구조·계약 변경. `AlertRuleTable`·`AlertRuleBuilder`·`NotificationChannelPanel`은
  props를 그대로 쓰고 내부를 고치지 않는다.
- 신규 라우트 추가. ADR-014 §3이 기존 `/settings`를 쓰도록 정했다.
- 신규 템플릿 추가, 폼 검증 로직 변경, BE 계약 변경.
- 사이드바 메뉴 구성 변경.

## Protected Files

- `src/pages/ui/AlertsPage.tsx` — 이번 작업에서 변경하지 않는다.
- `src/shared/config/navigation.ts` — 라우트 추가·변경 없음.
- 이관 대상 위젯 3종의 내부 구현.

## Requirements

1. `/settings`에서 알림 규칙 목록이 보이고 생성·수정·복제·일시정지가 동작한다.
2. `/settings`에서 채널 설정이 동작한다.
3. `/settings?builder=create&symbol=TSLA` 진입 시 Rule Builder가 create 모드로 열리고
   `NEWS_RISK_HIGH` 템플릿과 해당 종목 `targetId`가 prefill된다.
4. 쿼리는 소비 후 제거되어 새로고침 시 builder가 재오픈되지 않는다.
5. 쿼리 없는 `/settings` 진입은 builder를 열지 않으며 기존 프로필 표시가 그대로 동작한다.
6. `AlertsPage`는 변경되지 않아 기존 동작을 유지한다.

## Test Requirements

- SettingsPage: 알림 규칙 영역과 채널 영역이 렌더링되는지.
- SettingsPage: "새 규칙 만들기" 클릭 시 builder가 create 모드로 열리는지, 테이블의
  edit·duplicate가 해당 모드로 여는지.
- SettingsPage: `builder=create&symbol=...` 진입 시 prefill과 함께 열리고 쿼리가 제거되는지.
- SettingsPage: 쿼리 없는 진입은 builder를 열지 않는지.
- 기존 SettingsPage 테스트와 AlertsPage 테스트 회귀 없음.

## Verification Commands

- `pnpm format:check`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`

## Documentation Impact

없음(구현 이슈). ADR-014가 이미 결정을 담고 있다. 계약과 어긋나는 지점을 발견하면 멈추고
가정을 보고한다.

## Risk Level

Low-Medium — 위젯 재사용이라 로직 위험은 낮다. 주의할 점은 프로필 조회 로딩·에러 분기와
알림 영역의 공존 방식, 그리고 쿼리 파라미터 처리를 옮기는 과정에서 소비·제거 타이밍이
어긋나지 않게 하는 것이다.

## Expected Output

- `SettingsPage` 알림 설정 영역 신설과 상태·쿼리 처리 이관, 테스트 추가.
- 지정된 현재 브랜치에 커밋. 자체 브랜치 생성 금지.
- 검증 4종 통과 보고. 프로필 로딩·에러 분기 처리 방식에 대한 판단 근거 보고.

## Rules

- Stay within scope. `AlertsPage`와 deep-link는 건드리지 않는다.
- Do not weaken verification.
- 지정된 현재 브랜치를 유지한다. 새 브랜치 금지.
- Report assumptions and verification results.
