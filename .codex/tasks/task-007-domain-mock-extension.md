# Codex Handoff Task — task-007: 도메인·Mock 확장 (이슈 7~11 선행)

## Source Issue

- 선행 작업(특정 이슈 종료 아님). 이슈 7·8·9·10·11 페이지 구현을 위한 도메인/Mock 확장.
- 설계 기록: `docs/designs/7-11-domain-mock-extension.md`
- 의존: task-004(기존 도메인/Mock, PR #27 머지됨)
- 기반 브랜치: `feat/fe-domain-mock-extension`(최신 `main`에서 분기, 본 설계·핸드오프 커밋 포함)

## Task Summary

페이지 7~11 구현에 필요한 도메인 타입과 Mock 데이터를 `src/shared/model`·`src/shared/mock`에
확장한다. 신규 enum 2종, 기존 모델 3종 확장, 신규 모델 다수, Mock 데이터 보강을 포함한다.
UI(페이지·위젯)는 건드리지 않는다.

## Goal

- 설계 기록의 모든 타입이 `src/shared/model`에 정의되고 배럴(`index.ts`)에서 export된다.
- 모든 Mock 데이터가 해당 도메인 타입을 `satisfies`로 무손실 만족한다.
- 페이지 7~11이 추가 타입 정의 없이 이 모델·Mock 위에서 구현 가능하다.
- 기존 `Stock`/`Signal`/`DecisionLog`를 소비하던 코드(라우팅·기존 mock 테스트 등)가 깨지지 않는다.

## Background

- 기존 도메인: `src/shared/model/`(`domain.ts`, `stockStatus.ts`, `riskLevel.ts`, `index.ts`).
- 기존 Mock: `src/shared/mock/`(`domain.ts`, `index.ts`, `domain.test.ts`).
- `StockStatus`(7종)·`RiskLevel`('높음'|'중간'|'낮음')은 이미 정의됨 — 그대로 사용.
- Mock은 실제 API 응답으로 무손실 교체 가능한 구조를 유지한다(`satisfies` 패턴).

## Implementation Scope

`src/shared/model`:

- 신규 enum 파일(기존 `stockStatus.ts` 패턴: `as const` 배열 + 파생 union type):
  - `valuationLevel.ts` — `ValuationLevel` = `'저평가' | '적정' | '고평가'`.
  - `decisionType.ts` — `DecisionType` = `'매수' | '비중 확대' | '관망' | '비중 축소' | '매도' | '보류'`.
- `domain.ts` 확장:
  - `Stock`에 `market: string`, `newsRisk: RiskLevel`, `valuation: ValuationLevel`, `aiVerdict: string` 추가.
  - `Signal`에 `confidence: number`, `reasons: string[]`, `updatedAt: string`, `priority: number` 추가.
  - `DecisionLog`에 `decisionType: DecisionType`, `cognitiveRisks: string[]`, `reviewDate: string` 추가.
  - 신규 모델: `DashboardSummary`, `AiBriefing`, `PriorityQueueItem`, `StockResearch`(+`PricePoint`,
    `ResearchRisk`, `NewsItem`, `CatalystItem`, `ChecklistItem`), `DecisionPattern`, `ReviewMemo`.
    필드는 설계 기록 표를 그대로 따른다.
- `index.ts`: 신규 enum 값·타입과 신규 모델 타입을 모두 export.

`src/shared/mock`:

- `domain.ts`(필요 시 `research.ts`로 분리): 기존 `mockStocks`·`mockSignals`·`mockDecisionLogs`에
  신규 필드를 채우고, 신규 export 추가:
  `mockDashboardSummary`, `mockAiBriefing`, `mockPriorityQueue`,
  `mockStockResearch`(심볼→`StockResearch` 맵), `mockDecisionPatterns`, `mockReviewMemos`.
- `index.ts`: 신규 mock export.

## Out of Scope

- 페이지·위젯·라우팅 UI 변경(이슈 7~11 후속 page task에서 수행).
- API 클라이언트·서버 상태 관리(이슈 17).
- 차트 컴포넌트 구현(이슈 19) — `pricePoints`는 표시용 샘플 데이터만.
- 공통 UI 컴포넌트 추가/변경(`shared/ui`).

## Protected Files

없음.

## Requirements

- 신규 enum은 기존 `stockStatus.ts`/`riskLevel.ts`와 동일 패턴(`as const` 배열 + `(typeof x)[number]`).
- 모든 Mock은 `satisfies <Type>[]`(또는 맵 타입)로 선언해 타입 누락 시 컴파일 실패하도록 한다.
- 완료 조건 충족:
  - `mockStockResearch`에 `NVDA`·`AAPL`·`TSLA` 존재, 각 `keyRisks` 3개 이상.
  - `mockPriorityQueue` 3개 이상.
  - `mockStocks`는 NVDA/AAPL/TSLA 포함(기존 유지) + 신규 필드 채움.
  - `mockDecisionLogs` 각 항목에 `decisionType`/`cognitiveRisks`/`reviewDate` 채움.
- 현재 단계에 불필요한 추상화 금지(요구 필드만 정의).

## Test Requirements

- `src/shared/mock/domain.test.ts` 확장(또는 mock별 테스트 추가):
  - 신규 mock이 비어있지 않고 핵심 불변식을 만족(예: 각 `Stock.newsRisk`가 `riskLevels`에 포함,
    `mockStockResearch.NVDA.keyRisks.length >= 3`, `mockPriorityQueue.length >= 3`).
  - 기존 mock 테스트 통과 유지.
- 타입 단언은 `satisfies`로 컴파일 타임 검증(런타임 테스트와 별개).

## Verification Commands

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

> CI는 `format:check`(Prettier)를 강제한다. 커밋 전 변경 파일에 한정해 `prettier --write`로 포맷을 맞춘다.
> `pnpm format`은 저장소 전체를 건드리니 변경 파일에 한정할 것.

## Documentation Impact

- `src/shared/README.md`의 도메인 모델·Mock 설명에 신규 모델 목록 한두 줄 반영.

## ADR Need

불필요. 기존 도메인 모델의 점진 확장이며 신규 아키텍처·의존성 결정 없음.

## Failure Record Need

불필요.

## Risk Level

Low. `shared/model`·`shared/mock`에 한정한 타입·데이터 확장. 기존 소비처는 필드 추가만이라
기존 Mock에 신규 필드를 채우면 타입 호환 유지(파괴적 변경 없음).

## Expected Output

- 변경: `src/shared/model/`(신규 enum 2 + `domain.ts` 확장 + `index.ts`),
  `src/shared/mock/`(`domain.ts`/필요 시 `research.ts` + `index.ts` + 테스트), `src/shared/README.md`.
- `feat/fe-domain-mock-extension` 브랜치에서 PR 1건.
- 변경 파일·검증 결과·가정(필드 의미·mock 값 근거) 보고.

## Rules

- 기반 브랜치 `feat/fe-domain-mock-extension`에서 작업(최신 `main` 기반). 범위 내 유지, 검증 약화 금지.
- 페이지·위젯·라우팅은 손대지 않는다(후속 task).
- 기존 타입을 깨지 않도록 신규 필드는 기존 mock에도 반드시 채운다.
- 가정·검증 결과 보고.
