# Codex Handoff Task

## Source Issue

- 설계 기록(정본): `docs/designs/69-portfolio-day-change-wiring.md`
- 페어 BE: `JongEunLee310/project_stock#114` (`/portfolios/{id}/summary` day change 필드)
- 선례: `src/features/portfolio/{dto,adapters,queries}.ts`(기존 summary 매핑), `src/pages/ui/PortfolioPage.tsx` `SummaryCard`(총 자산/현금 비중 카드), `parseDecimal`/`formatKrw`/`formatPercent`

## Task Summary

Portfolio 화면의 일간 변동(day change)을 mock(`mockPortfolio.dayChangeValue/dayChangePercent`)에서 실 API로 전환한다.
BE #114가 `/portfolios/{id}/summary` 응답에 `day_change_value`/`day_change_percent`(Decimal 문자열)를 추가한다.
현재 PortfolioPage는 일간 변동을 **렌더하지 않으므로** 요약 섹션에 "일간 변동" `SummaryCard`를 신규 추가한다.

## Goal

- summary 계약에 day change 두 필드 반영(dto/adapter/view).
- PortfolioPage 요약 섹션에 "일간 변동" SummaryCard 추가, 실데이터 바인딩.
- 검증 5종 통과 + 갱신 테스트.

## Background — 오케스트레이터가 확정한 사실 (추측 금지, 그대로 따를 것)

`src/features/portfolio/{dto,adapters,queries}.ts`, `src/pages/ui/PortfolioPage.tsx` 확인 결과:

1. **BE 필드**: `day_change_value`/`day_change_percent`는 Decimal **문자열 또는 null**. 기존 `total_value` 등과 동일 컨벤션. `parseDecimal(...) ?? 0`으로 number 변환(기존 `adaptPortfolioSummary` 패턴 동일).
2. **graceful degradation**: BE #114 미배포 시 두 필드 부재 → `parseDecimal(undefined) ?? 0` → 0. FE 단독 머지 안전. **별도 가드 코드 불필요**(parseDecimal nullish 흡수).
3. **현재 일간 변동 미렌더**: PortfolioPage 요약 섹션(`aria-label="포트폴리오 요약"`)에 `SummaryCard` 3개(총 자산/현금 비중/상위 3종목 비중)뿐. 레이아웃 `grid ... 2xl:grid-cols-4`라 4번째 칸이 비어 있다. 여기에 카드를 추가한다.
4. **mock 유지 항목**: `mockPortfolio`의 `aiBriefing`·`riskExposures`는 이번 범위 밖 — `mockPortfolio` import와 해당 사용부 그대로 둔다. `dayChangeValue`/`dayChangePercent`에 대한 mock 의존만 없앤다(현재 PortfolioPage가 직접 참조하지 않으므로 import 라인 변경 없음, 신규 카드는 `portfolio` prop에서 읽는다).

## Implementation Scope

**`src/features/portfolio/dto.ts`**

- `PortfolioSummaryDto`에 `day_change_value: string | null`, `day_change_percent: string | null` 추가(기존 필드 뒤).

**`src/features/portfolio/adapters.ts`**

- `PortfolioView`에 `dayChangeValue: number`, `dayChangePercent: number` 추가.
- `adaptPortfolioSummary` 반환에 `dayChangeValue: parseDecimal(dto.day_change_value) ?? 0`, `dayChangePercent: parseDecimal(dto.day_change_percent) ?? 0` 추가.

**`src/features/portfolio/queries.ts`**

- 빈 포트폴리오 fallback 객체(`{ totalValue: 0, cash: 0, holdings: [], sectorExposure: [] }`)에 `dayChangeValue: 0`, `dayChangePercent: 0` 추가(타입 충족).

**`src/pages/ui/PortfolioPage.tsx`**

- `PortfolioPageView` 요약 `<section>`에 4번째 `SummaryCard` 추가: `label="일간 변동"`, `value={formatKrw(portfolio.dayChangeValue)}`, `helper={formatPercent(portfolio.dayChangePercent)}`. `visual`은 기존 카드 중 적절한 값 재사용(예 `"wallet"`/`"risk"` 등 기존 허용값; 새 visual 타입 추가 금지). 부호/색상 강조가 기존 SummaryCard에서 지원되면 그 props만 사용하고, 없으면 추가하지 말 것(범위 내 최소 변경).
- mock 주석(`{/* dayChange, riskExposures, aiBriefing은 BE 출처가 없어 ... */}`)에서 dayChange 언급을 제거하고 riskExposures/aiBriefing만 남기도록 정정.

## Out of Scope

- `aiBriefing`, `riskExposures` mock 섹션 전환(후속 AI Briefing).
- 포지션별 일간 변동률(`dailyChangePercent`) 표시.
- 다른 화면·다른 feature. BE 레포 변경.
- `SummaryCard` 공용 컴포넌트 시그니처 변경(새 visual 타입/새 prop 추가 금지).
- 무관 리팩터.

## Protected Files

없음. `.codex/*`, `docs/designs/*`, `docs/harness/*` 수정 금지.

## Requirements

- day change는 어댑터에서 number 변환(`parseDecimal ?? 0`). 화면은 `PortfolioView`만 소비.
- BE 미배포 시 0 표시로 graceful(별도 분기 불필요).
- 기존 통과 테스트 약화 금지.

## Test Requirements

- `src/features/portfolio/adapters.test.ts`: summary 입력에 `day_change_value`/`day_change_percent` 포함 케이스로 `dayChangeValue`/`dayChangePercent` 매핑 단언. 두 필드 누락(undefined) 입력 → 0 단언.
- PortfolioPage 테스트가 있으면 "일간 변동" 카드 렌더(label/value) 단언 추가. 없으면 생략 가능하나, 기존 요약 카드 단언이 깨지지 않는지 확인.
- 시간 단언은 `TZ=UTC`.

## Verification Commands

```
pnpm lint
pnpm typecheck
pnpm format:check
TZ=UTC pnpm test
pnpm build
```

(포맷은 변경 파일만 `pnpm format`. `format:check`는 전체 게이트.)

## Documentation Impact

- 설계 `docs/designs/69-portfolio-day-change-wiring.md` 참조. 구현 완료 후 상태 갱신(선택).

## ADR Need

불요. 기존 summary 소비 확장·카드 추가, 신규 아키텍처 없음.

## Failure Record Need

불요(국소 변경·회귀 테스트).

## Risk Level

Low. summary 어댑터 필드 추가 + 카드 1개. SummaryCard 시그니처 변경 없이 기존 props만 사용.

## Expected Output

- 전용 브랜치 `feat/portfolio-day-change-wiring`(최신 main 기준, 이미 생성)에서 구현.
- dto/adapters/queries/PortfolioPage + 테스트 변경 커밋(한국어 메시지).
- 검증 5종 전부 통과 로그.

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
