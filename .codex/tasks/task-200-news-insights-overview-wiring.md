# Codex Handoff Task

## Source Issue

JongEunLee310/project_stock_frontend#200 — 뉴스·공시 개요 연결 (에픽 #198 1차).
설계문서: `docs/designs/198-news-insights.md`. BE 계약: `project_stock/docs/designs/307-news-intelligence.md` §4.1·§4.2 (dev 머지 완료).

## Task Summary

개요 셸(#199)의 로컬 mock을 실제 BE 계약(`GET /api/v1/news-insights/overview`·`/events`)
연동으로 교체한다. 패널별 독립 query와 부분 실패 처리를 적용한다. 실시간 갱신(폴링·SSE)은 범위 밖.

## Goal

- 상단 KPI 4종·AI 브리핑이 `GET /overview` 응답으로 렌더된다.
- 실시간 이벤트 피드가 `GET /events`(cursor pagination)로 렌더된다.
- 한 패널 API 오류가 페이지 전체를 깨지 않는다(패널별 loading·error 상태).

## Background

- FE 데이터 패턴: `src/features/<name>/`에 `dto.ts`(와이어 타입, FE는 `*Dto` 명명 사용)·
  `adapters.ts`(Dto→View 매핑)·`queries.ts`(react-query 훅) 구성. 기존 `src/features/research/`가
  대표 예시다. HTTP는 `src/shared/api/client.ts`의 `apiGet`, 오류는 `src/shared/api/envelope.ts`의
  `ApiError`, cursor 페이징은 `src/shared/api/paging.ts` 헬퍼를 재사용한다.
- react-query 훅·`queryClient`는 `src/shared/api/queryClient.ts`. queryKey 컨벤션은 기존 feature를
  따른다.
- BE 응답(공통 엔벨로프 `ApiResponse`): `/overview`는 `as_of`·`summary`(4종 각 `{count,change}`)·
  `briefing`{summary·highlights[{text·topic_id·evidence_count·evidence_event_ids}]·generated_at};
  `/events`는 cursor 피드로 item {id·event_type·document_type·symbol·title·summary·importance
  {level·score}·sentiment{direction·score}·source{name·reliability}·published_at·evidence_count·
  topic_ids}, meta는 cursor(next_cursor·has_more).
- #199에서 추가한 `NewsInsightsOverviewPage`·`InsightSummaryCards`·`RealtimeEventFeed`·
  `AgentBriefing` 위젯의 mock을 이 query 연동으로 교체한다.

## Implementation Scope

- `src/features/news-insights/dto.ts` — overview·events 와이어 타입.
- `src/features/news-insights/adapters.ts` — Dto→View 매핑(중요도·감성 분리 유지).
- `src/features/news-insights/queries.ts` — `useNewsOverviewQuery`·`useNewsEventsQuery`(cursor).
- `src/widgets/InsightSummaryCards`·`AgentBriefing` — overview query 연동, loading·error·empty 상태.
- `src/widgets/RealtimeEventFeed` — events query 연동(cursor), loading·error 상태.
- `src/pages/ui/NewsInsightsOverviewPage.tsx` — 패널별 독립 query 배선, 부분 실패 처리.

## Out of Scope

- 토픽 맵(#202)·토픽 상세(#203)·이벤트 상세(#204). 실시간 갱신(폴링·SSE). 2·3차 패널 placeholder는 유지.
- BE 계약 변경. 새 npm 의존성 추가.

## Protected Files

없음.

## Requirements

- 패널별 독립 query — 한 패널 오류가 다른 패널·페이지를 깨지 않는다(부분 실패, 설계 공통 지침).
- 이벤트 피드는 cursor pagination을 사용한다(`paging.ts` 재사용). offset 금지.
- 중요도(importance)와 감성(sentiment)을 별도 표기(뭉치지 않음).
- 브리핑 하이라이트의 근거 수(evidence_count)를 표기한다.
- View 어댑터는 BE 필드를 그대로 신뢰하지 말고 표시용으로 매핑(기존 adapters 패턴).
- 색상만으로 상태 표현 금지 — 텍스트 배지 병기(설계 공통 지침).

## Test Requirements

- queries·adapters 단위 테스트(성공·오류·cursor).
- 위젯/페이지 테스트: 각 패널 loading·error·성공 렌더, 부분 실패 시 다른 패널 유지.
- 기존 테스트를 약화하지 않는다. mock 상수 제거로 깨지는 #199 테스트는 query mock으로 갱신한다.

## Verification Commands

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Documentation Impact

- 설계문서 `docs/designs/198-news-insights.md` 화면-API 매핑과 일치. 이탈 시 문서 먼저 갱신.

## ADR Need

불요. 기존 feature/query 패턴을 따르는 계약 연동.

## Failure Record Need

불요.

## Risk Level

Low~Medium — 계약 연동·부분 실패 처리. cursor 페이징·패널별 오류 격리 정확성에 주의.

## Expected Output

- features/news-insights(dto·adapters·queries)·위젯·페이지·테스트 커밋. PR 본문에 설계문서 링크와
  화면-API 매핑 요약.
- 검증 5종 결과 보고.

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
- 현재 체크아웃된 브랜치를 유지한다(자체 브랜치 생성 금지).
