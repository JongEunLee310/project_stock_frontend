# Codex Handoff Task

## Source Issue

JongEunLee310/project_stock_frontend#268 — FE: 인사이트 설명·반대 관점 패널 (에픽 #198 3차).
설계문서: `docs/designs/198-news-insights.md`. BE 계약: `project_stock`의
`GET /api/v1/news-insights/topics/{id}/explanation`(dev 머지 완료, PR #384).

## Task Summary

토픽 상세 "왜 이런 인사이트가 나왔나"(§5.10) placeholder를 실데이터 위젯으로 교체하고, 기존
반대 관점 패널(§5.11)을 `/explanation`의 구조화된 counter_view로 확장한다. 두 패널은 동일한
`/explanation` query를 공유한다.

## Goal

- "왜 이런 인사이트" placeholder를 `InsightExplanationPanel`(기여 요인 비율 막대 + 메타)로 교체한다.
- 반대 관점 패널을 `/explanation`의 counter_view(반대 근거·무효화 조건·선반영 가능성·CONTRADICTING
  evidence)로 확장한다.
- 기여 요인 비율은 **BE 산출값 렌더만**, FE 임의 생성 금지.
- 사실/분석 구분(분석은 AI 배지·신뢰도·근거)을 시각적으로 표시한다.
- 미분석 토픽의 BE 500을 패널 error로 격리(부분 실패).

## Background

- 토픽 상세 `src/pages/ui/TopicInsightDetailPage.tsx`의 placeholder:
  - `plannedPanels.explanation`(왜 이런 인사이트, #268) → `InsightExplanationPanel`로 교체·제거.
  - `plannedPanels.actionChecklist`는 **#270 액션·연결 소관**이다. 이번엔 교체하지 말고 issue 라벨을
    `#270`으로만 정정해 placeholder를 유지한다.
- 현재 `CounterViewPanel`은 `props.counterArguments: string[]`(1차 `/topics/{id}`의
  `insight.counterArguments`)만 받는다. 이를 확장한다:
  - **1차 counterArguments를 기본(base)으로 유지**하고(항상 제공됨), `/explanation` counter_view의
    무효화 조건·선반영 가능성·CONTRADICTING evidence를 **추가 섹션**으로 붙인다.
  - `/explanation`이 로딩/오류(미분석 토픽 500)/빈 값이어도 base 반대 근거는 계속 보이고, 확장
    섹션만 "확장 근거 미제공/불러오지 못함"으로 graceful 처리한다(counter_arguments 가시성 보존).
- `/explanation` query(`useNewsTopicExplanationQuery(topicId)`, `enabled` 가드)를 features에 추가하고
  `InsightExplanationPanel`과 확장된 `CounterViewPanel`이 공유한다.
- **숫자만 두지 말고 설명 병기**, 색만으로 상태 표현 금지 — 텍스트 배지 병기.

### BE 응답 계약 (ApiResponse envelope, snake_case, 비율·점수 0~1 float)

- `GET /topics/{id}/explanation` → `TopicExplanationResponse`:
  - `factors`[{`label`·`contribution_ratio`}] — 기여 요인 비율(합 ≈ 1.0).
  - `meta`{`analysis_version`·`data_coverage`·`last_updated`·`missing_data`[]·
    `counter_argument_count`·`confidence`·`limitations`[]}.
  - `counter_view`{`counter_arguments`[]·`invalidation_conditions`[]·
    `already_priced_in`{`likely`(bool)·`note`(str|null)}·`contradicting_evidence`
    [{`event_id`·`document_id`·`title`·`source`·`published_at`}]}.
- 미분석 토픽은 500(BE 후속 완화 예정). 400/404/500 모두 패널 error 처리.

## Implementation Scope

- `src/features/news-insights/dto.ts`·`adapters.ts`·`queries.ts` — explanation dto·adapter
  (`adaptNewsTopicExplanation`)·query(`useNewsTopicExplanationQuery`) 추가.
- `src/widgets/InsightExplanationPanel/`(신규) — 기여 요인 비율 막대(BE 값 렌더, 라벨+% 병기)·메타
  (분석 버전·데이터 범위·마지막 갱신·누락 데이터·반대 근거 수·신뢰도·분석 한계). AI 분석 배지.
- `src/widgets/CounterViewPanel/CounterViewPanel.tsx` — props 확장: base `counterArguments`(유지) +
  `explanation` query 결과(무효화 조건·선반영·CONTRADICTING evidence). 기존 loading/error/empty 유지,
  확장 섹션은 explanation 상태에 따라 graceful.
- `src/pages/ui/TopicInsightDetailPage.tsx` — explanation placeholder → `InsightExplanationPanel`,
  `CounterViewPanel`에 explanation query 연결, `actionChecklist` placeholder issue를 `#270`으로 정정.

## Out of Scope

- 캘린더·파이프라인(#269)·액션 체크리스트 실구현(#270)·폴링(#266). 개요 페이지 변경.
- 새 npm 의존성. BE 계약 변경. 기여 비율 FE 재계산·정규화.

## Protected Files

없음.

## Requirements

- 기여 요인 비율은 BE 값 렌더만(FE 생성·재계산 금지). 라벨+비율 % 병기.
- 반대 관점 필수 노출: base counter_arguments는 항상, 확장 근거는 explanation 가용 시.
- 사실/분석 구분 — 분석 항목에 AI 배지·신뢰도·근거 표시. 색만으로 표현 금지, 텍스트 배지 병기.
- 미분석 토픽 500을 패널 error로 격리, base 반대 근거 가시성 보존. 독립 query.
- 분석 버전·데이터 신선도·누락 데이터·한계 표기.

## Test Requirements

- explanation query·adapter 단위 테스트(성공·오류·빈 데이터).
- `InsightExplanationPanel` 테스트: 기여 요인 막대·메타·AI 배지, 오류/빈 처리.
- `CounterViewPanel` 테스트: base counter_arguments 유지 + 확장 섹션(무효화·선반영·CONTRADICTING),
  explanation 오류 시 base 유지·확장 graceful.
- 토픽 상세 페이지 테스트: explanation placeholder 교체, actionChecklist placeholder 유지(#270),
  부분 실패 격리.
- 기존 테스트를 약화하지 않는다.

## Verification Commands

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Documentation Impact

- 설계문서 `docs/designs/198-news-insights.md` 화면-API 매핑(설명·반대 관점 3차)과 일치. 이탈 시 문서
  먼저 갱신.

## ADR Need

불요. 기존 FSD·query 패턴을 따르는 3차 위젯 추가·기존 위젯 확장.

## Failure Record Need

불요.

## Risk Level

Medium — 기여 비율 렌더 정확성, 반대 관점의 base 유지 + 확장 graceful, 미분석 토픽 500 격리,
CounterViewPanel 확장에 따른 기존 테스트 동기화가 핵심 리스크.

## Expected Output

- features explanation query/adapter·`InsightExplanationPanel`·확장된 `CounterViewPanel`·페이지
  연결·테스트 커밋(한국어 메시지). PR·push는 하지 마라.
- 검증 5종 결과 보고.

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
- 현재 체크아웃된 브랜치(feat/268-explanation-counter-view)를 유지한다(자체 브랜치 생성·push·PR 금지).
