# Codex Handoff Task

## Source Issue

#131 — 시그널 페이지 재설계 1단계 — 디자인 레이아웃·KPI 유형화·카드/필터/우선순위 레일 (기존 데이터)
`gh issue view 131 --repo JongEunLee310/project_stock_frontend`

설계 문서: `docs/designs/131-signal-redesign-phase1.md`

## Task Summary

`SignalsPage`를 디자인(signal.png) 레이아웃에 맞게 재구성한다. signal_type → 카테고리 매핑 상수를 신설하고, KPI 5종·필터 바·카드·우선순위 레일을 새 구조로 교체한다. BE 신규 계약이 필요한 요소는 "준비 중" 자리표시로 처리한다. 기존 `useSignals`·`useSignalSparkline` 훅과 `Signal` 뷰 모델은 변경하지 않는다.

## Goal

작업 완료 시 다음 상태여야 한다.

- 시그널 페이지가 총 시그널 + 4카테고리(관망 유지·리스크 증가·매수 검토 가능·추가 리서치 필요) KPI 5종을 표시한다.
- 신호 유형·신뢰도 구간·시장·종목 검색·필터 초기화로 시그널 목록이 필터링된다.
- 각 시그널 카드에 카테고리 배지·신뢰도 링·1M 등락률·버튼 3개(근거 보기·판단 기록·알림 설정)가 표시된다.
- 우선순위 레일에 순위·심볼·카테고리 배지·신뢰도가 표시된다.
- "준비 중" 요소(전일 대비 delta·변화 컬럼·최근 변경 레일·알림 설정 버튼)는 자리표시로 처리된다.
- `pnpm format:check`, `pnpm typecheck`, `pnpm lint`, `pnpm test`가 전부 통과한다.

## Background

현재 `SignalsPage`는 `risk_level` 기준 KPI 3종, 버튼 2개짜리 카드, 신뢰도 수치만 있는 우선순위 레일로 구성되어 있다. 디자인(signal.png)에서는 signal_type을 4가지 카테고리로 묶어 KPI·필터·카드 배지·레일에 일관되게 표시한다. 카테고리 매핑은 설계 문서(`docs/designs/131-signal-redesign-phase1.md`)에 확정된 형태로 기술되어 있다.

신뢰도는 기존 `Signal.score`(0–100) 그대로 사용한다. 1M 등락률은 `useSignalSparkline`이 반환하는 종가 배열의 첫/마지막 값으로 계산한다. 전일 대비 delta·변화·최근 변경·근거 불릿은 BE 신규 계약이 필요하므로 이번 범위 밖이다.

현재 브랜치 `feat/signal-redesign-phase1`에서 작업한다.

## Implementation Scope

다음 파일을 변경하거나 신설할 수 있다.

**신설**
- `src/features/signals/signalCategories.ts` — `SignalCategory` 타입, `SIGNAL_CATEGORY_MAP`, `CATEGORY_META`, `categoryOf` 헬퍼

**재구성(대폭 변경)**
- `src/pages/ui/SignalsPage.tsx` — `SummaryCards` → `SignalKpiRow`, 필터 상태 모델 교체, `SignalCard` 재구성, `ScoreRing` → `ConfidenceRing` 개명, `SignalPriorityRail` 교체, `RecentChangesRail` placeholder 추가

**갱신**
- `src/pages/ui/SignalsPage.test.tsx` — 기존 테스트를 새 구조에 맞게 갱신하고, 아래 Test Requirements의 항목을 추가

선택적 분리 — `SignalCard`·`ConfidenceRing`·`SignalKpiRow`·`SignalFilters`·`SignalPriorityRail`·`RecentChangesRail`를 `src/pages/ui/` 내 별도 파일로 분리할 수 있다. 단, 파일 분리 자체가 목적이 아니며 `SignalsPage.tsx` 내 로컬 컴포넌트로 유지해도 무방하다.

**변경 불가**
- `src/features/signals/queries.ts`
- `src/features/signals/adapters.ts`
- `src/features/signals/dto.ts`
- `src/shared/lib/format/enumLabel.ts`
- `src/shared/ui/` 내 기존 컴포넌트 파일

## Out of Scope

- 좌측 시장 요약 사이드바.
- 전일 대비 delta · 변화 컬럼 · 최근 변경 타임라인 실데이터.
- 근거 불릿 구조화(`evidence` 필드 구조화).
- `useSignals` · `useSignalSparkline` 쿼리 로직 변경.
- BE 신규 API 엔드포인트.
- `src/shared/ui/` 기존 컴포넌트 수정.

## Protected Files

변경 금지: `AGENTS.md`, `CLAUDE.md`, `.codex/instructions.md`, `.codex/agents/`, `.codex/config.toml`, `.github/workflows/ci.yml`, `docs/harness/`, `docs/decisions/`, `docs/failures/`.

## Requirements

1. **카테고리 매핑 상수** — `src/features/signals/signalCategories.ts`에 `SignalCategory` 타입, `SIGNAL_CATEGORY_MAP`(signal_type → category), `CATEGORY_META`(label·color token·아이콘), `categoryOf` 헬퍼를 신설한다. 설계 문서의 매핑 표를 그대로 사용한다.

2. **KPI 5종** — 총 시그널 카드 1개 + 카테고리별 카드 4개. 각 카테고리 카드는 카운트와 비율(카운트/총합)을 표시한다. 총합이 0이면 비율을 `—`으로 표시한다. "전일 대비" 자리는 `—`으로 처리한다.

3. **필터 바** — 신호 유형(카테고리), 신뢰도 구간(high/mid/low/전체), 시장, 종목 검색, 필터 초기화를 제공한다. 신뢰도 구간 경계값은 구현 시 합리적인 값으로 결정하고 주석으로 명시한다(가정).

