# 이슈 7 — Dashboard(AI 투자 관제실) 페이지 설계

`/`(index) 플레이스홀더 `DashboardPage`를 시안 기반 실제 화면으로 교체한다. 대시보드는 다른 영역
(관심 종목·시그널·판단 기록)을 한 화면에 모으는 **집계 허브**이며, 신규 데이터는 최소화하고 기존 mock을
재사용한다. 시안: `~/Downloads/dashboard.png`.

## 범위 결정 (2026-06-22 확정)

- **핵심 지표 = PER/PEG 숫자**: 관심 종목 상태 테이블의 "핵심 지표" 칸을 시안대로 종목별 PER/PEG로
  표시한다. → `Stock`에 `per`·`peg`(숫자) 추가, `mockStocks` 4종 전수 채움(파괴적 변경 주의, satisfies 유지).
- **Today Brief 델타 표시**: 상단 4개 카드에 "전일 대비 +N" 델타를 시안대로 노출한다. → `DashboardSummary`에
  델타 표시 필드 추가.

## 시안 충실화 재결정 (2026-06-22, 1차 구현 후 시안 재대조)

1차 구현(PR #36)이 시안과 다수 상이해 시안 충실도를 우선해 두 결정을 갱신한다.

- **미니 시각요소 = `recharts` 도입(이전 결정 뒤집음)**: Today Brief 카드의 스파크라인/막대/도넛과 관심 종목
  스파크라인을 `recharts`(LineChart/BarChart/PieChart)로 그린다. 자체 인라인 SVG는 시안의 곡선/막대/도넛
  품질을 재현하기 어려워 라이브러리를 도입한다. 데코용은 `aria-hidden`, 종목 스파크라인은 `role="img"` +
  `aria-label` 유지. (이슈 19 경계는 캔들·거래량 등 **본격 분석 차트** 기준으로 재정의.)
- **시장 요약 위젯 시안 개편(범위 안으로)**: 시안의 사이드바 하단 시장 요약을 그대로 반영한다. →
  `MarketSummary`를 `AppShell` 메인에서 사이드바 하단(`mt-auto`)으로 이동, KOSPI 추가(S&P/NASDAQ/KOSPI/VIX
  4종), 값+등락률+등락 색(상승 emerald / 하락 rose), "데이터 기준 14:31 KST" 캡션. 셸 리디자인과 함께 처리.
- **셸 리디자인 동반**: 시안의 관제 콘솔 톤에 맞춰 사이드바(아이콘 + 한국어 라벨 + alerts 뱃지 + "Insight
  Cockpit AI" 브랜딩)·탑바(동기화 상태·알림·도움말·프로필)·`@theme` 색/spacing 토큰을 조정한다.

## 레이아웃

페이지 헤더 "AI 투자 관제실" → 상단 **Today Brief**(카드 4) → 3열 행 → 2열 행. (시장 요약은 페이지가 아닌
사이드바 하단에 위치 — 셸 영역.)

- **상단 Today Brief (카드 4, `Card` 안 4분할)**: 위험 증가 종목 · 중요 뉴스 · 검토 시그널 · 현금 비중. 각
  카드 = 아이콘·라벨·값·델타 + 미니 시각요소(위험 rose 스파크라인 / 뉴스 막대 / 시그널 amber 스파크라인 /
  현금 도넛, `recharts`). `md:grid-cols-2 xl:grid-cols-4`. `mockDashboardSummary` 파생, 신규 요약 타입 없음.
- **본문 상단 행 (`xl:grid-cols-[1.15fr_0.95fr_1fr]`)**:
  - **관심 종목 상태**: 공통 `Table<Stock>` 재사용. 컬럼 = 종목(이름+심볼, `/research/:symbol` Link) ·
    상태(`Badge status`, `dashboardStatusBySymbol` 오버라이드) · 변화(1D)(changePercent 부호 색) · 핵심
    지표(`recharts` 스파크라인 + `PER`/`PEG`). 상위 4종. 푸터 "더 많은 종목 보기" → `/watchlist` Link.
  - **AI 브리핑**: `Card`. 본문 문단 + `riskHeadline` 권고문 + `riskChecks` 불릿. "자세히 보기"(자리표시 링크).
  - **우선 확인 큐**: `Card`. `mockPriorityQueue`를 위험도(높음>중간>낮음) 순 정렬, 순번 뱃지 + title +
    reason + `Badge riskLevel`. "전체 큐 보기" → `/alerts` Link.
- **본문 하단 행 (`xl:grid-cols-[1.45fr_1fr]`)**:
  - 좌 **시그널**: `mockSignals` priority 오름차순 상위 3 카드. status `Badge` + 신뢰도(confidence) +
    근거(reasons 상위) + 관련 종목. "전체 시그널 보기" → `/signals` Link.
  - 우 **최근 판단 기록**: `mockDecisionLogs` createdAt 내림차순 상위 3. 컬럼 시간 · 종목(Link) ·
    판단(`Badge decisionType`) · 요약(decision 말줄임). "전체 기록 보기" → `/decision-log` Link.

## 셸 변경 (시안 충실화 동반)

- **`Sidebar`**: 항목별 아이콘 + 한국어 라벨(`navIcons`/`navLabels`), alerts 뱃지("6"), "Insight Cockpit AI"
  브랜딩. 하단 `mt-auto`에 `MarketSummary` 배치.
- **`MarketSummary`**: `AppShell` 메인 → 사이드바 하단 이동. KOSPI 추가(4종), 값+등락률+등락 색, 캡션.
  `aria-label`을 `Market summary` → `시장 요약`으로 변경(App.test 동반 갱신).
- **`Topbar`**: 동기화 상태·새로고침·알림·도움말·프로필 아바타로 한국어 재구성.
- **`AppShell`**: 메인에서 `MarketSummary` 제거, 그리드/패딩 조정.
- **`src/index.css` `@theme`**: 관제 콘솔 톤에 맞춰 app-* 색/`--spacing-page` 값 조정.

## 도메인·Mock 확장 (Part A)

| 대상 | 변경 | 비고 |
| --- | --- | --- |
| `Stock` | `per: number`, `peg: number` 추가 | 필수. `mockStocks` 4종 전수 채움(시안값). Watchlist 도메인 공유 — 표시는 안 하나 타입 확장. |
| `DashboardSummary` | 델타 표시 필드 4종 추가 | 예: `riskAlertDelta`·`importantNewsDelta`·`reviewSignalDelta`·`cashRatioDelta`(표시 문자열). |
| `PriorityQueueItem` | `title: string` 추가 | 필수. `mockPriorityQueue` 3종 채움. reason은 상세 설명으로 유지. |
| `AiBriefing` | `riskHeadline?`·`riskChecks?: string[]` 추가 | **선택 필드**(StockResearch.briefing 인라인 객체 무변경). `mockAiBriefing`만 채움. |

Mock 갱신: `mockDashboardSummary` 값을 시안에 맞춤(위험 3 / 뉴스 8 / 시그널 5 / 현금 22.7%) + 델타.
`mockAiBriefing` 한국어 재작성 + riskHeadline/riskChecks. `mockPriorityQueue` 한국어 title/reason + 위험도.
(세 mock 모두 현재 어떤 페이지/위젯에서도 미사용 → 자유 재작성 안전.) 전부 `satisfies` 유지.

## 시간·결정성

표시 시간 포매터는 `timeZone: 'Asia/Seoul'` 고정. 최근 판단 기록 정렬은 고정 mock `createdAt` 기준(현재
시각 비의존). 테스트는 종목·판단유형·수치 라벨로 단언(시간 문자열 단언 회피). `TZ=UTC pnpm test`로 검증.

## 테스트

- `App.test.tsx`: 대시보드 heading 단언 `Market Command Center` → `AI 투자 관제실` 갱신, 셸 리디자인 동반으로
  사이드바 nav 링크 단언(`Watchlist`→`/관심종목/`, `Research`→`/리서치/`) 및 시장 요약 라벨(`시장 요약`) 갱신.
- `DashboardPage.test.tsx`(신규): 헤딩 / Today Brief 4값·델타 / 관심 종목 상태 NVDA Link href·PER·PEG·상태
  (NVDA `관망`) / 우선 확인 큐 title·위험도 / 시그널 상위 3·신뢰도 / 최근 판단 기록 종목·판단유형 / 섹션 링크.

## 비범위 / 후속

- 차트 라이브러리 **본격 분석 차트**(캔들·거래량·비교) = 이슈 19. (대시보드 미니 시각요소용 `recharts`는 본
  작업에 포함.)
- "자세히 보기"·필터 등 자리표시 동작 = 후속.
- 색상 토큰화: 등락 emerald/rose·카테고리 톤은 여전히 원시 Tailwind 색 사용 → `@theme` app-* 토큰 통일 후속.
