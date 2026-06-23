# Codex Handoff Task

## Source Issue

Issue 14 — `[FE] Portfolio 포트폴리오 페이지 구현` (마일스톤 FE-M3).
설계 기록: `docs/designs/14-portfolio-page.md`.

## Task Summary

`/portfolio` 플레이스홀더 `PortfolioPage`를 실제 화면으로 교체한다. 보유 자산의 비중·섹터 노출·종목
집중도·리스크 노출·AI 브리핑·보유 종목 테이블을 표시한다. 이를 위해 `Portfolio`/`Holding` 도메인 타입과
`mockPortfolio`를 확장한다. 신규 프레젠테이션 컴포넌트는 만들지 않고 공통 컴포넌트를 재사용한다.

## Goal

작업 완료 시 다음이 참이어야 한다:

- `/portfolio`가 총 자산·현금 비중·일간 손익 카드, 자산 배분 차트, 섹터 익스포저, 단일 종목 집중도,
  리스크 노출 분석, 보유 종목 테이블, 포트폴리오 AI 브리핑을 표시한다.
- 종목 비중·섹터 합산·집중도·현금 비중은 mock 원시값에서 **페이지가 파생**한다(미리 굽지 않음).
- `Portfolio.totalValue == Σ holdings.currentValue` 불변식이 유지된다.
- 보유 종목이 없을 때 공통 `EmptyState`가 렌더된다.
- 전 검증 게이트 통과.

## Background

- 현재 `PortfolioPage`는 `PagePlaceholder` 기반 자리표시. 라우트는 이미 연결됨.
- 현재 `Portfolio`는 `totalValue` + `holdings[{symbol,quantity,avgPrice,currentValue}]`만 보유 →
  이슈의 7개 패널(섹터/현금/일간손익/집중도/리스크노출/AI브리핑)을 담기엔 부족. 도메인 확장 필요.
- `mockPortfolio` 소비처는 `src/shared/mock/domain.test.ts`뿐(`totalValue == Σ currentValue` 단언). 페이지
  미사용 → 구조 확장 안전하나 **그 불변식은 유지**한다.