4. **카드** — 카테고리 배지(`CATEGORY_META` 라벨·색상 사용) + `ConfidenceRing`(score 기반, 색상은 카테고리 기반) + 회사명 + reason + 1M 등락률 + 버튼 3개(근거 보기·판단 기록·알림 설정). 알림 설정 버튼은 `disabled` 상태로 "준비 중" aria-label을 달아 자리표시한다.

5. **1M 등락률** — `useSignalSparkline` 종가 배열 첫/마지막 값으로 계산한다. 배열 길이 2 미만이거나 첫 값이 0이면 `null`을 반환하고 `—`으로 표시한다. 양수는 녹색(`+XX.X%`), 음수는 적색으로 표시한다.

6. **우선순위 레일** — `signal.score` 내림차순 상위 6건. 순위·심볼·카테고리 배지·신뢰도(score%) 표시. "변화" 컬럼 자리는 `—`으로 처리한다.

7. **RecentChangesRail** — `EmptyState` 또는 "준비 중" 텍스트로 전체를 자리표시한다.

8. **디자인 준수** — `src/Downloads/signal.png` (또는 이미 확인된 디자인 이미지)의 레이아웃·색상 구조를 정본으로 따르되 기존 `cockpit-*` 테마 토큰을 재사용한다.

## Test Requirements

`src/pages/ui/SignalsPage.test.tsx`를 갱신하여 다음 항목을 포함한다.

기존 테스트는 새 구조에 맞게 업데이트한다(삭제하지 않고 갱신).

**KPI**
- 총 시그널 카운트가 올바르게 표시된다.
- 카테고리별 카운트와 비율이 `signalRows` 픽스처에서 올바르게 파생된다.

**필터**
- 카테고리 필터 선택 시 해당 카테고리 카드만 표시된다.
- 검색어 입력 시 심볼 또는 회사명에 매치되는 카드만 표시된다.
- 필터 초기화 버튼 클릭 시 모든 필터가 초기값으로 복원되고 전체 카드가 표시된다.

**카드**
- 카테고리 배지 텍스트(`CATEGORY_META[category].label`)가 카드에 표시된다.
- `ConfidenceRing`이 `role="meter"`, `aria-valuenow`, 점수 텍스트를 가진다.
- 1M 등락률이 스파크라인 데이터에서 올바르게 계산되어 표시된다(양수/음수 케이스).
- 스파크라인 데이터가 없거나 길이 1 이하이면 등락률이 `—`으로 표시된다.
- 버튼 3개(근거 보기·판단 기록·알림 설정)가 존재하며, 알림 설정은 `disabled` 상태다.

**우선순위 레일**
- 순위 번호, 심볼, 카테고리 배지가 렌더된다.
- `signal.score` 내림차순 상위 6건만 표시된다.

**RecentChangesRail**
- "준비 중" 자리표시가 렌더된다.

**기존 테스트 갱신**
- `aria-label`이 새 컴포넌트 구조에 맞게 변경된 경우 픽스처와 단언을 함께 업데이트한다.
- 리스크 라벨 기반 KPI 단언(`낮음 리스크` 등)은 카테고리 기반으로 교체한다.

## Verification Commands

```
pnpm format:check
pnpm typecheck
pnpm lint
pnpm test
```

네 명령이 모두 통과해야 한다. `format:check` 누락 금지.

## Documentation Impact

- `docs/designs/131-signal-redesign-phase1.md` — 이미 작성됨, 참조만.
- 구현 중 설계 문서의 "가정" 항목(신뢰도 구간 경계값, 시장 코드 목록, 색상 토큰)을 확정한 값으로 처리하되, 코드 주석에 "가정 → 확정" 사유를 남긴다.

## ADR Need

불필요. 카테고리 매핑 상수와 컴포넌트 분리는 이슈 범위 내 결정이며 아키텍처 방향을 바꾸지 않는다.

## Failure Record Need

불필요. 신규 구현이며 반복하지 않아야 할 실패 패턴 없음.

## Risk Level

Medium. `SignalsPage`를 전면 재구성하므로 기존 테스트 8개 전부가 영향을 받는다. `useSignals`·`useSignalSparkline` 인터페이스는 변경하지 않으므로 다른 페이지에 대한 회귀 위험은 낮다.

## Expected Output

- `src/features/signals/signalCategories.ts` 신설.
- `src/pages/ui/SignalsPage.tsx` 전면 재구성.
- `src/pages/ui/SignalsPage.test.tsx` 갱신.
- (선택) 컴포넌트 파일 분리 시 `src/pages/ui/` 내 신규 파일.
- `pnpm format:check && pnpm typecheck && pnpm lint && pnpm test` 전부 통과.

## Rules

- 현재 브랜치 `feat/signal-redesign-phase1`을 유지한다. 새 브랜치를 만들지 않는다.
- 커밋하지 않는다.
- `src/features/signals/queries.ts`, `adapters.ts`, `dto.ts`는 변경하지 않는다.
- `src/shared/ui/` 기존 컴포넌트 파일은 변경하지 않는다.
- 보호 파일 목록에 있는 파일은 변경하지 않는다.
- 테스트를 삭제하거나 단언을 약화하여 CI를 통과시키지 않는다.
- 가정으로 확정한 값(신뢰도 구간 경계값 등)은 코드 주석에 명시한다.
- 디자인 이미지(`signal.png`)의 레이아웃·색상 구조를 정본으로 따르되 기존 cockpit 테마 토큰을 재사용한다.
- 가정·결정 사항은 구현 완료 후 보고한다.
- Stay within scope. Do not weaken verification. Do not modify protected files unless listed above. Report assumptions and verification results.
