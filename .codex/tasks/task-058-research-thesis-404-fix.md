# Codex Handoff Task

## Source Issue

#137 — 리서치 화면 로드 실패 수정 — /theses/latest 404가 전체 렌더를 차단
`gh issue view 137 --repo JongEunLee310/project_stock_frontend`

설계 문서: `docs/designs/137-research-thesis-404-fix.md` (반드시 먼저 읽는다)

## Task Summary

`useResearchView`의 `Promise.all` 안에서 `GET /theses/latest?asset_id={id}`가
투자 가설 미존재 시 404(`THESIS_NOT_FOUND`)를 반환해 리서치 화면 전체가
ErrorState로 떨어진다. thesis 404만 `null`로 흡수해 나머지 데이터로 화면을
렌더한다.

## Goal

작업 완료 시 다음 상태여야 한다.

- 투자 가설이 없는 자산·사용자에서도 리서치 화면이 정상 렌더된다.
- `/theses/latest`가 `THESIS_NOT_FOUND` 오류 envelope를 반환하면
  `latestThesis`는 `null`로 매핑된다.
- thesis의 `THESIS_NOT_FOUND` 이외 오류와 나머지 4개 API의 오류는 기존대로
  쿼리 실패(ErrorState)로 이어진다.
- `pnpm format:check`, `pnpm typecheck`, `pnpm lint`, `pnpm test`가 전부
  통과한다.

## Background

- `apiGet`은 envelope의 `error`가 있으면 `ApiError(code, message)`를 던진다
  (`src/shared/api/envelope.ts`). HTTP 상태가 아니라 `ApiError.code ===
'THESIS_NOT_FOUND'`로 식별한다. 이 리터럴은 BE
  `app/core/error_codes.py`의 `ErrorCode.THESIS_NOT_FOUND` 값이다.
- FE 계약(`src/features/research/dto.ts`)은 이미 `ThesisDto | null`이고
  `adaptResearchDetail`도 null을 처리한다. 계약·어댑터 변경은 없다.
- BE 실응답(가설 없음): `{ "data": null, "message": "투자 가설을 찾을 수
없습니다.", "error": { "code": "THESIS_NOT_FOUND" }, "meta": null }`.

현재 브랜치 `feat/137-research-thesis-404-fix`에서 그대로 작업한다. 새
브랜치를 만들지 않는다.

## Implementation Scope

**갱신**

- `src/features/research/queries.ts` — `fetchLatestThesis(assetId)` 신설
  (설계 문서 시그니처), `useResearchView`의 다섯 번째 병렬 호출을 이 함수로
  교체.
- `src/features/research/queries.test.tsx` — 아래 Test Requirements 추가.

**변경 불가**

- `src/features/research/dto.ts`, `src/features/research/adapters.ts`
- `src/pages/ui/ResearchPage.tsx`
- `src/shared/api/` (client·envelope)

## Test Requirements

- thesis 404(`THESIS_NOT_FOUND` envelope) + 나머지 4개 API 200 조합에서
  `useResearchView`가 성공하고 결과의 `latestThesis`가 `null`이다.
- thesis가 `THESIS_NOT_FOUND` 이외의 오류 envelope를 반환하면 쿼리가
  실패한다.
- msw 픽스처는 Background의 BE 실응답 형태를 그대로 사용한다.

## Out of Scope

- BE `/theses/latest` 계약 변경 (404 유지).
- ResearchPage 레이아웃·디자인 정렬 (#138).
- 다른 4개 API의 실패 격리.

## Rules

- 커밋은 1개로 만든다. push는 하지 않는다.
- 필요하지 않은 추상화를 추가하지 않는다.

## Verification

- `pnpm format:check`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
