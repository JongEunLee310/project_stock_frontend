# ADR-003: Frontend Foundation Stack

## Status

Accepted

## Context

`FE-M1 | 프론트엔드 기반 구축` 마일스톤(이슈 1~6)에서 AI 투자 관제실 프론트엔드의 기반을 세운다. 빌드 도구, 언어, 스타일링, 패키지 매니저, 디렉터리 아키텍처를 정해야 이후 페이지·기능 이슈가 흔들리지 않는다. 이 결정들은 한 번 정하면 되돌리는 비용이 크므로 ADR로 남긴다.

## Decision

기반 스택을 다음과 같이 채택한다.

- **빌드 도구**: Vite
- **언어**: TypeScript
- **UI 라이브러리**: React
- **스타일링**: Tailwind CSS (Dark theme 기반 디자인 토큰)
- **라우팅**: React Router
- **패키지 매니저**: pnpm
- **디렉터리 아키텍처**: Feature-Sliced Design 계열 (`app`, `pages`, `widgets`, `features`, `entities`, `shared`)

디렉터리 아키텍처와 도메인 타입의 구체적 형태는 설계 기록(`docs/designs/`)에서 다룬다. 이 ADR은 선택의 *이유*만 기록한다.

## Why pnpm Instead of npm

이 저장소는 pnpm을 처음 도입하므로 근거를 명확히 남긴다.

- **디스크 효율**: pnpm은 패키지를 전역 store에 한 번만 저장하고 프로젝트의 `node_modules`에는 하드링크로 연결한다. npm처럼 프로젝트마다 의존성 트리를 통째로 복사하지 않는다.
- **설치 속도**: 전역 store 캐시를 재사용하므로 재설치·CI 캐시 적중 시 npm보다 빠르다.
- **엄격한 의존성 격리**: pnpm의 `node_modules`는 비평탄(non-flat) 구조라, `package.json`에 선언하지 않은 패키지를 import하는 "유령 의존성"을 차단한다. npm의 평탄 구조는 이를 허용해 나중에 깨지기 쉽다.
- **트레이드오프**: 개발/CI 환경에 pnpm 설치 단계(`corepack enable`)가 필요하고, 일부 구형 도구에서 비평탄 구조 호환 이슈가 드물게 발생할 수 있다. 신규 프로젝트라 레거시 도구 제약이 없으므로 이 비용은 수용 가능하다.

결론: 신규 프로젝트의 깨끗한 출발점에서 디스크·속도·의존성 위생 이점이 도입 비용을 상회한다.

## Alternatives

- **CRA(Create React App)**: 유지보수 둔화, 느린 빌드. Vite로 대체.
- **npm / yarn**: npm은 추가 설치가 없고 호환성이 가장 넓지만 위 이점을 포기한다. yarn(berry)은 PnP 호환 이슈가 더 잦다. → pnpm 채택.
- **CSS-in-JS(styled-components 등)**: 런타임 비용과 토큰 일관성 관리 부담. Tailwind 토큰 방식으로 대체.
- **평탄 디렉터리(`components/`, `utils/`만)**: 페이지·기능 증가 시 구조가 무너짐. FSD 계열 레이어링으로 대체.

## Consequences

- 라우트/페이지 이슈(4, 5, 7~)가 합의된 레이어 위에서 진행되어 구조 드리프트가 줄어든다.
- lockfile은 `pnpm-lock.yaml`로 고정되고, CI 캐시 키와 설치 명령이 pnpm 기준이 된다. 기여자는 pnpm을 설치해야 한다.
- Tailwind 토큰을 단일 소스로 두어 상태 색상(안정/관망/위험 증가 등)을 일관되게 재사용한다.
- 스택 변경(예: 패키지 매니저 교체)은 이 ADR을 갱신해야 한다.

## Follow-up

- 이슈 2 폴더 아키텍처, 이슈 6 도메인 타입의 설계 기록을 `docs/designs/`에 작성한다.
- `.github/workflows/`에 pnpm 기반 CI(설치·lint·typecheck·build) 구성은 사람 승인 게이트 대상이다.
- 기반 구축 이후 패키지 매니저 사용 가이드를 README에 반영한다(이슈 22).

## Related Documents

- 이슈 1~6 (`FE-M1 | 프론트엔드 기반 구축`)
- `docs/designs/2-frontend-architecture.md`
- `docs/designs/6-domain-types-and-mock-data.md`
- `docs/harness/branch-strategy.md`
- `docs/harness/human-gate-policy.md`
