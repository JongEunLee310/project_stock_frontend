# Codex Handoff Task

## Source Issue

JongEunLee310/project_stock_frontend#202 — 토픽 맵 시각화 (에픽 #198 1차).
설계문서: `docs/designs/198-news-insights.md`. BE 계약: `project_stock`의 `GET /api/v1/news-insights/topics/map`(dev 머지 완료).

## Task Summary

개요 페이지의 토픽 맵 자리(placeholder)를 실제 시각화로 교체한다. `GET /topics/map`의 nodes·edges를
**Cytoscape.js**(`cytoscape` + `react-cytoscapejs`, 이미 설치됨)로 렌더하고, 토픽 노드 클릭 시
토픽 상세 라우트로 이동한다.

## Goal

- 개요의 토픽 맵 카드가 `GET /topics/map`으로 nodes·edges를 받아 Cytoscape로 렌더한다.
- 토픽(TOPIC) 노드 클릭 시 `/news/topics/:topicId`로 이동한다.
- loading·error·empty 상태를 처리한다(패널 부분 실패, 페이지 전체를 깨지 않음).

## Background

- 의존성은 이미 설치됨: `cytoscape`, `react-cytoscapejs`(+ `@types/cytoscape`·
  `@types/react-cytoscapejs`). **새 의존성을 추가하지 마라.**
- FE 데이터 패턴: `src/features/news-insights/`(dto·adapters·queries)에 토픽 맵 query를 추가한다
  (#200에서 만든 구조 재사용). HTTP는 `apiGet`, 오류는 `ApiError`.
- BE 응답(`ApiResponse`): `nodes`[{id·label·type(TOPIC/KEYWORD)·mention_count·momentum_score·
  sentiment_score·category}]·`edges`[{source·target·strength·cooccurrence_count}]. **백엔드가 관계
  계산을 완료**했으므로 FE는 렌더만 한다.
- 위젯은 `src/widgets/TopicMap/`(신규 슬라이스). #199에서 둔 토픽 맵 placeholder 카드를 이 위젯으로
  교체한다.
- 라우트 `/news/topics/:topicId`는 아직 페이지가 없다(#203). 이 태스크는 **네비게이션만** 배선한다
  (상세 페이지 구현은 #203). `appRoutePaths`에 `newsTopicDetail`이 없으면 추가한다.

## Implementation Scope

- `src/features/news-insights/` — 토픽 맵 dto·adapter·query(`useNewsTopicMapQuery`) 추가.
- `src/widgets/TopicMap/` — Cytoscape 렌더 위젯. node 크기=mention_count/momentum, 색=category,
  감성 배지/테두리, edge 굵기=strength. 토픽 노드 클릭 → 상세 이동.
- `src/pages/ui/NewsInsightsOverviewPage.tsx` — 토픽 맵 placeholder를 `TopicMap` 위젯으로 교체.
- `src/shared/config/navigation.ts` — 필요 시 `newsTopicDetail: '/news/topics/:topicId'` 추가.

## Out of Scope

- 토픽 상세 페이지(#203)·상세 키워드 관계망(#265). 실시간 갱신. 다른 패널 placeholder 변경.
- 새 npm 의존성 추가. BE 계약 변경.

## Protected Files

없음.

## Requirements

- **연관 강도(edge.strength)와 감성(node.sentiment_score)을 다른 시각 요소로** 표현한다(선 굵기 vs
  색/배지). 하나로 뭉치지 않는다(설계 지침).
- 색상만으로 상태 표현 금지 — 카테고리/감성 텍스트 배지·범례 병기.
- 백엔드가 계산한 nodes·edges를 그대로 렌더(FE에서 관계 재계산 금지).
- Cytoscape 인스턴스는 언마운트 시 정리(cleanup)한다.
- loading·error·empty 상태를 처리한다.

## Test Requirements

- 토픽 맵 query·adapter 단위 테스트(성공·오류).
- 위젯 테스트: nodes·edges 렌더, 토픽 노드 클릭 시 네비게이션 호출(Cytoscape는 필요 시 mock).
- 기존 테스트를 약화하지 않는다.

## Verification Commands

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Documentation Impact

- 설계문서 `docs/designs/198-news-insights.md` 화면-API 매핑(토픽 맵)과 일치. 이탈 시 문서 먼저 갱신.

## ADR Need

불요. 그래프 라이브러리(Cytoscape) 도입은 사용자 승인 완료, 기존 FSD·query 패턴 준수.

## Failure Record Need

불요.

## Risk Level

Medium — 신규 시각화 라이브러리 통합. Cytoscape 생명주기(cleanup)·SSR/테스트 환경 렌더·번들 크기에 주의.

## Expected Output

- features 토픽 맵 query·`TopicMap` 위젯·페이지 교체·네비게이션·테스트 커밋. PR 본문에 설계문서 링크와
  시각 규칙 요약.
- 검증 5종 결과 보고.

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
- 현재 체크아웃된 브랜치를 유지한다(자체 브랜치 생성 금지).
