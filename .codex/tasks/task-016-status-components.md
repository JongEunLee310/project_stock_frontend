# Codex Handoff Task

## Source Issue

Issue 18 — `[FE] Loading, Empty, Error 상태 컴포넌트 구현` (마일스톤 FE-M3).
설계 기록: `docs/designs/18-status-components.md`.

## Task Summary

`src/shared/ui`에 공통 상태 컴포넌트 `Skeleton`/`EmptyState`/`ErrorState`(재시도 포함)를 추가하고,
현재 페이지마다 산재한 ad-hoc 빈 상태를 공통 `EmptyState`로 수렴한다.

## Goal

작업 완료 시 다음이 참이어야 한다:

- `src/shared/ui`에서 `Skeleton`, `EmptyState`, `ErrorState`를 import할 수 있다(barrel re-export).
- 세 컴포넌트가 단위 테스트로 렌더·역할·재시도 콜백·`lines` 분기를 검증한다.
- Research/Watchlist/Signals의 기존 빈 상태가 공통 `EmptyState`로 치환된다(표시 텍스트 동등 유지).
- 로딩 Skeleton·에러 상태·재시도 버튼 컴포넌트가 완성되어 #17에서 쿼리 상태에 연결할 준비가 된다.
- 전 검증 게이트 통과.

## Background

- 현재 빈 상태는 제각각: `Table.emptyMessage` prop(Dashboard/DecisionLog), Research 로컬
  `EmptyResearchState`(`Card` 기반), Watchlist/Signals 인라인 "조건에 맞는 … 없습니다" 텍스트.
- 로딩 Skeleton·에러 상태·재시도 UI는 전무.
- 데이터는 동기 mock 파생이라 **실제 비동기 로딩/에러 흐름이 아직 없다.** 비동기 API client +
  TanStack Query는 **#17**(이 작업 이후 라운드). 따라서 이 작업은 #17의 토대다.
- 기존 컨벤션: `Button`(variant primary/secondary/ghost), `Card`, `classNames`, `app-*` 토큰.
  공통 컴포넌트 우선, 네이티브 다이얼로그 금지(인앱 UI만).

## Implementation Scope

- 신규: `src/shared/ui/Skeleton.tsx`, `src/shared/ui/EmptyState.tsx`, `src/shared/ui/ErrorState.tsx`.
- `src/shared/ui/index.ts`에 컴포넌트·props 타입 re-export 추가(add-only).
- 단위 테스트: `src/shared/ui/Skeleton.test.tsx`, `EmptyState.test.tsx`, `ErrorState.test.tsx`
  (기존 `Badge.test.tsx`/`Table.test.tsx` 패턴 준수).
- 빈 상태 치환: `src/pages/ui/ResearchPage.tsx`(`EmptyResearchState` 내부),
  `WatchlistPage.tsx`, `SignalsPage.tsx`의 인라인 빈 텍스트 → 공통 `EmptyState`.

## Out of Scope

- 비동기 데이터 패칭/로딩·에러 트리거 도입, 가짜 async(setTimeout) 시뮬레이션 (#17에서 연결).
- `Table.emptyMessage` 기본 동작 강제 변경(ReactNode이므로 호출부 전달은 허용, 일괄 치환 금지).
- Portfolio/Alerts/Settings 신규 콘텐츠(#14/#15/#16).
- 도메인 타입/Mock 변경.
- recharts/차트 관련 변경(별도 PR #41).

## Protected Files

- 없음. (`src/index.css` `@theme` 수정 금지 — 기존 `app-*` 토큰만 사용.)

## Requirements

- `Skeleton`: `className?`/`lines?` 지원. `animate-pulse` CSS만 사용(JS 애니메이션 금지). 장식 →
  `aria-hidden`. `lines` 미지정 시 단일 블록, 지정 시 텍스트 줄 n개.
- `EmptyState`: `title`(필수)/`description?`/`icon?`(aria-hidden)/`action?`/`className?`. `role="status"`.
- `ErrorState`: `title?`(기본 "문제가 발생했습니다")/`description?`/`onRetry?`/`retryLabel?`(기본 "재시도")/
  `className?`. `role="alert"`. `onRetry` 지정 시 공통 `Button`(`variant="secondary"`)으로 재시도 버튼 렌더,
  클릭 시 `onRetry` 호출. 미지정 시 버튼 없음.
- 스타일: 기존 `app-*` 토큰·`Card`/`Button` 컨벤션 일관. 과한 변형 prop 금지(필요 최소).
- 빈 상태 치환은 사용자에게 보이는 텍스트를 의미 동등하게 유지.

## Test Requirements

- 컴포넌트별 단위 테스트: `Skeleton`(lines 분기 렌더), `EmptyState`(title/description/role 렌더),
  `ErrorState`(role, onRetry 미지정 시 버튼 없음 / 지정 시 버튼 렌더 + 클릭 콜백 호출).
- 치환된 페이지의 기존 테스트(`ResearchPage.test.tsx` 빈 상태 케이스 등)가 계속 통과해야 한다.
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

- 설계 `docs/designs/18-status-components.md`(동반)와 일치 유지.
- 상태 컴포넌트 사용 규칙은 패턴 확정 시 `docs/knowledge/frontend-conventions.md` 반영 고려(비차단 후속).

## ADR Need

불필요. 신규 라이브러리/아키텍처 도입 없음(기존 ADR-003 스택 내 공통 컴포넌트 추가).

## Failure Record Need

불필요. 회귀·실패 예상 없음.

## Risk Level

Low. 신규 공통 컴포넌트 추가 + 빈 상태 텍스트 치환. 회귀면은 치환 페이지에 한정.

## Expected Output

- 브랜치 `feat/fe-status-components`(최신 `main` 기준 분기).
- PR 본문에 `Closes #18`.
- 신규 컴포넌트 3종 + 테스트 3종, barrel re-export, 3개 페이지 빈 상태 치환.
- 전 검증 게이트 통과 결과 보고.

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