- 자매 셸 페이지(Dashboard/Watchlist/Signals)는 `cockpit-*` 토큰 사용. Portfolio도 동일 네임스페이스.
- 공통 차트(`DonutChart`/`BarChart`)·`Table`·`Badge`·`Card`·`EmptyState`(#18)가 이미 존재. 도넛은 #19에서
  포트폴리오 배치가 이 이슈로 이월됨.
- 데이터는 동기 mock 파생 — 로딩/에러 와이어링은 #17(후속). 이 이슈는 정적 표시만.

## Implementation Scope

- `src/shared/model/domain.ts`: `Holding`에 `name`/`sector`/`dailyChangePercent` 추가, `Portfolio`에
  `cash`/`dayChangeValue`/`dayChangePercent`/`aiBriefing`/`riskExposures` 추가, `PortfolioRiskExposure`
  인터페이스 신규.
- `src/shared/model/index.ts`: `PortfolioRiskExposure` 타입 export 추가(add-only).
- `src/shared/mock/domain.ts`: `mockPortfolio` 확장(2~3개 섹터 5~6종, 신규 필드 채움, `satisfies Portfolio` 유지).
- `src/pages/ui/PortfolioPage.tsx`: 플레이스홀더 → 실제 페이지. 공통 컴포넌트 재사용, `cockpit-*` 토큰.
- 테스트: `src/shared/mock/domain.test.ts` 단언 보강, `src/pages/ui/PortfolioPage.test.tsx` 신규,
  필요 시 `App.test.tsx` placeholder 단언 갱신.

## Out of Scope

- 비동기 데이터 패칭/로딩·에러 트리거·가짜 async (#17에서 연결).
- 매수/매도·리밸런싱·종목 추가삭제 등 인터랙션(정적 표시만).
- 신규 공통 프레젠테이션 컴포넌트 추가(페이지 로컬 헬퍼만 허용, 차트/테이블/뱃지는 기존 것 사용).
- 다른 페이지(Alerts #15 / Settings #16) 변경, Stock/기타 도메인 타입 변경.
- `@theme` 토큰 수정, chartTheme 변경.

## Protected Files

- 없음. (`src/index.css` `@theme` 수정 금지 — 기존 `cockpit-*` 토큰만 사용.)

## Requirements

- **도메인**: `totalValue == Σ holdings.currentValue` 불변식 유지. `cash`는 별도. 총 자산 = `totalValue + cash`.
- **파생 계산(페이지)**: 종목 비중 = `currentValue / totalValue`. 현금 비중 = `cash / (totalValue + cash)`.
  섹터 익스포저 = `sector`별 `currentValue` 합산. 단일 종목 집중도 = 비중 내림차순 + 최대/상위 N 누적.
  자산 배분 도넛은 현금 세그먼트 포함(총 자산 기준). mock에 파생값 저장 금지.
- **공통 컴포넌트 재사용**: `DonutChart`/`BarChart`(명시 `width`/`height`), `Table<Holding>`(종목 Link·섹터·
  수량·평균단가·평가액·비중·일간변화), `Badge riskLevel`(리스크 노출), `EmptyState`(빈 보유), `Card`,
  `classNames`. AI 브리핑은 기존 `AiBriefing` 형태(headline/body/riskChecks) 재사용. 네이티브 다이얼로그 금지.
- **표시**: 금액/퍼센트는 `Intl.NumberFormat('ko-KR')`. 일간 손익·일간 변화는 부호 색(emerald/rose).
  보유 종목 심볼은 `/research/:symbol` Link.
- **결정성**: 차트 명시 `width`(jsdom), `ResponsiveContainer` 미사용·`isAnimationActive=false` 유지. 신규
  타임존 의존 포매팅 도입 금지(부득이 시 `timeZone` 고정).

## Test Requirements

- `domain.test.ts`: `totalValue == Σ currentValue` 단언 유지 + 신규 필드 단언(holding `sector`/
  `dailyChangePercent`, `cash`/`dayChange*` 수치, `riskExposures.level`이 유효 `RiskLevel`, `aiBriefing` 형태).
- `PortfolioPage.test.tsx`(신규): 헤딩 / 요약 카드 3값 / 자산 배분 종목 라벨 / 섹터 익스포저 섹터 라벨 /
  단일 종목 집중도 top 종목 / 리스크 노출 label·`Badge` / 보유 종목 테이블 심볼·비중·`/research/:symbol`
  href / 빈 보유 시 `EmptyState`(별도 렌더 케이스). 차트 내부가 아닌 의미 라벨/수치/role로 단언.
- `App.test.tsx`: placeholder 텍스트 단언이 있으면 갱신.
- 타임존 비의존이지만 전체는 `TZ=UTC`로 검증.

## Verification Commands

```
pnpm format:check
pnpm lint
pnpm typecheck
TZ=UTC pnpm test
pnpm build
```

(변경 파일 포맷이 필요하면 `pnpm format`은 변경 파일 한정으로 적용.)

## Documentation Impact

- 설계 `docs/designs/14-portfolio-page.md`(동반)와 일치 유지.
- 포트폴리오 파생 계산 규칙(비중/집중도 기준)이 후속 화면과 공유될 경우 `docs/knowledge/frontend-conventions.md`
  반영 고려(비차단 후속).

## ADR Need

불필요. 신규 라이브러리/아키텍처 도입 없음(기존 ADR-003 스택 내 도메인 확장 + 공통 컴포넌트 재사용).

## Failure Record Need

불필요. 회귀·실패 예상 없음.

## Risk Level

Medium. `Portfolio`/`Holding` 도메인 타입과 `mockPortfolio` 구조를 확장하는 파괴적 변경 가능성. 소비처는
`domain.test`뿐이라 blast radius는 작으나, `satisfies`·불변식·테스트로 회귀를 막아야 한다.

## Expected Output

- 브랜치 `feat/fe-portfolio-page`(최신 `main` 기준 분기).
- PR 본문에 `Closes #14`.
- 도메인/Mock 확장 + `PortfolioPage` 실제 구현 + 테스트(도메인 보강·페이지 신규).
- 전 검증 게이트 통과 결과 보고.

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
