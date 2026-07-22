# Codex Handoff Task

## Source Issue

JongEunLee310/project_stock_frontend#203 — 토픽 인사이트 상세 페이지 `/news/topics/:topicId` (에픽 #198 1차).
설계문서: `docs/designs/198-news-insights.md`. BE 계약: `project_stock`의
`GET /api/v1/news-insights/topics/{id}`·`/trend`·`/evidence`(dev 머지 완료).

## Task Summary

개요(관제탑)에서 토픽 노드를 클릭하면 들어가는 상세 분석 화면(분석 현미경)을 구현한다.
"왜 중요해졌고, 무슨 근거이며, 어떤 종목이 영향받고, 반대 근거는 무엇인가"에 답한다. 세 개의
독립 패널(헤더·요약, 감성/언급 추이, 관련 근거)을 각각 독립 query로 연동한다.

## Goal

- 라우트 `/news/topics/:topicId`에 `TopicInsightDetailPage`가 배선되어 렌더된다.
- 헤더·요약 패널이 `GET /topics/{id}`로 토픽명·태그·점수·영향 종목·인사이트(요약·왜 중요한가·
  핵심 근거·주의 포인트·**반대 관점**)를 표시한다.
- 추이 패널이 `GET /topics/{id}/trend`로 언급량(막대)+감성(선) 복합 차트, 이벤트 마커, 출처
  분포를 표시한다.
- 근거 패널이 `GET /topics/{id}/evidence`로 cursor 목록을 표시하고 evidence_role과
  [원문 보기]·[AI 요약 보기]를 분리한다.
- 세 패널은 독립 query·부분 실패 처리(한 API 오류가 페이지 전체를 깨지 않음).

## Background

