# Codex Handoff Task

## Source Issue

- GitHub 이슈 #67 [Integration] FE-BE MVP smoke test 및 계약 불일치 수정 (Signal DTO nullability 후속)
- 설계 기록: `docs/designs/67-signal-dto-nullability.md`

## Task Summary

BE `SignalResponse`와 FE `SignalDto`/adapter의 nullability·타입 불일치를 정렬한다. smoke test 전 런타임 크래시(object를 React child로 렌더)·만료일 오표기 위험 제거. enum 테스트 fixture를 실제 BE 계약으로 정렬.

## Goal

- `SignalDto`가 `risk_level`/`expires_at` null, `evidence` object/string 모두 수용한다.
- adapter가 만료일 null, evidence object를 안전하게 처리한다(크래시·오표기 없음).
- signal 테스트 fixture가 실제 BE `SignalType` enum 값을 쓴다.
- 전체 검증 통과 + nullable/object evidence 회귀 테스트 추가.

## Background

- API 클라이언트는 `/api/v1` prefix 없는 경로로 호출(베이스 URL에 prefix 포함). 도메인 흐름: `dto → adapters → queries`.
- **먼저 BE 계약을 재확인하라.** BE `app/domains/signals/schema.py` `SignalResponse` (리뷰 보고 기준):
  - `risk_level: str | None`
  - `evidence: dict[str, Any] | None` (object)
  - `expires_at: UtcDatetime | None`
  - `SignalType` enum: `WATCH`, `RISK_ALERT`, `THESIS_BROKEN`, `BUY_CANDIDATE`, `SELL_REVIEW`, `OVERHEATED`
- 현 FE `src/features/signals/dto.ts`: `risk_level: string`, `evidence?: string | null`, `expires_at: string` (모두 non-null 가정).
- 현 adapter `src/features/signals/adapters.ts`: `formatKstDateTime(dto.expires_at)`(null이면 1970 표기), `evidence: dto.evidence ?? null`(object면 `SignalsPage.tsx:196` `{signal.evidence}`에서 React 크래시).
- 현 fixture `EARNINGS_REVISION`은 BE enum에 없음.

## Implementation Scope

- `src/features/signals/dto.ts`:
  - `risk_level: string | null`
  - `expires_at: string | null`
  - `evidence?: Record<string, unknown> | string | null`
- `src/features/signals/adapters.ts`:
  - 만료일 헬퍼 `(value: string | null | undefined) => string`: falsy면 "만료 없음" 반환, 아니면 `formatKstDateTime`.
  - evidence 헬퍼 `(evidence: Record<string, unknown> | string | null | undefined) => string | null`: falsy→null, string→그대로, object→가독 문자열(JSON 2-space) 직렬화.
  - riskLevel null 입력 시 라벨 안전 처리. 도메인 모델 `Signal.evidence: string | null`·`Signal.expiresAt: string` 유지.
- `src/features/signals/adapters.test.ts`·`src/pages/ui/SignalsPage.test.tsx`: `EARNINGS_REVISION` → 실제 BE enum 값(예: `BUY_CANDIDATE`)으로 교체, 라벨 단언 동기화.

## Out of Scope

- SignalType 한글 라벨 맵 도입(v0.2), 가격 시계열 활성화, API prefix 코드 고정, BE 레포 항목, 수동 smoke test, `/signals/{id}` 상세 동작 변경.
- 무관한 리팩터링.

## Protected Files

없음. `.codex/*`, `docs/decisions/*`, `docs/harness/*` 수정 금지.

## Requirements

- 도메인 모델(`Signal`) 외부 타입은 안정 유지(`evidence: string | null`). null/object 흡수는 adapter 책임.
- 시간 단언 테스트는 TZ=UTC로 검증.
- 기존 통과 테스트를 약화하지 말 것.

## Test Requirements

- `adapters.test.ts`: ① evidence object 입력 → 직렬화 문자열, ② `expires_at: null` → "만료 없음", ③ `risk_level: null` 안전 처리 회귀 케이스 추가.
- 기존 fixture enum 교체로 깨지는 단언 동기화.

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

- 설계 기록 `docs/designs/67-signal-dto-nullability.md` 참조. 추가 문서 불요.

## ADR Need

불요. 계약 정렬, 신규 도메인/의존성 없음.

## Failure Record Need

불요(국소·회귀 테스트로 방지).

## Risk Level

Medium. 런타임 크래시 방지가 핵심. evidence object 직렬화·null 만료일 처리에 회귀 테스트 필수.

## Expected Output

- 전용 브랜치(최신 `main` 기준, 예: `fix/67-signal-dto-nullability`).
- 위 파일 변경 + 회귀 테스트 커밋.
- 검증 5종 전부 통과 로그.
- 이슈 #67 해당 항목 PR.

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results (특히 BE 계약 재확인 결과).
