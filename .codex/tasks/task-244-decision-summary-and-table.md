# Codex Handoff Task — task-244: 상단 요약 카드 + 판단 기록 테이블

## Source Issue

FE #244 — 상단 요약 카드 + 판단 기록 테이블 위젯. Epic `project_stock_frontend#242`.
선행: FE #243(계약·훅·셸).

## Task Summary

`/decision-log` 셸에 상단 요약 카드와 판단 기록 테이블을 채운다. #243이 제공한
`useDecisionOverview`·`useDecisionLogs` 훅과 도메인 모델·라벨 매핑을 소비한다.

## Goal

- 상단 요약 카드가 overview를 표시한다: 전체 기록 / 이번 주 작성 / 재검토 예정 / 진행 중
  판단(+판단 유형 분포).
- 판단 기록 테이블이 목록을 표시한다: 작성 시각 · 대상 · 판단(라벨) · 핵심 이유 · 인지 위험 ·
  재검토 일정 · 상태 · (결과 자리). 행 클릭 시 상세(`/decision-log/:id`)로 이동.
- 로딩·에러·빈 상태 처리.
- `pnpm format:check` / `pnpm lint` / `pnpm typecheck` / `pnpm test` 통과.

## Background

디자인 정본은 `project_stock` 설계문서 §4(상단 요약 카드)·§6(판단 기록 테이블). "진행 중
판단"은 매수/매도 실행이 아니라 아직 결과 미평가·재검토 조건이 남은 판단(=`active_count`)이다.
판단 유형·상태·위험은 #243의 `shared/model` 라벨로 표시한다(영문 enum 직접 노출 금지).

## Implementation Scope

- `src/widgets/decision-summary-cards/`(신규) — overview 카드 위젯. 기존 대시보드/알림
  요약 카드 위젯의 구조·스타일을 참고해 일관되게 만든다.
- `src/widgets/decision-log-table/`(신규) — 목록 테이블 위젯. 기존 `shared/ui`의 `Table`과
  `Badge`를 재사용한다.
- `src/pages/ui/DecisionLogPage.tsx` — 두 위젯을 셸에 배치.
- 관련 위젯 테스트.

## Out of Scope

- 작성 패널(#245), 상세(#246), 목록 필터 UI(2차로 미룸 — 1차는 기본 목록).
- 유형 분포의 고급 시각화(간단한 막대/비율로 충분).
- 결과(복기 outcome) 컬럼의 실제 데이터 연결은 2차 — 1차는 자리·"미평가" 표시만.

## Protected Files

없음.

## Requirements

- 카드/테이블은 반응형이며 가로 스크롤은 테이블 자체 컨테이너에서만 발생한다.
- 상태·유형 배지는 시맨틱하게 구분(진행 중/재검토 예정/종료 등).
- 대상 표시는 `target.label ?? target.id`.
- 행 클릭 내비게이션과 셀 내부 링크(대상→리서치 등)의 클릭 전파를 분리한다(기존 페이지의
  `stopRowNavigation` 패턴 참고).

## Test Requirements

- overview 값이 카드에 반영, 0건 빈 상태.
- 목록 행 렌더·행 클릭 시 상세 경로로 이동.
- 로딩(Skeleton)·에러(ErrorState) 상태.

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

Low — 읽기 UI, 계약은 #243에서 확정.

## Expected Output

- 변경 파일: 두 위젯 + DecisionLogPage + 테스트.
- 검증 4종 통과 로그.
- 현재 브랜치 `feat/243-decision-log-redesign` 유지. 한국어 `feat:` 커밋, `#244` 참조.
