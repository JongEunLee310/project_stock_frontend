# Codex Handoff Task — task-005: 공통 Status Badge 컴포넌트 (이슈 13)

## Source Issue

- 이슈 13 `[FE] 공통 Status Badge 컴포넌트 구현`
- 설계 기록: `docs/designs/13-status-badge.md`
- 의존: task-002(디자인 토큰), task-004(도메인 타입/`StockStatus`)

## Task Summary

종목·시그널·리스크 상태를 일관되게 표현하는 Badge 컴포넌트를 확장한다. 현재 `Badge`는 5개 `StockStatus`만 지원하므로, 이슈가 요구하는 상태군을 모두 표현할 수 있도록 상태 모델·디자인 토큰·variant 매핑을 확장한다.

## Goal

- 아래 모든 상태가 Badge로 렌더링 가능하다.
  - 상태군: `안정`, `관망`, `관망 유지`, `위험 증가`, `매수 검토 가능`, `추가 리서치 필요`, `비중 축소 검토`
  - 리스크 레벨군: `높음`, `중간`, `낮음`
- 화면별로 동일 상태는 동일 색상 의미를 갖는다(토큰 기반 단일 출처).
- 상태 값 추가가 타입으로 강제되는 구조(누락 시 컴파일 에러)다.

## Background

- 기존 구현
  - `src/shared/model/stockStatus.ts` — `stockStatuses` union (현재 5개).
  - `src/shared/ui/stockStatus.ts` — `stockStatusClassNames: Record<StockStatus, string>` 토큰 매핑.
  - `src/shared/ui/Badge.tsx` — `status: StockStatus` 단일 prop으로 렌더.
  - `src/index.css` `@theme` — `--color-status-{stable,watch,risk,research,buy}-{bg,text,border}` 토큰만 존재.
- 이슈 13의 값은 두 개념이 섞여 있다: 종목/시그널 **상태**와 **리스크 레벨**(높음/중간/낮음). 단일 union으로 합치지 말고 별도 타입으로 분리한다(아래 Requirements).

## Implementation Scope

- `src/shared/model/stockStatus.ts`: `StockStatus` union에 `관망 유지`, `비중 축소 검토` 추가.
- 리스크 레벨 타입 신설: `RiskLevel = '높음' | '중간' | '낮음'` (모델 레이어, 예: `src/shared/model/riskLevel.ts` + `model/index.ts` export).
- `src/index.css` `@theme`: 신규 상태/레벨용 `--color-status-*` 토큰 **추가**(기존 토큰 수정·삭제 금지). 신규 키 예: `watch-hold`, `reduce`, `level-high`, `level-medium`, `level-low`(네이밍은 기존 컨벤션과 일관되게 결정).
- `src/shared/ui/stockStatus.ts`: 신규 `StockStatus` 값에 대한 `Record` 매핑 보강 + 리스크 레벨용 매핑(`riskLevelClassNames: Record<RiskLevel, string>`) 추가.
- `src/shared/ui/Badge.tsx`: 상태/레벨 모두 표현 가능하도록 확장. variant 분기는 별도 prop(예: `tone`/`kind`) 또는 별도 export 컴포넌트 중 단순한 쪽 선택. 단일 출처 매핑을 통해 색상 결정.
- `src/shared/ui/index.ts`: 신규 타입·매핑 export.

## Out of Scope

- 페이지에서의 Badge 실제 배치(이슈 7~11).
- 도메인 모델 대확장(선행 도메인·Mock 확장 task에서 처리). 본 task는 상태/레벨 enum 확장에 한정.
- 기존 디자인 토큰 색상 값 변경.

## Protected Files

- `src/index.css`(디자인 토큰, task-002 산출물): **신규 토큰 추가만 허용**. 기존 `@theme` 토큰의 수정·삭제 금지.

## Requirements

- `StockStatus`와 `RiskLevel`은 분리된 타입으로 유지(개념 혼합 금지).
- 색상 매핑은 union을 키로 하는 `Record`로 작성해 값 추가 시 컴파일 타임에 매핑 누락이 잡히게 한다.
- 토큰 네이밍은 기존 `--color-status-<name>-{bg,text,border}` 패턴을 따른다.
- Badge는 children 미지정 시 상태/레벨 라벨을 그대로 출력(기존 동작 유지).
- 신규 상태/레벨 색상은 의미가 충돌하지 않게 결정(예: `위험 증가`/`높음` 계열은 risk 톤, `매수 검토 가능` 계열은 buy 톤). 결정은 가정으로 보고.

## Test Requirements

- `src/shared/ui/Badge.test.tsx` 확장: 신규 상태(`관망 유지`, `비중 축소 검토`)와 리스크 레벨(`높음/중간/낮음`) 렌더링 검증.
- `Record` 매핑 완전성은 `typecheck`로 보증(누락 시 컴파일 실패).
- 기존 테스트 통과 유지.

## Verification Commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Documentation Impact

- 상태/레벨 추가 절차(union + 토큰 + 매핑 세 곳)를 `src/shared/README.md`에 한두 줄로 보강(선택).
- 디자인 토큰 추가가 이슈 3 설계와 상충하면 설계 기록 갱신을 제안 보고.

## ADR Need

불필요. 신규 도메인·의존성·아키텍처 결정 없음(컴포넌트·토큰 확장).

## Failure Record Need

불필요.

## Risk Level

Low. 공통 UI·토큰 한정, 추가 위주 변경. 단 `src/index.css`는 보호 파일이므로 추가만 수행.

## Expected Output

- 변경: `stockStatus.ts`(model/ui), 신규 `riskLevel.ts`, `Badge.tsx`, `index.ts`, `index.css`(@theme 추가), `Badge.test.tsx`.
- 최신 `main`에서 분기한 `feat/fe-status-badge` 브랜치에서 PR 1건.
- 변경 파일·검증 결과·가정(색상 톤 결정, 토큰 네이밍, Badge variant 구조) 보고.

## Rules

- 최신 `main`에서 분기. 범위 내 유지, 검증 약화 금지.
- 보호 파일(`src/index.css`)은 신규 토큰 추가만. 기존 토큰 변경 금지.
- 가정·검증 결과 보고.
