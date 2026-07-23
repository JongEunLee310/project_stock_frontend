# Codex Handoff Task

## Source Issue

- #287 — FE: 토픽 상세 3열 컬럼 구성 정렬
- #288 — FE: 감성·언급량 추이 기간 토글 7·30·90일

두 이슈 모두 `src/pages/ui/TopicInsightDetailPage.tsx`를 거치므로 한 브랜치에서 함께 처리한다.

## Task Summary

토픽 인사이트 상세 화면(`/news/topics/:topicId`)의 패널 배치를 설계 이미지에 맞추고, 감성·언급량
추이 패널에 기간 토글을 붙인다.

## Goal

- 상단 패널이 설계의 세 열 구성 그대로 놓이고, 한 열의 카드가 길어져도 다른 열이 밀리지 않는다.
- 하단이 `왜 이런 인사이트가 나왔나 | 액션 체크리스트 | 반대 관점` 전폭 3열이 된다.
- 추이 패널에서 7일·30일·90일을 전환할 수 있고, 차트·마커·출처 분포가 모두 함께 갱신된다.

## Background

설계 이미지는 `/Users/sleepyowl/Downloads/topic-insight.png`이다.

### 배치 문제(#287)

현재 `TopicInsightDetailPage`는 `grid gap-4 xl:grid-cols-3` 한 덩어리에 카드를 나열한다. 카드가
grid auto-flow로 흘러 들어가므로 설계의 열 구성이 무너진다.

- 현재 흐름 — 1행 `요약 | 추이 | 관계망`, 2행 `근거 | 투자자 반응 | 시나리오`,
  3행 `종목 민감도 | 설명 | 체크리스트`, 4행 `반대 관점`.
- 설계 — 종목 민감도는 중앙 열의 투자자 반응 아래에 붙고, 하단은 전폭 3열이다.

카드 높이가 제각각이라 열 사이 정렬도 어긋난다. 일부 위젯이 `xl:col-span-2`·`xl:col-span-3`을
자기 클래스에 들고 있어 auto-flow를 더 흐트러뜨린다.

### 기간 토글 부재(#288)

`src/features/news-insights/queries.ts`의 `useNewsTopicTrendQuery`가
`?window=7d&interval=1d`를 하드코딩한다. 설계의 추이 패널에는 `7일 / 30일 / 90일` 토글이 있다.
백엔드 `GET /news-insights/topics/{id}/trend`는 이미 `window`·`interval` 쿼리를 받으므로 백엔드
변경 없이 프론트엔드만으로 가능하다.

## Implementation Scope

### 배치(#287)

- `src/pages/ui/TopicInsightDetailPage.tsx`
  - 상단을 **명시적 3열**로 바꾼다. 열 컨테이너 각각이 자체 `flex flex-col gap-4`라서 카드가
    자기 열 안에서만 쌓이게 한다. auto-flow에 맡기지 않는다.
    - 좌 — `TopicInsightSummary`, `TopicEvidenceList`
    - 중 — `TopicTrendChart`, `InvestorFlowPanel`, `TopicSymbolSensitivity`
    - 우 — `TopicKeywordGraph`, `FundFlowScenarioPanel`
  - 하단을 별도 전폭 3열 그리드로 분리한다 —
    `InsightExplanationPanel | TopicActionChecklist | CounterViewPanel`.
  - `xl` 미만에서는 단일 열 스택으로 떨어지되 위 순서를 유지한다.
- 아래 위젯에서 자기 배치를 지정하는 `col-span` 클래스를 제거한다. 배치는 페이지가 정한다.
  - `src/widgets/TopicSymbolSensitivity/TopicSymbolSensitivity.tsx` — `xl:col-span-3`
  - `src/widgets/FundFlowScenarioPanel/FundFlowScenarioPanel.tsx` — `xl:col-span-3`
  - `src/widgets/InsightExplanationPanel/InsightExplanationPanel.tsx` — `xl:col-span-2`
  - `src/widgets/CounterViewPanel/CounterViewPanel.tsx` — `xl:col-span-3`
- 좁아진 열 폭에서 가로 스크롤이나 글자 겹침이 생기는 부분만 내부 밀도를 조정한다.

### 기간 토글(#288)

