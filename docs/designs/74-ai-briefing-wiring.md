# 74 · AI 브리핑 와이어링 (대시보드·포트폴리오)

Status: Draft
Track: FE
Pair: BE 057(`docs/designs/057-portfolio-briefing.md`)·058(`docs/designs/058-dashboard-briefing.md`)

## 1. 배경

DashboardPage의 "AI 브리핑" 카드(`mockAiBriefing`)와 PortfolioPage의 "포트폴리오 AI 브리핑"
패널(`mockPortfolio.aiBriefing`)을 BE 브리핑 API로 전환합니다. BE는 이미 두 엔드포인트를
제공합니다([[70-portfolio-risk-exposures-wiring]]·[[71-watchlist-summary-wiring]] 와이어링
선례를 따릅니다).

- `GET /dashboard/briefing`
- `GET /portfolios/{portfolio_id}/briefing`

두 응답 모두 `{ headline, body, risk_headline, risk_checks, generated_at }` 형태이며, FE
도메인 타입 `AiBriefing`(`headline`/`body`/`riskHeadline?`/`riskChecks?`)에 대응합니다. 두
화면의 출력 형태가 동일하므로 공통 adapter를 공유합니다.

## 2. 범위

### 포함

- 공통 브리핑 feature 슬라이스(`src/features/briefing/`): dto·adapter·query.
- DashboardPage: `mockAiBriefing` 사용 → `useDashboardBriefing()` 실데이터.
- PortfolioPage: `mockPortfolio.aiBriefing` 사용 → `usePortfolioBriefing()` 실데이터.

### 제외 (mock 유지 / 후속)

- `mockAiBriefing`·`mockPortfolio` 정의 자체 — 타 화면 영향 확인 전까지 `shared/mock`에
  남기고 두 페이지의 사용만 교체(71 관례).
- `generated_at` 표시 — `AiBriefing` 계약에 없으므로 화면에 노출하지 않습니다(어댑터에서
  버리거나 뷰 전용 필드로 분리, §3.2).
- research 브리핑(`ResearchPage`)·기타 mock — 본 트랙 밖.

## 3. 변경

### 3.1 dto (`src/features/briefing/dto.ts`)

- `AiBriefingDto { headline: string; body: string; risk_headline: string | null;
  risk_checks: string[]; generated_at: string }` 추가. 대시보드·포트폴리오 응답 동일 형태이므로
  단일 dto를 공유합니다.

### 3.2 adapters (`src/features/briefing/adapters.ts`)

- `adaptAiBriefing(dto: AiBriefingDto): AiBriefing` — snake_case → camelCase 매핑
  (`risk_headline → riskHeadline`, `risk_checks → riskChecks`). `risk_checks ?? []` 방어,
  `risk_headline`이 falsy면 `riskHeadline` 생략. `generated_at`은 `AiBriefing`에 없으므로
  버립니다(표시 필요 시 별도 뷰 타입으로 확장 — 후속).

### 3.3 queries (`src/features/briefing/queries.ts`)

- `useDashboardBriefing()` — `/dashboard/briefing` 호출 후 `adaptAiBriefing`.
- `usePortfolioBriefing()` — `usePortfolioSummary`와 동일하게 첫 포트폴리오를 조회
  (`/portfolios?page=1&size=20` → `firstPortfolio.id`)한 뒤 `/portfolios/{id}/briefing` 호출.
  포트폴리오가 없으면 쿼리를 비활성(enabled=false)하거나 빈 상태를 반환합니다.
- 두 쿼리 모두 기존 http client·envelope 언랩·React Query 관례를 그대로 따릅니다.

### 3.4 DashboardPage (`src/pages/ui/DashboardPage.tsx`)

- `mockAiBriefing` import·사용(헤드라인·본문·리스크 헤드라인·`riskChecks`)을 `useDashboardBriefing()`
  결과로 교체합니다.
- 로딩 시 스켈레톤, 에러/미배포 시 카드 degradation(§4). `riskChecks`가 비면 리스크 섹션 생략.

### 3.5 PortfolioPage (`src/pages/ui/PortfolioPage.tsx`)

- "aiBriefing은 BE 출처가 없어 mock 유지" 주석과 `mockPortfolio.aiBriefing` 렌더(헤드라인·본문·
  리스크)를 `usePortfolioBriefing()` 결과로 교체하고 주석을 제거합니다.
- 포트폴리오 요약과 동일한 로딩/에러 처리를 따릅니다. 포트폴리오가 없으면 브리핑 패널을
  노출하지 않습니다.

## 4. 계약·degradation

- BE 미배포·실패 시 브리핑 호출 실패를 흡수해 페이지가 깨지지 않도록 합니다(카드 비노출 또는
  안내 문구, 71 선례). mock으로 되돌리지 않습니다.
- LLM 생성이므로 응답 지연 가능성이 있습니다. 로딩 상태를 명확히 표시합니다.
- `mockAiBriefing`·`mockPortfolio` 정의는 사용처 제거 후에도 `shared/mock`에 남겨둡니다.

## 5. 범위 밖

- `generated_at` 화면 표시, research 브리핑 계약 정렬, 브리핑 캐시·재생성 UX(후속).
