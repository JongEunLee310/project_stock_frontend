# Codex Handoff Task

## Source Issue

이슈 #234 — `/alerts`를 관제 전용으로 축소하고 설정 화면으로 가는 링크를 둔다.
`gh issue view 234`로 맥락을 읽는다. 근거는 ADR-014 §2·§4(BE 저장소
`docs/decisions/ADR-014-settings-consolidation-and-alerts-split.md`). ADR-014 적용 3단계 중
2단계다.

선행 조건인 #233(PR #237)은 `main`에 머지 완료다. 규칙·채널 위젯이 이미 `/settings`에서
동작하므로 이번에 `/alerts`에서 걷어내도 기능 공백이 생기지 않는다.

## Task Summary

`AlertsPage`에서 규칙 섹션과 채널 섹션을 제거해 관제 요약과 발생 내역만 남긴다. 설정으로
이동하는 링크를 눈에 띄게 두어 규칙을 고치러 갈 수 있게 한다.

## Goal

- `/alerts`에 규칙 테이블·Rule Builder·채널 설정이 남지 않는다.
- 관제 요약과 발생 내역이 화면 위쪽에서 바로 보인다.
- 규칙을 고치려는 사용자가 설정 화면으로 이동할 경로를 화면에서 찾을 수 있다.

## Background — 현재 코드

`src/pages/ui/AlertsPage.tsx`는 네 영역을 세로로 쌓고 있다.

- `Overview` — `AlertSummaryCards`. 유지한다.
- `Settings` — 제목 "규칙·설정", "새 규칙 만들기" 버튼, `AlertRuleTable`. 제거한다.
- `Results` — "내역·결과", `AlertHistoryPanel`, 선택 시 `AlertDetail`. 유지한다.
- `Delivery` — "채널 설정", `NotificationChannelPanel`. 제거한다.

페이지 하단에 `AlertRuleBuilder`와 `AlertDetail`이 함께 렌더링된다. `AlertRuleBuilder`와
`BuilderState` 상태, `useSearchParams` 기반 쿼리 처리는 #233에서 `SettingsPage`로 이미
옮겨졌으므로 여기서는 제거 대상이다.

헤더 설명 문구는 "감시 규칙을 설정하고 발생 결과와 전달 채널을 한곳에서 관리합니다"인데,
축소 후에는 맞지 않는다.

라우트 상수는 `appRoutePaths.settings`(`src/shared/config/navigation.ts`)에 있다. 라우터는
react-router-dom v7이다.

## Implementation Scope

`src/pages/ui/AlertsPage.tsx`와 그 테스트만 고친다.

- `Settings` 섹션과 `Delivery` 섹션을 제거한다. 함께 쓰이던 `AlertRuleTable`·
  `NotificationChannelPanel`·`AlertRuleBuilder` import와 `BuilderState` 타입, `builderState`
  상태, `useSearchParams` 처리, "새 규칙 만들기" 버튼, `onEdit`·`onDuplicate` 핸들러를 모두
  걷어낸다. 쓰이지 않게 된 import가 남지 않도록 한다.
- `AlertSummaryCards`와 `AlertHistoryPanel`·`AlertDetail`만 남기고, 두 영역의 상하 배치와
  여백을 관제 화면에 맞게 정리한다. `Results` 섹션 위의 강조 구분선(`border-t-2`)은 설정
  영역과 나누던 장치이므로 남길 이유가 있는지 판단해 정리한다.
- 헤더 설명 문구를 관제 책임에 맞게 고친다.
- 설정 화면으로 가는 링크를 둔다. `appRoutePaths.settings`를 사용하고, 하드코딩한 경로
  문자열을 쓰지 않는다. 헤더 오른쪽처럼 눈에 띄는 자리에 두어 규칙 편집 진입점임이 드러나게
  한다.
- 규칙이 하나도 없을 때 설정으로 유도한다. 현재 빈 상태 표시가 `AlertSummaryCards`나
  `AlertHistoryPanel` 내부에 있다면 위젯을 고치지 말고 `AlertsPage` 수준에서 안내를 둔다.
  규칙 수를 알 수 있는 기존 조회를 재사용하고, 이를 위해 새 API 호출을 추가해야 한다면
  멈추고 보고한다.

## Out of Scope

- 위젯 내부 구조·계약 변경. `AlertSummaryCards`·`AlertHistoryPanel`·`AlertDetail`은 그대로
  쓴다.
- `SettingsPage` 변경. #233에서 완료됐다.
- Signals deep-link 목적지 변경. 3단계 이슈 #235에서 한다. 이번 작업 후에도 deep-link는
  `/alerts`로 향하는데, 이는 #235까지의 의도된 중간 상태다.
- 요약 카드·내역 패널의 데이터 계약 변경, 신규 API 호출 추가.
- 사이드바 메뉴 구성 변경.

## Protected Files

- `src/pages/ui/SettingsPage.tsx`
- `src/shared/config/navigation.ts` — 라우트 추가·변경 없이 상수만 참조한다.
- `src/widgets/` 아래 위젯 내부 구현.

## Requirements

1. `/alerts`에 규칙 테이블, Rule Builder, 채널 설정이 렌더링되지 않는다.
2. 관제 요약과 발생 내역이 남고 알림 상세(근거) 열람이 기존과 동일하게 동작한다.
3. 설정 화면으로 이동하는 링크가 있고 `appRoutePaths.settings`로 이동한다.
4. 규칙이 없는 상태에서 설정으로 유도하는 안내가 보인다.
5. 사용하지 않는 import와 상태가 남지 않아 lint가 통과한다.

## Test Requirements

- `/alerts`에 규칙 테이블·채널 설정·Rule Builder가 없음을 단언한다.
- 요약과 내역이 렌더링되고 내역 항목 선택 시 상세가 열리는지.
- 설정 링크가 존재하고 올바른 경로를 가리키는지.
- 규칙이 없을 때 설정 유도 안내가 보이는지.
- 기존 AlertsPage 테스트 중 제거된 요소를 전제한 것은 새 동작에 맞게 갱신한다. 단순 삭제로
  커버리지를 떨어뜨리지 않는다.

## Verification Commands

- `pnpm format:check`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`

전체 테스트가 부하 상태에서 `WatchlistPage.test.tsx` 타임아웃으로 간헐 실패할 수 있다. 이는
이번 변경과 무관한 기존 문제이며 이슈 #236에서 다룬다. 해당 파일에서만 타임아웃이 나면
`WatchlistPage.test.tsx`를 단독 실행해 통과를 확인하고 그 사실을 보고한다. 다른 파일이
실패하면 그것은 이번 변경의 문제이므로 고친다.

## Documentation Impact

없음(구현 이슈). ADR-014가 이미 결정을 담고 있다. 계약과 어긋나는 지점을 발견하면 멈추고
가정을 보고한다.

## Risk Level

Low — 제거가 중심이다. 주의할 점은 남은 두 영역의 여백·구분선 정리와, 빈 상태 안내를 새 API
호출 없이 기존 조회로 처리하는 것이다.

## Expected Output

- `AlertsPage` 축소와 설정 링크·빈 상태 유도 추가, 테스트 갱신.
- 지정된 현재 브랜치에 커밋. 자체 브랜치 생성 금지.
- 검증 4종 통과 보고. 빈 상태 안내를 어떤 데이터로 판단했는지 함께 보고한다.

## Rules

- Stay within scope. `SettingsPage`와 deep-link는 건드리지 않는다.
- Do not weaken verification.
- 지정된 현재 브랜치를 유지한다. 새 브랜치 금지.
- Report assumptions and verification results.
