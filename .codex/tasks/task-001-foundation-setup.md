# Codex Handoff Task — task-001: 기반 세팅 (이슈 1 + 2 + CI)

## Source Issue

- 이슈 1 `[FE] React + Vite + TypeScript 프로젝트 초기 세팅`
- 이슈 2 `[FE] 프론트엔드 폴더 구조 및 아키텍처 구성`
- 관련: ADR-003, `docs/designs/2-frontend-architecture.md`

## Task Summary

기존 npm 기반 React+Vite+TS+Tailwind 스캐폴드를 pnpm으로 전환하고, Prettier·경로 alias·FSD 폴더 구조를 추가하며, CI를 pnpm·`main` 기준으로 정정한다.

## Goal

완료 시 다음이 참이어야 한다.

- pnpm으로 의존성 설치 및 `pnpm dev`/`build`/`lint`/`typecheck`/`test`가 동작한다.
- `pnpm-lock.yaml`이 존재하고 `package-lock.json`은 제거된다.
- Prettier 설정과 `format` 스크립트가 있다.
- `@` → `src` 경로 alias가 Vite와 TypeScript 양쪽에서 동작한다.
- `src/` 하위에 `app/ pages/ widgets/ features/ entities/ shared/` 레이어가 존재한다.
- CI가 pnpm으로 설치·검증하고 `main`에 대해 트리거된다.
- README에 폴더 레이어 역할이 간단히 설명된다.

## Background

- 현재 스캐폴드: Vite 6 + React 19 + TS 5 + Tailwind v4(`@tailwindcss/vite`) + Vitest, npm 기반(`package-lock.json`).
- 패키지 매니저를 pnpm으로 채택함(ADR-003). 처음 도입이므로 lockfile·CI를 일관되게 전환해야 한다.
- 현재 `ci.yml`은 npm을 쓰고 `push: branches: [react]`로 트리거된다 — `main` 기준으로 정정 필요.
- 아키텍처는 FSD 계열 레이어(`docs/designs/2-frontend-architecture.md`)를 따른다.

## Implementation Scope

- `package.json`: `packageManager` 필드(pnpm) 추가, `format` 스크립트(Prettier) 추가. 기존 deps 버전은 유지.
- `package-lock.json` 삭제 → `pnpm install`로 `pnpm-lock.yaml` 생성.
- Prettier: 설정 파일 추가, ESLint와 충돌 없게 구성.
- 경로 alias `@ → src`: `vite.config.ts`의 `resolve.alias`와 `tsconfig.json`의 `paths`/`baseUrl`에 반영.
- FSD 폴더 생성: `src/{app,pages,widgets,features,entities,shared}`. 빈 디렉터리 대신 각 레이어에 placeholder(index 또는 README)로 역할 주석.
- 기존 `src/App.tsx`/`main.tsx`는 `app/` 레이어로 이동 또는 진입 구성에 맞게 재배치(최소 변경).
- `.github/workflows/ci.yml`: pnpm 설치(`pnpm/action-setup`), `cache: pnpm`, `pnpm install --frozen-lockfile`, lint/typecheck/test/build를 pnpm으로 실행, 트리거 브랜치를 `main`으로.
- `README.md`: 폴더 레이어 역할 간단 설명 추가.

## Out of Scope

- 디자인 토큰/색상 시스템(이슈 3, task-002).
- 라우팅·App Shell(이슈 4·5, task-003).
- 도메인 타입·Mock(이슈 6, task-004).
- 의존성 버전 업그레이드(스택 버전 변경 금지).

## Protected Files

- `.github/workflows/ci.yml` — 사람 승인으로 task-001에 포함(pnpm·main 전환). 검증을 약화하지 말 것.
- `AGENTS.md` — 기본 검증 명령이 `npm run ...`으로 적혀 있어 pnpm과 불일치한다. 이 파일은 보호 대상이므로 **임의 수정 금지**. 수정이 필요하면 별도 승인 요청. 본 핸드오프 범위에서는 건드리지 않는다.

## Requirements

- 기능: 위 Goal 전부. pnpm 단일 패키지 매니저로 일원화.
- 비기능: 기존 lint/typecheck 규칙을 약화하지 않는다. alias는 import에서 `@/...`로 동작.
- pnpm 도입: `corepack enable` 전제. `packageManager`에 pnpm 버전 고정.

## Test Requirements

- 기존 `src/App.test.tsx`가 통과 유지(이동 시 경로만 조정).
- alias 동작을 보증하기 위해 최소 1개 import가 `@/`를 경유하도록 구성(기존 테스트 또는 placeholder).
- 새 비즈니스 로직이 없으므로 신규 테스트 강제는 아님.

## Verification Commands

```bash
corepack enable
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Documentation Impact

- `README.md` 폴더 레이어 설명(필수).
- `AGENTS.md` 검증 명령(npm→pnpm) 불일치는 후속 승인 항목으로 보고만 한다.

## ADR Need

불필요. 스택·아키텍처·pnpm 결정은 ADR-003에 이미 기록됨. 이 핸드오프는 그 구현이다.

## Failure Record Need

불필요(신규 접근 실패·폐기 없음).

## Risk Level

Medium. pnpm 전환과 CI 변경(보호 파일)이 포함되나 범위가 명확하고 검증 가능. CI 변경은 사람 승인 완료.

## Expected Output

- 변경: `package.json`, `pnpm-lock.yaml`(신규), `package-lock.json`(삭제), Prettier 설정, `vite.config.ts`, `tsconfig.json`, `src/` 레이어 디렉터리, `.github/workflows/ci.yml`, `README.md`.
- `feat/fe-foundation-setup` 브랜치(최신 `main` 기준)에서 PR 1건.
- Done Definition(`AGENTS.md`)에 따라 변경 파일·검증 결과·잔여 리스크 보고.

## Rules

- 최신 `main`에서 분기, `main` 직접 커밋 금지.
- 범위 내 유지, 검증 약화 금지.
- 나열되지 않은 보호 파일 수정 금지(특히 `AGENTS.md`).
- 가정·검증 결과 보고.
