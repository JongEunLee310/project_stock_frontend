# Task 054: PR #130 리뷰 후속 — 테스트 보완 2건

## Source Issue

PR #130 로컬 리뷰(`docs/reviews/pr-130.md`)의 S1·S2. 기능 변경 없음, 테스트 파일만 보완한다.

## Implementation Scope

`src/widgets/Topbar.test.tsx`만 변경한다.

1. **S1 — 빈 관심목록 케이스 테스트 추가**: `GET /watchlists`가 빈 배열을 반환하면 분석 트리거(`POST /worker/jobs/analysis`)를 호출하지 않고, 캐시 무효화와 동기화 시각 갱신은 그대로 수행되며 상태 문구가 "동기화"로 유지되는지 검증한다. 기존 테스트의 mock 패턴을 그대로 따른다 (핸드오프 task-053 Test Requirements의 누락분).
2. **S2 — 픽스처 출처 주석**: 429 테스트의 `RATE_LIMIT_EXCEEDED` 리터럴에 출처 주석을 추가한다 — BE 계약(project_stock PR #244, `docs/designs/129-sync-analysis-trigger.md` §2). quality-process-policy의 Real-Contract Fixtures 규율.

## Out of Scope

- 구현 코드(`Topbar.tsx`, `mutations.ts`, `errorCodes.ts`) 변경
- 기타 파일

## Verification Commands

```
corepack pnpm format:check
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test
```

## Rules

- 현재 브랜치(`feat/129-sync-analysis-trigger`) 유지 — 새 브랜치 생성 금지. 커밋 금지.
- 위 2개 항목 외 변경 금지.
