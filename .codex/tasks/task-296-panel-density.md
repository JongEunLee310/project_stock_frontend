# Codex Handoff Task

## Source Issue

#296 — FE: 패널 공통 밀도 정리 (eyebrow·설명문장 제거, 항목 테두리 평탄화)

## Task Summary

뉴스 인사이트 위젯이 공통으로 달고 있는 장식을 걷어내 설계 이미지의 밀도에 맞춘다. 패널
머리말에서 영문 eyebrow와 설명 문장을 없애고, 목록 항목을 감싼 테두리 박스를 구분선으로
평탄화한다.

## Goal

- 뉴스 인사이트 위젯에 영문 eyebrow가 남아 있지 않다.
- 목록 항목이 테두리 박스가 아니라 구분선으로 나뉜다.
- 두 화면의 세로 길이가 눈에 띄게 줄어든다.
- **표시되던 정보는 하나도 사라지지 않는다.** 줄어드는 것은 장식이지 내용이 아니다.

## Background

설계 이미지(`/Users/sleepyowl/Downloads/news-instight.png`,
`/Users/sleepyowl/Downloads/topic-insight.png`)와 화면을 대조한 결과, 밀도 문제가 개별 패널의
결함이 아니라 **위젯 골격을 처음 정할 때의 형태가 전체에 복제된 결과**임이 확인됐다.

### 문제 1 — 설계에 없는 머리말 두 줄

뉴스 인사이트 위젯 19개가 예외 없이 같은 구조다.

```
Investor flows                    ← 영문 eyebrow (uppercase tracking-[0.2em])
투자자 동향                        ← 제목
시장 전체의 투자 주체별 순매수…      ← 설명 문장
                     [배지] [갱신 표시]
```

설계 패널에는 제목 한 줄과 우상단의 작은 컨트롤 하나뿐이다. 영문 eyebrow와 설명 문장은 설계
어디에도 없다. 이 eyebrow는 프로젝트 전체 관례도 아니다. 다른 화면에서는 `AlertsPage`·
`SettingsPage` 두 곳만 쓴다.

### 문제 2 — 카드 안의 카드

패널 카드 안에서 각 항목이 `rounded-control border border-app-border bg-app-surface-muted/40
p-3`(또는 `p-4`) 박스로 감싸이고, 그 안에서 소제목 블록이 또 나뉜다. 설계는 구분선으로 나뉜
평평한 행이다.

중첩 박스가 특히 많은 위젯: `TopicEvidenceList`(2), `InvestorFlowPanel`(2),
`CounterViewPanel`(2), `FundFlowScenarioPanel`(1).

### 확인된 사실

- eyebrow 문자열을 단언하는 테스트는 **없다.** 검색으로 확인했다.
- 뉴스 위젯 테스트는 34개다. 마크업 구조에 기대는 단언이 깨질 수 있다.

## Implementation Scope

### 1. 공용 패널 머리말 컴포넌트

`src/shared/ui/PanelHeader.tsx`(신규)를 만든다. 같은 머리말이 19곳에 복제돼 있으므로, 규칙을
한 곳에 두어 다음 패널이 eyebrow를 다시 붙이지 못하게 한다.

- 제목과 우상단 컨트롤 슬롯을 같은 행에 둔다.
- 제목에 `id`를 붙일 수 있어야 한다. 기존 `aria-labelledby` 연결을 유지해야 하기 때문이다.
- 설명 문장 슬롯은 **선택적**으로 두되, 기본은 없는 것이다.
- `src/shared/ui/index.ts` 배럴에 export를 추가한다.

### 2. 위젯 머리말 정리

아래 위젯의 머리말을 `PanelHeader`로 교체한다.

`AgentPipelinePanel`, `CounterViewPanel`, `FundFlowOutlookPanel`, `FundFlowScenarioPanel`,
`InsightExplanationPanel`, `InsightSummaryCards`, `InvestorFlowPanel`, `MarketEventTimeline`,
`NewsEventAffectedSymbols`, `NewsEventEvidenceList`, `NewsEventRelatedTopics`,
`RealtimeEventFeed`, `TopicActionChecklist`, `TopicEvidenceList`, `TopicInsightSummary`,
`TopicKeywordGraph`, `TopicMap`, `TopicSymbolSensitivity`, `TopicTrendChart`

규칙은 이렇다.

- 영문 eyebrow(`uppercase tracking-[0.2em]`)를 **제거한다.**
- 설명 문장은 **기본적으로 제거한다.** 제목만으로 뜻이 서지 않는 패널에만 남기되 한 줄로
  줄인다. 남긴 패널과 그 이유를 보고한다.
