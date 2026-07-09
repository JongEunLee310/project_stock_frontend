# Codex Handoff Task

## Source Issue

https://github.com/JongEunLee310/project_stock_frontend/issues/125

## Task Summary

watchlist 페이지 디테일 개선 4건이다. 종목 마크를 실제 회사 로고(Parqet CDN)로
교체하고, AI 관찰 메모에 더보기/접기 토글을 추가하며, 평가 지표 3종 헤더에 ⓘ 지표
정의 툴팁을 붙이고, 변화(1D) 스파크라인을 range=1D(15분 바)로 전환한다.

## Goal

- 로고가 있는 종목은 실제 로고, 없는 종목·로드 실패는 기존 글자 마크 폴백이 렌더링된다.
- 긴 AI 관찰 메모(120자 초과)가 3줄로 잘려 보이고 더보기/접기로 전문을 토글한다.
- 뉴스 위험도·밸류에이션·테마 과열 헤더에서 ⓘ hover/focus 시 지표 정의 툴팁이
  표시되고 Escape로 닫힌다.
- 스파크라인 요청이 `range=1D`로 나간다.
- `corepack pnpm format:check` / `typecheck` / `lint` / `test` 4종 모두 통과한다.

## Background

설계 문서: `docs/designs/125-watchlist-detail-polish.md` — Verified Facts에 현재 코드
위치가, Decisions §1~§4에 정확한 명세(로고 URL 규칙, 길이 임계값, 툴팁 마크업·문구,
range 전환)가 있다. 구현 전 Verified Facts를 실제 파일과 대조하고, 불일치하면 실코드를
우선한다. 툴팁 문구는 설계 문서의 3개 문단을 그대로 사용한다.

핵심 명세 요약 (상세는 설계 문서):

- `StockLogo`: `https://assets.parqet.com/logos/symbol/{sym}`, KOSPI → `.KS`,
  KOSDAQ → `.KQ`, 그 외 symbol 그대로. `loading="lazy"`, `alt=""`, `onError` 시
  `symbolMarks` 글자 마크 폴백. 테이블 `StockIdentity`와 "새로 추가된 관심 종목"
  aside 양쪽에 적용 (aside는 market 없음 → symbol 그대로).
- AI 메모: `note.length > 120`일 때만 토글 노출, 접힘 상태 `line-clamp-3`, 항목별
  확장 상태 관리.
- `InfoTooltip`: button(aria-label) + ⓘ(U+24D8), `role="tooltip"` + `aria-describedby`,
  hover·focus 표시, Escape 닫기, 미표시 시 툴팁 노드 미렌더링. 헤더 배열은
  `{ label, info? }` 객체 배열로 전환.
- 스파크라인: `WatchlistPage.tsx:392` 호출만 `useWatchlistSparklines('1D')`로 변경.
  BE 미지원 환경에서는 기존 에러 폴백(빈 맵 → `—`)이 동작한다.

## Implementation Scope

**신규 파일:**

- `src/shared/ui/StockLogo.tsx` + `src/shared/ui/StockLogo.test.tsx`
- `src/shared/ui/InfoTooltip.tsx` + `src/shared/ui/InfoTooltip.test.tsx`
- `src/shared/ui/index.ts`에 export 추가

**수정 파일:**

- `src/pages/ui/WatchlistPage.tsx`
  — `StockIdentity`(190-221)·aside(1140-1160 부근) 마크를 `StockLogo`로 교체.
    `symbolMarks`는 폴백 소스로 유지 (StockLogo로 이동 가능)
  — AI 관찰 메모(1074-1095) 더보기/접기
  — 헤더 배열(780-803) 객체화 + 3개 헤더 `InfoTooltip`
  — `useWatchlistSparklines('1D')`(392)

**테스트 파일:**

- 설계 문서 "테스트 영향" 절의 시나리오를 모두 구현한다.
- `src/features/watchlist/queries.test.tsx` — sparklines URL `range=1D` 단언 갱신.
- `src/pages/ui/WatchlistPage.test.tsx` — 기존 라벨·배지 단언은 수정 없이 통과해야
  한다. 헤더 텍스트 단언이 있으면 객체화 이후에도 라벨이 유지되므로 통과해야 한다.

## Out of Scope

- 셀 클릭 시 종목별 근거 팝오버 (BE 계약 필요, 후속)
- `DashboardPage.tsx` 등 다른 페이지의 종목 마크
- BE 변경, 배지·필터·정렬 등 기존 동작 변경
- 열 설정·내보내기·전체화면

## Protected Files

없음.

## Requirements

- 기존 테스트를 약화하거나 삭제하지 않는다.
- 테스트 픽스처의 enum·리터럴 출처 주석(`// app/domains/watchlists/types.py` 등)은
  유지한다.
- 검색·필터·배지·행 클릭 등 기존 핸들러 동작을 변경하지 않는다.
- 네트워크 실호출 없이 테스트한다 (로고 img는 fireEvent.error로 폴백 검증).

## Verification Commands

- `corepack pnpm format:check`
- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `corepack pnpm test`

(prettier 미준수 시 해당 파일만 `corepack pnpm prettier --write <파일>`로 정리.)

## Documentation Impact

- `docs/designs/125-watchlist-detail-polish.md` — 구현 완료 후 Status를 `Implemented`로
  갱신한다.

## ADR Need

불필요.

## Failure Record Need

불필요.

## Risk Level

Low~Medium — 신규 shared/ui 컴포넌트 2종과 페이지 렌더링 변경. 데이터 계약 변경은
스파크라인 range 파라미터 하나다.

## Expected Output

- 변경 파일 목록 보고
- 검증 4종 실행 결과 보고
- 가정·잔여 위험 보고

## Rules

- Stay within scope.
- Do not weaken verification.
- Report assumptions and verification results.
- 현재 브랜치 `feat/watchlist-detail-polish`에서 작업한다. 새 브랜치를 생성하지 않는다.
- 커밋하지 않는다 (커밋은 오케스트레이터가 별도 지시한다).
