# Codex Handoff Task

## Source Issue

https://github.com/JongEunLee310/project_stock_frontend/issues/123

## Task Summary

관심 종목 페이지 UI 폴리시 3건이다. 상단 툴바(검색·정렬·시장·위험 필터·액션 버튼)를
데스크톱에서 한 줄로 재배치하고, 테이블 헤더를 가운데 정렬하며, 상태·평가 배지 5종을
dot + soft tint 스타일로 리디자인한다.

## Goal

- 데스크톱(xl)에서 툴바 컨트롤과 버튼이 한 줄로 렌더링된다. 좁은 화면에서는
  `flex-wrap`으로 감긴다.
- 테이블 헤더 12개가 가운데 정렬된다. 배지가 들어가는 5개 셀(상태·뉴스 위험도·
  밸류에이션·테마 과열·AI 판단)도 가운데 정렬된다.
- 배지 5종이 border 없는 dot + 옅은 배경 스타일로 렌더링된다. 라벨 텍스트는
  기존과 동일하다.
- `corepack pnpm format:check` / `typecheck` / `lint` / `test` 4종 모두 통과한다.

## Background

설계 문서: `docs/designs/123-watchlist-ui-polish.md` — Verified Facts·Decisions에
현재 코드 위치와 정확한 클래스 명세가 있다. 구현 전 Verified Facts를 실제 파일과
대조하고, 불일치하면 실코드를 우선한다.

핵심 명세 요약 (상세는 설계 문서):

- 툴바: Card 내부를 단일 `flex flex-wrap items-center gap-2`로 재구성.
  검색 `min-w-[14rem] max-w-sm flex-1`, select 3종 `w-auto`, 버튼 그룹 첫 버튼에
  `ml-auto`. 컨트롤 높이 `min-h-11` → `min-h-9`, Card `p-4` → `p-3`.
- 헤더: th 공통 클래스 `text-left` → `text-center`.
- 배지 공통 마크업: `inline-flex items-center gap-1.5 rounded-md px-2 py-0.5
  text-xs font-medium` + 톤 클래스, dot은
  `<span aria-hidden="true" className="h-1.5 w-1.5 rounded-full …" />`.
- 톤 4종 (danger/warning/safe/neutral): `bg-{rose|amber|emerald|slate}-500/10
  text-{…}-300`, dot `bg-{…}-400`. 설계 문서 Decisions §3 표 참조.
- resolver 5종 반환 타입을 `{ label, className, dotClassName }`으로 확장.
  `resolveStatusBadge`는 `stockStatusClassNames` 의존을 제거하고 adapters 내부
  톤 매핑을 사용한다 (안정 → safe, 관망 → warning, 위험 증가 → danger).
  라벨 매핑·폴백 규칙은 바꾸지 않는다.

## Implementation Scope

**수정 파일:**

- `src/features/watchlist/adapters.ts`
  — `evaluationBadgeClassNames` 새 스타일로 교체, `evaluationBadgeDotClassNames` 추가
  — resolver 5종(`resolveStatusBadge`, `resolveNewsRiskBadge`, `resolveValuationBadge`,
    `resolveThemeHeatBadge`, `resolveAiJudgmentBadge`)에 `dotClassName` 추가
  — `stockStatusClassNames` import 제거 (다른 사용처가 없는지 확인 후)
- `src/pages/ui/WatchlistPage.tsx`
  — 툴바 재구성 (WatchlistPage.tsx:454-528 영역)
  — th `text-center` (760-768 영역), 상태 배지 셀·`EvaluationBadgeCell` 셀
    `text-center`, `EvaluationBadgeCell`의 Skeleton `mx-auto`·`—` 동일 정렬
  — 상태 배지 span과 `EvaluationBadgeCell`의 배지 마크업을 dot 스타일로 통일.
    공통 렌더링 추출 가능 (예: 파일 내 `TableBadge` 컴포넌트)

**테스트 파일:**

- `src/features/watchlist/adapters.test.ts` — resolver 단언을 `dotClassName` 포함
  형태로 갱신. enum 픽스처 리터럴과 출처 주석(`// app/domains/watchlists/types.py`)은
  유지한다.
- `src/pages/ui/WatchlistPage.test.tsx` — 라벨 기반 단언은 변경 없이 통과해야 한다.
  클래스 문자열 직접 단언이 있으면 새 스타일로 갱신한다.

## Out of Scope

- `src/shared/ui/stockStatus.ts` 등 공유 토큰 변경 (다른 페이지 영향)
- 테이블 본문 텍스트 셀(종목·섹터·현재가 등) 정렬 변경
- 열 설정·내보내기·전체화면
- BE 변경

## Protected Files

없음.

## Requirements

- 배지 라벨 텍스트와 폴백 규칙은 기존과 동일하게 유지한다.
- 검색·정렬·시장·위험 필터와 버튼의 기존 동작(핸들러·aria-label·페이지 리셋)은
  변경하지 않는다. 레이아웃과 스타일만 바꾼다.
- 기존 테스트를 약화하거나 삭제하지 않는다. 라벨 기반 단언이 깨지면 구현을
  의심한다 (라벨은 바뀌면 안 된다).

## Verification Commands

- `corepack pnpm format:check`
- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `corepack pnpm test`

(prettier 미준수 시 해당 파일만 `corepack pnpm prettier --write <파일>`로 정리.)

## Documentation Impact

- `docs/designs/123-watchlist-ui-polish.md` — 구현 완료 후 Status를 `Implemented`로
  갱신한다.

## ADR Need

불필요. 시각 스타일 변경이며 계약·구조 변화가 없다.

## Failure Record Need

불필요.

## Risk Level

Low — 스타일·레이아웃 변경. 유일한 로직 접점은 resolver 반환 타입 확장이며
라벨·폴백 규칙은 유지된다.

## Expected Output

- 변경 파일 목록 보고
- 검증 4종 실행 결과 보고
- 가정·잔여 위험 보고

## Rules

- Stay within scope.
- Do not weaken verification.
- Report assumptions and verification results.
- 현재 브랜치 `feat/123-watchlist-ui-polish`에서 작업한다. 새 브랜치를 생성하지 않는다.
- 커밋하지 않는다 (커밋은 오케스트레이터가 별도 지시한다).
