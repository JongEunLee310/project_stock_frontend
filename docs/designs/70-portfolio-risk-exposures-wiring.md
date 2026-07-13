# FE 연동: Portfolio 리스크 노출(risk exposures) mock 제거

상태: **계약 확정(Frozen)** — 2026-06-29(Opus). BE [[049-portfolio-risk-exposures]] 페어.
PortfolioPage "리스크 노출 분석" 카드가 `mockPortfolio.riskExposures`로 렌더되고 있다. BE summary가
`risk_exposures[]`를 제공하므로 실데이터로 교체한다. **BE 계약(049 §3)을 정본으로 따른다.**

## 배경

`PortfolioPage.tsx`는 상단 카드(dayChange 포함)는 이미 `usePortfolioSummary` 실데이터로 렌더하지만,
"리스크 노출 분석" 카드만 `mockPortfolio.riskExposures.map(...)`로 남아 있다. BE가 `risk_exposures[]`를
추가하므로 이 부분을 실데이터로 바꾸고 mock 의존을 제거한다.

`aiBriefing`은 이번 범위 밖(정성 콘텐츠, 후속 AI Briefing 작업)이라 mock을 유지한다.

## 1. 변경 범위

| 파일                                 | 변경                                                                   |
| ------------------------------------ | ---------------------------------------------------------------------- |
| `src/features/portfolio/dto.ts`      | `PortfolioSummaryDto`에 `risk_exposures` 추가                          |
| `src/features/portfolio/adapters.ts` | `PortfolioView`에 `riskExposures` 추가, DTO→뷰 매핑(level 한국어 변환) |
| `src/features/portfolio/queries.ts`  | 빈 포트폴리오 fallback에 `riskExposures: []` 추가                      |
| `src/pages/ui/PortfolioPage.tsx`     | 카드를 `portfolio.riskExposures`로 렌더, 빈 상태 처리, mock 주석 갱신  |

## 2. 계약 매핑 (BE 049 §3 정본)

### 2.1 DTO

`PortfolioSummaryDto`에 추가(snake_case, BE 와이어 그대로):

| 필드             | 타입                |
| ---------------- | ------------------- |
| `risk_exposures` | `RiskExposureDto[]` |

신규 `RiskExposureDto`: `{ code: string; label: string; level: string; description: string }`.
(BE `level`은 `"HIGH"` 또는 `"MEDIUM"` 문자열.)

### 2.2 뷰 매핑

`PortfolioView`에 `riskExposures: PortfolioRiskExposure[]` 추가. 기존 도메인 타입
`PortfolioRiskExposure { id, label, level: RiskLevel, description }`(`src/shared/model/domain.ts`)을 그대로
재사용한다. 매핑:

- `id` ← `code` (BE가 안정적 키로 제공).
- `label` ← `label`.
- `level` ← BE `level` 문자열을 `RiskLevel`(`높음`/`중간`)로 변환: `HIGH`→`높음`, `MEDIUM`→`중간`.
  그 외 값은 방어적으로 `중간` 처리.
- `description` ← `description`.

`riskLevels`는 `['높음','중간','낮음']`이며 BE는 HIGH/MEDIUM만 보내므로 `낮음`은 사용하지 않는다.

### 2.3 빈 상태

BE가 노출 0건이면 `risk_exposures: []`. 빈 배열일 때 카드 목록 대신 "현재 감지된 리스크 노출이
없습니다." 류의 빈 상태 문구를 렌더한다(섹션 자체는 유지). mock과 달리 항상 4개가 아니라 0~N개다.

빈 포트폴리오(summary 미존재) fallback 객체에도 `riskExposures: []`를 넣어 graceful degradation을
유지한다(기존 dayChange=0 패턴과 동일).

## 3. 범위 밖

- `aiBriefing` 카드 — mock 유지(후속 AI Briefing).
- 리스크 카드 정렬/필터 UI — BE가 결정적 순서로 보내므로 그대로 렌더.
- mock 파일(`shared/mock/domain.ts`)의 `riskExposures` 정의 제거 — DashboardPage 등 타 화면 영향 확인
  전까지 정의는 두고, PortfolioPage의 import·사용만 제거한다(이번 범위는 화면 연동).
