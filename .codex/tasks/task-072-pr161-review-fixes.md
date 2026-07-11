# Codex Handoff Task

## Source

PR #161 로컬 리뷰 후속 조치. 리뷰 기록: `docs/reviews/pr-161.md` (B1 절을
먼저 읽는다).

## Task Summary

**B1 — `return_percent` 타입을 BE 실계약(decimal 문자열)에 맞춘다.**

BE는 `return_percent`를 문자열로 직렬화한다 (BE
`tests/test_benchmark.py`가 `points[0]["return_percent"] == "0"`을
단언). 현재 FE는 number로 선언하고 파싱 없이 할당해, 실응답에서는
문자열이 그대로 흘러 수익률 렌더가 깨진다.

- `src/features/research/dto.ts` — `BenchmarkComparisonDto`의
  `return_percent`를 `string`으로 수정.
- `src/features/research/adapters.ts` — `adaptBenchmarkComparison`에서
  `parseDecimal` 적용 (다른 decimal 필드와 동일 패턴). 파싱 실패(null)
  포인트는 제외하거나 0 처리하지 말고 프로젝트 기존 관례를 따른다 —
  `adaptPriceSeries`가 null close를 필터링하는 패턴 참조.
- 관련 픽스처(`adapters.test.ts`·`queries.test.tsx`·
  `ResearchPage.test.tsx`)의 `return_percent`를 decimal 문자열
  (`"0"`, `"1.25"` 등)로 갱신.

## Out of Scope

- S1(가격 모드 축 표시)·S2·S3 — 비차단, 손대지 않는다.
- 다른 필드·컴포넌트 불변.

## Rules

- 현재 브랜치 `feat/148-price-chart-enhancement`에서 그대로 작업한다.
  새 브랜치를 만들지 않는다.
- 커밋은 1개로 만든다. push는 하지 않는다.
- 커밋 메시지는 한국어 `type: 본문` 형식으로 작성한다.

## Verification

- `pnpm format:check`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
