# Codex Handoff Task

## Source Issue

이슈 #236의 후속 단계다. 같은 브랜치 `test/236-watchlist-test-split`에서 이어서 작업한다.
새 브랜치와 새 PR을 만들지 않는다.

## Task Summary

`task-093`으로 `WatchlistPage.test.tsx`를 5개 파일로 분할했으나, orchestrator가 재검증한
결과 부하 상태에서 타임아웃이 여전히 재현됐다. 이슈 #236이 정한 조건부 후속에 따라
`vite.config.ts`의 `test.testTimeout`을 근거 있는 값으로 상향한다.

## Background — 재검증 결과

orchestrator가 `origin/main` 리베이스 후 busy loop 12개 부하를 준 채 스위트를 4회 실행했다.

- 1회차 — `src/pages/ui/WatchlistPage.actions.test.tsx`에서 3건 타임아웃 실패.
- 2·3회차 — 전체 통과.
- 4회차 — 같은 파일에서 2건 타임아웃 실패. 실패 테스트는
  `navigates to research from symbol, row, and row menu actions`와
  `renders loading, error, and empty states for connected rows`.

분할 전 실패하던 것과 같은 테스트들이며, 파일만 옮겨졌을 뿐 해소되지 않았다. 이는 태스크
`task-093` 배경에 적었던 "분할만으로는 해소되지 않을 수 있다"가 실제로 확인된 것이다.

부하 없이 `WatchlistPage.actions.test.tsx`를 단독 실행했을 때의 개별 소요는 다음과 같다.

- `removes a watchlist item from the row menu and disables only that row while pending` —
  5390ms
- `renders watchlist observations loading, error, null, and empty item states` — 2894ms
- `renders loading, error, and empty states for connected rows` — 1919ms

부하가 없는 상태에서도 5.4초를 쓰는 테스트가 있다. 현재 기본값 5000ms는 정상 소요보다 짧아
여유가 없는 설정이다.

## Implementation Scope

- `vite.config.ts`의 `test` 블록에 `testTimeout: 20000`을 추가한다. 근거는 부하 없는 상태의
  실측 최장값 5390ms이며, 부하 상태의 지연을 감안해 약 4배 여유를 둔 값이다.
- 다른 vitest 설정은 바꾸지 않는다.

## Out of Scope

- `hookTimeout`·`teardownTimeout`·pool·워커 수 설정 변경.
- 테스트 내용·구조 변경. `task-093`의 분할 결과는 그대로 둔다.
- 개별 테스트에 인자로 타임아웃을 주는 방식. 전역 설정 한 곳으로 관리한다.
- 프로덕션 코드 변경, CI workflow 변경.

## Protected Files

- `src/` 아래 프로덕션 코드 전부.
- `.github/workflows/` 아래 전부.
- `task-093`에서 만든 테스트 파일과 헬퍼.

## Requirements

1. `vite.config.ts`에 `testTimeout`이 명시되고 값이 20000이다.
2. 부하 상태에서 스위트를 3회 연속 실행해 타임아웃 실패가 없다.
3. 테스트 총 개수와 단언이 변하지 않는다.

## Verification Commands

- `pnpm format:check`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- 아래 부하 스크립트로 3회 반복 실행.

```
for i in $(seq 1 12); do (while :; do :; done) & done
LOADPIDS=$(jobs -p)
# 여기서 corepack pnpm test 를 3회 실행
kill $LOADPIDS
```

## Documentation Impact

없음. 값의 근거는 PR 본문에 남길 수 있도록 보고에 포함한다.

## Risk Level

Low — 설정 한 줄이다. 다만 타임아웃을 늘리면 진짜로 멈춘 테스트의 실패 인지가 늦어지므로,
값을 근거 없이 더 키우지 않는다.

## Expected Output

- `vite.config.ts` 수정.
- 현재 브랜치 `test/236-watchlist-test-split`에 이어서 커밋.
- 검증 4종과 부하 3회 실행 결과 보고.

## Rules

- Stay within scope.
- Do not weaken verification.
- 지정된 현재 브랜치를 유지한다. 새 브랜치 금지.
- Report assumptions and verification results.
