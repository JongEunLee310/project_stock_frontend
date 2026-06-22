# Codex Handoff Task — task-009 후속 수정: 타임존 의존 테스트 (PR #32)

## Source Issue

- PR #32(이슈 8 보강, task-009) **CI 실패** 후속 수정. 새 PR 금지 — **같은 브랜치
  `feat/fe-watchlist-redesign`에 push**하면 PR #32가 갱신된다.
- 리뷰: `docs/reviews/pr-32.md`의 Blocking 항목.

## Task Summary

`WatchlistPage`의 시간 표시가 런타임 로컬 타임존에 의존해 CI(UTC)에서 테스트가 깨진다. 포매터에
타임존을 고정해 결정적으로 렌더되게 한다.

## Goal

- 로컬(KST)·CI(UTC) 어디서나 마지막 갱신·추가 시각이 동일하게 렌더된다.
- `pnpm test`가 CI(UTC) 환경에서도 통과한다(31/31).
- 표시 의미·기존 테스트 단언(`/09:21/` 등)을 유지한다.

## Background

- 실패 테스트: `src/pages/ui/WatchlistPage.test.tsx` "renders extended table columns and stock cells"가
  `/09:21/`을 단언.
- mock `lastUpdatedAt = '2026-06-22T00:21:00.000Z'`(UTC). `src/pages/ui/WatchlistPage.tsx`의
  `timeFormatter = new Intl.DateTimeFormat('ko-KR', { month, day, hour, minute, hour12:false })`에
  **`timeZone` 미지정** → 런타임 로컬존으로 렌더. KST(UTC+9)=09:21 통과, CI(UTC)=00:21 실패.

## Implementation Scope

- `src/pages/ui/WatchlistPage.tsx`의 `timeFormatter`에 **`timeZone: 'Asia/Seoul'` 추가**(한국어 제품
  기준 KST 표시, 테스트 `/09:21/` 유지). 동일 포매터를 마지막 갱신·추가 시각에 함께 쓰므로 한 곳 수정으로
  일괄 해결.
- 다른 변경 불필요(로직·레이아웃·도메인·mock 그대로).

## Out of Scope

- 타임존 사용자 설정·다국어, 차트(이슈 19), 그 외 기능 변경.
- 다른 파일·테스트의 비관련 수정.

## Protected Files

없음.

## Requirements

- 포매터에 명시적 `timeZone` 고정. 표시 포맷(MM.DD HH:mm, 24시간)은 유지.
- 시간 단언 테스트가 환경 독립적으로 통과(필요 시 테스트도 동일 타임존 전제로 정합).

## Test Requirements

- 기존 테스트 유지·통과. 시간 표시 단언이 타임존 고정으로 결정적이게.
- (선택) 마지막 갱신 표시가 고정 타임존을 따른다는 점이 드러나면 충분.

## Verification Commands

```bash
pnpm format:check
pnpm lint
pnpm typecheck
TZ=UTC pnpm test   # CI(UTC) 환경 재현 — 반드시 통과해야 함
pnpm build
```

> 로컬이 KST라 일반 `pnpm test`만으로는 회귀를 못 잡는다. **`TZ=UTC pnpm test`로 CI 환경을 재현**해
> 확인할 것. 커밋 전 변경 파일에 한정해 `prettier --write`.

## Documentation Impact

- 불필요(설계·README 변경 없음). 필요 시 `docs/reviews/pr-32.md`에 해결 후속 코멘트는 Claude가 기록.

## ADR Need

불필요.

## Failure Record Need

불필요(경미한 환경 의존 테스트 수정). 단, "시간 포매터는 명시적 timeZone 고정" 관례는 컨벤션화 여지
있음(Claude가 판단).

## Risk Level

Low. 포매터 옵션 한 줄 추가. 동작 영향 최소.

## Expected Output

- 변경: `src/pages/ui/WatchlistPage.tsx`(timeFormatter `timeZone` 고정), 필요 시 테스트 정합.
- **같은 브랜치 `feat/fe-watchlist-redesign`에 커밋·push**(새 PR 금지, PR #32 갱신).
- `TZ=UTC pnpm test` 통과 결과 보고.

## Rules

- 새 PR 만들지 말 것 — 같은 브랜치에 push해 PR #32를 갱신.
- 범위 내(타임존 고정)만. 다른 리팩터링·기능 변경 금지.
- `TZ=UTC pnpm test`로 CI 환경 재현 확인 후 보고.
