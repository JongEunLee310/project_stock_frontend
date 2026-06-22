# Codex Handoff Task — task-006: 공통 Table 컴포넌트 (이슈 12)

## Source Issue

- 이슈 12 `[FE] 공통 테이블 컴포넌트 구현`
- 설계 기록: `docs/designs/12-table-component.md`
- 의존: task-002(디자인 토큰), task-003(공통 UI 구조)

## Task Summary

Watchlist, Decision Log, Alerts, Portfolio 등 여러 화면에서 재사용할 수 있는 제네릭 Table 컴포넌트를 `shared/ui`에 구현한다. Header/Row/Cell 스타일, Empty/Loading 상태, Pagination UI, Row action 슬롯을 지원한다.

## Goal

- 컬럼 설정과 행 데이터를 받아 표를 렌더링하는 제네릭 `Table<T>` 컴포넌트가 존재한다.
- 빈 데이터 상태와 로딩 상태를 표시할 수 있다.
- 페이지네이션 UI가 표시된다(클라이언트 상태 기반).
- 행별 액션 영역(메뉴/버튼 슬롯)을 지원한다.
- 이슈 8(Watchlist)·이슈 11(Decision Log) 테이블이 이 컴포넌트 위에서 구현 가능하다.

## Background

- 기존 공통 UI: `src/shared/ui/`(`Button`, `Card`, `Input`, `Badge`, `classNames`)와 배럴 `index.ts`. 동일 패턴·디자인 토큰(`app-*`, `rounded-control` 등)을 따른다.
- Tailwind v4(설정은 `src/index.css` `@theme`). 별도 config 파일 없음.
- 실제 데이터 연동은 페이지 task(8/11/14/15)에서 수행. 본 task는 표시·상호작용 골격에 한정.

## Implementation Scope

- `src/shared/ui/Table.tsx`(필요 시 `TableTypes.ts` 분리): 제네릭 `Table<T>` 컴포넌트.
  - 컬럼 정의 기반 렌더(컬럼: key/header/cell 렌더러/정렬 옵션 등 최소 필드).
  - Header / Row / Cell 스타일을 디자인 토큰으로 정의.
  - `isLoading` 시 로딩 표시, 데이터 0건 시 Empty 표시(메시지 주입 가능).
  - Row action 슬롯(행 렌더러가 액션 영역을 받을 수 있는 구조).
  - 페이지네이션 UI(현재 페이지/총 페이지/이전·다음). 페이지 상태는 제어/비제어 중 단순한 쪽 선택.
- `src/shared/ui/index.ts`: `Table` 및 관련 타입 export.

## Out of Scope

- 실제 페이지 통합·실데이터 바인딩(이슈 8/11/14/15).
- 서버 사이드 정렬·필터·페이지네이션 로직(클라이언트 UI 골격만).
- 가상 스크롤·무한 스크롤 등 고급 기능.
- Loading/Empty/Error 상태 "페이지 레벨" 컴포넌트(이슈 18) — 본 task는 테이블 내부 표시에 한정.

## Protected Files

없음.

## Requirements

- `Table<T>`는 행 타입에 제네릭. 컬럼 설정으로 셀 렌더링(불필요한 추상화 금지, 현재 요구 범위만).
- Empty/Loading/Pagination은 props로 제어 가능하고 기본값이 합리적이어야 한다.
- 스타일은 기존 `shared/ui` 컴포넌트와 토큰·클래스 컨벤션 일치.
- 접근성: 테이블 시맨틱(`table/thead/tbody/th/td`) 사용, 헤더 셀에 `scope`.

## Test Requirements

- `src/shared/ui/Table.test.tsx` 신설:
  - 행 데이터 렌더링.
  - Empty 상태 표시.
  - Loading 상태 표시.
  - 페이지네이션 UI 노출 및 페이지 이동 동작.
- 기존 테스트 통과 유지.

## Verification Commands

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

> CI는 `format:check`(Prettier)를 강제한다. 커밋 전 `pnpm format`(또는 변경 파일만 `prettier --write`)으로 포맷을 맞춰야 한다. `pnpm format`은 저장소 전체를 건드리니 변경 파일에 한정할 것.

## Documentation Impact

- `src/shared/README.md`에 Table 컴포넌트 용도·API 한두 줄 추가(선택).

## ADR Need

불필요. 신규 도메인·의존성·아키텍처 결정 없음.

## Failure Record Need

불필요.

## Risk Level

Low. 신규 공통 UI 컴포넌트 추가, 보호 파일·의존성 추가 없음.

## Expected Output

- 변경: `src/shared/ui/Table.tsx`(+필요 시 타입 파일), `index.ts`, `Table.test.tsx`.
- 최신 `main`에서 분기한 `feat/fe-table-component` 브랜치에서 PR 1건.
- 변경 파일·검증 결과·가정(컬럼 설정 형태, 페이지네이션 제어 방식) 보고.

## Rules

- 최신 `main`에서 분기. 범위 내 유지, 검증 약화 금지.
- 페이지 통합·실데이터는 손대지 않는다(후속 task).
- 가정·검증 결과 보고.
