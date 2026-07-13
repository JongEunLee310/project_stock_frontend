# Codex Handoff Task

## Source Issue

https://github.com/JongEunLee310/project_stock_frontend/issues/123 (Revision R1)

## Task Summary

PR #124(watchlist UI 폴리시)에 대한 개발자 피드백 반영이다. 배지 인디케이터를 톤별로
분화한다: danger(빨간색)는 dot 대신 경고 기호 `⚠︎`, warning(노란색)은 주의 기호 `!`,
safe·neutral은 기존 dot을 유지한다.

## Goal

- danger 톤 배지(위험 증가·높음·고평가·과열)에 dot 대신 `⚠︎` 기호가 표시된다.
- warning 톤 배지(관망·중간)에 dot 대신 `!` 기호가 표시된다.
- safe·neutral 톤 배지는 기존 dot을 유지한다.
- 라벨 텍스트·배경/텍스트 톤 클래스·폴백 규칙은 변경되지 않는다.
- `corepack pnpm format:check` / `typecheck` / `lint` / `test` 4종 모두 통과한다.

## Background

설계 문서: `docs/designs/123-watchlist-ui-polish.md`의 **Revision R1** 절에 정확한
명세가 있다 (인디케이터 표, 반환 타입, TableBadge 분기, 크기·aria 규칙).

- `⚠︎`는 U+26A0 + U+FE0E(변형 선택자)로 텍스트 표현을 강제한다. 이모지 렌더링을
  피하기 위함이다.
- `!` glyph는 `font-bold`를 준다.
- glyph 크기는 배지 텍스트(text-xs)보다 크지 않게 `text-[11px]` 수준으로 맞춘다.
- 두 인디케이터 모두 `aria-hidden="true"`를 유지한다.

## Implementation Scope

**수정 파일:**

- `src/features/watchlist/adapters.ts`
  — resolver 5종 반환 타입을 `{ label, className, indicator }`로 변경.
    `indicator: { kind: 'dot' | 'glyph'; className: string; glyph?: string }`.
    `dotClassName` 필드와 `evaluationBadgeDotClassNames`는 새 인디케이터 맵으로
    대체한다 (danger → glyph `⚠︎`/`text-rose-400`, warning → glyph `!`/
    `text-amber-400 font-bold`, safe → dot `bg-emerald-400`, neutral → dot
    `bg-slate-400`).
- `src/pages/ui/WatchlistPage.tsx`
  — `TableBadge`가 `indicator`를 받아 `kind`로 분기 렌더링.
    상태 배지·`EvaluationBadgeCell`의 prop 전달을 새 형태로 갱신.

**테스트 파일:**

- `src/features/watchlist/adapters.test.ts` — resolver 단언을 `indicator` 형태로
  갱신. danger가 glyph `⚠︎`, warning이 glyph `!`, safe·neutral이 dot임을 단언.
  enum 픽스처 리터럴과 출처 주석은 유지한다.
- `src/pages/ui/WatchlistPage.test.tsx` — 라벨 기반 단언은 수정 없이 통과해야 한다.

## Out of Scope

- 톤 배경/텍스트 클래스·라벨·폴백 규칙 변경
- `stockStatusClassNames` 등 공유 토큰 변경
- BE 변경

## Protected Files

없음.

## Requirements

- 기존 테스트를 약화하거나 삭제하지 않는다.
- 라벨 기반 페이지 테스트가 깨지면 구현을 의심한다 (라벨은 바뀌면 안 된다).

## Verification Commands

- `corepack pnpm format:check`
- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `corepack pnpm test`

## Documentation Impact

없음 (설계 문서 R1 절은 이미 갱신됨).

## ADR Need

불필요.

## Failure Record Need

불필요.

## Risk Level

Low — 인디케이터 표현 변경. 라벨·폴백·핸들러 로직은 그대로다.

## Expected Output

- 변경 파일 목록 보고
- 검증 4종 실행 결과 보고
- 가정·잔여 위험 보고

## Rules

- Stay within scope.
- Do not weaken verification.
- 현재 브랜치 `feat/123-watchlist-ui-polish`에서 작업한다. 새 브랜치를 생성하지 않는다.
- 커밋하지 않는다 (커밋은 오케스트레이터가 별도 지시한다).
