# 82 · BE↔FE 응답 계약 정렬 (research stance 표시 정정)

Status: Draft
Track: FE
Source: FE #101
Risk: Low
Author: Claude Code (orchestrator)

관련: BE #163(설계 `project_stock/docs/designs/064-be-fe-contract-alignment.md`, PR #165 병합),
점검 기록 `project_stock/docs/reviews/contract-audit-be-fe-2026-07-02.md`.

---

## 1. 배경

BE↔FE 계약 점검(2026-07-02)에서 확인된 8건의 응답 불일치는 BE를 계약 기준으로 확정해
BE #163(PR #165)에서 정렬을 마쳤습니다. FE DTO·adapter는 이미 목표 형태를 기대하고
있었으므로 대부분 항목은 BE 병합만으로 정합 상태가 되었습니다.

병합된 BE를 기준으로 FE를 재검증한 결과, DTO 형태는 모두 일치하지만 **research-summary
표시 경로에 조용한 표시 버그 2건**이 남아 있습니다. 크래시는 없으나 사용자에게 잘못된
값이 표시되므로 정정이 필요합니다.

### 1.1 stance 라벨 미매핑

BE `GET /assets/{id}/research-summary`는 `stance`를 `BUY_CANDIDATE`·`WATCH` 같은 enum성
와이어 문자열로 반환합니다. FE adapter(`adaptResearchDetail`)는 `summary.stance`를 그대로
전달하고 `ResearchPage`가 원문을 그대로 렌더하므로, 화면에 `BUY_CANDIDATE`가 그대로
노출됩니다.

### 1.2 stance_confidence 스케일 불일치

BE는 `stance_confidence`를 `"0.72"`·`"0.64"` 형태의 0~1 분수 문자열로 반환합니다. FE
adapter는 `parseDecimal`로 그대로 파싱하고 `ResearchPage`는 `Math.round(stanceConfidence)%`로
렌더하므로, 실제 72%가 `1%`로 표시됩니다. 기존 테스트 fixture가 `'65'`(퍼센트 값)를
사용해 이 불일치가 가려져 있었습니다.

---

## 2. 범위

포함:

- research stance 와이어 값(`BUY_CANDIDATE`·`WATCH`) → 한글 라벨 매핑 추가.
- adapter에서 `stance_confidence` 0~1 분수를 0~100 퍼센트로 정규화.
- 위 두 변경에 맞춘 테스트 fixture·단언 갱신(실제 BE 와이어 값 사용).

비포함:

- BE 응답 스키마 변경(BE #163에서 확정, 계약 기준은 BE).
- research 외 도메인 DTO·adapter 변경(이미 정합 확인).
- `ResearchPage` 레이아웃·컴포넌트 구조 변경.
- stance 3종 이상 확장(현재 BE mock은 2종 반환, 미지의 값은 fallback 유지).

---

## 3. 계약 정렬 정의

| 항목              | BE 와이어(확정)           | 현재 FE 표시       | 정정 후 FE 표시 |
| ----------------- | ------------------------- | ------------------ | --------------- |
| stance            | `BUY_CANDIDATE` / `WATCH` | 와이어 원문 그대로 | 한글 라벨       |
| stance_confidence | `"0.72"` (0~1 분수)       | `1%`               | `72%`           |

라벨 매핑 표기는 기존 `alertTypeLabels`와 일관되게 유지합니다.

| wire            | label     |
| --------------- | --------- |
| `BUY_CANDIDATE` | 매수 후보 |
| `WATCH`         | 관찰      |

미지의 stance 값·null은 기존 fallback(`판단 보류`)을 유지합니다.

---

## 4. 변경 파일

- `src/shared/lib/format/enumLabel.ts` — `researchStanceLabels: Record<string, string>` 추가.
- `src/shared/lib/format/index.ts` — `researchStanceLabels` re-export.
- `src/features/research/adapters.ts` — `stance`에 `toLabel(researchStanceLabels, ...)` 적용,
  `stanceConfidence`를 0~1 → 0~100 정규화.
- `src/features/research/adapters.test.ts` — fixture를 실제 BE 와이어 값(`BUY_CANDIDATE`,
  `"0.72"`)으로 교체하고 라벨·퍼센트 단언 갱신.
- `src/shared/lib/format/enumLabel.test.ts` — `researchStanceLabels` 단언 추가.

---

## 5. 정규화 방식

`stance_confidence` 정규화 위치는 adapter로 한정합니다(표시 계층은 `ResearchView`의
`stanceConfidence`를 0~100으로 신뢰). 파싱 실패·null은 기존과 동일하게 `null`을 유지해
`ResearchPage`의 `점수 없음` 분기가 그대로 동작하게 합니다. 컴포넌트의 `Math.round(x)%`
렌더는 변경하지 않습니다.

---

## 6. 테스트

- `enumLabel`: `researchStanceLabels['BUY_CANDIDATE']`·`['WATCH']` 매핑 단언.
- `adaptResearchDetail`: 와이어 `BUY_CANDIDATE` → `매수 후보`, `"0.72"` → `72` 단언.
- 미지의 stance·null → `판단 보류` 유지, null confidence → `null` 유지 단언.
- 전체 typecheck·test 통과.

---

## 7. ADR / 실패 기록

- ADR 불필요: 기존 enum 라벨 매핑·adapter 정규화 관례를 따르는 표시 정정입니다. 계약 기준
  결정(BE 확정)은 BE 설계 064에 기록되어 있습니다.
- 실패 기록 불필요.

---

## 8. 비범위 / 후속

- BE stance 확장(3종 이상)·실제 AI 스탠스 산출 — 별도 요구사항.
- research-summary 외 도메인은 본 병합 후에도 정합이 유지되는지 회귀 테스트로 감시.
