# Codex Handoff Task

## Source Issue

- GitHub 이슈 #67 [Integration] FE-BE MVP smoke test 및 계약 불일치 수정
- 설계 기록: `docs/designs/67-contract-alignment-p0.md`

## Task Summary

이슈 #67에서 코드로 검증된 FE 측 P0 계약 불일치 3건을 BE 실제 계약에 맞춰 정렬한다. (기본 브랜치 변경은 레포 설정 작업이라 범위 밖)

## Goal

- Research 화면이 thesis를 `asset_id` 포함으로 호출해 422 없이 동작한다.
- Signals 목록 카드가 종목 심볼/이름을 정상 표시한다(`UNKNOWN` 없음).
- Signal score 표시값이 BE 계약(0~100 가정)과 일치한다.
- 위 변경에 맞춰 테스트가 갱신되고 전체 검증이 통과한다.

## Background

- FE는 TanStack Query 기반 `dto → adapters → queries` 계층. API 클라이언트는 envelope unwrap 후 `{ data }` 반환.
- 검증된 불일치(이슈 #67 본문 참조):
  - `src/features/research/queries.ts:63` 이 `apiGet('/theses/latest')`로 호출 — BE `GET /theses/latest`는 `asset_id` 필수.
  - `src/features/signals/queries.ts:36` 이 `/signals`만 호출 — BE 기본 `SignalResponse`엔 `symbol` 없음, `expand=asset`일 때만 `asset` 포함. adapter(`src/features/signals/adapters.ts:27`)는 `dto.symbol ?? dto.asset?.symbol ?? 'UNKNOWN'`.
  - `src/pages/ui/SignalsPage.tsx:71,390` 이 `signal.score * 100` 사용. adapter는 `parseDecimal(dto.score)` 통과(`adapters.ts:38`). FE 목/테스트는 score를 0~1로 가정하나 BE 계약은 0~100 정수.

## Implementation Scope

- `src/features/research/queries.ts` — thesis 호출을 `/theses/latest?asset_id={assetId}`로 수정(이미 queryFn 내 `assetId` 확보됨).
- `src/features/signals/queries.ts` — `useSignals` 목록 호출에 `expand=asset` 부착(`asset_id` 동반 시 함께 전달).
- `src/pages/ui/SignalsPage.tsx` — score 표시 정규화(아래 Requirements 참조).
- `src/features/signals/adapters.test.ts`, `src/pages/ui/SignalsPage.test.tsx` — score 스케일 정렬에 맞춰 fixture/단언 갱신.
- 필요 시 Research thesis 호출 관련 테스트 추가/갱신.

## Out of Scope

- GitHub 기본 브랜치 변경(레포 설정).
- 가격 시계열 활성화·주석/DTO 정리(P1), `VITE_API_BASE_URL` 문서(P1), P2 항목 전부.
- `/signals/{id}` 상세 동작 변경(증상은 목록 카드). 변경이 필요하다고 판단되면 근거와 함께 보고만 하고 임의 확장 금지.
- 그 외 화면/스타일/리팩터링.

## Protected Files

없음. `.codex/*`, `docs/decisions/*`, `docs/harness/*` 수정 금지.

## Requirements

- thesis: `assetId`를 쿼리스트링으로 전달. URL 인코딩 불필요(숫자 id).
- signals: 목록 호출 시 항상 `expand=asset`. 기존 `asset_id` 분기를 유지하며 두 파라미터를 함께 구성(예: `?asset_id=…&expand=asset` 또는 `?expand=asset`).
- score(기본 가정 = BE 0~100):
  - **구현 전 BE 계약(OpenAPI/스키마)으로 score 범위를 먼저 확인할 것.**
  - BE가 0~100이면: `SignalsPage.tsx`의 `* 100` 제거 → `Math.min(100, Math.max(0, Math.round(signal.score)))`로 정규화하고, ring offset/표시 모두 이 값 사용. 테스트/목 fixture score를 0~100 스케일로 갱신.
  - BE가 실제 0~1이면: 현 `* 100`이 옳으므로 무수정 결론을 근거와 함께 보고하고, 이 항목만 건너뛴다.
  - 어느 쪽이든 최종 표시값이 BE 계약과 일치해야 함.
- 도메인 타입(`satisfies`)·envelope 계약·기존 에러 매핑을 깨지 말 것.

## Test Requirements

- score 변경 시 `src/features/signals/adapters.test.ts`와 `src/pages/ui/SignalsPage.test.tsx`의 score 단언을 새 스케일에 맞게 갱신(현재 fixture: 0.86/0.72/0.61 등).
- signals `expand=asset` 부착을 검증하는 단언 또는 목 호출 인자 확인 추가 권장.
- thesis `asset_id` 전달 검증(가능하면 호출 URL 단언).
- 시간 관련 단언이 생기면 `TZ=UTC`로 검증.

## Verification Commands

```
pnpm lint
pnpm typecheck
pnpm format:check
TZ=UTC pnpm test
pnpm build
```

(포맷은 변경 파일만 `pnpm format` 적용. `format:check`는 전체 게이트.)

## Documentation Impact

- `docs/designs/67-contract-alignment-p0.md` 이미 작성됨. 구현 중 결정(특히 score 범위 확인 결과)을 이 문서에 반영/추가.
- README 등 사용자 문서 영향 없음(P1 env 문서는 범위 밖).

## ADR Need

불요. 신규 도메인/외부 의존성/아키텍처 결정 없음. 기존 계약 정렬.

## Failure Record Need

불요. 단, score 범위 확인 결과 BE/FE 중 한쪽이 명백히 잘못된 계약이었다면 한 줄 요약을 PR 본문에 남길 것.

## Risk Level

Low. 국소 호출/표시 수정. 단 score 스케일 변경은 테스트 fixture 동반 수정이 필요해 누락 시 회귀 가능 → 검증 필수.

## Expected Output

- 전용 피처 브랜치(최신 `main` 기준, 예: `fix/67-contract-alignment-p0`). 브랜치가 `main`보다 뒤처지면 먼저 rebase/pull.
- 위 3개(또는 score 제외 시 2개) 수정 + 테스트 갱신 커밋.
- 검증 5종 전부 통과 로그.
- 이슈 #67 해당 체크박스(thesis/signals expand/score)에 대응하는 PR. PR 본문에 score 범위 확인 결과 명시.

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
