# Issue 12 — 공통 Table 컴포넌트

## Context

Watchlist(이슈 8), Decision Log(이슈 11), Alerts(이슈 15), Portfolio(이슈 14) 등 여러 화면이 공유할 제네릭 테이블 컴포넌트의 계약을 정의한다. 이후 페이지 작업이 이 API 형태에 의존하므로 핸드오프 전에 골격을 고정한다. 실제 데이터 연동·서버 정렬/필터는 페이지 task에서 수행하고, 본 컴포넌트는 표시·상호작용 골격에 한정한다. 이슈 12.

## Models

- `Column<T>` — `key: string`, `header: ReactNode`, `cell(row: T): ReactNode`(셀 렌더러), `align?`/`sortable?` 등 최소 표시 옵션. 정렬·필터 로직은 미포함.
- `TableProps<T>` — `columns: Column<T>[]`, `rows: T[]`, `isLoading?: boolean`, `emptyMessage?: ReactNode`, `rowAction?(row: T): ReactNode`(행 액션 슬롯), 페이지네이션 관련 props(아래).
- `PaginationState` — `page: number`, `pageSize: number`, `total: number`. 제어/비제어 중 단순한 쪽 선택(클라이언트 UI 골격).

## Component Shape

- `Table<T>` — 컬럼 설정 기반 렌더. 시맨틱 `table/thead/tbody/th(scope)/td` 사용.
  - Empty: `rows` 0건 시 `emptyMessage` 표시.
  - Loading: `isLoading` 시 로딩 표시.
  - Pagination: 현재/총 페이지·이전/다음 UI.
  - Row action: `rowAction` 슬롯으로 행별 메뉴/버튼 영역 지원.
- 스타일은 기존 `shared/ui`(Button/Card/Input/Badge) 토큰·클래스 컨벤션과 일치.

## Open Questions

- 페이지네이션 상태를 제어(부모 관리) vs 비제어(내부 state) 중 무엇으로 둘지.
- 정렬 표시(헤더 정렬 아이콘)를 본 task에 포함할지, 페이지 task로 미룰지.
- 컬럼 `key`의 용도(렌더 식별 only vs 정렬 키 겸용).

## Related

- `docs/designs/2-frontend-architecture.md` (shared/ui 레이어)
- 이슈 8(Watchlist), 11(Decision Log), 14(Portfolio), 15(Alerts) 소비
- `.codex/tasks/task-006-table-component.md`
