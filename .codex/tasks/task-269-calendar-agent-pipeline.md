# Codex Handoff Task

## Source Issue

JongEunLee310/project_stock_frontend#269 — FE: 이벤트 캘린더·에이전트 파이프라인 패널 (에픽 #198 3차).
설계문서: `docs/designs/198-news-insights.md`. BE 계약: `project_stock`의
`GET /api/v1/news-insights/calendar`·`/agent-runs`(dev 머지 완료).

## Task Summary

개요 페이지의 마지막 placeholder 두 자리(이벤트 타임라인·에이전트 파이프라인)를 실데이터로
교체한다. 타임라인은 향후 검증 이벤트를 시간순으로, 파이프라인은 처리 단계·집계 수치를 보인다.

## Goal

- 개요 "이벤트 타임라인" placeholder를 `/calendar` 위젯으로 교체한다(향후 이벤트 시간순, 토픽 연결
  표시, D-N 카운트다운).
- 개요 "에이전트 파이프라인" placeholder를 `/agent-runs` 위젯으로 교체한다(처리 단계 시각화 + 집계
  수치·지연·분석 버전).
- **검증 가능한 처리 단계·집계 수치만** 노출한다(비공개 추론 과정 노출 금지, 스펙 §3.8).
- 두 패널은 독립 query·부분 실패(loading·error·empty).

## Background

- 개요 `src/pages/ui/NewsInsightsOverviewPage.tsx`의 `plannedPanels` 배열에 `event-timeline`·
  `agent-pipeline` 두 항목이 남아 있다. 두 항목을 제거하고 실제 위젯을 배치한다. 제거 후
  `plannedPanels`가 비면 "단계별 확장 패널" 섹션 자체를 제거한다(빈 섹션 남기지 말 것).
- FE 데이터 패턴: `src/features/news-insights/`(dto·adapters·queries)에 두 query
  (`useNewsCalendarQuery({ market, window })`·`useNewsAgentRunsQuery()`)를 추가한다. enum 라벨/톤은
  기존 presentation 맵 재사용/확장(MarketEventKind·AgentStage·AgentRunStatus 라벨).
- 타임라인 토픽 연결: `related_topic_ids` → `/news/topics/:topicId` 링크. D-N은 `scheduled_at`과
  현재 시각 차이로 FE 계산(단순 일수 표시 — 없는 데이터가 아니라 파생 표기).
- **숫자만 두지 말고 설명 병기**, 색만으로 상태 표현 금지 — 텍스트 배지 병기.

### BE 응답 계약 (ApiResponse envelope, snake_case, 점수 0~1 float)

- `GET /calendar?window={w}&market={m}&topic_id={id}` — **window·market 필수**(window 패턴
  `^[1-9]\d*[hd]$`, 예 "30d"), topic_id optional(이번엔 미사용). 응답 `list[CalendarItem]`:
  [{`scheduled_at`·`event_kind`(EARNINGS|IR_EVENT|POLICY|RATE_DECISION|SHAREHOLDER_MEETING|
  PRODUCT_EVENT|REGULATION|LOCKUP_EXPIRY|OTHER)·`title`·`symbol`(str|null)·`market`(str|null)·
  `importance`·`related_topic_ids`[]}].
- `GET /agent-runs` — 파라미터 없음. 응답 `AgentRunsResponse`:
  `last_processed_at`·`processed_documents`·`extracted_events`·`active_topics`·
  `stages`[{`name`(COLLECT|NORMALIZE|EXTRACT|CLUSTER|SENTIMENT|IMPACT|LINK)·
  `status`(RUNNING|COMPLETED|DELAYED|FAILED)·`delayed`(bool)}]·`analysis_version`·`has_delay`(bool).

## Implementation Scope

- `src/features/news-insights/dto.ts`·`adapters.ts`·`queries.ts` — calendar·agent-runs dto·adapter
  (`adaptNewsCalendar`·`adaptNewsAgentRuns`)·query 추가. MarketEventKind·AgentStage·AgentRunStatus
  presentation 맵.
- `src/widgets/MarketEventTimeline/`(신규) — 향후 이벤트 시간순 목록. event_kind 배지·D-N·중요도·
  종목·토픽 연결(`/news/topics/:id`). 과거/미래 구분은 scheduled_at 기준.
- `src/widgets/AgentPipelinePanel/`(신규) — 7단계(수집→정규화→이벤트추출→토픽·감성→영향→연결) 시각화
  + 단계별 status·지연 배지, 집계(처리 문서·추출 이벤트·활성 토픽)·마지막 처리 시각·분석 버전·지연
  여부. 검증 가능한 수치·단계만.
- `src/pages/ui/NewsInsightsOverviewPage.tsx` — 두 placeholder를 위젯으로 교체, `plannedPanels`
  잔여 정리(빈 섹션 제거).

## Out of Scope

- 액션(#270)·폴링(#266). 토픽 상세 페이지 변경. calendar topic_id 필터 UI.
- 새 npm 의존성. BE 계약 변경. 비공개 추론 과정 노출.

## Protected Files

없음.

## Requirements

- 타임라인: 향후 이벤트 시간순, event_kind·중요도·종목·토픽 연결 표시. D-N 카운트다운(scheduled_at
  파생). 색만으로 표현 금지 — 텍스트 배지 병기.
- 파이프라인: 검증 가능한 처리 단계·집계 수치만. 단계 status·지연 배지, 분석 버전·마지막 처리 시각.
  비공개 추론 과정 노출 금지.
- 두 패널 독립 query·부분 실패(패널만 오류, 페이지 유지). BE 계산값 렌더, 수치 창작 금지.
- 개요 placeholder 전량 소진 시 "단계별 확장 패널" 섹션 제거.

## Test Requirements

- calendar·agent-runs query·adapter 단위 테스트(성공·오류·빈 데이터).
- `MarketEventTimeline` 테스트: 이벤트 항목·event_kind 배지·D-N·토픽 링크 네비게이션.
- `AgentPipelinePanel` 테스트: 단계 목록·status/지연 배지·집계 수치·분석 버전.
- 개요 페이지 테스트: 두 placeholder → 라이브 교체, 섹션 정리, 부분 실패 격리.
- 기존 테스트를 약화하지 않는다.

## Verification Commands

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Documentation Impact

- 설계문서 `docs/designs/198-news-insights.md` 화면-API 매핑(캘린더·파이프라인 3차)과 일치. 이탈 시
  문서 먼저 갱신.

## ADR Need

불요. 기존 FSD·query 패턴을 따르는 3차 위젯 추가.

## Failure Record Need

불요.

## Risk Level

Medium — 타임라인 D-N 파생·토픽 연결, 파이프라인 단계 시각화의 검증가능 수치 한정, 개요 섹션 정리에
따른 페이지 회귀가 핵심 리스크.

## Expected Output

- features 두 query/adapter·2개 위젯·개요 교체·테스트 커밋(한국어 메시지). PR·push는 하지 마라.
- 검증 5종 결과 보고.

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
- 현재 체크아웃된 브랜치(feat/269-calendar-agent-pipeline)를 유지한다(자체 브랜치 생성·push·PR 금지).
