# Codex Handoff Task

## Source Issue

- 설계 기록(정본): `docs/designs/70-portfolio-risk-exposures-wiring.md`
- 페어 BE: `JongEunLee310/project_stock#115` (`/portfolios/{id}/summary` `risk_exposures` 필드)
- 선례: `src/features/portfolio/{dto,adapters,queries}.ts`(기존 summary 매핑, dayChange 선례), `src/pages/ui/PortfolioPage.tsx` "리스크 노출 분석" 카드, `src/shared/model/domain.ts`(`PortfolioRiskExposure`/`RiskLevel`)

## Task Summary

Portfolio 화면 "리스크 노출 분석" 카드를 mock(`mockPortfolio.riskExposures`)에서 실 API로 전환한다.
BE #115가 `/portfolios/{id}/summary` 응답에 `risk_exposures[]`(`code`/`label`/`level`/`description`)를 추가한다.
`aiBriefing`은 이번 범위 밖이라 mock을 유지한다.

## Goal

- summary 계약에 `risk_exposures` 반영(dto/adapter/view), `level` 문자열→`RiskLevel` 변환.
- PortfolioPage 리스크 노출 카드를 `portfolio.riskExposures`로 렌더, 빈 상태 처리, mock 의존 제거.
- 검증 5종 통과 + 갱신 테스트.

## Background — 오케스트레이터가 확정한 사실 (추측 금지, 그대로 따를 것)

1. **BE 필드**: `risk_exposures`는 객체 배열, 각 `{ code: string; label: string; level: string; description: string }`.
   `level`은 BE에서 `"HIGH"` 또는 `"MEDIUM"` 문자열. snake_case 와이어 그대로 dto에 둔다.
2. **도메인 타입 재사용**: `src/shared/model/domain.ts`의 기존 `PortfolioRiskExposure { id, label, level: RiskLevel, description }`을
   그대로 쓴다(신규 타입 추가 금지). `RiskLevel = '높음' | '중간' | '낮음'`(`src/shared/model/riskLevel.ts`).
3. **level 매핑**: BE `"HIGH"`→`'높음'`, `"MEDIUM"`→`'중간'`. 그 외 값은 방어적으로 `'중간'`. BE는 `낮음`을 보내지 않는다.
4. **id 매핑**: `id` ← BE `code`(안정적 키, React 리스트 key로 사용).
5. **graceful degradation**: BE #115 미배포 시 `risk_exposures` 부재 → 빈 배열로 처리(`?? []`). FE 단독 머지 안전.
6. **빈 상태**: BE가 노출 0건이면 `risk_exposures: []`. 카드 목록 대신 "현재 감지된 리스크 노출이 없습니다." 류
   빈 상태 문구를 렌더한다(섹션·PanelTitle은 유지). mock과 달리 0~N개다.
7. **aiBriefing 유지**: `mockPortfolio.aiBriefing`은 그대로 둔다. `mockPortfolio.riskExposures` 사용만 제거한다.

## Implementation Scope

**`src/features/portfolio/dto.ts`**

- 신규 `RiskExposureDto { code: string; label: string; level: string; description: string }`.
- `PortfolioSummaryDto`에 `risk_exposures: RiskExposureDto[]`(또는 `RiskExposureDto[] | null`) 추가(기존 필드 뒤).

**`src/features/portfolio/adapters.ts`**

- `PortfolioView`에 `riskExposures: PortfolioRiskExposure[]` 추가(`src/shared/model`에서 타입 import).
- `adaptPortfolioSummary`: `dto.risk_exposures ?? []`를 매핑 — `{ id: code, label, level: mapLevel(level), description }`.
- level 변환 헬퍼(모듈 내 작은 함수): `HIGH→'높음'`, `MEDIUM→'중간'`, 그 외 `'중간'`.

**`src/features/portfolio/queries.ts`**

- 빈 포트폴리오 fallback 객체에 `riskExposures: []` 추가(타입 충족, dayChange=0 선례와 동일).

**`src/pages/ui/PortfolioPage.tsx`**

- "리스크 노출 분석" 카드의 `mockPortfolio.riskExposures.map(...)`를 `portfolio.riskExposures.map(...)`로 교체.
  `risk.id`/`risk.label`/`risk.level`/`risk.description`은 동일 필드명이라 렌더 JSX 거의 그대로.
- `portfolio.riskExposures.length === 0`이면 빈 상태 문구 렌더.
- mock 주석(`{/* riskExposures, aiBriefing은 BE 출처가 없어 ... */}`)에서 riskExposures 언급 제거, aiBriefing만 남김.
- `aiBriefing`이 여전히 mock이면 `mockPortfolio` import는 유지(aiBriefing 사용 때문). riskExposures 의존만 제거.

## Out of Scope

- `aiBriefing` 카드 전환(후속 AI Briefing).
- `shared/mock/domain.ts`의 `riskExposures` 정의 자체 삭제(타 화면 영향 미확인 — 정의는 두고 PortfolioPage 사용만 제거).
- 리스크 카드 정렬/필터 UI(BE가 결정적 순서로 전달).
- 다른 화면·다른 feature. BE 레포 변경. 무관 리팩터.

## Protected Files

없음. `.codex/*`, `docs/designs/*`, `docs/harness/*` 수정 금지.

## Requirements

- `level`은 어댑터에서 `RiskLevel`로 변환(화면은 `PortfolioView`만 소비, 화면에서 문자열 분기 금지).
- BE 미배포 시 빈 배열 → 빈 상태 표시로 graceful(별도 에러 분기 불필요).
- 기존 통과 테스트 약화 금지. 신규 타입/visual 추가 금지(기존 `PortfolioRiskExposure` 재사용).

## Test Requirements

- `src/features/portfolio/adapters.test.ts`: `risk_exposures`에 `HIGH`/`MEDIUM` 혼합 입력 → `riskExposures` 매핑 단언
  (`id`=code, `level`=높음/중간). `risk_exposures` 누락(undefined) 입력 → `riskExposures === []` 단언.
- PortfolioPage 테스트가 있으면: 노출 N건 렌더(label/level 배지) 단언 + 빈 배열 시 빈 상태 문구 단언. 없으면 기존 단언 유지 확인.

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

- 설계 `docs/designs/70-portfolio-risk-exposures-wiring.md` 참조. 구현 완료 후 상태 갱신(선택).

## ADR Need

불요. 기존 summary 소비 확장·카드 데이터 교체, 신규 아키텍처 없음.

## Failure Record Need

불요(국소 변경·회귀 테스트).

## Risk Level

Low. summary 어댑터 필드 추가 + 카드 데이터 소스 교체. 신규 타입/컴포넌트 없음.

## Expected Output

- 전용 브랜치 `feat/portfolio-risk-exposures-wiring`(최신 main 기준)에서 구현.
- dto/adapters/queries/PortfolioPage + 테스트 변경 커밋(한국어 메시지).
- 검증 5종 전부 통과 로그.

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
