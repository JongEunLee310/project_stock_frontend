# 설계 기록: 이슈 #67 Signal DTO nullability·evidence 타입 정렬

## 1. 목적

이슈 #67 통합 점검 후속. BE `SignalResponse`와 FE `SignalDto`/adapter의 nullability·타입 불일치를 정렬해 smoke test 전 런타임 크래시·오표기 위험을 제거한다. (ADR 불요)

## 2. 배경 (BE 계약 — 확인 필요)

BE `app/domains/signals/schema.py` `SignalResponse` (리뷰 보고 기준, Codex가 먼저 재확인):

- `risk_level: str | None`
- `evidence: dict[str, Any] | None` (object)
- `expires_at: UtcDatetime | None`
- `SignalType` enum: `WATCH`, `RISK_ALERT`, `THESIS_BROKEN`, `BUY_CANDIDATE`, `SELL_REVIEW`, `OVERHEATED`

현 FE는 `risk_level: string`, `evidence?: string | null`, `expires_at: string`(모두 non-null 가정), enum fixture는 `EARNINGS_REVISION`(BE에 없음).

## 3. 대상·방향

### 3-A. `SignalDto` nullability 정렬 (`dto.ts`)

- `risk_level: string | null`
- `expires_at: string | null`
- `evidence?: Record<string, unknown> | string | null` (object/string 모두 수용)

### 3-B. adapter 방어 (`adapters.ts`)

- 만료일: null/undefined면 포매팅 우회하고 "만료 없음" 류 플레이스홀더 반환 (시그니처: `(value: string | null | undefined) => string`).
- evidence: object면 가독 문자열로 직렬화, string이면 그대로, falsy면 null 반환 (시그니처: `(evidence: Record<string, unknown> | string | null | undefined) => string | null`).
- riskLevel: null 입력 시 라벨이 깨지지 않게 처리(빈/플레이스홀더). 도메인 모델 `Signal.evidence: string | null` 유지.

### 3-C. enum fixture 실계약 정렬 (테스트)

- `adapters.test.ts`·`SignalsPage.test.tsx`의 `EARNINGS_REVISION`을 실제 BE enum 값(예: `BUY_CANDIDATE`)으로 교체. 표시 라벨 단언도 동기화.

## 4. 스코프 밖

- SignalType 한글 라벨 맵 도입(v0.2 폴리시), 가격 시계열 활성화, prefix 코드 고정, BE 레포 항목, 수동 smoke test.

## 5. 검증

`pnpm lint` · `pnpm typecheck` · `pnpm format:check` · `TZ=UTC pnpm test` · `pnpm build` 전부 통과. nullable/object evidence 경로 회귀 테스트 추가.
