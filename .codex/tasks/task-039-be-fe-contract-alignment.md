# Codex Handoff Task

## Source Issue

FE #101 — BE↔FE 응답 계약 불일치 정리(DTO/adapter 정렬). 설계: `docs/designs/82-be-fe-contract-alignment.md`. 관련: BE #163(PR #165 병합), 점검 기록 `project_stock/docs/reviews/contract-audit-be-fe-2026-07-02.md`.

## Task Summary

BE #163(PR #165) 병합으로 BE 응답이 FE DTO 목표 형태에 맞춰졌다. 재검증 결과 DTO 형태는 모두 정합이며, research-summary 표시 경로에 남은 조용한 버그 2건(stance 라벨 미매핑, stance_confidence 스케일 불일치)만 정정한다.

## Goal

완료 시 다음이 참이어야 한다.

- research adapter가 BE stance 와이어 값(`BUY_CANDIDATE`·`WATCH`)을 한글 라벨(`매수 후보`·`관찰`)로 매핑해 `ResearchView.stance`에 담는다.
- research adapter가 `stance_confidence` 0~1 분수(`"0.72"`)를 0~100 퍼센트(`72`)로 정규화해 `ResearchView.stanceConfidence`에 담는다.
- 미지의 stance·null은 기존 fallback(`판단 보류`)을 유지하고, null confidence는 `null`을 유지한다.
- 관련 테스트가 실제 BE 와이어 값으로 갱신되고 전체 test·typecheck가 통과한다.

## Goal (branch)

이미 최신 `main`에서 생성된 `feat/fe-101-contract-alignment` 브랜치에서 작업한다. 브랜치에는 설계 82·본 핸드오프가 커밋되어 있다. 브랜치가 `main`보다 뒤처지면 먼저 rebase한다.

## Background

BE `GET /assets/{id}/research-summary`는 `stance`를 enum성 와이어 문자열(`BUY_CANDIDATE`·`WATCH`)로, `stance_confidence`를 0~1 분수 문자열(`"0.72"`)로 반환한다. FE `adaptResearchDetail`은 `summary.stance`를 그대로 전달하고 `stance_confidence`를 `parseDecimal`로만 파싱하므로, `ResearchPage`에서 stance는 와이어 원문이 그대로, confidence는 `Math.round(0.72)%` = `1%`로 잘못 표시된다. 기존 테스트 fixture(`stance: 'Constructive'`, `stance_confidence: '65'`)가 실제 BE 값과 달라 이 불일치가 가려져 있었다. 상세는 설계 82 §1·§3 참조.

## Implementation Scope

설계 82 §4의 파일 목록을 따른다.

- `src/shared/lib/format/enumLabel.ts` — `researchStanceLabels: Record<string, string>` 추가(`BUY_CANDIDATE`→`매수 후보`, `WATCH`→`관찰`).
- `src/shared/lib/format/index.ts` — `researchStanceLabels` re-export.
- `src/features/research/adapters.ts` — `stance`에 `toLabel(researchStanceLabels, summary.stance ?? '', '판단 보류')`(또는 null 분기 유지) 적용, `stanceConfidence`를 0~1 → 0~100 정규화.
- `src/features/research/adapters.test.ts` — fixture를 실제 BE 와이어 값으로 교체, 라벨·퍼센트 단언 갱신.
- `src/shared/lib/format/enumLabel.test.ts` — `researchStanceLabels` 단언 추가.

## Out of Scope

- BE 응답 스키마 변경(계약 기준은 BE, BE #163에서 확정).
- research 외 도메인 DTO·adapter 변경(이미 정합 확인).
- `ResearchPage` 레이아웃·컴포넌트 구조 변경(`Math.round(x)%` 렌더 유지).
- stance 3종 이상 확장.
- 방어 fallback 일괄 제거(정합 확인된 다른 필드의 `?? default`는 유지).

## Protected Files

없음. `.codex/` 설정·`AGENTS.md` 등 보호 파일은 변경하지 않는다.

## Requirements

- stance 정규화 위치는 adapter로 한정한다. 표시 계층(`ResearchPage`)은 변경하지 않는다.
- `stance_confidence` 정규화는 파싱 성공 시에만 ×100을 적용하고, null·파싱 실패는 `null`을 유지해 `점수 없음` 분기가 그대로 동작하게 한다.
- 라벨 매핑 표기는 기존 `alertTypeLabels`(`BUY_CANDIDATE`→`매수 후보`, `WATCH`→`관찰`)와 일관되게 유지한다.
- 미지의 stance 값·null stance는 기존 fallback(`판단 보류`)을 유지한다.

## Test Requirements

- `adapters.test.ts`: research-summary fixture의 `stance`를 `BUY_CANDIDATE`(또는 `WATCH`), `stance_confidence`를 `"0.72"`로 교체하고, `view.stance === '매수 후보'`, `view.stanceConfidence === 72` 단언. null confidence·미지 stance fallback 단언 유지.
- `enumLabel.test.ts`: `researchStanceLabels['BUY_CANDIDATE'] === '매수 후보'`, `['WATCH'] === '관찰'` 단언.
- 검증을 약화하지 않는다.

## Verification Commands

```
pnpm typecheck
pnpm test
pnpm lint
```

## Documentation Impact

- 설계 82 Status를 구현 완료 시 갱신할지 여부는 리뷰에서 판단.
- 별도 API 스펙 문서 변경 없음(BE 계약은 BE repo에서 관리).

## ADR Need

불필요. 기존 enum 라벨 매핑·adapter 정규화 관례를 따르는 표시 정정으로 아키텍처 결정 변경이 없다. 계약 기준 결정(BE 확정)은 BE 설계 064에 기록되어 있다.

## Failure Record Need

불필요.

## Risk Level

Low. research adapter·라벨 맵·해당 테스트로 변경 범위가 좁고, 표시 계층·다른 도메인은 건드리지 않는다.

## Expected Output

- `feat/fe-101-contract-alignment` 브랜치 커밋 + PR(base=main). 설계 82·BE #163 링크 포함.
- typecheck·test·lint 통과 로그.
- 가정(라벨 표기·정규화 방식)을 PR 본문에 명시.

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
