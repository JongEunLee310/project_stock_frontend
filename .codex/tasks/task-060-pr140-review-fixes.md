# Codex Handoff Task

## Source

PR #140 로컬 리뷰(`docs/reviews/pr-140.md`)의 Blocking B1 및 동반 처리
항목 S1·S3을 수정한다. 리뷰 전문을 반드시 먼저 읽는다.

## Task Summary

`ResearchPage`의 메모 debounce effect가 의존성 배열의 `checkedItemKeys`
(mutation 상태 파생 useMemo)와 `research`(무효화 재조회) 변화로 재실행되어,
메모 입력 중 체크리스트를 토글하면 debounce 타이머가 조기 초기화된다.
"입력 후 1초 저장" 계약이 깨지지 않도록 effect 의존성 설계를 수정한다.

## Goal

작업 완료 시 다음 상태여야 한다.

- 메모 debounce 타이머가 메모 입력(초안 변경) 이외의 상태 변화(체크리스트
  토글, mutation pending 전이, research 재조회)로 초기화되지 않는다.
- debounce 콜백이 저장 시점의 최신 `checked_item_keys`를 동봉한다
  (ref로 추적해 콜백 내부에서 읽는다).
- B1 경합 경로를 커버하는 테스트가 추가된다: 메모 입력 후 1초 안에
  체크리스트를 토글해도 메모 저장이 최초 입력 기준 1초에 발생하고, body의
  `checked_item_keys`가 토글 반영 값이다 (fake timers 사용).
- (S1) `checklistMutation`·`memoMutation` 두 인스턴스를 하나의
  `useSaveBuyChecklist` 인스턴스로 통합한다. 통합 후에도 체크 토글의
  낙관적 표시(`isPending`·`variables` 파생)와 메모 저장 상태 표시가 모두
  동작해야 한다. 통합이 낙관적 표시를 깨뜨리는 경우에만 두 인스턴스를
  유지하되 그 이유를 커밋 본문에 명시한다.
- (S3) `checked_item_keys`가 null 또는 미존재일 때 `items[].checked`
  폴백이 동작함을 검증하는 어댑터 테스트를 추가한다.
- `pnpm format:check`, `pnpm typecheck`, `pnpm lint`, `pnpm test`가 전부
  통과한다.

## Background

- 대상 코드: `src/pages/ui/ResearchPage.tsx`의 debounce effect(현재
  515–532행 부근)와 `checkedItemKeys` useMemo, `toggleChecklistItem`.
- 어댑터 폴백: `src/features/research/adapters.ts` 166–168행 부근
  (`checked_item_keys` 우선, 없으면 `item.checked`).
- 리뷰 근거: `docs/reviews/pr-140.md` B1·S1·S3. 설계 문서
  `docs/designs/138-research-design-alignment.md`의 "입력 후 1초 debounce"
  명세가 계약 기준이다.

현재 브랜치 `feat/138-research-design-alignment`에서 그대로 작업한다. 새
브랜치를 만들지 않는다. 원격에 이미 push된 커밋을 수정(amend·rebase)하지
말고 새 커밋을 추가한다.

## Implementation Scope

**갱신**

- `src/pages/ui/ResearchPage.tsx`
- `src/pages/ui/ResearchPage.test.tsx`
- `src/features/research/adapters.test.ts`

**변경 불가**

- `src/features/research/dto.ts`, `src/features/research/queries.ts`
  (S1 통합이 페이지 내 인스턴스 정리만으로 가능하므로 훅 시그니처는
  유지한다)
- `src/features/watchlist/`, `src/shared/api/`

## Out of Scope

- S2(관심종목 100개 초과 판정), S4, Q1(onSuccess 캐시 직접 갱신 전환),
  Q2(staleTime) — 후속 처리.

## Rules

- 커밋은 1개로 만든다. push는 하지 않는다.
- 필요하지 않은 추상화를 추가하지 않는다.

## Verification

- `pnpm format:check`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
