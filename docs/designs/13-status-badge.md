# Issue 13 — 공통 Status Badge 컴포넌트

## Context

종목·시그널·리스크 상태를 화면 전반에서 일관되게 표현하기 위한 Badge 컴포넌트의 상태 모델과 색상 매핑 구조를 정의한다. 기존 `StockStatus`(5개, 이슈 6/문서 `6-domain-types-and-mock-data.md`)를 확장하고, 개념이 다른 리스크 레벨은 별도 타입으로 분리한다. 색상은 이슈 3 디자인 토큰(`src/index.css` `@theme`)과 1:1 매핑한다. 이슈 13.

## Models

- `StockStatus`(확장) — `'안정' | '관망' | '관망 유지' | '위험 증가' | '매수 검토 가능' | '추가 리서치 필요' | '비중 축소 검토'`. 기존 5개에 `관망 유지`, `비중 축소 검토` 추가.
- `RiskLevel`(신설) — `'높음' | '중간' | '낮음'`. 종목/시그널 상태와 개념이 다르므로 분리.
- 색상 매핑 — union을 키로 하는 `Record<StockStatus, string>` 및 `Record<RiskLevel, string>`. 값 추가 시 컴파일 타임에 매핑 누락이 잡힌다.

## Design Tokens

- 기존: `--color-status-{stable,watch,risk,research,buy}-{bg,text,border}`.
- 추가(예시 네이밍, 기존 컨벤션 따름): `watch-hold`(관망 유지), `reduce`(비중 축소 검토), `level-high`/`level-medium`/`level-low`(리스크 레벨). 기존 토큰은 수정·삭제하지 않고 추가만 한다.
- 색상 의미 충돌 방지: `위험 증가`/`높음` 계열은 risk 톤, `매수 검토 가능` 계열은 buy 톤으로 결정(확정은 구현 시 가정 보고).

## Component Shape

- `Badge` — 상태/레벨 라벨을 색상 칩으로 렌더. children 미지정 시 상태/레벨 문자열을 그대로 출력(기존 동작 유지). 상태군과 레벨군 분기는 별도 prop(예: `tone`/`kind`) 또는 별도 export 중 단순한 쪽 선택.

## Open Questions

- Badge variant 분기를 단일 컴포넌트 prop으로 둘지, 상태용/레벨용 별도 컴포넌트로 둘지(구현 단순성 기준 결정).
- 신규 토큰 네이밍 최종안(`watch-hold`/`reduce`/`level-*`).

## Related

- `docs/designs/6-domain-types-and-mock-data.md` (StockStatus 원본)
- 이슈 3(상태 색상 토큰), 이슈 8~11(상태 표시 소비)
- `.codex/tasks/task-005-status-badge.md`
