# Codex Handoff Task

## Source Issue

설계 `docs/designs/74-ai-briefing-wiring.md`. Pair: BE 057(포트폴리오 브리핑)·058(대시보드
브리핑) — 두 엔드포인트는 이미 BE main에 존재.

## Task Summary

DashboardPage의 "AI 브리핑" 카드와 PortfolioPage의 "포트폴리오 AI 브리핑" 패널을 mock에서
BE 브리핑 API로 전환한다. 공통 브리핑 feature 슬라이스(dto·adapter·query)를 추가하고 두
페이지의 mock 사용을 실데이터로 교체한다.

## Goal

완료 시 참이어야 할 것:

- DashboardPage가 `GET /dashboard/briefing` 실데이터를 렌더한다(`mockAiBriefing` 사용 제거).
- PortfolioPage가 `GET /portfolios/{id}/briefing` 실데이터를 렌더한다(`mockPortfolio.aiBriefing`
  사용·주석 제거).
- BE 미배포·실패 시 페이지가 깨지지 않고 degradation한다(mock으로 되돌리지 않음).

## Background

- BE 응답 형태(두 엔드포인트 동일): `{ headline, body, risk_headline, risk_checks, generated_at }`.
  공통 envelope로 감싸여 있으므로 기존 http client의 언랩 관례를 따른다.
- FE 도메인 타입 `AiBriefing`(`src/shared/model/domain.ts`): `headline`·`body`·`riskHeadline?`·
  `riskChecks?`. `generated_at`은 도메인 타입에 없다.
- `usePortfolioSummary`(`src/features/portfolio/queries.ts`)가 `/portfolios?page=1&size=20`로 첫
  포트폴리오를 해소한 뒤 `/portfolios/{id}/summary`를 호출한다. 포트폴리오 브리핑 쿼리도 동일
  방식으로 id를 해소한다.
- adapter 패턴은 `src/features/research/adapters.ts`·`src/features/watchlist/adapters.ts` 참고.
- 소비 지점: DashboardPage.tsx의 `mockAiBriefing`(headline/body/riskHeadline/riskChecks),
  PortfolioPage.tsx의 `mockPortfolio.aiBriefing`(headline/body/riskHeadline/riskChecks) 및 그
  위의 "BE 출처가 없어 mock 유지" 주석.

## Implementation Scope

- `src/features/briefing/dto.ts` — `AiBriefingDto { headline, body, risk_headline, risk_checks,
generated_at }`.
- `src/features/briefing/adapters.ts` — `adaptAiBriefing(dto): AiBriefing`. snake→camel,
  `risk_checks ?? []`, falsy `risk_headline`은 `riskHeadline` 생략, `generated_at` 버림.
- `src/features/briefing/queries.ts` — `useDashboardBriefing()`, `usePortfolioBriefing()`
  (첫 포트폴리오 해소 후 호출, 없으면 enabled=false 또는 빈 상태).
- `src/pages/ui/DashboardPage.tsx` — `mockAiBriefing` → `useDashboardBriefing()`.
- `src/pages/ui/PortfolioPage.tsx` — `mockPortfolio.aiBriefing` → `usePortfolioBriefing()`, 주석 제거.
- 로딩(스켈레톤)·에러/미배포(degradation)·빈 `riskChecks`(리스크 섹션 생략) 처리.

## Out of Scope

- `mockAiBriefing`·`mockPortfolio` 정의 자체 제거(사용처만 교체, 정의는 `shared/mock`에 유지).
- `AiBriefing` 도메인 타입 변경, `generated_at` 화면 표시.
- research 브리핑(ResearchPage) 계약 정렬, 기타 mock 트랙.
- BE 변경(별도 repo).

## Protected Files

없음. 프로젝트 보호 파일 규칙을 따른다.

## Requirements

- 기존 feature 슬라이스 구조(dto/adapters/queries 분리)와 React Query·http client 관례를 따른다.
- 어댑터는 순수 함수로 두고 단위 테스트한다(기존 adapters.test.ts 선례).
- degradation은 mock 복귀가 아니라 카드 비노출 또는 안내 문구로 처리한다.

## Test Requirements

- `src/features/briefing/adapters.test.ts` — `adaptAiBriefing` 매핑·`risk_checks` 방어·falsy
  `risk_headline` 생략·`generated_at` 무시.
- 페이지 테스트가 있으면 mock 의존 제거 후 쿼리 mocking으로 렌더 확인(기존 페이지 테스트 관례).

## Verification Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm format:check`
- `TZ=UTC corepack pnpm test`
- `corepack pnpm build`

## Documentation Impact

설계 `docs/designs/74-ai-briefing-wiring.md`가 근거. 계약 정렬 문서(있다면)의 포트폴리오·대시보드
briefing 행을 "BE 연동 완료"로 갱신할 수 있으나 문서 갱신은 orchestrator가 리뷰 시 처리한다.

## ADR Need

불필요. 기존 와이어링 패턴을 따르는 화면 연동이다.

## Failure Record Need

불필요.

## Risk Level

Low. 읽기 전용 조회 연동이며 BE 계약이 확정되어 있다. 주의점은 envelope 언랩·포트폴리오 id
해소·degradation 처리 정도다.

## Expected Output

- feature 브랜치(최신 main 기준)와 PR.
- 위 scope의 코드·테스트 변경.
- 가정(포트폴리오 없음 처리·degradation 방식)과 검증 결과 보고.

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.

## Stop Conditions

- BE 응답 필드·envelope 형태가 설계와 다르면 멈추고 보고한다.
- 포트폴리오 id 해소가 기존 `usePortfolioSummary` 방식과 맞지 않으면 멈춘다.
