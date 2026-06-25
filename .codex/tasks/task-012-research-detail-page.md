# Codex Handoff Task — task-012: Stock Research Detail 페이지 (이슈 10, 시안 반영)

## Source Issue

- 이슈 10. `[FE] Stock Research Detail 페이지 구현` (Closes #10)
- 설계 기록: `docs/designs/10-research-detail-page.md` (시안 `research.png` 반영 재설계)
- 의존(머지됨): task-005 Badge(PR #28), task-007 도메인·Mock 확장(PR #30), task-011 Signals(PR #33)
- 기반 브랜치: `feat/fe-research-detail-page`(최신 `main`에서 분기, 본 설계·핸드오프 커밋 포함)

## Task Summary

`ResearchPage`를 플레이스홀더에서 시안 기반 실제 화면으로 교체한다. 먼저 시안의 풍부한 필드를 담도록
**도메인·Mock을 확장(Part A)**하고, 그 위에 헤더 카드(지표 타일·AI 스탠스), **가격 차트 영역(구조
자리표시 + SVG 스파크라인)**, AI 브리핑, 핵심 리스크, 뉴스·공시 요약, 촉매 타임라인, 의사결정
체크리스트(체크 가능), 내 메모(입력)를 **구현(Part B)**한다.

> **차트 경계**: 가격 영역은 탭·기간 프레임 + `pricePoints` SVG 스파크라인까지만. **캔들·거래량·
> 비교지수 렌더링과 차트 라이브러리 도입은 이슈 19**로 분리(이번 task에서 구현 금지).

## Goal

- `/research/NVDA`(및 AAPL·TSLA·MSFT)에서 시안 레이아웃의 리서치 상세가 표시된다.
- **헤더 카드**: 로고(이니셜)·티커·이름·거래소/섹터, 현재가·전일대비·기준 시각, AI 스탠스 박스(상태
  `Badge` + 신뢰도% + 스탠스 캡션), 지표 타일 5종(시가총액·52주 저가~고가·섹터·다음 실적 발표·평균
  목표주가+상승여력%).
- **가격 영역**: 탭(가격/밸류에이션/실적)·기간(1D~5Y) 프레임 + `pricePoints` **SVG 스파크라인** + 최신
  종가·기간 등락 + "캔들·거래량·비교지수는 이슈 19" 안내.
- **AI 브리핑**: 갱신 시각 + `briefing.headline` + `body`.
- **핵심 리스크 3건 이상**: 종합 수준 `Badge` + 항목별(제목·레벨 `Badge`·설명).
- **뉴스·공시 요약**: `news`(카테고리 `Badge`·헤드라인·출처·시각·위험도 `Badge`).
- **촉매 타임라인**: `catalysts` 날짜 오름차순(점·날짜·제목·카테고리 `Badge`).
- **체크리스트**: 진행도(n/총) + 항목(라벨·설명) 체크박스 토글(로컬).
- **메모**: `memo` 초기값 textarea 입력(로컬).
- **관심종목**: `isFavorite` 표시 + 로컬 토글(영속화 없음).
- mock에 없는 심볼은 안전한 미발견 안내(빈 상태) + 워치리스트 복귀 링크.
- 기존 공통 컴포넌트(`Badge`/`Button`/`Card`/`Input`) 재사용.

## Background

- 기존 `ResearchPage`는 `PagePlaceholder` 래퍼(`src/pages/ui/ResearchPage.tsx`), `useParams`로 심볼 수신.
- 데이터: `mockStockResearch`(`src/shared/mock/domain.ts`, 심볼 키 NVDA/AAPL/TSLA/MSFT → `StockResearch`).
  헤더 일부는 `mockStocks`(동일 4심볼)에서 조인: `name`/`market`/`price`/`change`/`changePercent`/`status`/
  `isFavorite`.
- `Badge`는 `status`(StockStatus)·위험도(`RiskLevel`)로 색상 자동 매핑(`src/shared/ui/Badge.tsx`). 카테고리
  Badge는 라벨/톤만 매핑(위험도와 별개) — 색상 클래스 인라인 복제 금지.
- 라우트: `appRoutePaths.watchlist='/watchlist'`, `appRoutePaths.decisionLog='/decision-log'`
  (`src/shared/config/navigation.ts`). 이동은 `react-router-dom`의 `Link`/`useNavigate`.
- 시간 표시 포매터는 **명시적 `timeZone: 'Asia/Seoul'`** 고정(Watchlist·Signals 선례 — 미지정 시 CI(UTC)
  시간 단언 테스트가 깨짐). 날짜 문자열(YYYY-MM-DD)·`priceAsOf` 같은 표시 문자열은 그대로 표기 가능.
- 컨벤션: `docs/knowledge/frontend-conventions.md` — 공통 컴포넌트 우선, 네이티브 다이얼로그 금지.

## Implementation Scope

### A. 도메인·Mock 확장

신규 enum 2종(기존 `as const` 배열 + 파생 union 패턴 = `stockStatus.ts` 선례):

- `src/shared/model/newsCategory.ts` — `newsCategories = ['실적','제품','파트너십','규제'] as const` +
  `type NewsCategory = (typeof newsCategories)[number]`.
- `src/shared/model/catalystCategory.ts` — `catalystCategories = ['이벤트','실적','제품','공급'] as const` +
  `type CatalystCategory`.

`src/shared/model/domain.ts` 타입 필드 추가:

- `StockResearch` += `priceAsOf: string` · `stanceConfidence: number`(0~100) · `marketCap: string`
  (예 `'2.54T USD'`) · `fiftyTwoWeekLow: number` · `fiftyTwoWeekHigh: number` · `sector: string` ·
  `nextEarningsDate: string`(YYYY-MM-DD) · `targetPrice: number` · `targetUpsidePercent: number`.
- `NewsItem` += `category: NewsCategory`.
- `CatalystItem` += `category: CatalystCategory`.
- `ChecklistItem` += `description: string`.

`src/shared/mock/domain.ts` 보강(파괴적 변경 주의):

- 위 필드는 **필수**이므로 `mockStockResearch`의 **모든 심볼(NVDA/AAPL/TSLA/MSFT)** 및 그 안의 모든
  `news`/`catalysts`/`checklist` 항목을 빠짐없이 채운다. `satisfies` 유지.
- 시안값 참고(NVDA): 시가총액 `'2.54T USD'`, 52주 저가 `399.23`, 섹터 `'정보기술'`, 다음 실적
  `'2026-08-28'`, 평균 목표주가 `1145.32`/상승여력 `11.8`, 스탠스 신뢰도 `65`. 나머지 심볼은 합리적 값으로.
- 뉴스/촉매에 시안 카테고리 분포(실적/제품/파트너십/규제, 이벤트/실적/제품/공급)를 다양하게 반영.
  각 심볼 `keyRisks` 3건+ 유지, `checklist` 각 항목에 `description` 추가.
- 신규 fixture·필드 추가는 `src/shared/README.md` mock 설명에 한 줄 반영.

### B. 페이지 구현 (`src/pages/ui/ResearchPage.tsx`)

설계 `docs/designs/10-research-detail-page.md` 레이아웃대로 구현:

- **페이지 헤더** — "{SYMBOL} 리서치" + 관심종목 표시/토글(`isFavorite`, 로컬 `useState`).
- **종목 헤더 카드** — `mockStocks` 조인 기본 정보 + 지표 타일 5종 + AI 스탠스 박스(상태 `Badge` +
  `stanceConfidence`% + `stance`). 보조 액션: 워치리스트(→`/watchlist`)·판단 기록(→`/decision-log`).
- **가격 영역(자리표시)** — 탭/기간 시각 프레임 + `pricePoints`를 `viewBox` 정규화한 SVG `polyline`
  스파크라인 + 최신 종가·기간 등락 텍스트. `<svg role="img" aria-label="...">`. **차트 라이브러리 도입
  금지**(SVG/CSS만). 가격 외 탭·기간 버튼은 비활성/자리표시(콘텐츠 미구현).
- **AI 브리핑** — `briefing.headline`(강조) + `body`.
- **핵심 리스크** — 종합 수준 `Badge`(예: 최고 레벨 파생) + `keyRisks` 항목(제목·레벨 `Badge`·설명).
- **뉴스·공시 요약** — `news`(카테고리 `Badge`·헤드라인·출처·발행 시각·위험도 `Badge`).
- **촉매 타임라인** — `catalysts` 날짜 오름차순(점·날짜·제목·카테고리 `Badge`). 미래일은 "예정" 표시.
- **체크리스트** — `checklist` `useState` 초기화 후 토글, 진행도(n/총) 파생.
- **메모** — `memo` 초기값 textarea(`useState`).
- **미발견** — `mockStockResearch[symbol]` 없으면 빈 상태 안내 + 워치리스트 링크.
- 카테고리(`NewsCategory`/`CatalystCategory`) 라벨 매핑은 페이지/공용 유틸로 둔다. 차트 영역을 별 파일로
  뺄 경우 `shared/ui`(재사용 신호) 또는 페이지 디렉터리 하위.

## Out of Scope

- 캔들·거래량·비교지수 차트, 밸류에이션/실적 탭 콘텐츠, 기간 전환 데이터(모두 이슈 19). 차트 라이브러리 금지.
- 실시간 시세·서버 연동·메모/체크리스트/관심종목 영속화(현 단계 mock·로컬 상태).
- 다른 페이지·라우팅·네비게이션·AppShell(알림·동기화) 변경. 뉴스/촉매 "더보기" 상세(자리 링크만).

## Protected Files

- `src/index.css`는 `@theme` 토큰 **추가만** 허용(기존 토큰 수정/삭제 금지). 가능하면 기존 토큰 재사용.
- 그 외 보호 파일(AGENTS.md/CLAUDE.md/.codex/instructions·agents·config/ci.yml/docs/harness·decisions·
  failures) **수정 금지**.

## Requirements

- 신규 enum은 `as const` + 파생 union 패턴(`stockStatus.ts` 선례). 도메인 필드 추가 시 모든 mock 엔트리
  채우고 `satisfies` 유지.
- 가격 스파크라인은 SVG/CSS만(차트 라이브러리 추가 금지). `pricePoints` 정규화 후 `polyline`.
- 상태·위험도·카테고리 표시는 `Badge` 재사용 — 색상 클래스 인라인 복제 금지.
- 시간 포매터는 `timeZone: 'Asia/Seoul'` 고정. 날짜 문자열·표시 문자열은 그대로 표기 가능.
- 네이티브 다이얼로그(alert/confirm/prompt) 금지 — 필요 시 인앱 UI.
- 체크리스트·메모·관심종목은 제어 컴포넌트(`useState`)로 동작.

## Test Requirements

- `src/pages/ui/ResearchPage.test.tsx` 신규: (1) 헤더(티커·이름·상태 Badge)·AI 스탠스(신뢰도) 렌더,
  (2) 지표 타일(시가총액·평균 목표주가 등) 표시, (3) 핵심 리스크 3건 이상, (4) 체크리스트 항목 클릭 시
  체크 토글 + 진행도 변화, (5) 메모 textarea 입력 반영, (6) 미발견 심볼에서 빈 상태 안내, (7) 가격
  스파크라인 `aria-label` 존재.
- 시간 단언이 있으면 **타임존 독립**(포매터 `timeZone` 고정 전제). 가능하면 종목/상태/라벨/숫자로 단언해
  시간 문자열 단언 회피. 라우트 파라미터는 `createMemoryRouter`로 진입(Signals 테스트 선례 참고).
- `App.test.tsx` 등 기존 테스트 영향 시 정합 갱신.

## Verification Commands

```bash
pnpm format:check
pnpm lint
pnpm typecheck
TZ=UTC pnpm test   # CI(UTC) 환경 재현 — 시간 단언이 있으면 반드시 통과해야 함
pnpm build
```

> 커밋 전 변경 파일에 한정해 `prettier --write`. 로컬이 KST라 시간 단언은 `TZ=UTC pnpm test`로 재현 확인.

## Documentation Impact

- 설계 `docs/designs/10-research-detail-page.md`와 구현 일치. mock 필드·fixture 확장은 `src/shared/README.md`
  mock 설명에 반영. ADR·실패 기록 불필요(기존 FSD·도메인 점진 확장, 신규 아키텍처 결정 없음).

## ADR Need

불필요.

## Failure Record Need

불필요.

## Risk Level

Medium. 도메인 타입 필드 추가(필수 필드 → 모든 mock 엔트리 갱신 필요) + 신규 enum 2종 + 신규 페이지.
파괴적 변경 회피를 위해 mock 전수 채움·`satisfies` 통과 확인 필수.

## Expected Output

- 변경: `src/shared/model/newsCategory.ts`·`catalystCategory.ts`(신규), `src/shared/model/domain.ts`
  (필드 추가), `src/shared/mock/domain.ts`(전수 보강), `src/pages/ui/ResearchPage.tsx`(구현),
  `src/pages/ui/ResearchPage.test.tsx`(신규), `src/shared/README.md`(mock 설명), 차트 분리 시 해당 파일,
  필요 시 `App.test.tsx` 정합.
- 브랜치 `feat/fe-research-detail-page`에 커밋(새 PR은 Claude가 생성, Codex는 push까지).
- `TZ=UTC pnpm test` 통과 결과 보고.

## Rules

- 범위 내(이슈 10 Research Detail + 시안 도메인·Mock 확장)만. 다른 페이지·리팩터링·기능 변경 금지.
- 도메인 확장은 시안 표 범위로 한정(임의 신규 타입·필드 추가 금지). 공통 컴포넌트 우선 재사용.
- 보호 파일 수정 금지(`src/index.css`는 토큰 추가만). 차트 라이브러리 추가 금지(SVG/CSS만, 캔들·거래량은 이슈 19).
- `TZ=UTC pnpm test`로 CI 환경 재현 확인 후 보고.
