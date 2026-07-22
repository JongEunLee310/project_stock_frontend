# Codex Handoff Task — #203 라운드2 (디자인 셸 정합·1차 재배치)

## Source Issue

JongEunLee310/project_stock_frontend#203 — 토픽 인사이트 상세 (에픽 #198). PR #275(브랜치
`feat/203-topic-insight-detail`)에 이어서 작업한다. 설계문서: `docs/designs/198-news-insights.md`.
디자인 정본: `/Users/sleepyowl/Downloads/topic-insight.png`(사용자 제공).

## Task Summary

라운드1에서 1차 라이브 3패널(요약 헤더·추이·근거)+반대 관점만 세로 스택으로 배치했다. 디자인은
3열 고밀도 대시보드이며 2·3차 패널까지 포함한 완성 화면이다. 이번 라운드는 **개요 셸(#199)과 동일한
방식**으로 전체 대시보드 그리드를 갖추되, 1차 패널은 라이브로 두고 2·3차 패널은
**placeholder(자리 + 단계 안내)**로 채운다. 가짜 데이터는 만들지 않는다.

## Goal

- 토픽 상세 페이지가 디자인의 3열 대시보드 그리드 배치를 따른다.
- 요약 헤더가 디자인처럼 재배치된다: 토픽 아이콘·제목·태그(좌) / 종합 영향도·감성 방향·신뢰도 stat
  블록 / 영향 종목 칩 / 우상단 액션 버튼 / 하단 AI 요약 한 줄.
- 1차 라이브 패널(인사이트 요약·감성/언급 추이·관련 근거·반대 관점)은 기능 유지.
- 2·3차 패널(키워드 관계망·투자자 반응·종목 민감도·자금 흐름 시나리오·왜 이런 인사이트·액션
  체크리스트)은 placeholder로 자리만 확보하고 단계·이슈를 안내한다.

## Background

- **개요 셸(#199)의 placeholder 패턴을 재사용한다.** `src/pages/ui/NewsInsightsOverviewPage.tsx`의
  `PlannedPanelCard`(대시보드 dashed 카드 + `phase · issue` Badge + 설명 + "구현 예정")가 기준이다.
  중복을 피하기 위해 이 카드를 공용 컴포넌트(`src/widgets/PlannedPanelCard/` 또는
  `src/shared/ui`)로 **추출**하고, 개요 페이지도 그 공용 컴포넌트를 쓰도록 교체한다(동작·표기 동일
  유지, 스냅샷/테스트 깨지지 않게).
- BE 계약 현황: 2·3차 패널 중 `/topics/{id}/graph`(키워드 관계망)·`/investor-flows`(투자자 반응)·
  `/topics/{id}/symbols`(종목 민감도)는 dev에 있으나 **이번 라운드에서는 연동하지 않고 placeholder**로
  둔다(2차 이슈 #264·#265에서 연동). 자금 흐름 시나리오·Agent 프로세스는 BE 계약이 없어 3차까지 무조건
  placeholder다.
- 헤더 stat 매핑(라운드1 adapter 재사용): 종합 영향도=`scores.impact`(×100, "78/100" 형태·라벨),
  감성 방향=`scores.sentiment` 방향/라벨(상승·하락 화살표는 점수 기준 시각 표현), 신뢰도=
  `scores.confidence`(×100·%). 라운드1의 점수 오인 방지 문구는 유지한다.
- 액션 버튼: `+ 알림 생성`→`appRoutePaths.alerts`, `판단 기록 연결`→`appRoutePaths.decisionLog`,
  `관련 종목 보기`→첫 영향 종목의 `/research/:symbol`(없으면 비활성). `포트폴리오 영향 보기`는 대상
  라우트가 불명확하면 비활성 + 툴팁("준비 중")으로 둔다. 존재하지 않는 라우트를 만들지 마라.
- 디자인의 추이 7/30/90일 토글은 **시각 토글만** 두되 현재 데이터는 7일 고정이므로 30/90은 비활성
  또는 "준비 중" 처리한다(BE window 파라미터화는 후속). 없는 데이터를 만들지 마라.

## Implementation Scope

- `src/pages/ui/TopicInsightDetailPage.tsx` — 3열 대시보드 그리드로 재구성. 1차 위젯 배치 + 2·3차
  placeholder 카드 배치. 디자인 배치 순서:
  - 1행: 인사이트 요약(라이브) · 감성·언급 추이(라이브) · 키워드 관계망(2차 placeholder)
  - 2행: 관련 근거(라이브) · 투자자 반응(2차 placeholder) · 예상 자금 흐름 시나리오(3차 placeholder)
  - 3행: 왜 이런 인사이트(3차 placeholder) · 액션 체크리스트(3차 placeholder) · 반대 관점(라이브)
  - 반응형: 좁은 폭에서는 1열로 스택.
- `src/widgets/TopicSummaryHeader/TopicSummaryHeader.tsx` — 헤더를 디자인 배치로 재구성(stat 블록·
  영향 종목 칩·우상단 액션 버튼·하단 AI 요약 한 줄). 인사이트 요약(왜 중요·핵심 근거·주의 포인트)은
  헤더에서 분리해 **별도 위젯**(`src/widgets/TopicInsightSummary/`)으로 뽑아 1행 좌측 패널에 놓는다.
  반대 관점(`CounterViewPanel`)도 헤더 내부에서 빼내 3행 우측에 독립 배치한다.
- `src/widgets/PlannedPanelCard/`(신규 공용) — 개요에서 추출. `src/pages/ui/NewsInsightsOverviewPage.tsx`도
  이 공용 컴포넌트를 쓰도록 교체.
- 필요 시 `src/features/news-insights/adapters.ts`에 감성 방향 라벨/화살표용 파생 필드 추가(라운드1
  presentation 맵 재사용, 점수 재계산·창작 금지).

## Out of Scope

- 2·3차 패널의 실제 API 연동(그래프·투자자·민감도·시나리오·Agent·액션). 이번엔 placeholder만.
- BE 계약 변경. 새 npm 의존성 추가. 새 라우트 생성.
- 추이 window/interval 실제 파라미터화(30/90일 데이터 로딩).

## Protected Files

없음.

## Requirements

- 개요 셸과 표기·톤이 일관된 placeholder(단계·이슈 Badge, "구현 예정" 안내).
- 1차 라이브 패널의 기존 동작(독립 query·부분 실패·loading/error/empty·cursor 더보기·점수 오인 방지·
  사실/분석 분리·반대 관점 상시 노출)을 회귀 없이 유지한다.
- 색상만으로 상태 표현 금지 — 텍스트 배지 병기(기존 원칙).
- 데스크톱 고밀도 우선, 좁은 폭 1열 스택 반응형.
- 존재하지 않는 라우트로 이동하는 버튼을 만들지 않는다(비활성+안내로 처리).
- 없는 수치·데이터를 만들지 않는다(placeholder는 데이터 없이 안내만).

## Test Requirements

- 페이지 테스트: 1차 라이브 패널 렌더 + 2·3차 placeholder(단계·이슈 안내) 노출, 패널별 부분 실패 유지.
- 헤더 테스트: stat 블록(영향도·감성·신뢰도)·영향 종목 칩·액션 버튼 렌더 및 네비게이션 호출.
- 추출한 `PlannedPanelCard` 공용 컴포넌트 및 개요 페이지 회귀 테스트 통과.
- 기존 테스트를 약화하지 않는다(개요·상세 스냅샷/문구 변경 시 테스트 동기화).

## Verification Commands

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Documentation Impact

- `docs/designs/198-news-insights.md`의 화면-API 매핑과 단계 구분에 부합(1차 라이브·2·3차 placeholder).
  이탈 시 문서 먼저 갱신. ADR·Failure Record 불요(기존 셸 패턴 확장).

## ADR Need

불요. 개요 셸의 placeholder 패턴을 상세에 동일 적용하는 배치 변경이다.

## Failure Record Need

불요.

## Risk Level

Medium — 헤더·페이지 대규모 재배치와 공용 컴포넌트 추출로 표면적이 넓다. 1차 라이브 패널 회귀와
개요 페이지 placeholder 교체 회귀가 핵심 리스크.

## Expected Output

- 재배치된 상세 페이지·재구성 헤더·분리된 인사이트 요약/반대 관점 위젯·공용 `PlannedPanelCard`·개요
  교체·테스트 커밋(한국어 메시지). PR #275에 이어지는 커밋으로 push는 하지 마라.
- 검증 5종 결과 보고.

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
- 현재 체크아웃된 브랜치(feat/203-topic-insight-detail)를 유지한다(자체 브랜치 생성·push·PR 금지).
