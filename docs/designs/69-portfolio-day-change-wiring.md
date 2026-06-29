# FE 연동: Portfolio 일간 변동(day change) 실데이터 전환

상태: **계약 확정(Frozen)** — 2026-06-29(Opus). 페어 BE: `project_stock#114`(`/portfolios/{id}/summary` day change 필드).

Portfolio 화면 상단 일간 변동 금액/비율이 `mockPortfolio.dayChangeValue/dayChangePercent`로 남아 있다.
BE summary가 `day_change_value`/`day_change_percent`를 제공하므로 이 두 값만 실데이터로 전환한다.

## 배경

`PortfolioSummaryDto`/`adaptPortfolioSummary`/`PortfolioView`는 totalValue·cash·holdings·sectorExposure만
다룬다. day change는 mock. BE #114가 summary 응답에 두 필드를 추가하면 어댑터에서 매핑해 화면에 바인딩한다.

`aiBriefing`·`riskExposures` mock은 이번 범위 밖(후속 AI Briefing). 이번 PR은 day change 카드만 전환한다.

## 1. 변경 범위

| 파일 | 변경 |
| --- | --- |
| `src/features/portfolio/dto.ts` | `PortfolioSummaryDto`에 `day_change_value`, `day_change_percent`(string \| null) 추가 |
| `src/features/portfolio/adapters.ts` | `PortfolioView`에 `dayChangeValue`, `dayChangePercent`(number) 추가, 매핑 |
| `src/features/portfolio/queries.ts` | 빈 포트폴리오 fallback 객체에 두 필드 0 추가 |
| `src/pages/ui/PortfolioPage.tsx` | 요약 섹션에 "일간 변동" `SummaryCard` 신규 추가(현재 3개 → 4개, `2xl:grid-cols-4` 빈 칸), `portfolio.dayChangeValue/Percent` 바인딩 |

현재 PortfolioPage는 일간 변동을 렌더하지 않고 mock 주석(`dayChange ... 후속 API까지 mock`)만 남아 있다. 따라서 단순 교체가 아니라 **일간 변동 카드 신규 추가**다. 요약 카드는 총 자산/현금 비중/상위 3종목 비중 3개뿐이고 레이아웃이 4컬럼이라 자리가 비어 있다.

## 2. 계약

- BE: `day_change_value`/`day_change_percent`는 Decimal **문자열**(또는 null). `parseDecimal(...) ?? 0`으로 number 변환(기존 totalValue 패턴 동일).
- graceful degradation: BE #114 미배포 시 두 필드 부재 → `parseDecimal(undefined) ?? 0` → 0 표시. FE 단독 머지 안전, BE 머지 후 실값 활성화.
- `mockPortfolio`의 `aiBriefing`·`riskExposures`는 그대로 유지(import 유지). `dayChangeValue`/`dayChangePercent`만 mock 의존 제거.

## 3. 범위 밖

- `aiBriefing`, `riskExposures` mock 섹션.
- 포지션별 일간 변동률 표시.
- 다른 화면·다른 feature.
