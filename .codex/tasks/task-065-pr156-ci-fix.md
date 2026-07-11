# Codex Handoff Task

## Source

PR #156 CI 실패 수정. GitHub Actions에서 `ResearchPage.test.tsx`의
deep-link 테스트 2건이 실패했다 (로컬은 통과 — 타이밍 의존).

```
FAIL ResearchPage > scrolls to and focuses a supported section after research loads
  AssertionError: expected "spy" to be called once, but got 0 times
FAIL ResearchPage > does not scroll for a missing or unsupported section at /research/NVDA
  AssertionError: expected "spy" to not be called at all, but actually been called 1 times
```

## 원인 분석

- 양성 테스트가 `findByRole(heading)` 직후 `mockScrollIntoView` 호출을
  동기 단언한다. section 처리 effect는 heading 렌더 이후 커밋 단계에서
  실행되므로, 느린 CI에서는 단언 시점에 아직 호출 전이다 (0회 실패).
- 그 지연 호출이 다음 테스트 시작 후 도착해 음성 테스트에서 1회로
  관측된다 (교차 오염).
- 음성 테스트가 기다리는 `NVDA 리서치` h1은 로딩 상태에서도 존재해
  데이터 로드 완료를 보장하지 못하는 문제도 있다.

## 수정 지시

`src/pages/ui/ResearchPage.test.tsx`만 수정한다. 구현 코드는 바꾸지 않는다.

- 양성 테스트·심볼 전환 테스트: 호출 횟수 단언을
  `await waitFor(() => expect(mockScrollIntoView).toHaveBeenCalledOnce())`
  (전환 테스트는 `toHaveBeenCalledTimes(2)`) 형태로 바꿔 타이밍 의존을
  제거한다. focus 단언도 waitFor 안 또는 그 뒤에 둔다.
- 음성 테스트: 데이터 로드 완료를 보장하는 요소(예: 브리핑 headline
  `AI demand remains durable`)를 기다린 뒤, effect flush를 지나고 나서
  `not.toHaveBeenCalled()`를 단언한다 (예: `await act(async () => {})`
  또는 waitFor로 안정 상태 확인 후 단언).
- 테스트 간 오염 방지를 위해 각 테스트 종료 시점에 pending 호출이 남지
  않는 구조인지 확인하고, 필요하면 spy 초기화 위치를 조정한다.

## Verification

- `pnpm format:check`, `pnpm typecheck`, `pnpm lint`, `pnpm test` 전부 통과.
- `pnpm test src/pages/ui/ResearchPage.test.tsx`를 3회 연속 실행해도
  통과해야 한다.

## Rules

- 현재 브랜치(feat/144-research-deeplink)에서 새 커밋 1개. push 금지.
- 커밋 메시지는 한국어 `type: 본문` 형식.
