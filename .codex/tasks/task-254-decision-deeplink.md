# Codex Handoff Task — task-254: 타 페이지 → 판단 작성 딥링크 + 근거 prefill

## Source Issue

FE #254 — 타 페이지 → 판단 작성 딥링크 연결(+#361 흡수: 근거 자동 연결). 상위 #247(2차).
Epic `project_stock_frontend#242`.

## Task Summary

Signals·Research·Portfolio에서 "판단 기록 작성"으로 딥링크하며, 소스 페이지가 화면에 이미
가진 데이터로 **대상(target)과 근거(evidence)를 작성 폼에 prefill**한다. create가 이미
evidence(스냅샷 포함)를 수용하므로 BE 신규 작업은 없다. prefill은 초기값일 뿐, 사용자가
확인·수정 후 저장한다.

## Goal

- Signals(시그널 카드)·Research(종목 리서치)·Portfolio(비중/리스크)에서 판단 작성으로
  이동하며 대상과 근거를 함께 전달한다.
- 작성 폼(`DecisionFormPanel`)이 전달된 prefill(대상 유형·식별자·evidence 목록)로 초기화된다.
- `pnpm format:check` / `pnpm lint` / `pnpm typecheck` / `pnpm test` 통과.

## Background

- 기존 부분 딥링크: `SignalsPage`는 `navigate(appRoutePaths.decisionLog)`(prefill 없음),
  `ResearchPage`는 `decisionLog?symbol=...`(symbol만). 이를 target+evidence 전달로 완성한다.
- `DecisionFormPanel`은 이미 `initialTargetId` prop을 받는다. `initialTargetType`·
  `initialEvidence`(또는 통합 prefill prop)를 추가해 초기화한다.
- 전달 수단: React Router `navigate(path, { state })` 또는 쿼리. 복합 데이터(evidence)는
  라우터 state 사용을 권장. `DecisionLogPage`가 state를 읽어 `DecisionFormPanel`에 전달.
- evidence 구성(소스별, 화면 데이터로):
  - Signal → `{ type: 'SIGNAL', id, title(시그널 요약), summary, snapshot(시그널 필드),
    relationship: 'SUPPORTING' }`(위험 시그널이면 'RISK').
  - Research → `{ type: 'RESEARCH', id/symbol, title, summary, snapshot }`.
  - Portfolio → `{ type: 'PORTFOLIO', title, snapshot(비중·현금 등), relationship: 'BACKGROUND' }`.
- 대상: Signal/Research → `SYMBOL`(해당 종목). Portfolio → `PORTFOLIO` 또는 해당 종목.

## Implementation Scope

- `src/pages/ui/SignalsPage.tsx` — 시그널 카드의 판단 작성 액션이 target+evidence를 실어
  딥링크.
- `src/pages/ui/ResearchPage.tsx` — 리서치의 판단 작성 링크가 target+evidence 전달.
- `src/pages/ui/PortfolioPage.tsx` — 비중/리스크에서 판단 작성 딥링크(target+포트폴리오
  스냅샷 evidence).
- `src/pages/ui/DecisionLogPage.tsx` — 라우터 state(또는 쿼리)에서 prefill을 읽어
  `DecisionFormPanel`에 전달.
- `src/widgets/decision-form-panel/DecisionFormPanel.tsx` — `initialTargetType`·
  `initialEvidence`(또는 prefill prop) 수용·초기화. 기존 `initialTargetId` 유지.
- 필요 시 `features/decision-log`에 prefill 구성 헬퍼.
- 테스트.

## Out of Scope

- Alerts → 판단 상세 딥링크(트리거 엔진이 Alert를 발생시키지 않으므로 연결점 없음, #360
  범위 밖).
- BE 변경(create가 이미 evidence 수용).
- AI 보조(#250, 완료), 상세 2차(#253).

## Protected Files

없음.

## Requirements

- prefill은 초기 폼 값일 뿐이며, 사용자가 확인·수정 후 저장한다(자동 저장 금지).
- evidence는 소스 화면이 이미 가진 데이터로 구성(신규 조회 없이). 당시 스냅샷 보존.
- 대상 유형·근거 관계·태그는 `shared/model` 라벨로 표시.
- prefill이 없을 때(직접 진입) 기존 빈 폼 동작 유지.

## Test Requirements

- 각 소스(Signals/Research/Portfolio)에서 판단 작성 딥링크가 target+evidence를 전달.
- `DecisionLogPage`가 prefill을 읽어 폼에 반영(대상·근거 초기화).
- prefill 없는 직접 진입 시 빈 폼.
- 사용자가 prefill을 수정·저장 가능(자동 저장 아님).

## Verification Commands

```
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
```

## Documentation Impact

불필요.

## ADR Need

불필요.

## Failure Record Need

불필요.

## Risk Level

Medium — 여러 소스 페이지 + 폼 prefill 배선.

## Expected Output

- 변경 파일: Signals/Research/Portfolio 페이지, DecisionLogPage, DecisionFormPanel(+헬퍼) +
  테스트.
- 검증 4종 통과 로그.
- 현재 브랜치 `feat/254-decision-deeplink` 유지(새 브랜치 금지). 한국어 `feat:` 커밋, `#254`
  참조.
