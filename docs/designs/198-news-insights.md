# FE 설계: 뉴스·공시 인텔리전스 — 개요 + 토픽 상세 (에픽 #198)

상태: **3차 완료 · 세부 수정 진행** — 2026-07-23 갱신(최초 2026-07-21). 에픽 FE #198,
BE 에픽 `project_stock#307`(1~3차 계약 dev 머지 완료). BE 계약 정본:
`project_stock/docs/designs/307-news-intelligence.md`(1차)·`-phase2.md`(2차)·`-phase3.md`(3차).

이 문서는 뉴스·공시 인텔리전스 두 화면(개요·토픽 상세)의 FE 구조를 스켈레톤 수준으로 확정한다.
컴포넌트 배치·라우팅·화면-API 매핑·단계별 범위만 담고 구현 코드는 담지 않는다. 화면 요구사항의
출처는 사용자 제공 설계 지침(2026-07-14 확정 + 2026-07-21 보강)과 에픽 #198이다.

## 배경

두 화면은 상·하위 관계다. 개요(관제탑, `/news`)에서 시장을 훑어 토픽을 발견하고, 토픽 상세
(분석 현미경, `/news/topics/:topicId`)에서 근거·영향·반대 관점을 검증한다. 피드는 문서 나열이
아니라 **이벤트 중심**이며, 모든 AI 문장은 근거(evidence)로 되돌아갈 수 있어야 한다. 자금 흐름은
확정값이 아니라 시나리오·범위·확률로 표기한다.

## 라우팅 (`src/shared/config/navigation.ts` · `src/app/router.tsx`)

```text
/news                      개요 (사이드바 '뉴스·공시', 리서치 다음)
/news/topics/:topicId      토픽 인사이트 상세
/news/events/:eventId      이벤트 상세 (2차)
```

`appRoutePaths`에 `news`·`newsTopicDetail`·`newsEventDetail` 추가, `navigationItems`에 `news`
항목 추가(matchPrefix `/news`), `appRouteObjects`의 AppShell children에 라우트 추가.

## FSD 배치

```text
pages/ui/
  NewsInsightsOverviewPage.tsx     개요
  TopicInsightDetailPage.tsx       토픽 상세 (#203)
widgets/
  InsightSummaryCards/             상단 KPI 4종
  RealtimeEventFeed/               이벤트 중심 피드
  AgentBriefing/                   AI 브리핑
  TopicMap/                        토픽 맵 (#202)
  InvestorFlowPanel/ FundFlowOutlook/ MarketEventTimeline/ AgentPipelinePanel/  (2·3차)
  TopicSummaryHeader/ TopicTrendChart/ TopicKeywordGraph/ TopicEvidenceList/
  TopicSymbolSensitivity/ TopicScenarios/ InsightExplanation/ CounterViewPanel/  (상세)
entities/
  source-document/ market-event/ topic-cluster/ topic-insight/ evidence/ fund-flow-scenario/
features/
  topic-follow/ alert-create-from-topic/ decision-link-from-topic/
  evidence-filter/ symbol-research-navigation/
```

## 화면-API 매핑 (BE `/api/v1/news-insights`)

| UI 패널 | API | 단계 |
|---|---|---|
| 상단 KPI 4종 · AI 브리핑 | `GET /overview` | 1차 #200 |
| 실시간 이벤트 피드 | `GET /events`(cursor) | 1차 #200 |
| 토픽 맵 | `GET /topics/map` | 1차 #202 |
| 토픽 상세 헤더·요약 | `GET /topics/{id}` | 1차 #203 |
| 감성·언급 추이 | `GET /topics/{id}/trend` | 1차 #203 |
| 관련 근거 | `GET /topics/{id}/evidence` | 1차 #203 |
| 이벤트 상세 | `GET /events/{id}` | 2차 #204 |
| 투자자 동향·반응 | `GET /investor-flows` | 2차 #264 |
| 종목 민감도 · 키워드 관계망 | `GET /topics/{id}/symbols`·`/graph` | 2차 #265 |
| 캘린더 · 파이프라인 | `GET /calendar`·`/agent-runs` | 3차 #269 |
| 자금 흐름 전망·시나리오 | `GET /fund-flow-outlook`·`/topics/{id}/scenarios` | 3차 #267 |
| 설명·반대 관점 | `GET /topics/{id}/explanation` | 3차 #268 |

## 1차 단계 (이슈)

- **#199 개요 셸** — 사이드바 메뉴·`/news` 라우트·레이아웃 골격. KPI 4종·이벤트 피드·브리핑은
  로컬 mock 상수로 형태만, 나머지 패널은 자리(placeholder)+단계 안내. **계약 연동 없음.**
