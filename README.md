# AI 개발 보조 템플릿

> **브랜치:** `react` — 최소 실행 가능한 React + Tailwind CSS 스타터가 포함된 React 변형.
> 공통 Harness Engineering 파일이 포함된다. 프레임워크 무관 템플릿은 `main` 브랜치를 참고한다.

이 저장소는 Claude Code와 Codex를 함께 사용하는 팀을 위한 재사용 가능한 Harness Engineering 기반 프로젝트 템플릿이다.

## 핵심 모델

Claude Code와 Codex는 역할이 분리되어 있다.

- **Claude Code** — 작업 계획 수립, 설계 검토, Codex 핸드오프 태스크 생성, 로컬 PR 리뷰, 문서화 영향 평가, ADR/실패 기록/지식베이스 업데이트 필요 여부 판단.
- **Codex** — Claude Code 핸드오프 태스크 기반 구현, 테스트 업데이트, 로컬 검증 실행, CI 실패 수정, Claude Code 로컬 리뷰 블로킹 이슈 대응.
- **GitHub Actions CI** — PR 워크플로우의 피드백 센서 역할.
- **사람** — 최종 승인, merge, 위험 결정의 책임자.

Claude Code 리뷰는 기본적으로 로컬에서 수행한다. 이 템플릿은 Claude GitHub Action을 설정하지 않는다. CI에 Anthropic API 키가 필요하지 않다. 적절한 경우 로컬 리뷰 기록을 PR 대화에 게시할 수 있다.

## 에이전트 자율성

에이전트 행동 범위는 `docs/agent/autonomy-levels.md`에 정의된 레벨로 제어한다.

- 기본 레벨은 **Level 1: Local Edit**이다.
- 작업 문서에서 명시적으로 지정하지 않으면 에이전트는 커밋, push, PR 생성을 수행하지 않는다.
- 레벨 상향은 작업 문서에서 명시적으로 지정해야 한다.

## React 스타터

이 브랜치는 Vite + React + TypeScript + Tailwind CSS v4로 구성된 최소 실행 가능한 애플리케이션을 포함한다.

`App` 컴포넌트는 `status: ok`를 렌더링하며, 동일 내용을 검증하는 테스트가 포함된다.

### 검증

```bash
npm install
npm run lint
npm run typecheck
npm run test
npm run build
```

개발 서버는 `npm run dev`로 실행한다.

## 포함된 관행

이 템플릿은 다음을 포함한다:

- 지속적인 아키텍처 및 워크플로우 결정을 위한 ADR.
- 반복하지 말아야 할 접근 방식에 대한 실패 기록.
- 워크플로우 및 프로젝트별 도메인 지식을 위한 지식베이스 문서.
- PR, CI, 리뷰 학습을 위한 피드백 루프 기록.
- 오래된 AI 워크플로우 아티팩트 및 문서 제거를 위한 가비지 컬렉션 정책.
- 문서 드리프트 감소를 위한 디렉토리 README 파일.
- 보호 파일 및 문서 일관성 훅 플레이스홀더.
- 에이전트 자율성 레벨 정의 (`docs/agent/autonomy-levels.md`).

## 의도적 제외 항목

코드 드리프트 및 구조 드리프트 규칙은 공통 harness 레이어에서 의도적으로 제외한다.

React 특화 드리프트 규칙은 프로젝트별로 추가해야 한다.

외부 Claude Skills는 이 저장소에 포함되지 않는다. `everything-claude-code` 또는 다른 소스에서 수동으로 설치한다. `docs/harness/skill-usage-policy.md` 참고.

## 사용 방법

1. 이 템플릿을 새 프로젝트에 복사한다.
2. 대상 프로젝트에 맞게 `AGENTS.md`, `CLAUDE.md`, `.codex/instructions.md`를 커스터마이즈한다.
3. `docs/knowledge/domain-knowledge.md`를 작성한다.
4. `.github/workflows/ci.yml`의 CI를 프로젝트별 검증 명령으로 교체하거나 확장한다.
5. GitHub에서 브랜치 보호 및 필수 체크를 설정한다.

## 디렉토리 구조

```
docs/
  agent/          — 에이전트 자율성 및 행동 범위 정책
  decisions/      — ADR (아키텍처 결정 기록)
  failures/       — 실패 기록
  feedback/       — 피드백 루프 기록
  harness/        — Harness Engineering 핵심 정책
  knowledge/      — 워크플로우 및 도메인 지식
  archive/        — 보관된 문서
```
