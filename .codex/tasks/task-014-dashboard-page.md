# Codex Handoff Task

## Source Issue

이슈 7 — Dashboard(AI 투자 관제실) 페이지. 설계 기록: `docs/designs/7-dashboard-page.md`. 시안:
`~/Downloads/dashboard.png`. PR은 `Closes #7`.

## Task Summary

`/`(index) 플레이스홀더 `DashboardPage`를 시안 기반 실제 대시보드로 교체한다. 대시보드는 관심 종목·시그널·
판단 기록을 한 화면에 모으는 집계 허브다. 신규 데이터는 최소화하고 기존 mock을 재사용하되, 시안 충실을 위해
도메인을 소폭 확장한다(Part A) 후 페이지를 구현한다(Part B).

## Goal

완료 시 참이어야 하는 것:

- `/`가 시안 구조의 실제 대시보드를 렌더한다: 헤더 "AI 투자 관제실" + AI Today Brief 카드 4 + 관심 종목 상태
  테이블 + AI 브리핑 + 우선 확인 큐 + 시그널 상위 3 + 최근 판단 기록.
- 관심 종목 상태가 종목별 PER/PEG를 표시하고, Today Brief 카드가 "전일 대비 +N" 델타를 표시한다.
- 공통 `Card`·`Badge`·`Table`·`Button`을 재사용하고, 미니 시각요소는 인라인 SVG·CSS로만 그린다(차트
  라이브러리 도입 금지).
- `format:check`/`lint`/`typecheck`/`TZ=UTC test`/`build` 전부 통과.

## Background

- FSD 구조(app→pages→widgets→features→entities→shared). 페이지는 `src/pages/ui/`.
- 라우팅: `/`(index) → `DashboardPage`(`src/app/router.tsx`). 페이지는 `AppShell` 안에서 렌더되며 상단에는
  전역 `MarketSummary` 위젯이 이미 붙는다 — **대시보드 페이지에서 시장 요약을 다시 만들지 말 것**.
- 확정 결정(2026-06-22): ① 핵심 지표 = PER/PEG 숫자(`Stock` 확장) ② Today Brief 델타 표시(`DashboardSummary`
  확장) ③ 미니 시각요소 = 자체 SVG·CSS, 차트 라이브러리는 이슈 19 ④ 시장 요약 위젯은 범위 밖.
- enum 패턴: `as const` 배열 + 파생 union. Mock은 `satisfies <Type>[]`로 컴파일타임 완전성 보장 →
  필수 필드 추가 시 모든 mock 항목을 채워야 한다(파괴적 변경 회피).
- `Badge`는 `status`/`riskLevel`/`tone`/`decisionType` 오버로드를 가진다(기존 컴포넌트 재사용, 인라인 색상
  복제 금지). 종목 링크는 `/research/:symbol`, 행/카드 네비게이션과 분리가 필요하면 `stopPropagation`.
- 공통 `Table<T>`(task-006): columns(key/header/cell/align), rows, getRowKey, onRowClick, emptyMessage,
  aria-label. 4행이라 페이지네이션 불필요.
- 타임존: 로컬 KST, CI UTC. 모든 `Intl.DateTimeFormat`에 `timeZone: 'Asia/Seoul'` 명시. 시점 의존 로직
  금지(정렬은 고정 mock `createdAt` 기준). `TZ=UTC pnpm test`로 재현·검증.
- `src/index.css` `@theme` 토큰은 **추가만** 가능(보호 성격). 이번 작업은 기존 app-*/status-* 토큰으로 충분 —
  신규 토큰 없이 구현할 것.

## Implementation Scope

### Part A — 도메인·Mock 확장

- `src/shared/model/domain.ts`:
  - `Stock`에 `per: number`, `peg: number` 추가(필수).
  - `DashboardSummary`에 델타 표시 필드 4종 추가: `riskAlertDelta`, `importantNewsDelta`,
    `reviewSignalDelta`, `cashRatioDelta`(각 표시 문자열, 예 `'전일 대비 +1'`).
  - `PriorityQueueItem`에 `title: string` 추가(필수).
  - `AiBriefing`에 `riskHeadline?: string`, `riskChecks?: string[]` 추가(**선택 필드**).
- `src/shared/mock/domain.ts`:
  - `mockStocks` 4종에 `per`/`peg` 채움. 시안값: NVDA PER 60.3 / PEG 1.32, AAPL 28.7 / 2.36,
    TSLA 88.1 / 3.04, MSFT 31.6 / 2.36.
  - `mockDashboardSummary` 값을 시안에 맞춤: `riskAlertCount 3`, `importantNewsCount 8`,
    `reviewSignalCount 5`, `cashRatio 22.7` + 델타(`전일 대비 +1`/`+2`/`+1`/`+1.3%p`).
  - `mockAiBriefing` 한국어 재작성(body 시장 요약 문단) + `riskHeadline: '신규 매수 전 리스크 검토'` +
    `riskChecks` 3~4개 한국어 불릿.
  - `mockPriorityQueue` 3종에 한국어 `title`(예 "테슬라 뉴스 감성 급락") 부여 + `reason` 상세 한국어
    재작성 + `risk`(높음/중간/중간). symbol은 기존 종목 유지.
  - 전부 `satisfies` 유지.
- 위 mock(`mockDashboardSummary`/`mockAiBriefing`/`mockPriorityQueue`)은 현재 어느 페이지/위젯에서도
  미사용 → 자유 재작성 안전. `AiBriefing`의 신규 필드는 선택이라 `mockStockResearch`의 인라인 briefing은
  변경 불필요.

### Part B — DashboardPage 구현