- **#200 개요 연결** — `/overview`·`/events` 연동, 패널별 독립 query, 부분 실패 처리.
- **#202 토픽 맵** — `/topics/map` nodes·edges 시각화(토픽 클릭 → 상세).
- **#203 토픽 상세** — `/topics/{id}`·`/trend`·`/evidence` 연동.
- **#201 종목별 뉴스 재구성** — 임시 페이지(PR #195)를 새 피드 스타일로 교체.

## 개요 화면 배치 — 관제 화면 재구성 (2026-07-23)

설계 이미지(`news-instight.png`)는 스크롤 없이 한 화면에 들어오는 관제 배치다. 패널을 그대로
세로로 쌓으면 이 성질이 사라지므로, 상시 참조가 아닌 두 패널을 화면 밖으로 빼고 나머지를
뷰포트 높이에 맞췄다.

```text
Topbar(compact, 2xl에서 본문 위에 겹침)
헤더            제목 + [파이프라인 아이콘] [+ 알림 생성] [판단 기록 연결]
KPI 4종         InsightSummaryCards(compact)
2열             RealtimeEventFeed | TopicMap
3열             InvestorFlowPanel | FundFlowOutlookPanel | MarketEventTimeline
플로팅          AgentBriefing(우하단 버튼 → 팝오버)
```

- **AgentBriefing** — 본문 패널에서 우하단 플로팅 버튼과 팝오버로 옮겼다. 버튼에 하이라이트
  개수를 배지로 노출해 접기 상태에서도 브리핑 유무를 알 수 있게 한다.
- **AgentPipelinePanel** — 본문 패널에서 헤더 아이콘 버튼과 팝오버로 옮겼다. 버튼의 상태 점이
  `has_delay`를 반영하므로 열지 않아도 지연 여부는 보인다. 팝오버 안에서는 단계 7종을 가로
  체인으로, 집계 지표를 하단 스트립으로 표시한다.
- **compact 모드** — 관제 배치에 들어가는 위젯은 `compact` prop으로 밀도를 높인 표현을 함께
  갖는다. 같은 위젯이 다른 화면에서는 기존 표현을 유지해야 하므로 별도 위젯으로 나누지 않는다.
- **2xl 뷰포트 고정** — 2xl 이상에서 개요는 페이지 스크롤 없이 뷰포트 높이에 맞춘다. 넘치는
  내용은 패널 내부에서 스크롤한다. 그 미만 폭에서는 기존대로 페이지가 흐른다.
- **정보 유지 원칙** — 밀도를 높이며 화면에서 뺀 문장(기준 시각·분석 버전 등)은 `sr-only`로
  남겨 보조 기술에서는 그대로 읽힌다. 지우지 않는다.

설계 이미지와 남은 차이는 다음과 같다. 모두 **BE 계약 부족**이 원인이며 FE 표현 문제가 아니다.

| 설계 요소 | 현재 | 원인 |
|---|---|---|
| KPI 카드 4종의 미니 추이 차트 | 수치·전일 대비만 | `SummaryMetric`에 시계열 없음(BE #387) |
| 파이프라인 집계 5종 중 3종 | `—` 표시 | 수집 소스·평균 처리 지연·정확도 계약 없음(BE #394) |
| 파이프라인 단계 6개 | 7개 | `AgentStage`가 토픽·감성을 분리(BE 계약이 정본) |

## 공통 UI 지침

- 색상 의미 고정: 초록(긍정·유입)·빨강(부정·위험)·주황(주의)·파랑(정보·활성)·보라(AI·토픽)·
  회색(중립·데이터 부족). 색만으로 상태 표현 금지 — 텍스트 배지 병기.
- 데스크톱 관제 화면 우선(정보 밀도 높음).
- 패널별 독립 query·부분 실패 허용(한 API 오류가 페이지 전체를 깨지 않음).
- 패널별 데이터 신선도(“N분 전”) 개별 표기(전 화면 단일 동기화 표시 금지).
- 사실(출처·원문)·분석(AI 배지·신뢰도·근거)·사용자 판단(Decision Log) 시각적 구분.
- 갱신 주기 차등(피드 30~60초·요약 60초·브리핑 5~15분·토픽 맵 5분·자금 흐름 30분~1일).

## ADR·실패 기록 판단

- ADR: 기존 FSD 구조·라우팅·컨벤션을 따르는 신규 화면 추가로 **불요**.
- 실패 기록: 해당 없음.