- `src/features/news-insights/queries.ts`
  - `useNewsTopicTrendQuery(topicId, window)`로 파라미터를 연다. 기본값은 현재와 같은 `7d`.
  - `queryKey`에 `window`를 포함한다. 기존 `placeholderData: keepPreviousData`와 폴링 주기는
    그대로 둔다.
  - `interval`은 7일·30일·90일 모두 `1d`로 보낸다.
- `src/widgets/TopicTrendChart/TopicTrendChart.tsx`
  - 패널 헤더에 `7일 / 30일 / 90일` 토글을 둔다. 선택 상태를 `aria-pressed`로 노출한다.
  - 선택 상태는 페이지가 들고 있어도 되고 위젯이 들고 있어도 된다. 위젯이 들면 선택값을
    페이지로 올려 쿼리에 반영해야 하므로, 페이지에서 `useState`로 관리하고 위젯에는
    `window`·`onWindowChange`를 내려주는 쪽이 단순하다.

## Out of Scope

- 개요 화면(`NewsInsightsOverviewPage`)과 그 전용 위젯. 별도 PR(#285·#286)에서 이미 다루고 있다.
- `src/widgets/InvestorFlowPanel` **수정 금지.** 이 위젯은 개요 화면과 공유하며 진행 중인 다른
  PR이 같은 파일을 고치고 있다. 이 위젯의 `xl:col-span-3`은 새 구조에서 부모가 flex라 적용되지
  않으므로 그대로 둬도 배치에 영향이 없다.
- 헤더 액션 버튼 추가·면책 푸터 추가(#289), `PlannedPanelCard` 제거(#290).
- 각 패널이 표시하는 값의 계산·포맷 변경. 배치 변경을 이유로 수치를 바꾸지 않는다.
- 백엔드 계약 변경.

## Protected Files

없음.

## Requirements

- `xl` 이상에서 각 열의 카드 구성이 위 목록과 일치한다.
- 한 열의 카드가 길어져도 다른 열의 카드가 밀려 내려가지 않는다.
- 기존 패널 단위 로딩·오류·재시도·빈 상태·`PanelFreshness` 동작이 모두 유지된다.
- 기간 전환 시 요청 URL의 `window`가 바뀌고 차트·마커(`markers`)·출처 분포
  (`sourceDistribution`)가 모두 해당 기간 응답으로 갱신된다. 7일 마커가 90일 차트에 남아서는
  안 된다.
- 전환 중에도 이전 구간 데이터가 유지돼 차트가 비었다 채워지지 않는다.
- 모든 브레이크포인트에서 페이지 본문에 가로 스크롤이 생기지 않는다.
- 기존 접근성 속성(`aria-label`, `aria-labelledby`, `role="status"`, `sr-only` 안내)을 유지한다.

## Test Requirements

- `TopicTrendChart` 테스트 — 토글 렌더, 선택 상태(`aria-pressed`), 전환 시 `onWindowChange` 호출.
- 토픽 상세 페이지 테스트가 있다면 새 배치와 기간 상태 연결에 맞춰 갱신한다.
- `col-span` 제거로 마크업이 바뀐 위젯 테스트를 갱신한다.
- 기존 단언을 약화시키지 않는다. 셀렉터가 깨졌다는 이유로 검증을 삭제하지 말고 새 구조에 맞게
  다시 쓴다.

## Verification Commands

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Documentation Impact

없음. 계약·모델 변경이 아니라 배치와 기존 쿼리 파라미터 노출이다.

## ADR Need

불요. 새 도메인·테이블·외부 의존성·아키텍처 결정이 없다.

## Failure Record Need

불요.

## Risk Level

Low — 배치 재구성과 기존 쿼리 파라미터를 화면에 여는 작업이다. 다만 열 구성을 바꾸면서 패널
단위 실패 격리가 깨지지 않는지 확인이 필요하다.

## Expected Output

- 위 범위의 커밋(한국어 메시지). push·PR은 하지 않는다.
- 검증 5종 결과 보고.
- 기간 토글의 상태를 어디에 뒀는지와 그 이유를 보고한다.

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
- 현재 체크아웃된 브랜치(feat/287-topic-detail-layout)를 유지한다(자체 브랜치 생성·push·PR 금지).