- `src/pages/ui/DashboardPage.tsx` 전면 재작성(플레이스홀더 제거):
  - 헤더 "AI 투자 관제실"(`<h1>`/heading role).
  - **AI Today Brief**: `Card` 4. 라벨·아이콘·톤은 페이지 상수, 값·델타는 `mockDashboardSummary` 파생.
    미니 시각요소는 인라인 SVG 스파크라인/CSS 막대/SVG 도넛(경량, 데코용 `aria-hidden`).
  - **관심 종목 상태**: 공통 `Table<Stock>`(`mockStocks` 상위 4). 컬럼 종목(이름+심볼,
    `/research/:symbol` Link) · 상태(`Badge status`) · 변화(1D)(changePercent 부호 색) · 핵심 지표
    (changeSeries 스파크라인 SVG + `PER {per}` / `PEG {peg}`). aria-label "관심 종목 상태".
    푸터 "더 많은 종목 보기" → `/watchlist`.
  - **AI 브리핑**: `Card`. body 문단 + riskHeadline + riskChecks 불릿. "자세히 보기"(자리표시 링크).
  - **우선 확인 큐**: `Card`. 순번 뱃지 + title + reason + `Badge riskLevel`. "전체 큐 보기" → `/alerts`.
  - **시그널**: `mockSignals` priority 오름차순 상위 3. status `Badge` + 신뢰도 숫자 + 근거(reasons 상위
    1~2) + 관련 종목. "전체 시그널 보기" → `/signals`.
  - **최근 판단 기록**: 공통 `Table<DecisionLog>` 또는 목록. `mockDecisionLogs` createdAt 내림차순 상위
    3~4. 시간 · 종목(Link) · 판단(`Badge decisionType`) · 요약(decision 말줄임). "전체 기록 보기" →
    `/decision-log`.
  - 시간 표시 포매터는 `timeZone: 'Asia/Seoul'` 고정.

## Out of Scope

- 시장 요약 위젯(`MarketSummary`) 변경 — 전역 공유 셸. 이번 범위 아님.
- 차트 라이브러리 도입(캔들·거래량 등) — 이슈 19.
- "자세히 보기"·필터 등 자리표시 동작의 실제 구현.
- 다른 페이지(Watchlist/Signals/Research/Decision Log) 로직 변경(도메인 타입 확장 외).

## Protected Files

없음. `src/index.css` `@theme`는 추가만 허용이나 이번 작업은 기존 토큰으로 충분 → **변경 없음**.

## Requirements

- 공통 컴포넌트 재사용(`Card`/`Badge`/`Table`/`Button`/`Link`), 인라인 색상·뱃지 스타일 복제 금지.
- 네이티브 다이얼로그 금지(이번 페이지는 폼/검증 없음, 해당 시 인앱 UI).
- 신규 `@theme` 토큰 없이 기존 app-*/status-* 토큰으로 구현.
- 필수 필드 추가 후 모든 mock 항목 채워 `typecheck` 통과(satisfies).
- 모든 시간 포매터 `timeZone: 'Asia/Seoul'` 고정, 시점 의존 로직 금지.

## Test Requirements

- `src/App.test.tsx`: 대시보드 heading 단언을 `Market Command Center` → `AI 투자 관제실`로 갱신.
- `src/pages/ui/DashboardPage.test.tsx` 신규(`createMemoryRouter` + `appRouteObjects`, `initialEntries: ['/']`):
  - 헤딩 "AI 투자 관제실".
  - Today Brief 4값(위험 증가 종목 3 / 중요 뉴스 8 / 검토 시그널 5 / 현금 비중 22.7%) 및 델타 1건 이상.
  - 관심 종목 상태 테이블에서 NVDA Link href `/research/NVDA`, PER/PEG 텍스트, 상태 Badge.
  - 우선 확인 큐 title + 위험도 Badge.
  - 시그널 상위 3과 신뢰도.
  - 최근 판단 기록 종목·판단유형.
  - 섹션 링크 목적지(더 많은 종목 보기 → /watchlist, 전체 시그널 보기 → /signals, 전체 기록 보기 →
    /decision-log).
  - 시간 문자열 단언 회피(타임존 비의존).

## Verification Commands

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `TZ=UTC pnpm test`
- `pnpm build`

(포맷 위반 시 변경 파일에 한해 `pnpm format` 후 재확인.)

## Documentation Impact

- 설계 `docs/designs/7-dashboard-page.md`·본 핸드오프는 브랜치에 이미 커밋됨.
- `src/shared/README.md`에 dashboard fixture 확장(Stock per/peg, DashboardSummary 델타, AiBriefing
  riskChecks, PriorityQueueItem title)을 한 줄 반영.

## ADR Need

불필요. 기존 FSD·도메인 점진 확장, 신규 아키텍처 결정 없음.

## Failure Record Need

불필요. 신규 페이지 구현, 알려진 실패 패턴 재발 아님(타임존 가이드는 본 task에 반영).

## Risk Level

Medium. 이유: `Stock`·`DashboardSummary`·`PriorityQueueItem` 필수 필드 추가(파괴적 변경 — mock 전수 채움
필요), `App.test` 단언 갱신, 다수 영역 집계. 단 신규 페이지·로컬 데이터라 외부 영향은 제한적.

## Expected Output

- 변경 파일: `src/shared/model/domain.ts`, `src/shared/mock/domain.ts`, `src/pages/ui/DashboardPage.tsx`,
  `src/pages/ui/DashboardPage.test.tsx`(신규), `src/App.test.tsx`, `src/shared/README.md`. 필요 시
  `src/shared/mock/domain.test.ts`(per/peg·델타 검증 보강).
- PR 본문에 `Closes #7`. 검증 명령 결과 요약 포함.

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
