# 219 · 리서치 AI briefing 실데이터 연결 (빈 상태·재생성)

Status: Draft
Track: FE
Source: FE #219
Risk: Medium
Author: Claude Code (orchestrator)

관련: BE #322(PR #323 병합, 설계 `project_stock/docs/designs/322-research-summary-real.md`).
BE 계약은 `project_stock/docs/api/frontend-api-spec.md`의 research-summary 절을 기준으로 한다.

---

## 1. 배경

BE #322에서 리서치 요약이 mock 템플릿에서 LLM 실생성·저장 구조로 전환됐습니다. 이에 따라
계약이 두 가지로 바뀌었습니다.

- `GET /assets/{id}/research-summary`는 저장본이 없으면 `404 RESEARCH_SUMMARY_NOT_FOUND`를
  반환합니다(기존에는 항상 mock 200).
- `POST /assets/{id}/research-summary/refresh`가 신설되어 요약을 생성·저장합니다.

### 1.1 현재 FE의 크래시 위험

`useResearchView`(`src/features/research/queries.ts`)는 `Promise.all`로 `detail`·
`research-summary`·`buy-checklist`·`thesis`를 동시에 조회합니다. 저장본이 없는 종목에서
`research-summary`가 404를 반환하면 `Promise.all` 전체가 reject되어 리서치 상세 페이지가
통째로 에러 상태로 빠집니다. `thesis` 조회는 이미 `fetchLatestThesis`에서
`THESIS_NOT_FOUND`를 catch해 `null`로 처리하는 선례가 있습니다.

### 1.2 요약 파생 필드의 소비 지점

`research-summary` 응답은 briefing뿐 아니라 stance 카드·counter points·key risks의 원본이기도
합니다. `ResearchPage.tsx`의 소비 지점은 다음과 같습니다.

- briefing 카드: `research.briefing.{createdAt,headline,body,positiveFactors,cautionFactors,nextChecks}`
- stance 카드: `research.{stance,stanceConfidence,confidenceBasis,stanceComment}`
- key risks: `research.keyRisks`
- counter points: `research.counterPoints`

저장본이 없으면 이 필드들이 모두 비게 되므로, 어댑터가 `summary` 부재를 null-safe하게 처리해야
합니다.

### 1.3 리서치 큐

`toResearchQueueView`(`adapters.ts:201`)는 이미 `stance`를 `stance ? toLabel(..., '판단 보류') : null`로,
`headline`을 그대로(nullable) 처리합니다. 큐 항목은 저장본 부재 시 이미 방어적이므로 이번
작업에서는 확인·회귀 테스트 보강만 합니다.

---

## 2. 범위

- `useResearchView`가 `research-summary` 404(`RESEARCH_SUMMARY_NOT_FOUND`)를 catch해 `null`로
  처리하고, 나머지 조회는 정상 진행한다(페이지 크래시 방지).
- `adaptResearchDetail`이 `summary` 부재를 null-safe하게 처리하고, `briefing`을 nullable로 노출한다.
- briefing 카드가 저장본 부재 시 빈 상태(생성 전 안내 + 생성 버튼)를 렌더한다.
- `POST .../refresh` 연동 mutation 훅을 추가하고, 생성 버튼의 로딩·에러 상태를 처리한다. 성공 시
  리서치 상세 쿼리를 무효화해 실제 요약과 갱신 시각을 다시 렌더한다.
- 리서치 큐의 nullable stance/headline 경로를 확인하고 회귀 테스트를 보강한다.
- 관련 mock(`src/shared/mock`)과 어댑터·쿼리 테스트를 갱신한다.

## 3. 비포함

- briefing 카드의 레이아웃·디자인 변경(빈 상태·버튼 추가 외).
- BE 계약 자체의 변경.
- stance/counter points/key risks 섹션의 독립적 빈 상태 재설계(기존 fallback 유지).
- 요약 이력·버전 표시(최신 1행만 유지하는 BE 계약을 따른다).

---

## 4. 계약 (BE #322 기준)

