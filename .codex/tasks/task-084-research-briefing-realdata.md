# Codex Handoff Task

## Source Issue

이슈 #219 — 리서치 AI briefing 실데이터 연결. 설계: `docs/designs/219-research-briefing-realdata.md`
(먼저 전체를 읽는다 — §5 구현 스켈레톤이 확정 스펙이다). BE 계약은
`../project_stock/docs/api/frontend-api-spec.md`의 research-summary 절을 따른다.

## Task Summary

BE #322에서 리서치 요약이 mock에서 LLM 실생성·저장으로 전환되며 계약이 바뀌었다.
`GET /assets/{id}/research-summary`가 저장본 부재 시 `404 RESEARCH_SUMMARY_NOT_FOUND`를
반환하고, `POST /assets/{id}/research-summary/refresh`가 신설됐다. FE가 (1) 404로 인한 리서치
상세 페이지 크래시를 막고, (2) 저장본 부재 시 briefing 빈 상태 + 생성 버튼을 렌더하며,
(3) 재생성 mutation으로 실제 요약을 채우도록 연결한다.

## Goal

- 저장본이 없는 종목에서 리서치 상세 페이지가 크래시하지 않고, briefing 카드가 빈 상태(안내 +
  생성 버튼)를 렌더한다. 가격·검토 체크리스트 등 다른 섹션은 정상 동작한다.
- 생성 버튼을 누르면 `refresh`가 호출되고(로딩·에러 상태 처리), 성공 시 실제 요약과 갱신 시각이
  렌더된다.
- 저장본이 있는 종목은 기존 briefing 렌더가 그대로 유지된다.
- 리서치 큐의 nullable stance/headline 항목이 예외 없이 렌더된다.

## Implementation Scope

설계 §5 그대로:

- `src/features/research/queries.ts`
  - `fetchResearchSummary(assetId): Promise<ResearchSummaryDto | null>` 신설 — `apiGet` 호출을
    try/catch로 감싸 `ApiError.code === 'RESEARCH_SUMMARY_NOT_FOUND'`이면 `null` 반환, 그 외 재던짐
    (`fetchLatestThesis` 패턴).
  - `useResearchView`의 `Promise.all`에서 research-summary 항목을 `fetchResearchSummary`로 교체.
  - `useRefreshResearchSummary(symbol, assetId)` 신설 — `useMutation` + `apiPost`
    (`/assets/{assetId}/research-summary/refresh`), `onSuccess`에서 `['research', normalizedSymbol]`
    무효화. `apiPost`는 `src/shared/api/client`에 이미 존재한다.
- `src/features/research/adapters.ts`
  - `adaptResearchDetail`의 `summary` 인자를 `ResearchSummaryDto | null`로 변경. `summary`가 null이면
    briefing=null, stance='판단 보류', stanceConfidence/stanceComment/confidenceBasis=null,
    counterPoints=[], keyRisks=[]. 기존 `summary.field` 접근을 `summary?.field ?? default`로 보정.
  - `ResearchView.briefing`을 `ResearchBriefing | null`로 변경(briefing 형태를 별도 인터페이스로 분리).
- `src/pages/ui/ResearchPage.tsx`
  - briefing 카드: `research.briefing`이 null이면 `EmptyState` + 생성 `Button`, 아니면 기존 렌더.
    `갱신 {createdAt}`는 briefing이 있을 때만 렌더.
  - 생성 버튼: `useRefreshResearchSummary`의 `mutate`, `isPending` 로딩/비활성, `isError` 에러 문구.
- `src/shared/mock` — briefing null(저장본 부재) 시나리오 표현 보정.
- 테스트 — 어댑터(summary=null), 쿼리(404 흡수·refresh 재조회), 큐 회귀(nullable stance/headline).

## Out of Scope

