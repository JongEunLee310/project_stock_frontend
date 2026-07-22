# Codex Handoff Task

## Source Issue

JongEunLee310/project_stock_frontend#264 — FE: 투자자 동향·투자자 반응 패널 (에픽 #198 2차).
설계문서: `docs/designs/198-news-insights.md`. BE 계약: `project_stock`의
`GET /api/v1/news-insights/investor-flows`(dev 머지 완료).

## Task Summary

개요 "투자자 동향"(§3.5)과 토픽 상세 "투자자 반응"(§5.7) 두 패널을 `/investor-flows`에 연동한다.
개요는 시장 전체(market-wide), 토픽 상세는 토픽 종목군 기준(topic_id 전달)이다. 공용 위젯을
파라미터화해 두 화면에서 재사용한다.

## Goal

- 개요 페이지의 "투자자 동향" placeholder를 실데이터 위젯으로 교체한다(market="KR", window="7d").
- 토픽 상세 페이지의 "투자자 반응" placeholder를 실데이터 위젯으로 교체한다(market="KR",
  window="7d", topic_id).
- 투자 주체별(외국인·기관·개인·ETF) 순매수/순매도, 전일 대비 변화, 뉴스 내러티브 vs 수급 방향
  **불일치 신호**를 표시한다.
- 데이터 미제공 시장은 빈 숫자 추정 금지 — availability로 대체 지표 안내를 명시한다.
- 패널별 독립 query·부분 실패(loading·error·empty).

## Background

- 두 placeholder 위치:
  - 개요 `src/pages/ui/NewsInsightsOverviewPage.tsx` — `plannedPanels` 배열의 `investor-flow`
    (투자자 동향, #264). 이 항목을 배열에서 제거하고 실제 위젯을 배치한다(나머지 placeholder는 유지).
  - 토픽 상세 `src/pages/ui/TopicInsightDetailPage.tsx` — `plannedPanels.investorReaction`
    (투자자 반응, #264). 제거하고 실제 위젯을 배치한다.
- FE 데이터 패턴: `src/features/news-insights/`(dto·adapters·queries)에 investor-flows query
  (`useNewsInvestorFlowsQuery({ market, window, topicId? })`)를 추가한다. enum 라벨/톤은 기존
  presentation 맵 재사용/확장(InvestorType·FlowDirection 라벨).
- **금액(net_value)은 Decimal 문자열**이다. `src/shared/lib/format`의 `parseDecimal`·`formatMoney`로
  표기하고 float 산술을 하지 마라(정밀도 손실 금지).
- 색상 의미 고정: 유입/순매수=초록, 유출/순매도=빨강 + **텍스트 배지 병기**(색만으로 표현 금지).

### BE 응답 계약 (ApiResponse envelope, snake_case)

- `GET /investor-flows?market={m}&window={w}&topic_id={id}` — **market·window 필수**(window 패턴
  `^[1-9]\d*[hd]$`, 예 "7d"), topic_id optional. market은 서버에서 upper-case 정규화됨.
- 응답 `InvestorFlowsResponse`:
  `as_of`·`by_investor_type`[{`investor_type`(FOREIGN|INSTITUTION|RETAIL|ETF)·`net_value`(Decimal
  문자열)·`direction`(BUY|SELL|NEUTRAL)·`change`(float, 전일 대비 증감률)}]·
  `narrative_alignment`{`aligned`(bool)·`note`}·`availability`{`available`(bool)·`fallback`(str|null)}.
- **계약에 없는 지표(거래량·공매도 등)는 만들지 마라.** 토픽 상세의 ETF 흐름은 `by_investor_type`의
  ETF 항목으로, 대체 지표 안내는 `availability.fallback`로 표기한다.

## Implementation Scope

- `src/features/news-insights/dto.ts`·`adapters.ts`·`queries.ts` — investor-flows dto·adapter
  (`adaptNewsInvestorFlows`)·query 추가. InvestorType·FlowDirection presentation 맵.
- `src/widgets/InvestorFlowPanel/`(신규 공용) — 주체별 순매수/순매도 막대·수치(금액 문자열 포맷)·전일
  대비 변화·내러티브 정렬(불일치 신호) 배지·availability 안내. props로 `{ market, window, topicId?,
  title, context }` 등을 받아 개요·상세에서 재사용. 독립 loading·error·empty.
- `src/pages/ui/NewsInsightsOverviewPage.tsx` — 투자자 동향 placeholder → `InvestorFlowPanel`
  (market-wide). `plannedPanels`에서 investor-flow 항목 제거.
- `src/pages/ui/TopicInsightDetailPage.tsx` — 투자자 반응 placeholder → `InvestorFlowPanel`
  (topicId 전달). `plannedPanels.investorReaction` 제거.

## Out of Scope

- 자금 흐름 시나리오(#267)·설명(#268) 등 3차 패널. 폴링 갱신(#266). market/window 선택 UI(고정값).
- 새 npm 의존성. BE 계약 변경. 계약에 없는 거래량·공매도 지표 추가.

## Protected Files

없음.

## Requirements

- 순매수/순매도 방향을 색(초록/빨강)과 텍스트 배지로 함께 표현. 금액은 Decimal 문자열 포맷(float 금지).
- 뉴스 내러티브 vs 수급 방향 **불일치 신호**(narrative_alignment.aligned=false)를 문구로 명시.
- availability.available=false면 빈 숫자 추정 금지, fallback 안내 문구 노출.
- 두 화면에서 공용 위젯 재사용, 각각 독립 query·부분 실패(패널만 오류, 페이지 유지).
- BE 계산값 그대로 렌더, 없는 지표 창작 금지.

## Test Requirements

- investor-flows query·adapter 단위 테스트(성공·오류·빈 데이터·availability=false·정렬 불일치).
- `InvestorFlowPanel` 위젯 테스트: 주체별 항목·방향 배지·금액 포맷·불일치 신호·fallback 안내.
- 개요·토픽 상세 페이지 테스트: placeholder → 라이브 패널 교체, 나머지 placeholder 유지, 부분 실패.
- 기존 테스트를 약화하지 않는다(개요·토픽 상세 스냅샷/문구 동기화).

## Verification Commands

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Documentation Impact

- 설계문서 `docs/designs/198-news-insights.md` 화면-API 매핑(투자자 동향·반응 2차)과 일치. 이탈 시
  문서 먼저 갱신.

## ADR Need

불요. 기존 FSD·query 패턴을 따르는 2차 위젯 추가.

## Failure Record Need

불요.

## Risk Level

Medium — 공용 위젯을 두 화면에서 파라미터로 재사용, Decimal 문자열 포맷, availability·불일치 신호
표기가 핵심. 개요·토픽 상세 페이지 회귀에 주의.

## Expected Output

- features investor-flows query/adapter·공용 `InvestorFlowPanel`·두 페이지 교체·테스트 커밋(한국어
  메시지). PR·push는 하지 마라.
- 검증 5종 결과 보고.

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
- 현재 체크아웃된 브랜치(feat/264-investor-flows)를 유지한다(자체 브랜치 생성·push·PR 금지).