- 배지·`PanelFreshness`·토글 같은 우상단 컨트롤은 그대로 유지하고 머리말 컨트롤 슬롯에 넣는다.
- `aria-labelledby`가 가리키는 제목 `id`를 그대로 유지한다. 끊기면 접근성이 후퇴한다.

### 3. 항목 표현 평탄화

같은 위젯들에서 목록 항목을 감싼 박스를 걷어낸다.

- `rounded-control border border-app-border bg-app-surface-muted/40 p-3`류의 항목 래퍼를
  제거하고, 항목 사이를 구분선(`divide-y` 또는 항목별 `border-t`)으로 나눈다.
- 배경색으로 항목을 구분하지 않는다.
- 항목 내부 패딩을 줄인다.
- **예외** — 강조가 성격상 필요한 항목은 남길 수 있다. `CounterViewPanel`의 위험 항목처럼
  경고 톤이 의미를 갖는 곳이다. 남긴 곳과 이유를 보고한다.

## Out of Scope

- `TopicSummaryHeader` **수정 금지.** 이 위젯은 한 줄 밴드로 재구성하는 #295에서 다루며 같은
  파일을 건드리면 충돌한다.
- 뉴스 인사이트 밖의 위젯·페이지. `AlertsPage`·`SettingsPage`의 eyebrow는 건드리지 않는다.
- 패널의 배치·그리드 변경. 배치는 이미 #285~#288에서 맞췄다.
- 데이터 바인딩·쿼리·계약 변경.
- 차트 추가나 시각화 형태 변경(#293·#294).

## Protected Files

없음.

## Requirements

- **정보 손실 금지.** 근거 서술·가정·위험 요인·반대 관점·설명 문장의 **본문**은 이 화면의
  핵심이므로 그대로 둔다. 지우는 대상은 영문 eyebrow와 패널 설명 문장, 그리고 항목을 감싼
  장식이다. 제목·배지·수치·본문 텍스트는 유지한다.
- 로딩·오류·빈 상태, 재시도 버튼, `PanelFreshness`, 패널 단위 부분 실패 격리를 모두 유지한다.
- 접근성 속성(`aria-labelledby`·`aria-label`·`role="status"`·`sr-only` 안내)을 유지한다.
  머리말 구조가 바뀌어도 제목과 패널의 연결이 끊기면 안 된다.
- 모든 브레이크포인트에서 가로 스크롤이 생기지 않는다.
- 시각적 계층은 테두리·배경이 아니라 글자 크기·굵기·간격·구분선으로 만든다.

## Test Requirements

- 34개 뉴스 위젯 테스트를 새 구조에 맞춰 갱신한다.
- **셀렉터가 깨졌다는 이유로 단언을 삭제하지 않는다.** 새 구조에 맞게 다시 쓴다. 특히 제목과
  패널의 접근성 연결을 확인하는 단언은 반드시 살린다.
- 표시되던 텍스트가 사라지지 않았음을 확인할 수 있어야 한다. 기존 테스트가 본문 텍스트를
  단언하고 있으면 그대로 통과해야 한다.
- 기존 단언을 약화시키지 않는다.

## Verification Commands

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Documentation Impact

`src/widgets/README.md`가 있다. 위젯 머리말 관례를 기술한 부분이 있으면 `PanelHeader` 사용
규칙으로 갱신한다. 없으면 문서 변경은 필요 없다.

## ADR Need

불요. 새 도메인·외부 의존성·아키텍처 결정이 없다. 설계 이미지를 따르는 표현 정리다.

## Failure Record Need

불요.

## Risk Level

Medium — 위젯 19개와 테스트 34개를 건드리는 넓은 변경이다. 개별 변경은 단순하지만 범위가
넓어 접근성 연결이나 상태 표시를 놓치기 쉽다. 파일마다 같은 규칙을 일관되게 적용하고, 각
위젯에서 표시 정보가 줄지 않았는지 확인한다.

## Expected Output

- 위 범위의 커밋(한국어 메시지). push·PR은 하지 않는다.
- 검증 5종 결과 보고.
- 설명 문장을 **남긴** 패널과 그 이유.
- 항목 테두리를 **남긴** 곳과 그 이유.
- 갱신한 테스트에서 단언을 삭제한 곳이 있으면 그 이유(원칙적으로 없어야 한다).

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
- 현재 체크아웃된 브랜치(feat/296-panel-density)를 유지한다(자체 브랜치 생성·push·PR 금지).
