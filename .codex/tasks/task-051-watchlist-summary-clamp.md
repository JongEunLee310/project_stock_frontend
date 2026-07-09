# Codex Handoff Task

## Source Issue

https://github.com/JongEunLee310/project_stock_frontend/issues/125 (Revision R1)

## Task Summary

PR #126에 대한 개발자 피드백 반영이다. AI 관찰 메모의 요약문(`observations.summary`)이
클램프 없이 전문 노출되어 여전히 길게 표시된다. 항목 note와 동일한 더보기/접기
규칙을 summary에도 적용한다.

## Goal

- 120자를 넘는 summary가 3줄로 잘려 보이고 더보기/접기로 전문을 토글한다.
- 짧은 summary는 토글 없이 기존과 동일하게 표시된다.
- 항목 note의 기존 더보기 동작은 변경되지 않는다.
- `corepack pnpm format:check` / `typecheck` / `lint` / `test` 4종 모두 통과한다.

## Background

설계 문서: `docs/designs/125-watchlist-detail-polish.md`의 **Revision R1** 절.
summary 렌더링 위치는 `src/pages/ui/WatchlistPage.tsx`의 AI 관찰 메모 카드
(`<p className="text-cockpit-text">{observations.summary}</p>`). 항목 note에 이미
구현된 패턴(길이 임계값 120 · `line-clamp-3` · 더보기/접기 버튼)을 재사용하되,
확장 상태는 boolean state 하나로 관리한다.

## Implementation Scope

**수정 파일:**

- `src/pages/ui/WatchlistPage.tsx` — summary 클램프 + 토글
- `src/pages/ui/WatchlistPage.test.tsx` — 긴 summary 토글 시나리오 추가,
  짧은 summary 토글 미노출 단언

## Out of Scope

- 항목 note 로직 변경, 카드 하단 기존 "더 보기 ›" 버튼, BE 변경

## Protected Files

없음.

## Requirements

- 기존 테스트를 약화하거나 삭제하지 않는다.
- 픽스처 리터럴 출처 주석은 유지한다.

## Verification Commands

- `corepack pnpm format:check`
- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `corepack pnpm test`

## Documentation Impact

없음 (설계 문서 R1 절은 이미 갱신됨).

## ADR Need

불필요.

## Failure Record Need

불필요.

## Risk Level

Low — 기존 패턴 재사용, 표시 로직만 변경.

## Expected Output

- 변경 파일 목록, 검증 4종 결과, 가정·잔여 위험 보고

## Rules

- Stay within scope.
- Do not weaken verification.
- 현재 브랜치 `feat/watchlist-detail-polish`에서 작업한다. 새 브랜치를 생성하지 않는다.
- 커밋하지 않는다 (커밋은 오케스트레이터가 별도 지시한다).
