# 이슈 14 — Portfolio(포트폴리오) 페이지 설계

`/portfolio` 플레이스홀더 `PortfolioPage`를 실제 화면으로 교체한다. 보유 자산의 비중·리스크
집중도·섹터 노출·종목 집중도를 한 화면에서 확인하는 **운영 화면**이다. 마일스톤 3 세 번째 라운드.

시안 없음 — 자매 셸 페이지(Dashboard/Watchlist/Signals)의 톤·레이아웃·토큰 컨벤션을 따른다.

## 범위 결정 (2026-06-23)

- **토큰 네임스페이스 = `cockpit-*`**: Portfolio는 관제 셸 내 주 네비 라우트라 Dashboard/Watchlist/
  Signals와 동일한 `cockpit-*` 토큰을 쓴다(`app-*` 아님). `@theme` 수정 없음(기존 토큰만 사용).
- **공통 컴포넌트 전면 재사용**: `Card`/`Badge`/`Table`/`DonutChart`/`BarChart`/`EmptyState`(#18)/
  `classNames`. 신규 프레젠테이션 컴포넌트는 만들지 않는다(페이지 로컬 헬퍼만 허용).
- **#19에서 이월된 포트폴리오 도넛 배치 = 여기**. 자산 배분 도넛은 공통 `DonutChart`로 그린다(명시 `width`).
- **파생값은 페이지에서 계산(미리 굽지 않음)**: 종목 비중(%)·섹터 익스포저 합산·단일 종목 집중도·현금
  비중은 모두 mock의 원시값(평가액·현금·섹터)에서 페이지가 파생한다. mock에는 계산 가능한 값을 저장하지 않는다.
- **AI 브리핑 = 기존 `AiBriefing` 타입 재사용**: Dashboard 패턴(headline/body/riskHeadline/riskChecks)을 따른다.

## 금액 정의 (불변식)

- `Portfolio.totalValue` = **보유 종목 평가액 합**(현금 제외). 기존 `domain.test` 불변식
  `totalValue == Σ holdings.currentValue` **유지**.
- 현금은 `Portfolio.cash`로 분리. **총 자산 = totalValue + cash**(파생).
- 현금 비중 = `cash / (totalValue + cash)`(파생).
- 종목 비중 = `holding.currentValue / totalValue`(현금 제외 기준, 자산 배분·집중도 공통). 자산 배분 도넛은
  현금 세그먼트를 포함해 **총 자산 기준**으로 그린다(현금 비중 카드와 일관). 단일 종목 집중도는 종목 한정
  (`totalValue` 기준) 최대 비중으로 표현.

## 레이아웃

페이지 헤더 "포트폴리오" → 요약 카드 행 → 차트·집중도 행 → 리스크/브리핑 행 → 보유 종목 테이블.

- **요약 카드 행 (3)**: 총 자산(`totalValue + cash`) · 현금 비중(`cash` 파생) · 일간 손익
  (`dayChangeValue`/`dayChangePercent`, 부호 색 emerald/rose). `Card` 분할, 통화/퍼센트 포매터.
- **자산 배분 (`DonutChart`)**: 종목별 + 현금 세그먼트(총 자산 기준). 명시 `width`/`height`, 범례는 종목
  심볼+비중(%). 장식 도넛은 `aria-hidden`, 차트 컨테이너 `ariaLabel`은 공통 차트 규칙 따름.
- **섹터 익스포저 패널**: 보유 종목을 `sector`로 그룹·합산해 섹터별 비중 표시. 공통 `BarChart`(명시 `width`)
  또는 비중 막대 목록 중 택1(자매 페이지 톤에 맞춤).
- **단일 종목 집중도 패널**: 비중 내림차순 상위 종목 + 최대 비중/상위 N 누적 비중. 과집중 경고 문구(파생).
- **리스크 노출 분석 카드**: `riskExposures`를 `Badge riskLevel` + label + description으로 나열.
  완료 조건의 "리스크 권고 문구"를 충족.
- **포트폴리오 AI 브리핑 패널**: `portfolio.aiBriefing`(headline/body/riskChecks) 표시(Dashboard 패턴).
- **보유 종목 테이블 (`Table<Holding>`)**: 종목(심볼+이름, `/research/:symbol` Link) · 섹터 · 수량 · 평균
  단가 · 평가액 · 비중(%) · 일간 변화(`dailyChangePercent` 부호 색). 빈 경우 공통 `EmptyState`.

## 도메인·Mock 확장 (Part A)

| 대상 | 변경 | 비고 |
| --- | --- | --- |
| `Holding` | `name: string`, `sector: string`, `dailyChangePercent: number` 추가 | 테이블 표시·섹터 합산·일간 변화. 기존 `symbol`/`quantity`/`avgPrice`/`currentValue` 유지. |
| `Portfolio` | `cash: number`, `dayChangeValue: number`, `dayChangePercent: number`, `aiBriefing: AiBriefing`, `riskExposures: PortfolioRiskExposure[]` 추가 | `totalValue == Σ currentValue` 불변식 유지. |
| `PortfolioRiskExposure`(신규) | `id: string`, `label: string`, `level: RiskLevel`, `description: string` | 리스크 노출 카드용. `RiskLevel` 재사용. `model/index.ts` 타입 export 추가. |

Mock 갱신(`mockPortfolio`): 현재 3종 보유를 **2~3개 섹터에 걸친 5~6종으로 확장**(섹터 익스포저·집중도가
의미 있도록), 각 종목 `name`/`sector`/`dailyChangePercent` 채움. `cash`·`dayChange*`·`aiBriefing`(한국어)·
`riskExposures`(3~4건) 추가. `totalValue`는 확장된 holdings 평가액 합과 일치시킴. 전부 `satisfies` 유지.
(현재 `mockPortfolio` 소비처는 `domain.test`뿐 → 구조 확장 안전.)

## 시간·결정성

- 신규 타임존 의존 포매팅 도입하지 않음(포트폴리오는 정적 수치 위주). 금액/퍼센트는 `Intl.NumberFormat('ko-KR')`
  사용(타임존 비의존). 부득이 시각 표시 시 `timeZone` 고정 + `TZ=UTC` 검증.
- 차트는 명시 `width`로 렌더(jsdom 결정성), `ResponsiveContainer` 미사용·`isAnimationActive=false` 유지.

## 테스트

- `src/shared/mock/domain.test.ts`: `totalValue == Σ currentValue` 불변식 단언 유지. 신규 필드 단언 추가
  (holding `sector`/`dailyChangePercent` 존재, `cash`/`dayChange*` 수치, `riskExposures` `level`이 유효
  `RiskLevel`, `aiBriefing` 형태).
- `src/pages/ui/PortfolioPage.test.tsx`(신규): 헤딩 / 요약 카드 3값(총자산·현금비중·일간손익) / 자산 배분
  종목 라벨·비중 / 섹터 익스포저 섹터 라벨 / 단일 종목 집중도 top 종목 / 리스크 노출 label·`Badge` /
  보유 종목 테이블 심볼·비중·`/research/:symbol` href / 빈 보유 시 `EmptyState`(별도 렌더 케이스).
- `App.test.tsx`: `/portfolio`가 placeholder→실제 페이지로 바뀌므로 placeholder 텍스트 단언이 있으면 갱신.

## 비범위 / 후속

- 비동기 데이터 패칭/로딩·에러 와이어링 = #17(`Skeleton`/`ErrorState` 연결은 그 라운드).
- 매수/매도·리밸런싱 액션, 종목 추가/삭제 등 인터랙션 = 후속(현재 정적 표시).
- 색상 토큰화(등락 emerald/rose 원시색) = `@theme` 통일 후속(M2/M3 공통 이월).
- chartTheme 원시 hex → `@theme` 토큰화 = 이월.