| 메서드 | 경로 | 응답 | FE 처리 |
| --- | --- | --- | --- |
| `GET` | `/assets/{id}/research-summary` | `200 ResearchSummaryResponse` / `404 RESEARCH_SUMMARY_NOT_FOUND` | 404는 `null`로 흡수 |
| `POST` | `/assets/{id}/research-summary/refresh` | `200 ResearchSummaryResponse` (동일 envelope) | 생성 트리거, 성공 시 상세 재조회 |

- `created_at`은 저장 행의 마지막 생성 시각이다(기존 `formatKstDateTime` 표기 유지).
- `404 ASSET_NOT_FOUND`는 기존 자산 조회 실패 경로와 동일하게 전파한다(요약 부재와 구분).

---

## 5. 구현 스켈레톤

### 5.1 `src/features/research/queries.ts`

- `fetchResearchSummary(assetId): Promise<ResearchSummaryDto | null>` (신설) — `apiGet` 호출을
  `try/catch`로 감싸 `ApiError.code === 'RESEARCH_SUMMARY_NOT_FOUND'`이면 `null` 반환, 그 외는
  재던짐. `fetchLatestThesis` 패턴을 따른다.
- `useResearchView` — `Promise.all`의 research-summary 항목을 `fetchResearchSummary(assetId)`로 교체.
- `useRefreshResearchSummary(symbol, assetId)` (신설) — `useMutation`으로 `apiPost`(`/assets/{id}/research-summary/refresh`)
  호출, `onSuccess`에서 `['research', normalizedSymbol]` 무효화. `apiPost`는 이미
  `src/shared/api/client`에 존재하므로 그대로 사용한다.

### 5.2 `src/features/research/adapters.ts`

- `adaptResearchDetail(detail, summary: ResearchSummaryDto | null, checklist, thesis)` — `summary`를
  nullable로 받는다. `summary`가 `null`이면:
  - `briefing`: `null`
  - `stance`: `'판단 보류'`(기존 빈 stance와 동일 fallback), `stanceConfidence/stanceComment/confidenceBasis`: `null`
  - `counterPoints`: `[]`, `keyRisks`: `[]`
  - 기존 `summary.field ?? default` 접근을 `summary?.field ?? default`로 일괄 보정.
- `ResearchView.briefing` 타입을 `ResearchBriefing | null`로 변경(별도 인터페이스로 분리 권장).

### 5.3 `src/pages/ui/ResearchPage.tsx`

- briefing 카드 — `research.briefing`이 `null`이면 `EmptyState`(제목·안내)와 생성 버튼(`Button`)을
  렌더한다. 값이 있으면 기존 렌더 유지.
- 생성 버튼 — `useRefreshResearchSummary`의 `mutate` 호출, `isPending`이면 로딩 문구/비활성,
  `isError`면 에러 문구. 저장본이 이미 있을 때의 "재생성" 진입점은 이번 범위에서 빈 상태 카드에만
  둔다(카드 헤더 재생성 버튼은 비포함).
- `갱신 {research.briefing.createdAt}`는 `briefing`이 있을 때만 렌더(null 접근 제거).

### 5.4 mock·테스트

- `src/shared/mock` — 저장본 부재(briefing null) 시나리오를 표현할 수 있도록 mock을 보정한다.
- 어댑터 테스트 — `summary=null`에서 briefing null·파생 필드 fallback 확인.
- 쿼리 테스트 — `RESEARCH_SUMMARY_NOT_FOUND` 404가 페이지를 깨지 않고 briefing null로 흡수되는지,
  refresh mutation 성공 시 재조회가 트리거되는지.
- 큐 회귀 테스트 — nullable stance/headline 항목이 예외 없이 렌더되는지.

---

## 6. Test / Verification

- 저장본 없는 종목: briefing 빈 상태 + 생성 버튼 렌더, 다른 섹션(가격·검토 체크리스트 등) 정상.
- 생성 버튼: 로딩·에러 상태, 성공 후 실제 요약·갱신 시각 렌더.
- 404가 리서치 상세 전체를 에러로 만들지 않음.
- 큐: nullable stance/headline 회귀 없음.
- `pnpm run format:check` / `pnpm run typecheck` / `pnpm run lint` / `pnpm run test`
