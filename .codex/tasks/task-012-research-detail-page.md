# Codex Handoff Task — task-012: Stock Research Detail 페이지 (이슈 10)

## Source Issue

- 이슈 10. `[FE] Stock Research Detail 페이지 구현` (Closes #10)
- 설계 기록: `docs/designs/10-research-detail-page.md`
- 의존(머지됨): task-005 Badge(PR #28), task-007 도메인·Mock 확장(PR #30), task-011 Signals(PR #33)
- 기반 브랜치: `feat/fe-research-detail-page`(최신 `main`에서 분기, 본 설계·핸드오프 커밋 포함)

## Task Summary

`ResearchPage`를 플레이스홀더에서 실제 화면으로 교체한다. `mockStockResearch`(+헤더는 `mockStocks`
조인) 기반으로 종목 헤더, **가격 추이 스파크라인(SVG, 차트 라이브러리 미사용)**, AI 브리핑, 핵심
리스크, 뉴스·공시 요약, 촉매 타임라인, 의사결정 체크리스트(체크 가능), 사용자 메모(입력 UI)를
구현한다. 신규 도메인 타입은 만들지 않는다.

## Goal

- `/research/NVDA`(및 AAPL·TSLA·MSFT)에서 리서치 상세가 표시된다.
- **헤더 카드**: 티커·이름·시장, 현재가·전일대비, 상태 `Badge`, AI 스탠스(`stance`).
- **가격 추이**: `pricePoints`를 **SVG `polyline` 스파크라인**으로 렌더 + 최신 종가·기간 등락 텍스트.
- **AI 브리핑**: `briefing.headline` + `body` 표시(완료 조건 "AI 투자 스탠스 표시").
- **핵심 리스크 3건 이상**: `keyRisks` 리스트 + 위험도 `Badge`(RiskLevel).
- **뉴스·공시 요약**: `news`(헤드라인·출처·시각·위험도).
- **촉매 타임라인**: `catalysts` 날짜 오름차순.
- **체크리스트**: `checklist` 항목 체크박스 토글(로컬 상태, 체크 가능).
- **메모**: `memo` 초기값 textarea 입력(로컬 상태).
- mock에 없는 심볼은 안전한 미발견 안내(빈 상태)를 표시한다.
- 기존 공통 컴포넌트(`Badge`/`Button`/`Card`/`Input`)를 재사용한다.

## Background

- 기존 `ResearchPage`는 `PagePlaceholder` 래퍼(`src/pages/ui/ResearchPage.tsx`), `useParams`로 심볼 수신.
- 데이터: `mockStockResearch`(`src/shared/mock/domain.ts`) — 심볼 키(NVDA/AAPL/TSLA/MSFT) → `StockResearch`:
  `symbol`/`pricePoints`(`{date,close}[]`)/`stance`/`briefing`(`{headline,body}`)/`keyRisks`(`ResearchRisk`:
  `id`/`title`/`level`(RiskLevel)/`description`)/`news`(`NewsItem`: `id`/`headline`/`source`/`publishedAt`/
  `risk`)/`catalysts`(`CatalystItem`: `id`/`date`/`title`/`description`)/`checklist`(`ChecklistItem`:
  `id`/`label`/`checked`)/`memo`.
- 헤더 기본 정보는 `mockStocks`(동일 심볼 4종)에서 조인: `name`/`market`/`price`/`change`/`changePercent`/
  `status`.
- `Badge`는 `status`(StockStatus)·위험도(`RiskLevel`)로 색상 자동 매핑(`src/shared/ui/Badge.tsx`) —
  인라인 복제 금지. (Watchlist에서 RiskLevel Badge 사용 선례 있음.)
- 라우트: `appRoutePaths.watchlist='/watchlist'`, `appRoutePaths.decisionLog='/decision-log'`
  (`src/shared/config/navigation.ts`). 이동은 `react-router-dom`의 `Link`/`useNavigate`.
- 시간 표시가 필요하면 **명시적 `timeZone: 'Asia/Seoul'`** 고정(Watchlist·Signals `timeFormatter` 선례 —
  미지정 시 CI(UTC)에서 시간 단언 테스트가 깨진다). 날짜만(YYYY-MM-DD) 표시는 문자열 그대로 사용 가능.
- 컨벤션: `docs/knowledge/frontend-conventions.md` — 공통 컴포넌트 우선, 네이티브 다이얼로그 금지.

## Implementation Scope (`src/pages/ui/ResearchPage.tsx`)

플레이스홀더 제거 후 설계대로 구현:

- **종목 헤더 카드** — `mockStocks` 조인(티커·이름·시장·현재가·전일대비), 상태 `Badge`, AI 스탠스.
  보조 액션: 워치리스트(→`/watchlist`)·판단 기록(→`/decision-log`).
- **가격 추이 스파크라인** — `pricePoints.close`를 SVG `viewBox` 좌표로 정규화해 `polyline`로 렌더.
  최신 종가 + 기간 첫~마지막 등락(% 또는 절대값) 텍스트 동반. **차트 라이브러리 도입 금지**(SVG/CSS만).
  접근성: `<svg role="img">` + `aria-label`(예: "NVDA 최근 가격 추이").
- **AI 브리핑 패널** — `briefing.headline`(강조) + `body`.
- **핵심 리스크 패널** — `keyRisks` 리스트(제목·설명·위험도 `Badge`). 3건 이상 노출.
- **뉴스·공시 요약** — `news` 리스트(헤드라인·출처·발행 시각·위험도 `Badge`).
- **촉매 타임라인** — `catalysts` 날짜 오름차순(날짜·제목·설명).
- **체크리스트** — `checklist`를 `useState` 초기화 후 체크박스 토글(로컬). 라벨·체크 상태 표시.
- **메모** — `memo` 초기값 textarea(`useState`). 입력 가능(로컬, 영속화 없음).
- **미발견 처리** — `mockStockResearch[symbol]`이 없으면 안전한 안내(빈 상태) + 워치리스트 복귀 링크.
- 페이지 하위 조립 요소는 재사용 신호가 약하면 페이지 내부/페이지 디렉터리 하위 파일. 2곳 이상
  재사용/도메인 표현이면 적절 레이어(`shared/ui`의 스파크라인 등)로 분리.

## Out of Scope

- 본격 가격 차트·기술 지표·시계열 인터랙션(이슈 19). 스파크라인으로 충분.
- 실시간 시세·서버 연동·메모/체크리스트 영속화(현 단계 mock·로컬 상태, 새로고침 시 초기화).
- 신규 도메인 타입 신설(모두 기존 `StockResearch`/`Stock`에서 파생).
- 다른 페이지(Watchlist/Signals 등)·라우팅·네비게이션 변경.

## Protected Files

- `src/index.css`는 `@theme` 토큰 **추가만** 허용(기존 토큰 수정/삭제 금지). 가능하면 기존 토큰 재사용.
- 그 외 보호 파일(AGENTS.md/CLAUDE.md/.codex/instructions·agents·config/ci.yml/docs/harness·decisions·
  failures) **수정 금지**.

## Requirements

- 스파크라인은 SVG/CSS만으로 구현(차트 라이브러리 추가 금지). `pricePoints` 정규화 후 `polyline`.
- 상태·위험도 표시는 기존 `Badge`(StockStatus·RiskLevel) 재사용 — 색상 클래스 인라인 복제 금지.
- 시간 표시가 있으면 포매터에 `timeZone: 'Asia/Seoul'` 고정. 날짜 문자열(YYYY-MM-DD)은 그대로 표기 가능.
- 네이티브 다이얼로그(alert/confirm/prompt) 금지 — 필요 시 인앱 UI.
- 체크리스트 토글·메모 입력은 제어 컴포넌트(`useState`)로 동작.

## Test Requirements

- `src/pages/ui/ResearchPage.test.tsx` 신규: (1) 종목 헤더(티커·이름·상태)·AI 스탠스 렌더, (2) 핵심
  리스크 3건 이상 표시, (3) 체크리스트 항목 클릭 시 체크 상태 토글, (4) 메모 textarea 입력 반영,
  (5) 미발견 심볼 경로에서 빈 상태 안내. (필요 시 가격 스파크라인 `aria-label` 존재 확인.)
- 시간 단언이 있으면 **타임존 독립**이어야 함(포매터 `timeZone` 고정 전제). 가능하면 종목/상태/라벨로
  단언해 시간 문자열 단언을 피한다. `App.test.tsx` 등 기존 테스트 영향 시 정합 갱신.
- 라우트 파라미터(`/research/:symbol`)는 `createMemoryRouter`로 진입(Signals 테스트 선례 참고).

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

- 설계 `docs/designs/10-research-detail-page.md`와 구현 일치. mock은 기존 `mockStockResearch` 활용
  (신규 fixture 없으면 README 갱신 불필요). ADR·실패 기록 불필요(기존 FSD·도메인 점진 확장).

## ADR Need

불필요.

## Failure Record Need

불필요.

## Risk Level

Low~Medium. 신규 페이지 1개. 도메인 타입 변경 없음(파괴적 변경 없음). 스파크라인은 SVG 단순 구현.

## Expected Output

- 변경: `src/pages/ui/ResearchPage.tsx`(구현), `src/pages/ui/ResearchPage.test.tsx`(신규), 스파크라인을
  `shared/ui`로 분리 시 해당 파일. 필요 시 `App.test.tsx` 정합.
- 브랜치 `feat/fe-research-detail-page`에 커밋(새 PR은 Claude가 생성, Codex는 push까지).
- `TZ=UTC pnpm test` 통과 결과 보고.

## Rules

- 범위 내(이슈 10 Research Detail 페이지)만. 다른 페이지·리팩터링·기능 변경 금지.
- 신규 도메인 타입 신설 금지(파생으로 해결). 공통 컴포넌트 우선 재사용.
- 보호 파일 수정 금지(`src/index.css`는 토큰 추가만). 차트 라이브러리 추가 금지(SVG/CSS만).
- `TZ=UTC pnpm test`로 CI 환경 재현 확인 후 보고.
