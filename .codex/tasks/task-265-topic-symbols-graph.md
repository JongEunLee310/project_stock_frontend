# Codex Handoff Task

## Source Issue

JongEunLee310/project_stock_frontend#265 — FE: 종목 민감도·키워드 관계망 위젯 (에픽 #198 2차).
설계문서: `docs/designs/198-news-insights.md`. BE 계약: `project_stock`의
`GET /api/v1/news-insights/topics/{id}/symbols`·`/topics/{id}/graph`(dev 머지 완료).

## Task Summary

토픽 상세 페이지(`/news/topics/:topicId`)의 placeholder 두 자리를 실데이터로 교체한다: 키워드
관계망(`/graph`)과 종목 민감도(`/symbols`). 라운드2 셸에서 이 자리는 `PlannedPanelCard`
placeholder다.

## Goal

- 키워드 관계망 패널이 `GET /topics/{id}/graph`의 nodes·edges를 Cytoscape로 렌더하고, 노드
  클릭 시 관련 이벤트·종목을 표면화한다(장식용 그래프 금지).
- 종목 민감도 패널이 `GET /topics/{id}/symbols`를 표로 렌더하며 **노출도와 영향 방향을 시각적으로
  분리**한다.
- 두 패널은 독립 query·부분 실패 처리(loading·error·empty).

## Background

- 토픽 상세 페이지 `src/pages/ui/TopicInsightDetailPage.tsx`에 `plannedPanels.keywordGraph`
  (키워드 관계망)와 `plannedPanels.investorReaction`(투자자 반응 + supportingLabel 종목 민감도)
  placeholder가 있다. 이번 작업은:
  - `keywordGraph` placeholder → 실제 `TopicKeywordGraph` 위젯으로 교체.
  - 종목 민감도는 **별도 `TopicSymbolSensitivity` 위젯**으로 신설해 배치하고, `investorReaction`
    placeholder는 **투자자 반응(#264)만** 남기도록 `supportingLabel`을 제거하고 issue를 `#264`로
    좁힌다. (투자자 반응 실데이터는 #264에서 연동)
- **키워드 관계망은 개요 토픽 맵(`src/widgets/TopicMap/`)의 Cytoscape lazy-load 패턴을 재사용**한다
  (`cytoscape`·`react-cytoscapejs` 이미 설치, **새 의존성 금지**). 개요 맵은 TOPIC+KEYWORD 혼합이고
  이 그래프는 topic 한정 KEYWORD 노드만이다.
- FE 데이터 패턴: `src/features/news-insights/`(dto·adapters·queries)에 두 query 추가(기존 구조
  재사용). HTTP `apiGet`, enum 라벨/톤은 기존 presentation 맵(`sentimentPresentations` 등) 재사용.

### BE 응답 계약 (ApiResponse envelope, snake_case, 점수 0~1 float)

- `GET /topics/{id}/symbols` → `TopicSymbolSensitivityItem[]`:
  `symbol`·`exposure_score`·`impact_direction`(POSITIVE|NEUTRAL|NEGATIVE|MIXED)·
  `relationship`(DIRECT|SUPPLY_CHAIN|COMPETITOR|CUSTOMER)·`valuation_burden`(LOW|MEDIUM|HIGH|null)·
  `portfolio_weight`(0~1|null)·`current_signal`(WATCH|RISK_ALERT|THESIS_BROKEN|BUY_CANDIDATE|
  SELL_REVIEW|OVERHEATED|null).
- `GET /topics/{id}/graph` → `TopicGraphResponse`:
  `nodes`[{`id`·`label`·`type`("KEYWORD")·`mention_count`·`sentiment_score`·`related_event_ids`[]·
  `related_symbols`[]}]·`edges`[{`source`·`target`·`strength`·`cooccurrence_count`}].

## Implementation Scope

- `src/features/news-insights/dto.ts`·`adapters.ts`·`queries.ts` — 두 query
  (`useNewsTopicSymbolsQuery(topicId)`·`useNewsTopicGraphQuery(topicId)`) dto·adapter·query 추가.
  enum presentation 맵 재사용/확장(relationship·valuation_burden·signal 라벨/톤 추가).
- `src/widgets/TopicKeywordGraph/`(신규) — Cytoscape 렌더. 노드 크기=mention_count, 색=감성,
  edge 굵기=strength. **연관 강도(선 굵기)와 감성(색/배지)을 별도 표현.** 노드 클릭 시 선택 노드의
  `related_symbols`·`related_event_ids`를 패널 내 목록으로 표면화(장식 금지). 언마운트 시 cleanup.
- `src/widgets/TopicSymbolSensitivity/`(신규) — 표. 컬럼: 종목·노출도·영향 방향·관계 유형·밸류 부담·
  포트폴리오 비중·현재 시그널. **노출도와 영향 방향을 다른 시각 요소로 분리**(같은 색/배지로 뭉치지
  않음). null 필드(밸류 부담·비중·시그널)는 "—"·"미보유" 등으로 명시.
- `src/pages/ui/TopicInsightDetailPage.tsx` — keywordGraph placeholder → `TopicKeywordGraph`,
  종목 민감도 위치에 `TopicSymbolSensitivity` 배치, `investorReaction` placeholder 정리(#264만).

## Out of Scope

- 투자자 반응(#264 /investor-flows) 실연동. 자금 흐름·설명 등 3차 패널. 이벤트 상세(#204).
- 개요 토픽 맵(#202) 변경. 새 npm 의존성. BE 계약 변경.

## Protected Files

없음.

## Requirements

- 노출도(exposure_score)와 영향 방향(impact_direction)을 시각적으로 분리(스펙 §5.8).
- 키워드 관계망은 연관 강도와 감성을 별도 표현, 노드 상호작용으로 관련 이벤트·종목 표면화(§5.5).
- 색상만으로 상태 표현 금지 — 관계 유형·밸류 부담·시그널·감성 텍스트 배지 병기.
- BE가 계산한 nodes·edges·민감도를 그대로 렌더(FE 재계산·수치 창작 금지).
- 두 패널 독립 query·부분 실패·loading·error·empty 처리. Cytoscape 언마운트 cleanup.

## Test Requirements

- 두 query·adapter 단위 테스트(성공·오류·빈 데이터·null 필드).
- `TopicSymbolSensitivity` 위젯 테스트: 컬럼 렌더·null 표기·노출도/방향 분리.
- `TopicKeywordGraph` 위젯 테스트: nodes·edges 렌더, 노드 클릭 시 관련 목록 표면화(Cytoscape는 필요
  시 mock).
- 페이지 테스트: 두 패널 라이브 렌더 + `investorReaction` placeholder 유지, 부분 실패 격리.
- 기존 테스트를 약화하지 않는다.

## Verification Commands

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Documentation Impact

- 설계문서 `docs/designs/198-news-insights.md` 화면-API 매핑(종목 민감도·키워드 관계망 2차)과 일치.
  이탈 시 문서 먼저 갱신.

## ADR Need

불요. 기존 FSD·query·Cytoscape 패턴을 따르는 2차 위젯 추가.

## Failure Record Need

불요.

## Risk Level

Medium — Cytoscape 생명주기·노드 상호작용, 민감도 표의 노출도/방향 분리와 null 처리가 핵심 리스크.

## Expected Output

- features 두 query/adapter·2개 위젯·페이지 교체·테스트 커밋(한국어 메시지). PR·push는 하지 마라.
- 검증 5종 결과 보고.

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
- 현재 체크아웃된 브랜치(feat/265-topic-symbols-graph)를 유지한다(자체 브랜치 생성·push·PR 금지).
