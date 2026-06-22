# Codex Handoff Task — task-011: Signals 시그널 페이지 (이슈 9)

## Source Issue

- 이슈 9. `[FE] Signals 시그널 페이지 구현` (Closes #9)
- 설계 기록: `docs/designs/9-signals-page.md`
- 의존(머지됨): task-005 Badge(PR #28), task-006 Table(PR #29), task-007 도메인·Mock 확장(PR #30)
- 기반 브랜치: `feat/fe-signals-page`(최신 `main`에서 분기, 본 설계·핸드오프 커밋 포함)

## Task Summary

`SignalsPage`를 플레이스홀더에서 실제 화면으로 교체한다. `mockSignals` 기반으로 상태별 요약 카드,
필터 바, **시그널 카드 그리드**(신뢰도 막대바·근거 bullet·판단 기록 버튼), 우측 우선순위·최근 변경
패널을 구현한다. 신규 도메인 타입은 만들지 않고, `mockSignals` 항목만 보강한다.

## Goal

- `/signals`에서 시그널이 카드 그리드로 표시된다.
- 각 카드에 종목·상태(Badge)·시그널 유형·메시지·**신뢰도(막대바+숫자)**·근거 bullet·갱신 시각이 보인다.
- 카드에 **[판단 기록]** 버튼(→ `/decision-log`)과 리서치 보기(→ `/research/:symbol`)가 있다.
- 상태별 요약 카드 4종(매수 검토 가능·위험 증가·추가 리서치 필요·관망 유지) 개수가 표시된다.
- 검색·상태·시그널 유형 필터·정렬(신뢰도/우선순위/최근 변경)·필터 초기화가 동작한다.
- 우측에 우선순위 패널(`priority` 오름차순)·최근 변경 패널(`updatedAt` 내림차순)이 표시된다.
- 기존 공통 컴포넌트(`Badge`/`Button`/`Input`/`Card`)를 재사용한다.

## Background

- 기존 `SignalsPage`는 `PagePlaceholder` 래퍼 한 줄(`src/pages/ui/SignalsPage.tsx`).
- 데이터: `mockSignals`(`src/shared/mock/domain.ts`) — `Signal`: `id`/`symbol`/`kind`(`SignalKind`)/
  `message`/`createdAt`/`status`(`StockStatus`)/`confidence`(0~100)/`reasons`(string[])/`updatedAt`/
  `priority`(작을수록 우선).
- `SignalKind = 'price_momentum' | 'earnings' | 'valuation' | 'news' | 'technical'`.
- `Badge`는 `status`(StockStatus)로 색상 자동 매핑(`src/shared/ui/Badge.tsx`) — 인라인 복제 금지.
- 라우트: `appRoutePaths.research='/research/:symbol'`, `appRoutePaths.decisionLog='/decision-log'`
  (`src/shared/config/navigation.ts`). 이동은 `react-router-dom`의 `Link`/`useNavigate`.
- 시간 표시는 **명시적 `timeZone: 'Asia/Seoul'`** 고정(WatchlistPage `timeFormatter` 선례 — 미지정 시
  CI(UTC)에서 시간 단언 테스트가 깨진다).
- 컨벤션: `docs/knowledge/frontend-conventions.md` — 공통 컴포넌트 우선, 네이티브 다이얼로그 금지.

## Implementation Scope

### A. Mock 보강 (`src/shared/mock/domain.ts`)

- `mockSignals`에 항목 추가(신규 타입·필드 없음, `satisfies Signal[]` 유지):
  - **`관망 유지` 상태 시그널 최소 1건**(완료 조건 충족).
  - 그리드·패널이 의미 있게 보이도록 총 **5~6건** 수준으로 확장. `kind`/`confidence`/`priority`/
    `updatedAt`을 다양하게(예: technical·news 유형 포함). 기존 3건은 유지.
  - 시간 단언 안정화를 위해 `updatedAt`은 분 단위가 겹치지 않게(또는 테스트는 종목/상태로 단언).

### B. 페이지 구현 (`src/pages/ui/SignalsPage.tsx`)

- 플레이스홀더 제거 후 설계대로 구현:
  - **요약 카드 4종** — 상태별 개수 `useMemo` 파생(`Card` 재사용).
  - **필터 바** — 검색 `Input`, 상태/유형/정렬 `<select>`, 필터 초기화 `Button`. 상태는 `useState` +
    `useMemo` 파생.
  - **시그널 카드 그리드** — 카드별: 헤더(티커→`/research/:symbol` Link · 상태 `Badge` · 유형 라벨),
    메시지, **신뢰도 막대바+숫자**(CSS 진행 막대, `aria` 라벨, `confidence`% 채움), 근거 bullet 리스트,
    갱신 시각, **[판단 기록]** 버튼(→`/decision-log`) + 리서치 보기.
  - **우측 레일** — 우선순위 패널(`priority` 오름차순 상위)·최근 변경 패널(`updatedAt` 내림차순 상위).
- 페이지 하위 조립 요소(요약 카드 그룹·필터 바·시그널 카드·레일 패널)는 재사용 신호가 약하면 페이지
  내부 또는 페이지 디렉터리 하위 파일. 2곳 이상 재사용/도메인 표현이면 적절 레이어
  (`widgets`/`features`/`entities/signal`)로 분리.
- 시그널 유형(`SignalKind`) → 한국어 라벨 매핑은 페이지/공용 유틸로 둔다.

## Out of Scope

- 차트·스파크라인(신뢰도는 CSS 막대로 충분, 시계열 필요 시 이슈 19).
- 신규 도메인 타입 신설(요약·우선순위·최근 변경 모두 `Signal`/`mockSignals` 파생).
- 실시간 갱신·서버 연동·시그널 생성 로직.
- 다른 페이지(Watchlist 등)·라우팅·네비게이션 변경.

## Protected Files

- `src/index.css`는 `@theme` 토큰 **추가만** 허용(기존 토큰 수정/삭제 금지). 가능하면 기존 토큰 재사용.
- 그 외 보호 파일(AGENTS.md/CLAUDE.md/.codex/instructions·agents·config/ci.yml/docs/harness·decisions·
  failures) **수정 금지**.

## Requirements

- 신뢰도 막대바는 `confidence`(0~100) 비율로 채우고, 숫자(%)를 함께 표시. 접근성 라벨 포함.
- 상태 표시는 기존 `Badge`(StockStatus) 재사용 — 색상 클래스 인라인 복제 금지.
- 시간 포매터는 `timeZone: 'Asia/Seoul'` 고정(MM.DD HH:mm, 24시간).
- 네이티브 다이얼로그(alert/confirm/prompt) 금지 — 필요 시 인앱 UI.

## Test Requirements

- `src/pages/ui/SignalsPage.test.tsx` 신규: (1) 시그널 카드 렌더(종목·상태·신뢰도·근거), (2) 4개 상태가
  모두 표시(매수 검토 가능·위험 증가·추가 리서치 필요·**관망 유지**), (3) [판단 기록] 버튼이 카드에 존재,
  (4) 필터/검색으로 표시 카드가 좁혀짐.
- 시간 단언이 있으면 **타임존 독립**이어야 함(포매터 `timeZone` 고정 전제). `App.test.tsx` 등 기존
  테스트 영향 시 정합 갱신.

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

- 신규 mock fixture 추가 시 `src/shared/README.md`의 mock 설명에 시그널 항목 보강 반영.
- 설계 `docs/designs/9-signals-page.md`와 구현 일치. ADR·실패 기록 불필요(기존 FSD·도메인 점진 확장).

## ADR Need

불필요.

## Failure Record Need

불필요.

## Risk Level

Low~Medium. 신규 페이지 + mock 항목 추가. 도메인 타입 변경 없음(파괴적 변경 없음).

## Expected Output

- 변경: `src/pages/ui/SignalsPage.tsx`(구현), `src/pages/ui/SignalsPage.test.tsx`(신규),
  `src/shared/mock/domain.ts`(`mockSignals` 보강), 필요 시 `src/shared/README.md`·`App.test.tsx` 정합.
- 브랜치 `feat/fe-signals-page`에 커밋(새 PR은 Claude가 생성, Codex는 push까지).
- `TZ=UTC pnpm test` 통과 결과 보고.

## Rules

- 범위 내(이슈 9 Signals 페이지 + mock 보강)만. 다른 페이지·리팩터링·기능 변경 금지.
- 신규 도메인 타입 신설 금지(파생으로 해결). 공통 컴포넌트 우선 재사용.
- 보호 파일 수정 금지(`src/index.css`는 토큰 추가만).
- `TZ=UTC pnpm test`로 CI 환경 재현 확인 후 보고.
