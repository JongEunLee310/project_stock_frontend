# Design — Issue 137: 리서치 화면 로드 실패 수정 (/theses/latest 404)

리서치 화면 진입 시 `useResearchView`의 `Promise.all` 안에서
`GET /theses/latest?asset_id={id}`가 404로 실패하면 화면 전체가
ErrorState로 떨어진다. 투자 가설이 없는 자산·사용자에서 항상 재현된다.

## Background

- BE `ThesisService.get_latest`는 해당 사용자·자산의 활성 가설이 없으면
  404를 반환한다. 에러 코드는 `THESIS_NOT_FOUND`
  (BE `app/core/error_codes.py`의 `ErrorCode.THESIS_NOT_FOUND`).
- FE 계약(`src/features/research/dto.ts`)은 `ThesisDto | null`을 기대하고,
  `adaptResearchDetail`도 `thesis: ThesisDto | null`을 받는다. 즉 null은
  이미 정상 경로다.
- `apiGet`은 envelope의 `error`가 있으면 `ApiError(code, message)`를
  던진다 (`src/shared/api/envelope.ts`). 404 여부가 아니라 `code`로
  식별한다.
- `latestThesis`는 현재 `ResearchPage` 렌더에 사용되지 않는다. BE 계약은
  변경하지 않는다 (단건 조회 not found 404 유지).

## 변경 — `src/features/research/queries.ts`

- `fetchLatestThesis(assetId: number): Promise<ThesisDto | null>` —
  `/theses/latest?asset_id={assetId}`를 호출하고, `ApiError`이면서
  `code === 'THESIS_NOT_FOUND'`인 경우만 `null`을 반환한다. 그 외 오류는
  그대로 다시 던진다.
- `useResearchView`의 `Promise.all` 다섯 번째 항목을 인라인 `apiGet`에서
  `fetchLatestThesis(assetId)` 호출로 교체한다.

## Test — `src/features/research/queries.test.tsx`

- thesis 404(`THESIS_NOT_FOUND` envelope) + 나머지 4개 API 200 조합에서
  `useResearchView`가 성공하고 `latestThesis === null`인지 검증.
- thesis가 `THESIS_NOT_FOUND` 이외의 오류(예: 서버 오류 envelope)면
  기존대로 쿼리가 실패하는지 검증.
- msw 핸들러 픽스처는 BE 실응답 형태를 따른다:
  `{ "data": null, "message": "...", "error": { "code": "THESIS_NOT_FOUND" }, "meta": null }`.

## Out of Scope

- BE `/theses/latest` 계약 변경 (404 → 200 null 전환 없음).
- ResearchPage 레이아웃·디자인 정렬 (#138에서 진행).
- 다른 4개 API의 실패 격리 (전체 ErrorState 유지가 의도된 동작).

## Open Questions

- 없음.
