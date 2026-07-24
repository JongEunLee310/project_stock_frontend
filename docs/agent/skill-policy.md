# Agent Skill Policy

## Default Rule

Installed skills are available as references only. Agents must not activate autonomous behavior unless this file explicitly allows it.

## Allowed Skills

### Frontend reference skills

`react-patterns`, `react-performance`, `react-testing`, `coding-standards`는 이 프론트엔드 프로젝트에서 구현·리뷰 시 참조로 사용한다. 자율 워크플로를 발동시키지 않으며, 판단 근거를 제시하는 참조 자료로만 활용한다.

- Claude Code — `.claude/settings.json`의 `skillOverrides`에서 `on`으로 활성화됨.
- Codex — `.codex/instructions.md`가 이 스킬들을 참조하도록 배선함.

`api-design`은 FE에서 API 계약을 정의하지 않고 소비만 하므로 비활성 유지한다. `autonomous-agent-harness`·`autonomous-loops`는 하네스 자동화 스킬로 자율 실행을 허용하지 않는다.
