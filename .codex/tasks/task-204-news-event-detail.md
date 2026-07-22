# Codex Handoff Task

## Source Issue

JongEunLee310/project_stock_frontend#204 — FE: 이벤트 상세 페이지 `/news/events/:eventId` (에픽 #198 2차).
설계문서: `docs/designs/198-news-insights.md`. BE 계약: `project_stock`의
`GET /api/v1/news-insights/events/{event_id}`(dev 머지 완료).

## Task Summary

개별 시장 이벤트의 근거를 검증하는 이벤트 상세 화면을 신설한다. 헤더(유형·제목·요약·중요도·감성),
영향 종목, 근거 문서 목록(원문/AI 요약 분리·evidence_role), 관련 토픽 링크를 담는다.

## Goal

- 라우트 `/news/events/:eventId`에 `NewsEventDetailPage`가 배선되어 렌더된다.
- `GET /events/{id}`로 이벤트 유형·제목·요약·중요도(점수·수준·설명)·감성(방향·점수)을 표시한다.
- 영향 종목(방향·노출도·사유, 클릭 → `/research/:symbol`)과 근거 문서 목록(출처·제목·발행 시각·
  역할, 원문/AI 요약 분리), 관련 토픽 링크(→ `/news/topics/:topicId`)를 표시한다.
- loading·error·empty 처리(존재하지 않는 event_id는 BE 404).

## Background

- 라우트 `newsEventDetail`은 아직 없다. `src/shared/config/navigation.ts`의 `appRoutePaths`에
  `newsEventDetail: '/news/events/:eventId'`를 추가하고 타입 union(`AppRoutePathKey` 계열)에도
  키를 추가한다. `src/app/router.tsx`의 AppShell children에 라우트를 추가한다.
- FE 데이터 패턴: `src/features/news-insights/`(dto·adapters·queries)에 이벤트 상세 query
  (`useNewsEventDetailQuery(eventId)`, `enabled` 가드)를 추가한다. HTTP `apiGet`, 오류 `ApiError`.
- **adapter presentation 맵 재사용**: `importancePresentations`·`sentimentPresentations`·
  `eventTypeLabels`·`documentTypePresentations`·`evidenceRolePresentations`가 이미 있다. 확장만.
- 토픽 상세의 `TopicEvidenceList`가 원문/AI 요약을 분리하는 UI 패턴의 참고다. 다만 이벤트 상세
  evidence 계약에는 **per-doc summary가 없다**(아래 계약 참고) — 원문은 메타데이터(출처·제목·발행
  시각·문서 번호), "AI 요약"은 per-doc 요약이 없으므로 이벤트 레벨 `summary`를 안내하거나 "문서별 AI
  요약 미제공"으로 정직하게 처리한다. 없는 데이터를 만들지 마라.

### BE 응답 계약 (ApiResponse envelope, snake_case, 점수 0~1 float)

- `GET /events/{id}` → `EventDetailResponse`:
  `event_type`(EventType)·`title`·`summary`·
  `importance`{`level`(LOW|MEDIUM|HIGH)·`score`·`explanation`}·
  `sentiment`{`direction`(POSITIVE|NEUTRAL|NEGATIVE|MIXED)·`score`}·
  `affected_symbols`[{`symbol`·`direction`·`exposure_score`·`reason`}]·
  `evidence`[{`document_id`·`document_type`(DocumentType)·`source`·`title`·`published_at`·
  `evidence_role`(PRIMARY|SUPPORTING|CONTRADICTING|BACKGROUND)}]·
  `related_topics`[{`topic_id`·`title`}].
- 존재하지 않는 event_id는 404.

## Implementation Scope

- `src/shared/config/navigation.ts` — `newsEventDetail` 경로·타입 키 추가.
- `src/app/router.tsx` — `/news/events/:eventId` 라우트 추가.
- `src/features/news-insights/dto.ts`·`adapters.ts`·`queries.ts` — 이벤트 상세 dto·adapter
  (`adaptNewsEventDetail`)·query 추가. presentation 맵 재사용.
- `src/widgets/`(신규) — 이벤트 상세 헤더·영향 종목·근거 목록·관련 토픽 위젯(설계 배치에 맞게 구성.
  근거 목록은 `TopicEvidenceList` 스타일 참고하되 계약 차이 반영).
- `src/pages/ui/NewsEventDetailPage.tsx`(신규) — `useParams` eventId, 패널 조합. `src/pages/index.ts`
  export 추가.

## Out of Scope

- 개요 피드(#200)에서 이벤트 행 클릭 → 이 페이지 연결(후속 배선). 토픽 상세·2·3차 다른 패널.
- 새 npm 의존성. BE 계약 변경.

## Protected Files

없음.

## Requirements

- 중요도(점수·수준·설명)와 감성(방향·점수)을 분리 표기, 색상만으로 상태 표현 금지(텍스트 배지 병기).
- 근거 문서는 사실(출처·원문 메타)과 분석을 구분, evidence_role(PRIMARY/SUPPORTING/CONTRADICTING/
  BACKGROUND) 배지 표시.
- 영향 종목 클릭 → `/research/:symbol`, 관련 토픽 클릭 → `/news/topics/:topicId`.
- BE 계산값 그대로 렌더, 없는 수치·요약 창작 금지(per-doc AI 요약 미제공은 정직하게 안내).
- loading·error(404 포함)·empty 처리.

## Test Requirements

- 이벤트 상세 query·adapter 단위 테스트(성공·오류·빈 배열).
- 위젯/페이지 테스트: 헤더 중요도·감성 렌더, 영향 종목·관련 토픽 네비게이션 호출, 근거 역할 배지·
  원문/요약 분리, `MemoryRouter` 래핑.
- 기존 테스트를 약화하지 않는다.

## Verification Commands

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Documentation Impact

- 설계문서 `docs/designs/198-news-insights.md` 화면-API 매핑(이벤트 상세 2차)과 일치. 이탈 시 문서
  먼저 갱신.

## ADR Need

불요. 기존 FSD·query·라우팅 패턴을 따르는 신규 화면 추가.

## Failure Record Need

불요.

## Risk Level

Low~Medium — 신규 read 화면. evidence 계약의 per-doc summary 부재 처리와 라우트·타입 추가가 주의점.

## Expected Output

- navigation·router·features query/adapter·위젯·페이지·테스트 커밋(한국어 메시지). PR·push는 하지
  마라.
- 검증 5종 결과 보고.

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
- 현재 체크아웃된 브랜치(feat/204-news-event-detail)를 유지한다(자체 브랜치 생성·push·PR 금지).
