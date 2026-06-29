# Codex Handoff Task

## Source Issue

- 설계 기록: `docs/designs/49-decision-log-activation.md`
- 정본 계약(BE): `project_stock/docs/designs/decision-log-domain.md`, `project_stock/app/domains/decision_logs/schema.py`

## Task Summary

DecisionLog 화면을 mock/로컬 임시에서 실제 `/decision-logs` API로 전환한다. BE G10은 완료 상태이며, FE `dto`/`adapters`/모델이 옛 가정대로 작성되어 실제 BE 응답과 어긋난 것을 정렬하고 `useDecisionLogs`의 `enabled: false`와 생성 mutation 스텁을 해제한다.

## Goal

- `useDecisionLogs`가 활성화되어 서버 데이터를 단일 소스로 목록을 렌더한다(로컬 임시/mock 폴백 제거).
- `DecisionLogDto`/adapter가 BE `DecisionLogResponse`와 정렬된다(`ticker`/`reason`/`reviewed_at`, 10종 enum).
- 생성 폼이 실제 `POST /decision-logs`를 호출하고 성공 시 목록이 갱신된다.
- 전체 검증 통과 + 신규 계약 기준 테스트.

## Background

- **먼저 BE 계약을 재확인하라.** `project_stock/app/domains/decision_logs/schema.py`:
  - `DecisionLogResponse`: `id`, `user_id`, `ticker`, `company_name?`, `decision_type`, `decision_status`, `summary?`, `reason?`, `risk_note?`, `action_plan?`, `confidence_score?`, `target_price?`, `stop_loss_price?`, snapshot들, `cognitive_risks: list[str]`, `created_by`, `decided_at`(필수), `reviewed_at?`, `closed_at?`, `created_at`, `updated_at`.
  - `DecisionLogCreate` 필수: `ticker`, `decision_type`. 선택: `company_name?`, `decision_status?`(기본 OPEN), `summary?`, `reason?`, `risk_note?`, `action_plan?`, `confidence_score?`(0~100), `target_price?`/`stop_loss_price?`, `cognitive_risks`(기본 []), `created_by?`(기본 USER), `decided_at?`(생략 시 서버 now()). **`reviewed_at`은 POST 불가(PATCH 전용).**
  - enum: `decision_type` 10종 `WATCH`/`BUY_CONSIDER`/`BUY`/`HOLD`/`SELL_CONSIDER`/`SELL`/`SKIP`/`REBALANCE`/`TAKE_PROFIT`/`STOP_LOSS`. `decision_status` `OPEN`/`REVIEWED`/`CLOSED`. `created_by` `USER`/`AI`/`SYSTEM`.
- API 클라이언트는 `/api/v1` prefix 없는 경로로 호출(베이스 URL에 prefix 포함). 목록은 `paginated` 응답 — 기존 watchlist/signals list 패턴처럼 `apiGet`이 `data`로 배열을 반환하는지 재확인하고 동일 방식으로 추출.
- 현 FE 불일치: `dto.ts`가 `symbol`·`rationale`·`review_date`, 5종 비표준 enum 사용. `queries.ts`의 `useDecisionLogs`는 `enabled: false`+`initialData:[]`, 생성 핸들러는 `void createBody`/`void createDecisionLog.mutate`로 스텁됨. `DecisionLogPage.tsx`는 `mockDecisionLogs`→`adaptMockDecisionLog`→`localLogs` 폴백.
- 계약 매핑(정본): `ticker↔symbol`, `reason↔rationale`, `decision_status↔outcome`, `cognitive_risks↔cognitiveRisks`. enum은 UPPER_SNAKE 정본, **FE 표시계층에서 한글화**.

## Implementation Scope

