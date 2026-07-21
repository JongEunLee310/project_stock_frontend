# Codex Handoff Task — task-250: 새 판단 작성 AI 보조 UI

## Source Issue

FE #250 — 새 판단 작성 AI 보조 UI (제안 확인 후 저장). Epic `project_stock_frontend#242`.
선행: FE #245(작성 패널, 같은 브랜치에 있음). BE 계약: `project_stock` #356
(`POST /api/v1/decision-logs/assist`).

## Task Summary

FE #245가 만든 작성 패널(`widgets/decision-form-panel`)에 AI 보조를 추가한다. 현재 초안을
BE `assist` 엔드포인트로 보내 4종 제안(핵심 판단 구조화·반대 근거 후보·인지 위험/편향 점검
후보·모호 표현 감지)을 받고, **각 제안을 [적용][수정][무시]로 사용자가 확인한 뒤에만** 정식
폼 필드에 반영한다.

## Goal

- 작성 패널에 "AI 보조" 액션이 있고, 누르면 현재 초안(대상·판단 유형·판단 이유/메모)을
  `assist`로 보낸다.
- 응답 제안을 유형별로 표시하고, 각 항목에 [적용][수정][무시]를 둔다. [적용] 전에는 정식
  필드에 반영하지 않는다.
- AI는 자동 확정·자동 저장하지 않는다.
- `pnpm format:check` / `pnpm lint` / `pnpm typecheck` / `pnpm test` 통과.

## Background

BE 계약(`project_stock` #356, `docs/designs/356-decision-assist.md`):

- `POST /api/v1/decision-logs/assist` (비영속). 요청: `{ target:{type,id}, decision_type?,
  thesis?, rationale?, memo? }`. 응답: `{ structured_thesis?, structured_rationale?,
  counter_arguments: string[], risk_candidates: [{type,reason}], bias_candidates:
  [{type,reason}], vague_flags: [{quote,suggestion}] }`.
- 제안은 비어 있을 수 있다(부분 실패·해당 없음). LLM 실패 시 BE가 빈 제안을 반환하므로 FE는
  빈 응답을 정상 처리한다.

원칙(설계 §23): AI는 판단을 대신하지 않는다. 제안은 확인 후 저장. 편향은 점검 후보로만
표시(확정 진단 어조 금지).

## Implementation Scope

- `src/features/decision-log/dto.ts` — assist 요청/응답 타입 추가(`*Dto`, 기존 관례).
- `src/features/decision-log/adapters.ts` — assist 응답 → 도메인 모델 변환(필요 시).
- `src/features/decision-log/queries.ts` — `useDecisionAssist` 뮤테이션 훅(`apiPost`).
- `src/widgets/decision-form-panel/` — AI 보조 액션 버튼 + 제안 표시 영역([적용][수정][무시]).
  기존 폼 상태와 연결해 [적용] 시 해당 필드(핵심 이유·반대 근거·위험 태그 등)에 반영.
- 관련 테스트.

## Out of Scope

- 관련 근거 자동 연결·복기 요약(2차 이후).
- BE 변경(#356에서 완료).
- 편향 확정 진단 어조(점검 후보로만).
- 상세/복기 화면.

## Protected Files

없음.

## Requirements

- [적용] 전에는 어떤 제안도 정식 폼 필드에 저장하지 않는다.
- 각 제안 유형 매핑:
  - `structured_thesis`/`structured_rationale` → 핵심 판단 이유 필드에 반영(적용 시).
  - `counter_arguments` → 반대 근거 입력에 추가.
  - `risk_candidates` → 인지 위험 태그 선택/안내.
  - `bias_candidates` → 편향 "점검 후보" 안내(선택 강제 아님).
  - `vague_flags` → 해당 문장·보완 제안 안내.
- 로딩(보조 요청 중)·오류·빈 제안(해당 없음) 상태를 명확히 처리한다.
- 영문 enum·태그는 `shared/model` 라벨로 표시.

## Test Requirements

- "AI 보조" 클릭 시 현재 초안으로 assist 호출.
- 제안이 표시되고, [적용] 시에만 폼 필드에 반영, [무시] 동작.
- 빈 제안·오류 상태 처리.
- 적용 전 정식 필드 미반영 확인.

## Verification Commands

```
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
```

## Documentation Impact

불필요(BE 계약 정본은 `project_stock`).

## ADR Need

불필요.

## Failure Record Need

불필요.

## Risk Level

Medium — 폼 상태와 제안 반영의 연결, 확인 후 저장 원칙 준수.

## Expected Output

- 변경 파일: dto/adapters/queries, decision-form-panel + 테스트.
- 검증 4종 통과 로그.
- 현재 브랜치 `feat/243-decision-log-redesign` 유지(새 브랜치 금지). 한국어 `feat:` 커밋,
  `#250` 참조.