- BE 수정.
- briefing 카드 레이아웃·디자인 변경(빈 상태·버튼 추가 외).
- 저장본이 있을 때의 카드 헤더 재생성 버튼(빈 상태 카드의 생성 버튼만 추가).
- stance/counter points/key risks 섹션의 독립 빈 상태 재설계(기존 fallback 유지).

## Protected Files

없음.

## Requirements

이슈 요구 불릿을 수용 기준으로 번역했다. 설계에서 확인한 계약은 다음과 같다.

1. `GET /assets/{id}/research-summary` 404 `RESEARCH_SUMMARY_NOT_FOUND`가 `null`로 흡수되어 리서치
   상세 페이지가 크래시하지 않는다. `404 ASSET_NOT_FOUND`는 흡수하지 않고 기존대로 전파한다(요약
   부재와 자산 부재를 구분).
2. 저장본 부재 시 briefing 카드가 빈 상태(안내 문구 + 생성 버튼)를 렌더한다.
3. `POST .../refresh` 성공 시 `['research', symbol]` 무효화로 실제 요약과 갱신 시각이 렌더된다.
   버튼은 `isPending`·`isError` 상태를 표시한다.
4. `adaptResearchDetail`이 `summary=null`에서 briefing null과 파생 필드 fallback을 안전하게 반환한다.
5. 리서치 큐의 nullable stance/headline이 예외 없이 렌더된다(기존 `toResearchQueueView` 경로 확인).

## Test Requirements

- 어댑터: `adaptResearchDetail(detail, null, checklist, thesis)`가 briefing=null,
  stance='판단 보류', counterPoints=[], keyRisks=[]를 반환.
- 쿼리: `useResearchView`가 research-summary 404를 briefing null로 흡수하고 나머지 데이터는 렌더;
  refresh mutation 성공 시 research 쿼리 무효화(재조회) 발생.
- 페이지/컴포넌트: briefing null이면 빈 상태와 생성 버튼 노출, 저장본 있으면 기존 briefing 렌더.
- 큐: nullable stance/headline 항목 렌더 회귀 테스트.

## Verification

- `pnpm run format:check`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm run test`

## Documentation Impact

- FE 문서 갱신은 이 설계·핸드오프 문서로 한정한다(별도 spec 파일 없음, BE spec은 이미 #322에서 갱신됨).

## ADR Need

불필요. 기존 쿼리·어댑터·페이지 패턴 안에서의 계약 대응이며 새 아키텍처 결정이 없다.

## Failure Record Need

불필요. 신규 계약 대응 작업이며 과거 실패의 재작업이 아니다.

## Risk Level

Medium — `useResearchView`의 `Promise.all`과 `adaptResearchDetail` 시그니처를 건드리므로, null-safe
처리 누락 시 저장본 있는 기존 종목의 렌더까지 회귀할 수 있다. 어댑터·쿼리 테스트로 양쪽(저장본
있음/없음)을 모두 고정한다.

## Expected Output

- 변경: `src/features/research/queries.ts`, `src/features/research/adapters.ts`,
  `src/pages/ui/ResearchPage.tsx`, `src/shared/mock` 관련 파일, 관련 테스트 파일.
- PR 본문에 Verification 4종 실행 결과와, 저장본 있음/없음 두 경로가 모두 렌더되는지 확인 결과를 기록.

## Rules

- 최신 `main`에서 만든 현재 브랜치(`feat/219-research-briefing-realdata`)를 그대로 유지한다. 다른
  브랜치로 전환하거나 `main`에 직접 커밋하지 않는다.
- 커밋 메시지는 한국어 `type: 본문` 형식.
- 설계 문서·이 태스크 문서·구현이 같은 PR에 함께 실린다.
- 스코프 외 파일을 변경하지 않는다. 특히 briefing 외 무관한 UI를 건드리지 않는다.
- 검증 명령을 임의로 생략하거나 완화하지 않는다. prettier(`format:check`) 포함 4종 모두 통과시킨다.