- `src/features/decision-log/dto.ts` — `DecisionLogDto`를 BE `DecisionLogResponse` 정렬(`ticker`, `reason`, `reviewed_at`, `decided_at` 등 화면+정렬에 필요한 필드). `CreateDecisionLogBody` = `ticker`, `decision_type`, `reason?`, `cognitive_risks` (`review_date` 제거).
- `src/features/decision-log/adapters.ts` — `adaptDecisionLog`에서 `ticker→symbol`, `reason→rationale`, `reviewed_at→reviewDate`, `decision_type`를 한글 라벨 맵(아래)으로 변환. 도메인 모델 `DecisionLog` 외부 형태는 화면 호환 유지.
- `src/features/decision-log/queries.ts` — `useDecisionLogs` `enabled: false`/`initialData` 제거, 페이지네이션 목록 추출. `useCreateDecisionLog` 실제 `apiPost` 활성화 + `['decision-logs']` 무효화.
- `src/shared/model/decisionType.ts` — 라벨 세트를 BE 10종 기반으로 재정의(enum↔라벨 맵). 폼·`toLabel` 공용.
- `src/pages/ui/DecisionLogPage.tsx` — 쿼리/뮤테이션 단일 소스 연결, mock 폴백(`localLogs`/`adaptMockDecisionLog`) 제거, 생성 폼 10종 드롭다운 + `CreateDecisionLogBody` 매핑(`reviewDate` 미전송), 제출 스텁 제거, loading/empty/error 분기, "G10 대기" 문구 제거.

decision_type 한글 라벨 맵(설계 §3 제안, 그대로 사용 가능):
`WATCH`=관망, `BUY_CONSIDER`=매수 검토, `BUY`=매수, `HOLD`=보유 유지, `SELL_CONSIDER`=매도 검토, `SELL`=매도, `SKIP`=보류, `REBALANCE`=리밸런싱, `TAKE_PROFIT`=차익 실현, `STOP_LOSS`=손절.

## Out of Scope

- patterns 통계(`mockDecisionPatterns`)·review memos(`mockReviewMemos`) BE 연동 — 엔드포인트 부재. mock 유지 + "BE 미지원" TODO 주석만.
- PATCH 라이프사이클(재검토/종료) UI, snapshot·confidence·목표가 입력.
- 다른 화면(Dashboard/Portfolio/Watchlist) mock 정리.
- BE 레포 변경(불요). 무관한 리팩터링.

## Protected Files

없음. `.codex/*`, `docs/decisions/*`, `docs/harness/*` 수정 금지.

## Requirements

- 서버 데이터를 단일 소스로 사용(mock 폴백 제거). 빈 목록은 EmptyState, 오류는 ErrorState, 로딩은 Skeleton.
- 생성 body는 BE POST 계약 준수(`reviewed_at` 미전송).
- 도메인 모델(`DecisionLog`) 외부 타입은 화면 호환 유지, BE↔화면 변환은 adapter 책임.
- 기존 통과 테스트를 약화하지 말 것.

## Test Requirements

- `decision-log/adapters.test.ts`: 신규 필드명(`ticker`/`reason`/`reviewed_at`) 입력 → 도메인 매핑 단언. 10종 enum 한글 라벨 단언.
- `DecisionLogPage.test.tsx`: ① 서버 데이터 렌더, ② 생성 mutation 호출 body 단언(`reviewDate` 미포함), ③ mock 폴백 제거에 따른 fixture/단언 갱신.
- 시간 단언은 `TZ=UTC`.

## Verification Commands

```
pnpm lint
pnpm typecheck
pnpm format:check
TZ=UTC pnpm test
pnpm build
```

(포맷은 변경 파일만 `pnpm format`. `format:check`는 전체 게이트.)

## Documentation Impact

- 설계 기록 `docs/designs/49-decision-log-activation.md` 참조.
- `docs/designs/48-remaining-wiring.md` §3.5의 "G10 BE 미완 전략"이 outdated임을 1줄 주석/상태로 갱신(선택).

## ADR Need

불요. 계약 정렬·기존 도메인 활성화, 신규 의존성·아키텍처 변경 없음.

## Failure Record Need

불요(국소 변경·회귀 테스트로 방지).

## Risk Level

Medium. enum 전면 재매핑 + mock 폴백 제거로 화면 데이터 소스가 바뀐다. 생성 body 계약·페이지네이션 추출·null 필드(`reviewed_at`) 처리에 테스트 필수.

## Expected Output

- 전용 브랜치(이미 생성: `feat/decision-log-activation`, 최신 `main` 기준). 이 브랜치에서 구현.
- 위 파일 변경 + 테스트 커밋.
- 검증 5종 전부 통과 로그.
- DecisionLog 활성화 PR.

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results (특히 BE 계약 재확인 결과).
