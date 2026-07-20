# Codex Handoff Task

## Source Issue

이슈 #235 — Signals 카드의 알림 deep-link 목적지를 `/settings`로 바꾼다.
`gh issue view 235`로 맥락을 읽는다. 근거는 ADR-014 §4와 ADR-013 §1·§5(BE 저장소
`docs/decisions/`). ADR-014 적용 3단계 중 마지막이다.

선행 조건인 #233(PR #237)은 `main`에 머지 완료다. Rule Builder와 쿼리 소비가 이미
`SettingsPage`에 있다. 2단계 #234(PR #239)는 리뷰 완료 상태이며 이 작업과 파일이 겹치지
않는다.

## Task Summary

`SignalsPage`의 알림 버튼이 `/alerts` 대신 `/settings`로 이동하도록 목적지만 바꾼다. 쿼리
규약과 버튼 자체는 그대로 둔다.

## Goal

- Signals 카드에서 알림 버튼을 누르면 `/settings`로 이동하고 Rule Builder가 해당 종목으로
  prefill된 create 모드로 열린다.
- `/alerts`로 향하는 잔여 경로가 남지 않는다.

## Background — 현재 코드

`src/pages/ui/SignalsPage.tsx` 493행 부근에 해당 버튼이 있다.

```
onClick={() => {
  const searchParams = new URLSearchParams({
    builder: 'create',
    symbol: signal.symbol,
  })
  navigate(`${appRoutePaths.alerts}?${searchParams.toString()}`)
}}
```

`appRoutePaths`는 `src/shared/config/navigation.ts`에서 오고 `settings` 키가 이미 있다.
`SettingsPage`는 `useSearchParams`로 `builder=create`·`symbol=`을 읽어 create 모드로 열고
`setSearchParams({}, { replace: true })`로 쿼리를 제거한다.

## Implementation Scope

- `src/pages/ui/SignalsPage.tsx` — `appRoutePaths.alerts`를 `appRoutePaths.settings`로 바꾼다.
  `URLSearchParams` 구성과 `navigate` 호출 구조는 그대로 둔다.
- 관련 테스트의 기대 경로를 갱신한다.

## Out of Scope

- 버튼 라벨("변화 알림")·`aria-label`("이 시그널 변화 알림 받기")·아이콘(`FiBell`)·위치 변경.
  ADR-013 §1이 정한 "보조 버튼 하나"를 유지한다.
- 쿼리 파라미터 규약 변경. `builder=create`와 `symbol=`, 소비 후 제거 동작은 ADR-014 §4에
  따라 유지한다.
- `AlertRuleBuilder`의 prefill 계약, `SettingsPage`, `AlertsPage` 변경.
- 시그널 유형별 템플릿 매핑 확장.

## Protected Files

- `src/pages/ui/SettingsPage.tsx`
- `src/pages/ui/AlertsPage.tsx`
- `src/shared/config/navigation.ts` — 상수 참조만 하고 변경하지 않는다.
- `src/widgets/alert-rule-builder/` 내부 구현.

## Requirements

1. 알림 버튼 클릭 시 `/settings?builder=create&symbol={symbol}`로 이동한다.
2. 경로는 `appRoutePaths.settings`를 참조하고 문자열을 하드코딩하지 않는다.
3. 버튼의 접근성 이름과 표시 라벨이 기존과 동일하다.
4. 저장소 전체에서 알림 deep-link가 `/alerts`를 가리키는 잔여 코드가 없다. `appRoutePaths.alerts`
   자체는 사이드바 등 다른 용도로 계속 쓰이므로 제거 대상이 아니다. deep-link 용도만 확인한다.

## Test Requirements

- SignalsPage: 알림 버튼 클릭 시 `/settings?builder=create&symbol=...`로 navigate 되는지.
- 기존 SignalsPage 테스트 회귀 없음. `/alerts` 경로를 기대하던 단언은 새 경로로 갱신한다.

## Verification Commands

- `pnpm format:check`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`

전체 테스트가 부하 상태에서 `WatchlistPage.test.tsx` 타임아웃으로 간헐 실패할 수 있다. 이는
이번 변경과 무관한 기존 문제이며 이슈 #236에서 다룬다. 해당 파일에서만 타임아웃이 나면
단독 실행으로 통과를 확인하고 그 사실을 보고한다. 다른 파일이 실패하면 이번 변경의 문제이므로
고친다.

## Documentation Impact

없음(구현 이슈). ADR-014가 이미 결정을 담고 있다.

## Risk Level

Low — 상수 한 곳 교체와 테스트 갱신이다.

## Expected Output

- `SignalsPage` 목적지 변경과 테스트 갱신.
- 지정된 현재 브랜치에 커밋. 자체 브랜치 생성 금지.
- 검증 4종 통과 보고.

## Rules

- Stay within scope. 버튼 표현과 쿼리 규약은 건드리지 않는다.
- Do not weaken verification.
- 지정된 현재 브랜치를 유지한다. 새 브랜치 금지.
- Report assumptions and verification results.
