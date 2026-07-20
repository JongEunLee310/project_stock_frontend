# Codex Handoff Task

## Source Issue

이슈 #134 — Signals 카드 '알림 설정'(disabled) 버튼을 보조 버튼 "이 시그널 변화 알림 받기"로
교체하고, Alerts Rule Builder로 조건이 prefill된 채 이동하는 deep-link를 연결한다.
`gh issue view 134`로 맥락을 읽는다. 근거는 ADR-013(Signals 화면에는 알림 보조 버튼 하나만
허용, 두 화면 연결은 단방향 deep-link)과 에픽 #133. 선행 조건이던 Rule Builder(F2, PR #229)와
통합 레이아웃(F3, PR #230)은 main에 머지 완료.

## Task Summary

알림 관제 개편 라운드의 마지막 FE 조각이다. Signals 카드 하단 3버튼 그리드의 세 번째
버튼(현재 `disabled` "알림 설정")을 활성 보조 버튼으로 바꾸고, 클릭 시 `/alerts`로 이동해
Rule Builder가 해당 종목으로 prefill된 create 모드로 자동 오픈되게 한다.

## Goal

- Signals 카드에서 한 번의 클릭으로 해당 종목 감시 규칙 생성 폼에 도달한다.
- Signals 화면에는 알림 채널 선택·규칙 테이블·발송 내역을 두지 않는다(ADR-013). 이 작업은
  버튼 교체 + 이동뿐이다.

## Background — 현재 코드

- `src/pages/ui/SignalsPage.tsx` 카드 하단 3버튼 그리드(근거 보기·판단 기록·알림 설정).
  세 번째 버튼이 `disabled` + `aria-label="알림 설정 (준비 중)"`. 카드에는 `signal.symbol`이
  있다.
- `src/pages/ui/AlertsPage.tsx` — `builderState`(`{mode, rule}`)로 `AlertRuleBuilder` drawer를
  연다. 라우트는 `appRoutePaths.alerts`(`/alerts`, `src/shared/config/navigation.ts`).
- `src/widgets/alert-rule-builder/AlertRuleBuilder.tsx` — create 모드 오픈 시 첫 번째 active
  템플릿을 seed(`applyTemplate`)하고 `targetId`는 `''`로 초기화한다. props:
  `isOpen`·`mode`·`rule`·`onClose`·`onSaved`.
- 템플릿 카탈로그(BE 정본): SYMBOL 대상 active 템플릿은 `NEWS_RISK_HIGH`(뉴스 위험도 High
  이상)뿐이다. 따라서 prefill 템플릿은 `NEWS_RISK_HIGH` 고정.
- 라우터는 react-router-dom v7 — 쿼리 파라미터는 `useSearchParams` 사용.

## Implementation Scope

- `src/pages/ui/SignalsPage.tsx` — 세 번째 버튼을 활성화하고 라벨/aria-label을
  "이 시그널 변화 알림 받기"로 교체(`FiBell` 유지). 클릭 시
  `/alerts?builder=create&symbol={signal.symbol}`로 navigate. 3열 그리드 안이므로 표시
  텍스트가 길면 기존 두 버튼과 톤을 맞춰 짧은 표기("변화 알림")를 쓰되 `aria-label`은 전체
  문구를 유지해도 된다 — 접근성 이름이 정확하면 표시 라벨은 재량.
- `src/pages/ui/AlertsPage.tsx` — 마운트 시 `useSearchParams`로 `builder=create`(+선택
  `symbol`)를 읽으면 builder를 create 모드로 열고 prefill을 전달한다. 읽은 직후
  `setSearchParams({}, { replace: true })`로 쿼리를 제거해 새로고침·뒤로가기에서 재오픈되지
  않게 한다.
- `src/widgets/alert-rule-builder/AlertRuleBuilder.tsx` — 선택적 prefill prop 추가(예:
  `prefill?: { templateType?: string; targetId?: string }`). create 모드 오픈 시 prefill이
  있으면: `templateType`이 active 템플릿에 있으면 해당 템플릿을 `applyTemplate`하고(없으면
  기존 첫 active 템플릿 fallback), 이어서 `targetId`를 prefill 값으로 set한다. edit/duplicate
  모드에는 영향 없음.
- AlertsPage에서 prefill은 `{ templateType: 'NEWS_RISK_HIGH', targetId: symbol }`로 구성한다.
- 관련 단위 테스트.

## Out of Scope

- 시그널 유형별 템플릿 매핑 확장(현재 SYMBOL active 템플릿이 1종이므로 매핑 없음).
- Rule Builder 폼 구조·검증 로직 변경, 신규 템플릿 추가.
- Signals 화면 내 알림 규칙 테이블·채널 UI(ADR-013 금지).

## Protected Files / 주의

- `AlertRuleBuilder`의 기존 create/edit/duplicate 동작·계약을 깨지 않는다 — prefill은 추가
  전용(optional prop)이다.
- Signals 카드의 기존 두 버튼(근거 보기·판단 기록)과 카드 레이아웃은 무변경.
- `SignalsPage`의 기존 테스트 중 disabled 버튼을 전제한 테스트는 새 동작에 맞게 갱신한다.

## Requirements

1. Signals 카드의 세 번째 버튼이 활성 상태로 "이 시그널 변화 알림 받기"(접근성 이름 기준)
   역할을 하며, 클릭 시 `/alerts`로 이동한다.
2. 이동 직후 Rule Builder가 create 모드로 열리고 `NEWS_RISK_HIGH` 템플릿 + 해당 종목
   `targetId`가 prefill되어 있다.
3. 쿼리 파라미터는 소비 후 제거되어 새로고침 시 builder가 재오픈되지 않는다.
4. `/alerts` 직접 진입(쿼리 없음)과 기존 create/edit/duplicate 플로우는 기존과 동일하게
   동작한다.

## Test Requirements

- SignalsPage: 버튼이 활성화되고 클릭 시 올바른 경로(쿼리 포함)로 navigate 되는지.
- AlertsPage: `builder=create&symbol=...` 진입 시 builder가 prefill과 함께 열리고 쿼리가
  제거되는지, 쿼리 없는 진입은 기존과 동일한지.
- AlertRuleBuilder: prefill prop이 templateType 선택 + targetId를 설정하는지, 미지의
  templateType이면 기존 첫 active 템플릿 fallback인지, edit/duplicate에 영향 없는지.
- 기존 테스트 회귀 없음.

## Verification Commands

- `pnpm format:check`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`

## Documentation Impact

- 없음(구현 이슈). 계약과 어긋나면 멈추고 가정을 보고한다.

## Risk Level

Low — 버튼 교체 + 쿼리 파라미터 기반 prefill로 범위가 좁다. 주의점은 Rule Builder의 기존
seed 로직(첫 active 템플릿)과 prefill의 우선순위 충돌, 쿼리 제거 타이밍 정도다.

## Expected Output

- SignalsPage 버튼 교체, AlertsPage 쿼리 파라미터 처리, AlertRuleBuilder prefill prop, 테스트.
- 지정된 현재 브랜치(아래)에 커밋. 자체 브랜치 생성 금지.
- 검증 4종 통과 보고.

## Rules

- Stay within scope. 템플릿 매핑 확장·폼 구조 변경은 하지 않는다.
- Do not weaken verification.
- 지정된 현재 브랜치를 유지한다. 새 브랜치 금지.
- Report assumptions and verification results.
