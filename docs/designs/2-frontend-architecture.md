# Issue 2 — 프론트엔드 폴더 구조 및 아키텍처

## Context

페이지·기능·공통 UI·API 계층을 분리해 이후 기능 확장에 대응한다. Feature-Sliced Design 계열 레이어를 채택한다(ADR-003). 이 기록은 레이어의 책임 경계만 정의하고, 실제 컴포넌트 구현은 포함하지 않는다. 이슈 2.

## Layers

`src/` 하위 레이어와 책임:

- `app/` — 앱 진입점, 전역 프로바이더, 라우터 구성, 전역 스타일.
- `pages/` — 라우트 단위 화면 조립. 하위 레이어를 조합만 하고 도메인 로직을 두지 않는다.
- `widgets/` — 여러 feature/entity를 묶은 독립 UI 블록(예: Sidebar, Topbar, Market Summary).
- `features/` — 사용자 행동 단위 기능(예: 관심종목 추가, 알림 규칙 편집).
- `entities/` — 도메인 엔티티 단위 모델·표현(예: Stock, Signal, Portfolio).
- `shared/` — 도메인 비의존 공통 UI, 유틸, 타입, API 클라이언트, Mock.

## Dependency Rule

상위 레이어는 하위 레이어만 의존한다: `app → pages → widgets → features → entities → shared`. 역방향·동일 레이어 간 직접 의존을 금지한다.

## Placement Conventions

- 공통 타입: `shared/`의 타입 모듈 또는 해당 `entities/<entity>` 내부.
- API 클라이언트: `shared/api`.
- Mock 데이터: `shared/`의 mock 모듈, 도메인 타입 기반으로 작성해 실제 API로 교체 가능하게 둔다(이슈 6).
- 라우트: `app/` 라우터에서 `pages/`를 연결(이슈 5).

## Open Questions

- `entities`와 `features` 경계가 모호한 항목(예: Decision Log)의 귀속은 1차 구현 시 확정한다.
- `widgets`를 1차부터 분리할지, App Shell(이슈 4)에서 먼저 도입할지.

## Related

- ADR-003 (`docs/decisions/ADR-003-frontend-foundation-stack.md`)
- 이슈 1(초기 세팅), 이슈 5(라우팅), 이슈 6(도메인 타입)
