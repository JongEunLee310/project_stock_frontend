# Codex Handoff Task — task-245: 새 판단 작성 패널

## Source Issue

FE #245 — 새 판단 작성 패널. Epic `project_stock_frontend#242`. 선행: FE #243(계약·훅).

## Task Summary

`/decision-log`에 새 판단 작성 패널을 채운다. 자유 메모 하나가 아니라 구조화 입력이되
과하지 않게 구성하고, 생성 후 확정(activate)까지 배선한다.

## Goal

- 작성 패널 입력: 대상(유형+식별자) · 판단 유형(9종) · 핵심 판단 이유(thesis/rationale) ·
  긍정 근거 / 반대 근거(분리 입력) · 인지 위험 태그(복수 선택) · 확신 수준(낮음/중간/높음) ·
  재검토 날짜.
- 저장 시 `useCreateDecisionLog`로 DRAFT 생성 후 `useActivateDecision`으로 확정.
- 반대 근거 미작성 시 경고(저장은 막지 않음). 확신 "높음"인데 근거가 빈약하면 안내(선택).
- `pnpm format:check` / `pnpm lint` / `pnpm typecheck` / `pnpm test` 통과.

## Background

디자인 정본은 `project_stock` 설계문서 §7(작성)·§8(재검토 조건). AI 보조(핵심 판단 추출·
반대 근거 후보)는 1차 범위가 아니다 — 사람이 직접 입력한다. 다만 저장 전 확인 후 저장
원칙(정식 필드에 확정 전 저장 금지)은 폼 제출 흐름으로 자연히 만족한다.

입력 → 생성 body 매핑(#243 계약):
- 대상 → `target:{type,id}`. `type=SYMBOL`이면 식별자를 티커로.
- 긍정/반대 근거 → `supporting_reasons[]` / `counter_arguments[]`(문자열 배열, BE가 evidence로
  정규화).
- 인지 위험 태그 → `risks:[{type, severity}]`(severity 기본 `MEDIUM`, 1차는 태그 중심).
- 재검토 날짜 → `review_triggers:[{type:'DATE', condition:{}, scheduled_at}]`.
- 확신 수준 → `confidence_level`.

## Implementation Scope

- `src/widgets/decision-form-panel/`(신규) 또는 `features/decision-log/` 내 폼 컴포넌트 —
  기존 저장소 관례(위젯 vs feature ui)를 따른다. 기존 `DecisionForm`(구 계약)을 대체한다.
- `src/pages/ui/DecisionLogPage.tsx` — 패널 배치.
- 인지 위험 태그 선택 UI는 #243의 위험 태그 라벨 매핑을 소비.
- 폼 상태·검증·제출·경고 처리 + 테스트.

## Out of Scope

- 관련 근거(Signal/Research/Topic) 연결 UI(2차 #247).
- AI 제안 UI(3차).
- 이벤트 기반 재검토 조건(1차는 날짜만).
- 상세/복기(#246, 2차).

## Protected Files

없음.

## Requirements

- 필수: 대상, 판단 유형. 나머지 선택.
- 대상 유형 선택에 따라 식별자 입력 라벨을 바꾼다(종목/포트폴리오/토픽 등).
- 긍정·반대 근거는 시각적으로 분리하고 각각 여러 줄 입력 가능.
- 확신 수준은 3단계 세그먼트/셀렉트.
- 제출 성공 시 폼 초기화 + 목록/overview 쿼리 무효화.
- 서버 검증 오류(422)·상태 오류 메시지를 사용자에게 표시.

## Test Requirements

- 필수값 누락 시 제출 차단·안내.
- 반대 근거 미작성 경고 노출.
- 인지 위험 복수 선택.
- create→activate 호출 순서와 성공 시 초기화.

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

Medium — 폼 상태·검증·2단계 제출(create+activate).

## Expected Output

- 변경 파일: 폼 위젯/컴포넌트 + DecisionLogPage + 테스트.
- 검증 4종 통과 로그.
- 현재 브랜치 `feat/243-decision-log-redesign` 유지. 한국어 `feat:` 커밋, `#245` 참조.
