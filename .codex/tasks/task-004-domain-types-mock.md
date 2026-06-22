# Codex Handoff Task — task-004: 도메인 타입 + Mock (이슈 6)

## Source Issue

- 이슈 6 `[FE] Mock 데이터 및 도메인 타입 정의`
- 관련: ADR-003, `docs/designs/6-domain-types-and-mock-data.md`

## Task Summary

핵심 도메인 타입(Stock/Signal/Portfolio/AlertRule/DecisionLog)과 공통 `StockStatus` enum, 그리고 타입을 만족하는 Mock 데이터를 정의한다.

## Goal

- 도메인 타입과 `StockStatus` union이 정의되어 컴포넌트 props 기준이 된다.
- 핵심 화면에서 쓸 Mock 데이터가 준비된다.
- Mock이 도메인 타입을 무손실로 만족해, 추후 실제 API 응답으로 교체 가능하다.

## Background

- 타입·필드 골격은 `docs/designs/6-domain-types-and-mock-data.md` 참조(1차 골격, 확정 시 조정 가능).
- `StockStatus`는 상태 색상(이슈 3)과 1:1 매핑.
- 위치는 `shared/`(타입·Mock·API 클라이언트 자리), 엔티티 표현이 필요하면 `entities/<entity>`.

## Implementation Scope

- `shared/`(또는 `entities/`)에 타입 정의: `StockStatus`, `Stock`, `Signal`, `Portfolio`+`Holding`, `AlertRule`, `DecisionLog`.
- `shared/`에 Mock 데이터 모듈(타입 기반 대표 샘플).
- 실제 API 교체를 염두에 둔 export 구조(데이터 접근부와 타입 분리).

## Out of Scope

- API 클라이언트 실제 구현·서버 상태 관리(이슈 17).
- 페이지 렌더링(이슈 7~).
- 디자인 토큰(task-002).

## Protected Files

없음.

## Requirements

- 타입은 설계 기록 골격을 따르되, 모호 항목(`Signal.kind`, `AlertRule.condition` 등)은 합리적 기본값으로 정하고 가정으로 보고.
- Mock은 타입을 컴파일 타임에 만족(`satisfies`/명시 타입).

## Test Requirements

- Mock 데이터가 타입을 만족함을 보증하는 typecheck 통과.
- 핵심 타입 사용 예시 단위 테스트 1건(선택).
- 기존 테스트 통과 유지.

## Verification Commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Documentation Impact

- 타입·Mock 위치를 README 폴더 설명에 반영(선택). 설계 기록과 불일치 시 설계 기록 갱신 제안 보고.

## ADR Need

불필요(ADR-003 범위 내).

## Failure Record Need

불필요.

## Risk Level

Low. 타입·Mock 한정, 보호 파일·의존성 추가 없음.

## Expected Output

- 변경: `shared/`(또는 `entities/`)의 타입·Mock 모듈.
- `feat/fe-domain-types-mock` 브랜치(task-001 머지 후 최신 `main` 기준)에서 PR 1건.
- 변경 파일·검증 결과·가정(모호 필드 결정) 보고.

## Rules

- task-001 머지 후 진행. 최신 `main`에서 분기.
- 범위 내 유지, 검증 약화 금지. 가정·검증 결과 보고.
