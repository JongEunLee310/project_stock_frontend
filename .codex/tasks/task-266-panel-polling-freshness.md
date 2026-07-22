# Codex Handoff Task

## Source Issue

JongEunLee310/project_stock_frontend#266 — FE: 패널별 폴링 갱신 배선 (에픽 #198 2차, SSE 전 단계).
설계문서: `docs/designs/198-news-insights.md`. 갱신 주기 가이드: 스펙 §6.4.

## Task Summary

뉴스·공시 인사이트 전 패널에 **차등 폴링 갱신**을 배선하고, **패널별 데이터 신선도("N분 전")**를
개별 표기하며, 백그라운드 refetch 시 로딩 점멸을 최소화한다. 전 패널 동일 주기·단일 동기화 표시는
금지한다.

## Goal

- 각 news-insights query에 패널 성격에 맞는 `refetchInterval`을 차등 설정한다.
- 각 라이브 패널이 자기 query의 `dataUpdatedAt` 기준 "N분 전" 신선도를 개별 표시한다(전체 단일
  "동기화 완료" 표시 금지, §6.4).
- 백그라운드 refetch 중 이전 데이터를 유지해 점멸을 최소화한다(`placeholderData: keepPreviousData`).

## Background

- 대상 query는 `src/features/news-insights/queries.ts`의 15개다(overview·calendar·agent-runs·
  investor-flows·fund-flow-outlook·topic-scenarios·events(infinite)·event-detail·topic-map·
  topic-detail·topic-symbols·topic-graph·topic-trend·topic-evidence(infinite)·topic-explanation).
- react-query v5(`@tanstack/react-query` ^5.101). 점멸 최소화는 `placeholderData: keepPreviousData`
  (동일 패키지에서 import). 신선도는 각 query 결과의 `dataUpdatedAt`(ms) 사용.
- **신규 유틸**: `src/shared/lib/format`에 `formatRelativeTime(updatedAtMs: number, now?: number)`
  추가("방금 전"·"N분 전"·"N시간 전"·"N일 전" 수준, 한국어). `src/shared/lib/format/index.ts`
  재노출.
- **신규 공용 컴포넌트**: `src/shared/ui`에 작은 `PanelFreshness`(props `updatedAt?: number`) — "N분
  전" 텍스트 + 접근성 라벨(`<time>` 또는 aria-label). 값이 없으면 렌더 안 함. 색만으로 표현 금지.

### 차등 refetch 주기 (상수로 중앙화 — queries.ts 상단 named const)

- 이벤트 피드(events): 45s.
- 상단 요약·브리핑(overview): 60s. (요약·브리핑이 같은 query라 60s 공유 — 브리핑은 더 자주
  갱신돼도 무해.)
- 에이전트 파이프라인(agent-runs): 60s. (처리 현황 — 자주)
- 토픽 맵(topic-map): 5min. (기존 staleTime 유지 + refetchInterval 추가)
- 투자자 수급(investor-flows): 30min.
- 자금 흐름 전망(fund-flow-outlook): 30min.
- 캘린더(calendar): 30min.
- 토픽 상세·추이·근거·민감도·관계망·시나리오·설명(topic-detail/trend/evidence/symbols/graph/
  scenarios/explanation): 5min.
- 이벤트 상세(event-detail): 5min.

주기는 상수(`refetchIntervals` 등)로 모아 각 query에서 참조한다. 매직 넘버 산재 금지.

## Implementation Scope

- `src/features/news-insights/queries.ts` — 차등 `refetchInterval` 상수·적용, 목록/상세/무한 query에
  `placeholderData: keepPreviousData`(적절한 곳). 기존 `enabled` 가드·`select`·queryKey 유지.
- `src/shared/lib/format/datetime.ts`(+ `index.ts`) — `formatRelativeTime` 추가.
- `src/shared/ui/` — `PanelFreshness` 컴포넌트(+ `index.ts` 재노출·타입).
- 각 라이브 패널에 신선도 표기:
  - **자기 query를 내부 호출하는 위젯**(TopicKeywordGraph·TopicSymbolSensitivity·InvestorFlowPanel·
    FundFlowOutlookPanel·FundFlowScenarioPanel·InsightExplanationPanel·MarketEventTimeline·
    AgentPipelinePanel): 각 query hook의 `dataUpdatedAt`을 읽어 `PanelFreshness`로 표시.
  - **page가 query를 소유해 props로 data를 받는 위젯**(InsightSummaryCards·RealtimeEventFeed·
    AgentBriefing·TopicMap·TopicSummaryHeader·TopicInsightSummary·TopicTrendChart·
    TopicEvidenceList·CounterViewPanel): page(`NewsInsightsOverviewPage`·`TopicInsightDetailPage`)에서
    해당 query의 `dataUpdatedAt`을 `updatedAt` prop으로 내려 위젯 헤더에 `PanelFreshness` 표시.
- 기존 개요/토픽 상세 페이지의 단일 동기화/기준 시각 표시가 있으면 패널별 신선도로 대체·정리(전 화면
  단일 표시 금지).

## Out of Scope

- SSE 스트림 연결(별도 이슈, BE 스트림 계약 선행). BE 계약 변경. 신규 query 추가.
- 사용자 조절 가능한 갱신 주기 UI. 새 npm 의존성.

## Protected Files

없음.

## Requirements

- 패널별 차등 주기(전 패널 동일 주기 금지). 주기 상수 중앙화.
- 패널별 "N분 전" 개별 표기(전체 단일 "동기화 완료" 표시 금지). `dataUpdatedAt` 기준.
- 백그라운드 refetch 점멸 최소화(`keepPreviousData`). 기존 loading·error·empty·부분 실패 유지.
- 색만으로 상태 표현 금지 — 신선도는 텍스트. 접근성 라벨 제공.
- BE 계산값·타임스탬프 그대로 사용, 수치 창작 금지.

## Test Requirements

- `formatRelativeTime` 단위 테스트(방금/분/시간/일 경계, 미래·NaN 방어).
- `PanelFreshness` 테스트(값 있음/없음 렌더).
- query 테스트: 대표 query에 refetchInterval·keepPreviousData 설정이 반영됐는지(설정값 확인 수준).
- 대표 위젯/페이지 테스트: 신선도 표기 노출(옵션 prop 추가로 기존 테스트 깨지지 않게 mock 갱신).
- 기존 테스트를 약화하지 않는다(대량 위젯 prop 추가 시 스냅샷·mock 동기화).

## Verification Commands

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Documentation Impact

- 설계문서 `docs/designs/198-news-insights.md` 공통 UI 지침(갱신 주기 차등·패널별 신선도)과 일치. 이탈
  시 문서 먼저 갱신.

## ADR Need

불요. 기존 react-query 패턴 위의 폴링·신선도 배선.

## Failure Record Need

불요.

## Risk Level

Medium~High — 15개 query와 다수 위젯을 건드리는 교차 작업. prop 추가에 따른 기존 테스트 동기화,
자기완결/prop-driven 위젯 혼재, 주기 상수 일관성이 핵심 리스크. 한 패널이라도 단일 동기화 표시로
남지 않게 주의.

## Expected Output

- refetchInterval 상수·적용, keepPreviousData, `formatRelativeTime`·`PanelFreshness`, 전 라이브 패널
  신선도 배선·테스트 커밋(한국어 메시지). PR·push는 하지 마라.
- 검증 5종 결과 보고. 어떤 패널에 어떤 주기·신선도를 배선했는지 요약 보고.

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
- 현재 체크아웃된 브랜치(feat/266-panel-polling-freshness)를 유지한다(자체 브랜치 생성·push·PR 금지).
