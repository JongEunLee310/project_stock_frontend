# 이슈 7 — Dashboard(AI 투자 관제실) 페이지 설계

`/`(index) 플레이스홀더 `DashboardPage`를 시안 기반 실제 화면으로 교체한다. 대시보드는 다른 영역
(관심 종목·시그널·판단 기록)을 한 화면에 모으는 **집계 허브**이며, 신규 데이터는 최소화하고 기존 mock을
재사용한다. 시안: `~/Downloads/dashboard.png`.

## 범위 결정 (2026-06-22 확정)

- **핵심 지표 = PER/PEG 숫자**: 관심 종목 상태 테이블의 "핵심 지표" 칸을 시안대로 종목별 PER/PEG로
  표시한다. → `Stock`에 `per`·`peg`(숫자) 추가, `mockStocks` 4종 전수 채움(파괴적 변경 주의, satisfies 유지).
- **Today Brief 델타 표시**: 상단 4개 카드에 "전일 대비 +N" 델타를 시안대로 노출한다. → `DashboardSummary`에
  델타 표시 필드 추가.
- **미니 시각요소 = 자체 SVG·CSS**: 카드 스파크라인/막대/도넛, 관심 종목 스파크라인은 인라인 SVG·CSS로만
  그린다. 차트 라이브러리는 **이슈 19**로 분리(도입 금지). (Research/Signals/Decision Log 선례 일치.)
- **시장 요약은 범위 밖**: 시안 사이드바의 시장 지수(S&P/NASDAQ/KOSPI/VIX)는 이미 전역 `MarketSummary`
  위젯으로 존재(모든 페이지 상단). 공유 셸 변경은 이번 범위에서 제외(후속 가능).

## 레이아웃

페이지 헤더 "AI 투자 관제실" → 상단 **AI Today Brief**(stat 카드 4) → 본문 2열 그리드.

- **상단 AI Today Brief (카드 4)**: 위험 증가 종목 · 중요 뉴스 · 검토 시그널 · 현금 비중. 각 카드 =
  아이콘·라벨·값·델타 + 미니 시각요소(위험 빨강 스파크라인 / 뉴스 막대 / 시그널 노랑 스파크라인 / 현금
  도넛). `mockDashboardSummary` 파생, 신규 요약 타입 없음(페이지 상수로 라벨·톤 구성).
- **본문 상단 행**:
  - 좌(넓음) **관심 종목 상태**: 공통 `Table<Stock>` 재사용. 컬럼 = 종목(이름+심볼, `/research/:symbol`
    Link) · 상태(`Badge status`) · 변화(1D)(changePercent 부호 색) · 핵심 지표(스파크라인 SVG + `PER`/`PEG`).
    상위 4종, 페이지네이션 없음. 푸터 "더 많은 종목 보기" → `/watchlist` Link.
  - 우(좁음) **AI 브리핑**: `Card`. `mockAiBriefing.body` 문단 + `riskHeadline` + `riskChecks` 불릿.
    "자세히 보기"(자리표시 링크).
  - 우(좁음) **우선 확인 큐**: `Card`. `mockPriorityQueue` 순번 뱃지 + title + reason + `Badge riskLevel`.
    "전체 큐 보기" → `/alerts` Link.
- **본문 하단 행**:
  - 좌 **시그널**: `mockSignals` priority 오름차순 상위 3 카드. status `Badge` + 신뢰도(confidence) +
    근거(reasons 상위) + 관련 종목. "전체 시그널 보기" → `/signals` Link.
  - 우 **최근 판단 기록**: `mockDecisionLogs` createdAt 내림차순 상위 3~4. 컬럼 시간 · 종목(Link) ·
    판단(`Badge decisionType`) · 요약(decision 말줄임). "전체 기록 보기" → `/decision-log` Link.

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

- `App.test.tsx`: 대시보드 heading 단언 `Market Command Center` → `AI 투자 관제실`로 갱신(라우팅 선례 허용).
- `DashboardPage.test.tsx`(신규): 헤딩 / Today Brief 4값·델타 / 관심 종목 상태 NVDA Link href·PER·PEG·상태 /
  우선 확인 큐 title·위험도 / 시그널 상위 3·신뢰도 / 최근 판단 기록 종목·판단유형 / 섹션 링크 목적지.

## 비범위 / 후속

- 차트 라이브러리(캔들·거래량) = 이슈 19.
- 시장 요약 위젯 시안 정밀 개편(KOSPI 추가·등락 색) = 후속(공유 셸).
- "자세히 보기"·필터 등 자리표시 동작 = 후속.
