# Codex Handoff Task

## Source Issue

JongEunLee310/project_stock_frontend#267 — FE: 예상 자금 흐름 전망·시나리오 위젯 (에픽 #198 3차).
설계문서: `docs/designs/198-news-insights.md`. BE 계약: `project_stock`의
`GET /api/v1/news-insights/fund-flow-outlook`·`/topics/{id}/scenarios`(dev 머지 완료, PR #384).

## Task Summary

개요 "예상 자금 흐름"(§3.6)과 토픽 상세 "예상 자금 흐름 시나리오"(§5.9) placeholder 두 자리를
실데이터로 교체한다. 자금 흐름은 확정 예측이 아니라 방향·수준·범위·가중치로만 표기한다.

## Goal

- 개요 페이지의 "예상 자금 흐름" placeholder를 `/fund-flow-outlook` 위젯으로 교체한다.
- 토픽 상세 페이지의 "예상 자금 흐름 시나리오" placeholder를 `/topics/{id}/scenarios` 위젯으로
  교체한다(낙관/기준/보수 3 시나리오 카드).
- 확정 예측처럼 표기하지 않는다("유입 가능성: 높음" 수준), 가중치는 "현재 근거 기준"으로 표기하고
  통계 확률로 과표현하지 않는다.
- 분석 버전·데이터 신선도(as_of)를 표기한다.
- 두 패널은 독립 query·부분 실패(loading·error·empty).

## Background

- 두 placeholder 위치:
  - 개요 `src/pages/ui/NewsInsightsOverviewPage.tsx` — `plannedPanels` 배열의 `fund-flow-outlook`
    (예상 자금 흐름, #267). 배열에서 제거하고 실제 위젯 배치(나머지 placeholder 유지).
  - 토픽 상세 `src/pages/ui/TopicInsightDetailPage.tsx` — `plannedPanels.fundFlowScenario`
    (예상 자금 흐름 시나리오, #267). 제거하고 실제 위젯 배치.
- FE 데이터 패턴: `src/features/news-insights/`(dto·adapters·queries)에 두 query
  (`useNewsFundFlowOutlookQuery()`·`useNewsTopicScenariosQuery(topicId)`, 후자는 `enabled` 가드)를
  추가한다. enum 라벨/톤은 기존 presentation 맵 재사용/확장.
- **BE S1 주의**: 토픽에 시나리오 데이터가 없으면 BE가 500을 반환할 수 있다(미분석 토픽). query 오류를
  패널 error 상태로 격리해 페이지 전체를 깨지 않게 한다(부분 실패). 400/500/404 모두 error 처리.
- **숫자만 두지 말고 설명 병기**(스펙 §10): 방향·수준에 근거 문장(key_assumptions·risk_factors)을
  함께 노출. 색만으로 상태 표현 금지 — 텍스트 배지 병기.

### BE 응답 계약 (ApiResponse envelope, snake_case, 점수 0~1 float)

- `GET /fund-flow-outlook` → `FundFlowOutlookResponse`:
  `as_of`·`analysis_version`·`items`[{`sector`·`direction`(INFLOW|OUTFLOW|NEUTRAL)·
  `likelihood`(LOW|MEDIUM|HIGH)·`estimated_range`(str|null)·`horizon`(str)·`confidence`·
  `key_assumptions`[]·`risk_factors`[]}].
- `GET /topics/{id}/scenarios` → `FundFlowScenariosResponse`:
  `topic_id`·`analysis_version`·`as_of`·`scenarios`[3]{`scenario_kind`(OPTIMISTIC|BASE|
  CONSERVATIVE)·`weight`(0~1)·`expected_flow_direction`(INFLOW|OUTFLOW|NEUTRAL)·
  `key_assumptions`[]·`benefiting_sectors`[]·`risk_sectors`[]·`related_symbols`[]·
  `invalidation_conditions`[]}.

## Implementation Scope

- `src/features/news-insights/dto.ts`·`adapters.ts`·`queries.ts` — 두 dto·adapter
  (`adaptNewsFundFlowOutlook`·`adaptNewsTopicScenarios`)·query 추가. FundFlowDirection·
  FlowLikelihood·ScenarioKind presentation 맵.
- `src/widgets/FundFlowOutlookPanel/`(신규) — 섹터별 방향·유입 가능성 수준·예상 범위·신뢰도·주요
  근거(가정·위험). 확정 예측 아닌 "가능성" 표기.
- `src/widgets/FundFlowScenarioPanel/`(신규) — 낙관/기준/보수 3 시나리오 카드. 가중치("근거 기준")·
  가정·수혜/위험 섹터·관련 종목·자금 방향·무효화 조건. 관련 종목 칩은 필요 시 `/research/:symbol`
  링크(선택).
- `src/pages/ui/NewsInsightsOverviewPage.tsx` — fund-flow-outlook placeholder → `FundFlowOutlookPanel`,
  `plannedPanels`에서 항목 제거.
- `src/pages/ui/TopicInsightDetailPage.tsx` — fundFlowScenario placeholder → `FundFlowScenarioPanel`
  (topicId 전달), `plannedPanels.fundFlowScenario` 제거.

## Out of Scope

- 설명·반대 관점(#268)·캘린더·파이프라인(#269)·액션(#270) 등 나머지 3차. 폴링(#266).
- 새 npm 의존성. BE 계약 변경.

## Protected Files

없음.

## Requirements

- 확정 예측 표기 금지 — 방향·수준·범위·가중치로만. 가중치는 "현재 근거 기준", 통계 확률 과표현 금지.
- 숫자에 근거 문장 병기(가정·위험). 색만으로 상태 표현 금지 — 텍스트 배지 병기.
- 분석 버전(analysis_version)·데이터 신선도(as_of) 표기.
- 시나리오는 항상 3종(낙관/기준/보수) 카드로. BE가 3종을 반환하지 않거나 오류면 패널 error/empty.
- 두 패널 독립 query·부분 실패(미분석 토픽 500 격리). BE 계산값 그대로 렌더, 수치 창작 금지.

## Test Requirements

- 두 query·adapter 단위 테스트(성공·오류·빈 데이터).
- 두 위젯 테스트: outlook 섹터 항목·근거 병기·가능성 표기, scenario 3카드·가중치·무효화 조건.
- 개요·토픽 상세 페이지 테스트: placeholder → 라이브 교체, 나머지 placeholder 유지, 부분 실패(오류
  격리).
- 기존 테스트를 약화하지 않는다.

## Verification Commands

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Documentation Impact

- 설계문서 `docs/designs/198-news-insights.md` 화면-API 매핑(자금 흐름 3차)과 일치. 이탈 시 문서 먼저
  갱신.

## ADR Need

불요. 기존 FSD·query 패턴을 따르는 3차 위젯 추가.

## Failure Record Need

불요.

## Risk Level

Medium — 확정 예측 오인 방지 표기, 미분석 토픽 500 격리, 3 시나리오 카드 구성이 핵심 리스크.

## Expected Output

- features 두 query/adapter·2개 위젯·두 페이지 교체·테스트 커밋(한국어 메시지). PR·push는 하지 마라.
- 검증 5종 결과 보고.

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
- 현재 체크아웃된 브랜치(feat/267-fund-flow-scenarios)를 유지한다(자체 브랜치 생성·push·PR 금지).
