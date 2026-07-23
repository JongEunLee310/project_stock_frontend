# Codex Handoff Task

## Source Issue

- #285 — FE: 개요 상단 3열 재구성, AI Agent 브리핑 상시 패널화
- #286 — FE: 개요 하단 4패널 1행 재배치 + 패널 상세 링크

두 이슈 모두 `src/pages/ui/NewsInsightsOverviewPage.tsx` 한 파일을 고치므로 한 브랜치에서 함께
처리한다.

## Task Summary

뉴스·공시 인사이트 개요 화면(`/news`)의 패널 배치를 설계 이미지에 맞춘다. 데이터 계약·패널 내부
로직은 그대로 두고 **배치와 노출 방식**만 바꾼다.

## Goal

- AI Agent 브리핑이 페이지 진입 즉시 상단 중앙 패널로 보인다(클릭 불필요).
- 하단 네 패널이 한 행 4열로 배치된다.
- 기존 패널 단위 로딩·오류·재시도·갱신 표시 동작이 모두 유지된다.

## Background

설계 이미지는 `/Users/sleepyowl/Downloads/news-instight.png`이다. 화면 구성은 다음과 같다.

```
[ 요약 카드 4장 ]
[ 실시간 뉴스·공시 피드 | AI Agent 브리핑 | 많이 언급되는 키워드 / 토픽 맵 ]
[ 투자자 동향 | 예상 자금 흐름 | 이벤트 타임라인 | 에이전트 파이프라인 ]
```

현재 구현과 어긋나는 지점은 두 가지다.

1. `AgentBriefing`이 `fixed bottom-6 right-6`의 플로팅 버튼으로 렌더되고 기본 상태가 닫힘이다.
   페이지 최하단에서 `<section>` **밖**에 렌더된다. 관제탑 화면의 1차 정보가 클릭 한 단계 뒤에
   숨어 있다.
2. 하단이 `투자자 동향`(전폭) → `예상 자금 흐름`(전폭) → `이벤트 타임라인 | 에이전트 파이프라인`
   (2열)로 3행에 걸쳐 있다.

## Implementation Scope

- `src/pages/ui/NewsInsightsOverviewPage.tsx`
  - 상단을 3열 그리드로 바꾼다 — `RealtimeEventFeed | AgentBriefing | TopicMap`.
    피드가 가장 넓고 브리핑·토픽 맵이 그다음이 되도록 열 폭을 잡는다.
  - `AgentBriefing`을 `<section>` 안 상단 그리드로 옮긴다. 페이지 끝의 렌더 위치를 제거한다.
  - 하단을 `InvestorFlowPanel | FundFlowOutlookPanel | MarketEventTimeline | AgentPipelinePanel`
    한 행 4열 그리드로 바꾼다. 반응형은 `2xl` 4열, `xl` 2열, 그 미만 1열.
- `src/widgets/AgentBriefing/AgentBriefing.tsx`
  - 플로팅 래퍼(`fixed bottom-6 right-6`), 열기/닫기 토글 버튼, 하이라이트 개수 배지,
    `useState(open)`, 닫기 버튼(`FiX`)을 제거한다.
  - 다른 패널과 같은 `Card` 패널로 만든다. 제목·`PanelFreshness`·생성 시각·`BriefingBody`는
    그대로 살린다. `role="dialog"`·`aria-modal` 성격의 속성은 패널에 맞게 정리한다.
- 4열 폭에 맞춘 하단 패널 내부 밀도 조정 — 필요한 범위에서만.
  - `src/widgets/InvestorFlowPanel`, `src/widgets/FundFlowOutlookPanel`,
    `src/widgets/MarketEventTimeline`, `src/widgets/AgentPipelinePanel`
  - 좁아진 폭에서 가로 스크롤이나 글자 겹침이 생기는 부분만 손본다. 줄바꿈 허용, 라벨 축약,
    표 컬럼 정리 수준이다.
- 위 위젯들의 기존 테스트 파일 — 구조 변경에 따라 갱신이 필요한 부분.

## Out of Scope

- API 호출·쿼리 키·폴링 주기 변경. `src/features/news-insights/queries.ts`는 건드리지 않는다.
- 패널이 표시하는 값의 계산·포맷 변경. 4열로 좁아졌다는 이유로 수치를 반올림하거나 단위를
  바꾸지 않는다.
- 토픽 상세 페이지(`TopicInsightDetailPage`)와 그 전용 위젯. 별도 이슈(#287·#288)에서 다룬다.
- 헤더 액션 버튼 추가·면책 푸터 추가. 별도 이슈(#289)에서 다룬다.
- `PlannedPanelCard` 제거. 별도 이슈(#290)에서 다룬다.

## Protected Files

없음.

## Requirements

- `/news` 진입 직후 클릭 없이 브리핑 요약과 하이라이트가 보인다.
- 브리핑 조회가 실패해도 피드·토픽 맵은 정상 렌더되고 브리핑 카드에만 재시도 버튼이 나온다.
  패널 단위 부분 실패 격리는 이 화면의 기존 원칙이므로 유지한다.
- 문장별 근거 건수 배지(`근거 N건`)를 유지한다.
- 하단 패널에 상세 링크를 붙이되, **이동할 실제 라우트가 있는 패널에만** 붙인다.
  `src/shared/config/navigation.ts`의 `appRoutePaths`에 존재하는 경로만 쓴다. 존재하지 않는
  경로를 새로 만들거나 빈 화면으로 보내지 않는다. 대상 화면이 없으면 링크를 생략한다.
- 모든 브레이크포인트에서 페이지 본문에 가로 스크롤이 생기지 않는다.
- 기존 접근성 속성(`aria-label`, `aria-labelledby`, `role="status"`, `sr-only` 안내)을 유지한다.
  플로팅 버튼 제거로 사라지는 `aria-expanded`는 패널 구조에 맞게 정리한다.

## Test Requirements

- `AgentBriefing` 테스트 — 토글 없이 바로 내용이 보이는지, 로딩·오류·빈 상태가 유지되는지.
- 개요 페이지 테스트가 있다면 새 배치에 맞춰 갱신한다.
- 밀도 조정으로 마크업이 바뀐 하단 패널 테스트를 갱신한다.
- 기존 단언을 약화시키지 않는다. 셀렉터가 깨졌다는 이유로 검증을 삭제하지 말고 새 구조에 맞게
  다시 쓴다.

## Verification Commands

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Documentation Impact

없음. 계약·모델 변경이 아니라 배치 변경이다.

## ADR Need

불요. 새 도메인·테이블·외부 의존성·아키텍처 결정이 없다.

## Failure Record Need

불요.

## Risk Level

Low — 렌더 위치와 그리드 구성 변경이 중심이다. 다만 `AgentBriefing`은 플로팅 다이얼로그에서
일반 패널로 성격이 바뀌므로 접근성 속성 정리에 주의한다.

## Expected Output

- 위 범위의 커밋(한국어 메시지). push·PR은 하지 않는다.
- 검증 5종 결과 보고.
- 하단 패널 중 상세 링크를 **붙이지 않은** 패널이 있으면 그 이유(대상 라우트 부재)를 함께 보고한다.

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
- 현재 체크아웃된 브랜치를 유지한다(자체 브랜치 생성·push·PR 금지).
