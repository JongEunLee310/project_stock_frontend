# Codex Handoff Task — task-002: 디자인 토큰 및 공통 스타일 (이슈 3)

## Source Issue

- 이슈 3 `[FE] 디자인 토큰 및 공통 스타일 시스템 구성`
- 관련: ADR-003, `docs/designs/6-domain-types-and-mock-data.md`(StockStatus enum)

## Task Summary

Dark theme 기반 색상·간격·폰트 토큰과 상태 색상 5종을 Tailwind theme로 정의하고, Card/Badge/Button/Input 공통 스타일을 재사용 가능하게 구성한다.

## Goal

- Dark theme 색상 토큰이 단일 소스에서 정의되어 전 화면에 일관 적용된다.
- 상태 색상 5종(안정/관망/위험 증가/추가 리서치 필요/매수 검토 가능)이 토큰으로 존재한다.
- Card/Badge/Button/Input 기본 스타일이 재사용 가능하다.
- 위험 색상이 과도하게 자극적이지 않다.

## Background

- Tailwind v4(`@tailwindcss/vite`) 사용. v4는 CSS-first(`@theme`)로 토큰을 확장한다.
- 상태 색상은 `StockStatus` union(이슈 6)과 1:1 매핑되어야 한다.
- task-001에서 만든 `shared/` 레이어에 공통 UI/스타일을 둔다.

## Implementation Scope

- `src/index.css`(또는 shared 스타일 모듈)에 `@theme`로 Dark theme 색상·상태 색상·간격·폰트 토큰 정의.
- 상태 색상 토큰 5종 + 의미 기반 네이밍.
- `shared/ui`에 Card/Badge/Button/Input 기본 스타일 컴포넌트(또는 클래스 프리셋).
- 기본 배경/텍스트를 dark theme로 전환(현재 App의 light 클래스 정리).

## Out of Scope

- 페이지·레이아웃 구현(task-003).
- 도메인 타입 정의(task-004) — StockStatus 값만 참조.
- 차트 스타일(이슈 19).

## Protected Files

없음.

## Requirements

- 상태 색상은 접근성 대비를 확보하되 위험 색상은 톤다운.
- 토큰은 하드코딩 색상 대신 의미 토큰을 통해 사용.
- 컴포넌트는 props로 상태/변형을 받도록 최소 구성.

## Test Requirements

- Badge가 StockStatus 값에 따라 올바른 상태 클래스를 렌더하는지 최소 단위 테스트 1건.
- 기존 테스트 통과 유지.

## Verification Commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Documentation Impact

- 토큰·상태 색상 매핑을 README 또는 `shared/ui` 주석에 간단히 명시.

## ADR Need

불필요(ADR-003 범위 내 구현).

## Failure Record Need

불필요.

## Risk Level

Low. 스타일 한정, 보호 파일 없음.

## Expected Output

- 변경: `src/index.css`/shared 스타일, `shared/ui`의 Card/Badge/Button/Input, App 기본 스타일.
- `feat/fe-design-tokens` 브랜치(task-001 머지 후 최신 `main` 기준)에서 PR 1건.
- 변경 파일·검증 결과 보고.

## Rules

- task-001 머지 후 진행. 최신 `main`에서 분기.
- 범위 내 유지, 검증 약화 금지.
- 가정·검증 결과 보고.