- FE 데이터 패턴: `src/features/news-insights/`(dto·adapters·queries)에 토픽 상세 3종 query를
  추가한다(#200/#202에서 만든 구조 재사용). HTTP는 `apiGet`, 오류는 `ApiError`, cursor는
  `buildCursorSearchParams`·`toCursorPageInfo`(evidence). enum 라벨/톤 매핑은 기존 adapter의
  presentation 맵 컨벤션을 따른다.
- 라우트 `/news/topics/:topicId`는 이미 `appRoutePaths.newsTopicDetail`에 정의됨. `router.tsx`의
  AppShell children에 페이지만 추가하면 된다(#202가 토픽 노드 클릭 네비게이션은 이미 배선).
- 차트는 기존 공용 차트(`src/shared/ui/charts/`: `LineChart`(ComposedChart 기반, `series` 지원)·
  `BarChart`·`DonutChart`)를 우선 재사용한다. 복합(막대+선) 축이 필요하면 Recharts `ComposedChart`로
  위젯을 구성하되 **새 의존성 추가 금지**(recharts 이미 설치됨).
- 점수 안내 문구(설계 지침, 필수): 종합 영향도는 '관찰 우선순위'이지 수익률 점수가 아니며, 감성
  '긍정'은 '주가 상승 예상'이 아님을 UI에 안내한다.
- **반대 관점(counter_arguments)은 비어 있어도 패널을 노출**하고(빈 상태 문구), 존재 시 반드시
  표시한다(설계 원칙: 근거·반대 근거 대칭).
- 영향 종목 칩 클릭 → `/research/:symbol`(`appRoutePaths.researchDetail`)로 이동.

### BE 응답 계약 (ApiResponse envelope, snake_case, 점수는 0~1 float)

- `GET /topics/{id}` → `TopicDetailResponse`:
  `title`·`tags[]`·`lifecycle`(EMERGING|RISING|ACTIVE|COOLING|ARCHIVED)·
  `scores`{`impact`·`sentiment`·`confidence`·`momentum`}·
  `affected_symbols[]`{`symbol`·`exposure_score`·`impact_direction`(POSITIVE|NEUTRAL|NEGATIVE|MIXED)·
  `relationship`(DIRECT|SUPPLY_CHAIN|COMPETITOR|CUSTOMER)}·
  `insight`{`summary`·`why_it_matters`·`key_evidence`(list[dict])·`risk_points`[]·`counter_arguments`[]}·
  `version`·`updated_at`.
- `GET /topics/{id}/trend?window=7d&interval=1d` → `TopicTrendResponse`:
  `points[]`{`timestamp`·`mention_count`·`sentiment_score`·`impact_score`}·
  `markers[]`{`timestamp`·`label`·`event_id`}·
  `source_distribution[]`{`source_type`(DocumentType)·`count`·`share`}.
- `GET /topics/{id}/evidence?types=&direction=&cursor=&limit=20`(cursor_paginated) →
  `TopicEvidenceItem[]`:
  `event_id`·`document_id`·`evidence_role`(PRIMARY|SUPPORTING|CONTRADICTING|BACKGROUND)·
  `document_type`(NEWS|DISCLOSURE|EARNINGS|ANALYST_REPORT|COMMUNITY|COMPANY_IR)·`symbol`·`title`·
  `summary`·`direction`(SentimentDirection)·`relevance_score`·`source`·`published_at`.

## Implementation Scope

- `src/features/news-insights/dto.ts`·`adapters.ts`·`queries.ts` — 토픽 상세 3종
  (`useNewsTopicDetailQuery(topicId)`·`useNewsTopicTrendQuery(topicId)`·
  `useNewsTopicEvidenceQuery(topicId)` — evidence는 infinite/cursor) dto·adapter·query 추가.
  기존 enum presentation 맵(importance·sentiment·documentType) 재사용/확장.
- `src/widgets/TopicSummaryHeader/`·`TopicTrendChart/`·`TopicEvidenceList/`·`CounterViewPanel/`
  (신규 슬라이스). 반대 관점은 요약 패널 내부 섹션 또는 별도 위젯 중 설계 배치를 따른다.
- `src/pages/ui/TopicInsightDetailPage.tsx`(신규) — `useParams`로 topicId 취득, 세 패널 조합.
  `src/pages/index.ts`에 export 추가.
- `src/app/router.tsx` — AppShell children에 `appRoutePaths.newsTopicDetail` 라우트 추가.

## Out of Scope

- 2·3차 패널: 종목 민감도(`/symbols`)·키워드 관계망(`/graph`)·자금 흐름 시나리오(`/scenarios`)·
  Agent 설명(`/explanation`)·액션(알림·판단 기록·팔로우) 연결.
- 이벤트 상세 페이지(#204)·근거 행 클릭 → `/news/events/:eventId` 연결.
- 새 npm 의존성 추가. BE 계약 변경.

## Protected Files

없음.

## Requirements

- 세 패널 독립 query·부분 실패 허용. loading·error·empty 상태 각각 처리.
- 색상만으로 상태 표현 금지 — lifecycle·감성·evidence_role·종목 관계는 텍스트 배지 병기.
- 점수는 '관찰 우선순위'·감성은 '방향'임을 안내(수익률/주가 예상으로 오인 금지).
- 반대 관점(counter_arguments) 패널 상시 노출(빈 상태 포함).
- BE가 계산한 값을 그대로 렌더 — FE에서 점수·추이·집계 재계산 금지, 없는 수치 창작 금지.
- 추이 복합 차트는 언급량(막대)·감성(선)을 다른 시각 요소로 분리. 이벤트 마커 표기.
- 영향 종목 칩·근거 항목의 [원문 보기]/[AI 요약 보기]는 사실/분석을 시각적으로 구분.
- Decimal-as-string 금액은 이 화면에 없음(점수 float만). KST 시각 포맷은 기존 `formatKst*` 재사용.

## Test Requirements

- 토픽 상세 3종 query·adapter 단위 테스트(성공·오류·빈 데이터).
- 각 위젯 테스트: 헤더 점수/종목 렌더·반대 관점 빈 상태·추이 차트 데이터 바인딩·근거 목록/더보기.
- 페이지 테스트: `useParams` topicId 기반 3패널 조합, 패널별 부분 실패(한 query 오류 시 나머지 유지),
  `MemoryRouter`로 라우팅 래핑.
- 기존 테스트를 약화하지 않는다.

## Verification Commands

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Documentation Impact

- 설계문서 `docs/designs/198-news-insights.md` 화면-API 매핑(토픽 상세 3행)과 일치. 이탈 시 문서 먼저 갱신.

## ADR Need

불요. 기존 FSD·query·차트 패턴을 따르는 신규 화면 추가.

## Failure Record Need

불요.

## Risk Level

Medium — 3패널·복합 차트·cursor 근거 목록으로 표면적이 넓다. 부분 실패 격리와 점수 오인 방지 문구,
반대 관점 상시 노출이 핵심 리스크.

## Expected Output

- features 토픽 상세 3종 query/adapter·4개 위젯·상세 페이지·라우트·테스트 커밋. PR 본문에 설계문서
  링크와 패널-API 매핑·점수 안내 규칙 요약.
- 검증 5종 결과 보고.

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
- 현재 체크아웃된 브랜치를 유지한다(자체 브랜치 생성 금지).
