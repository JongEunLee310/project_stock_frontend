# Codex Handoff Task

## Source

PR #159 로컬 리뷰 후속 조치. 리뷰 기록: `docs/reviews/pr-159.md` (B1 절을
먼저 읽는다).

## Task Summary

**B1 — 페이지 테스트 픽스처의 `axis` 필드 계약 형태 위반 수정.**

`src/pages/ui/ResearchPage.test.tsx`의 `beforeEach` 커버리지 픽스처에서
나머지 3개 축을 `['실적', '밸류에이션', '공시'].map((axisLabel) => ({
axis: axisLabel, ... }))`로 생성해 `axis`에 한국어 라벨이 들어간다.
`CoverageAxisItem.axis`는 영문 enum 값이어야 한다.

- `EARNINGS` / `VALUATION` / `DISCLOSURE` 영문 값을 `axis`로 두고,
  `axisLabel`은 대응하는 한국어(실적·밸류에이션·공시)로 매핑하도록
  수정한다. `src/features/research/adapters.ts`의
  `researchCoverageAxisLabels` 상수를 참조해도 좋다.
- 기존 단언은 그대로 통과해야 한다. 단언 변경은 하지 않는다.

## Out of Scope

- S1·S2·Q1 (비차단 — 손대지 않는다).
- 프로덕션 코드·다른 테스트 파일 불변.

## Rules

- 현재 브랜치 `feat/150-freshness-coverage-counterview`에서 그대로
  작업한다. 새 브랜치를 만들지 않는다.
- 커밋은 1개로 만든다. push는 하지 않는다.
- 커밋 메시지는 한국어 `type: 본문` 형식으로 작성한다.

## Verification

- `pnpm format:check`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
