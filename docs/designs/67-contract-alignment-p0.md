# 설계 기록: 이슈 #67 P0 계약 불일치 수정 (FE)

## 1. 목적

이슈 #67(FE-BE MVP smoke test)에서 코드로 검증된 **P0 FE 계약 불일치 3건**을 BE 실제 계약에 맞춰 정렬한다. 신규 도메인/테이블/외부 의존성 추가 없음 → 국소 수정. (ADR 불요)

> P0 4번째 "기본 브랜치 main 변경"은 GitHub 레포 설정 작업이라 본 코드 핸드오프 범위 밖.

## 2. 대상·수정 방향

### P0-1. Research thesis 호출에 `asset_id` 누락

- 현재: `src/features/research/queries.ts:63` `apiGet<ThesisDto|null>('/theses/latest')`
- BE: `GET /theses/latest`는 `asset_id` 필수 → 미전달 시 422 가능
- 방향: 동일 queryFn 안에서 이미 확보한 `assetId`를 사용해 `/theses/latest?asset_id={assetId}` 호출

### P0-2. Signals가 `expand=asset` 미사용 → `UNKNOWN` 표시

- 현재: `src/features/signals/queries.ts:36` `/signals` (+`?asset_id`만)
- BE: 기본 `SignalResponse`엔 `symbol` 없음, `expand=asset`일 때만 `asset{symbol,name,...}` 포함. adapter는 `dto.symbol ?? dto.asset?.symbol ?? 'UNKNOWN'`(`adapters.ts:27`)
- 방향: `useSignals` 목록 호출에 항상 `expand=asset` 부착(`asset_id` 동반 시 함께). adapter는 이미 `asset.symbol`/`asset.name` fallback 처리하므로 추가 변경 최소.
- 비고: 상세(`/signals/{id}`)는 본 범위에서 제외(목록 카드 `UNKNOWN`이 증상). 필요 판단 시 Codex가 근거와 함께 보고.

### P0-3. Signal score 표시 계산 오류 (0~1 vs 0~100)

- 현재: `src/pages/ui/SignalsPage.tsx:71,390` `Math.round(signal.score * 100)`. adapter는 `parseDecimal(dto.score)` 그대로 통과(`adapters.ts:38`).
- 충돌: FE 목/테스트는 score를 **0~1**(0.86)로 가정. assessment 기준 BE 계약은 **0~100 정수**.
- 방향(기본 가정 = BE 0~100): SignalsPage의 `* 100` 제거하고 `Math.min(100, Math.max(0, Math.round(signal.score)))`로 정규화. 테스트/목 fixture(`SignalsPage.test.tsx`, `adapters.test.ts`)의 score를 0~100 스케일로 갱신.
- 안전장치: Codex는 **구현 전 BE 계약(OpenAPI/스키마)으로 score 범위를 먼저 확인**한다. 만약 BE가 실제 0~1을 반환하면 `* 100` 유지가 맞으므로, 그 경우 본 항목은 "FE 목/테스트가 옳음 → 무수정"으로 결론내고 근거를 보고한다. 어느 쪽이든 **FE 표시값이 BE 계약과 일치**하는 것이 완료 기준.

## 3. 스코프 밖

- 기본 브랜치 변경(레포 설정), 가격 시계열 활성화(P1), env 문서(P1), P2 항목.
- 시그널 상세/리서치 외 화면 동작 변경.

## 4. 검증

`pnpm lint` · `pnpm typecheck` · `pnpm format:check` · `TZ=UTC pnpm test` · `pnpm build` 전부 통과.
