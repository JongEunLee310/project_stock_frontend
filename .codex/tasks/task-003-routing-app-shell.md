# Codex Handoff Task — task-003: 라우팅 + App Shell (이슈 5 + 4)

## Source Issue

- 이슈 5 `[FE] 라우팅 구조 구성`
- 이슈 4 `[FE] App Shell 레이아웃 구현`
- 관련: ADR-003, `docs/designs/2-frontend-architecture.md`

## Task Summary

React Router로 주요 페이지 라우트와 Not Found를 구성하고, 모든 페이지가 공유하는 App Shell(Sidebar/Topbar/Market Summary/콘텐츠 슬롯)을 구현한다.

## Goal

- Sidebar 클릭으로 페이지 이동, 현재 경로에 따라 활성 메뉴 표시.
- 존재하지 않는 경로에서 Not Found 표시.
- `/research/:symbol` 형태 상세 접근 가능(예: `/research/NVDA`).
- Topbar에 동기화 상태·알림 아이콘·사용자 영역 표시.
- 모든 페이지가 동일한 App Shell 안에서 렌더된다.

## Background

- 라우트: `/ /watchlist /signals /research/:symbol /portfolio /alerts /decision-log /settings`.
- React Router는 새 의존성이며 ADR-003에서 채택 승인됨.
- 페이지 본문은 placeholder 수준(각 페이지 이슈 7~에서 채움).
- App Shell은 `widgets/` 레이어, 라우터는 `app/` 레이어, 페이지는 `pages/` 레이어.

## Implementation Scope

- `react-router-dom` 추가(pnpm) 및 `app/`에 라우터 구성.
- 각 라우트에 대응하는 `pages/` placeholder 페이지.
- `pages/NotFound`.
- `widgets/`에 Sidebar/Topbar/MarketSummary, App Shell 레이아웃(콘텐츠 슬롯 = `<Outlet/>`).
- 활성 메뉴 표시(현재 경로 기반).
- 데스크톱 기준 최소 반응형.

## Out of Scope

- 각 페이지 실제 콘텐츠(이슈 7~18).
- 디자인 토큰 정의(task-002) — 토큰은 사용만.
- 도메인 데이터 연동(task-004 Mock은 선택적으로 메뉴 라벨 정도만 참조).

## Protected Files

없음.

## Requirements

- 라우트와 Sidebar 메뉴가 단일 소스에서 일관되게 파생.
- 활성 메뉴는 중첩 경로(`/research/NVDA`)에서도 정확.
- App Shell은 모든 라우트를 감싸는 레이아웃 라우트로 구성.

## Test Requirements

- 라우팅 테스트: 메뉴 이동, Not Found, `/research/:symbol` 파라미터 접근.
- 활성 메뉴 표시 단위 테스트 1건.
- 기존 테스트 통과 유지.

## Verification Commands

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Documentation Impact

- README 라우트 표 또는 App Shell 구조 간단 설명(선택).

## ADR Need

불필요(React Router 채택은 ADR-003에 기록됨).

## Failure Record Need

불필요.

## Risk Level

Medium. 의존성 추가(react-router-dom)와 전역 레이아웃 도입. 의존성은 ADR-003 승인 범위.

## Expected Output

- 변경: `package.json`/`pnpm-lock.yaml`(react-router-dom), `app/` 라우터, `pages/*` placeholder, `widgets/*` App Shell.
- `feat/fe-routing-app-shell` 브랜치(task-001, 가급적 task-002 머지 후 최신 `main` 기준)에서 PR 1건.
- 변경 파일·검증 결과 보고.

## Rules

- task-001 머지 후 진행(task-002 이후 권장). 최신 `main`에서 분기.
- 의존성은 react-router-dom만 추가, 그 외 추가 금지.
- 범위 내 유지, 검증 약화 금지. 가정·검증 결과 보고.
