# Codex Handoff Task

## Source Issue

- GitHub 이슈 #67 [Integration] FE-BE MVP smoke test 및 계약 불일치 수정 (P1 + FE 한정 P2)
- 설계 기록: `docs/designs/67-p1-docs-cleanup.md`

## Task Summary

이슈 #67의 P1(env 문서·가격 시계열 주석)과 FE 한정 P2(템플릿 잔존 이름)를 처리한다. 동작 변경 없는 문서·주석·메타데이터 정리.

## Goal

- `VITE_API_BASE_URL` 설정이 `/api/v1`까지 포함해야 함이 `.env.example`/README에서 분명하다.
- 가격 시계열 관련 주석이 "BE 준비됨 + 활성화 블로커"로 정확히 갱신된다(차트는 비활성 유지).
- `package.json` name이 템플릿 이름에서 프로젝트 이름으로 바뀐다.
- 동작/테스트 결과 변화 없이 전체 검증이 통과한다.

## Background

- API 클라이언트(`src/shared/api/client.ts`)는 `/auth/login` 등 prefix 없는 경로로 호출, BE는 `/api/v1` prefix → 베이스 URL에 prefix 누락 시 404.
- BE 가격 시계열 API 완료: `GET /api/v1/stocks/{symbol}/prices` (`range=1M|3M|6M|1Y`, `interval=1d`, `market` 필수). 현 FE 주석은 "G4 BE 미완"으로 사실과 다름.
- 현재 `package.json` `"name": "ai-assisted-react-template"`.

## Implementation Scope

- `.env.example` — `VITE_API_BASE_URL` 주석에 로컬 예시 `http://localhost:8000/api/v1` 와 "베이스에 `/api/v1`까지 포함" 명시.
- `README.md` — 환경변수 설명/예시를 `/api/v1` 포함 형태로 갱신.
- `src/features/signals/queries.ts` — sparkline 관련 "G4 BE 미완" 주석을 "BE 준비됨 — 활성화 블로커: 심볼→market 매핑 확정 + FE DTO를 `PriceSeriesDto{ bars: PriceBarDto[] }`로 정렬" 취지로 갱신. `enabled:false`·빈 배열·동작은 유지.
- `src/features/research/queries.ts` — 동일 취지로 sparkline 주석 갱신. 동작 유지.
- `package.json` — `"name"`을 `project-stock-frontend`로 변경.

## Out of Scope

- 기본 브랜치 변경(레포 설정), 가격 시계열 실제 활성화(`enabled` 전환·DTO 타입 실제 변경·`market` 파라미터 추가), API prefix 코드 고정, BE 레포 항목(README·pyproject), 수동 smoke test.
- 동작/로직 변경 일체, 무관한 리팩터링.

## Protected Files

없음. `.codex/*`, `docs/decisions/*`, `docs/harness/*` 수정 금지.

## Requirements

- 순수 문서·주석·메타데이터만 변경. 런타임 동작·쿼리 호출·DTO 타입은 그대로.
- README 표/문구는 기존 포맷(마크다운 표) 유지하며 값만 보강.
- `package.json` name 변경이 스크립트/워크스페이스 참조를 깨지 않는지 확인(단일 패키지면 영향 없음).

## Test Requirements

- 신규 테스트 불요(동작 무변경). 기존 테스트가 깨지지 않는지만 확인.

## Verification Commands

```
pnpm lint
pnpm typecheck
pnpm format:check
TZ=UTC pnpm test
pnpm build
```

(포맷은 변경 파일만 `pnpm format`. `format:check`는 전체 게이트.)

## Documentation Impact

- `.env.example`, `README.md` 본 작업이 대상. 설계 기록 `docs/designs/67-p1-docs-cleanup.md` 참조.

## ADR Need

불요. 문서·주석·이름 정리, 아키텍처 결정 없음.

## Failure Record Need

불요.

## Risk Level

Low. 동작 무변경 텍스트/메타데이터 변경. 유일 주의점은 `package.json` name 변경의 파급 → 검증으로 확인.

## Expected Output

- 전용 브랜치(최신 `main` 기준, 예: `chore/67-p1-docs-cleanup`).
- 위 5개 파일 변경 커밋.
- 검증 5종 전부 통과 로그.
- 이슈 #67 P1/P2 해당 체크박스에 대응하는 PR.

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
