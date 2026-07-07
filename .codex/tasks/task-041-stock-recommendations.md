# Codex Handoff Task

## Source Issue

https://github.com/JongEunLee310/project_stock_frontend/issues/109

## Task Summary

WatchlistPage에 종목 추천 섹션을 추가한다: "추천 받기" 버튼으로 BE 추천 API를 호출해 추천 종목(심볼·이름·근거·참고 지표)을 표시하고, 각 항목을 원클릭으로 관심종목에 추가한다.

## Goal

- WatchlistPage 하단에 추천 섹션(Card)이 표시되고, "추천 받기" 버튼으로 추천을 조회한다.
- 추천 항목마다 심볼, 이름, 추천 근거(rationale), 참고 지표(reference_metrics) 태그가 표시된다.
- 항목의 "추가" 버튼으로 해당 종목이 첫 번째 관심종목에 추가되고 `['watchlist']` prefix 쿼리가 무효화된다.
- 로딩·빈·오류 상태가 처리된다.

## Background

설계 문서: `docs/designs/109-stock-recommendations.md` (배치·호출 시점·asset_id 해석 방식 확정)

BE 계약 (출처: project_stock BE 저장소 origin/dev의 `app/domains/watchlists/schema.py`, `app/api/v1/endpoints/watchlists.py`. 로컬 경로 `/Users/sleepyowl/Projects/project_stock`에서 구현 전 실계약 검증 가능):

- `GET /watchlists/{watchlist_id}/recommendations` — envelope 래핑 응답. data:
  - `{ recommendations: [{ symbol: string, name: string, rationale: string, reference_metrics: string[] }], generated_at: string }`
  - 추천 최대 5개, 후보 없으면 빈 배열. `asset_id`는 응답에 없다.
  - 서버가 LLM을 호출하므로 수 초 이상 걸릴 수 있다.
- `GET /assets?symbol=<필터>&page=1&size=20` — 종목 검색 (#108에서 이미 사용, `AssetDto[]`)
- 관심종목 추가는 기존 `useAddAssetToFirstWatchlist` (`src/features/watchlist/queries.ts`) 재사용.

기존 FE 패턴:

- feature 모듈 구조: `src/features/<name>/{dto.ts, queries.ts}` + 테스트 (adapters는 필요할 때만)
- HTTP 클라이언트: `src/shared/api/client.ts`의 `apiGet` (envelope 처리 포함)
- 첫 번째 watchlist 규칙: `GET /watchlists?page=1&size=20` 결과의 `[0]` (기존 쿼리들과 동일)
- 공용 UI: `src/shared/ui`의 `Card`, `Button`, `Skeleton`, `EmptyState`, `ErrorState` 등

## Implementation Scope

- `src/features/watchlist-recommendations/dto.ts` — `StockRecommendationDto`, `WatchlistRecommendationsDto`
- `src/features/watchlist-recommendations/queries.ts` — 추천 조회 훅 (수동 트리거: `enabled: false` + `refetch`, 또는 동등한 패턴)
- `src/features/watchlist-recommendations/WatchlistRecommendationsSection.tsx` — 섹션 컴포넌트
- `src/pages/ui/WatchlistPage.tsx` — 섹션 삽입 (관심종목 테이블 아래)
- 관련 테스트 추가

## Out of Scope

- 새 라우트·사이드바 항목 추가 (섹션 방식이므로 불필요)
- BE 변경 (필요하면 보고만 하고 중단)
- 종목 추가 모달(#108 산출물) 변경
- 기존 watchlist 조회 로직·디자인 시스템 변경

## Protected Files

없음. 보호 파일을 수정하지 않는다.

## Requirements

- 추천 조회는 페이지 진입 시 자동 실행하지 않는다. "추천 받기" 버튼 클릭 시에만 호출한다.
- 로딩 중에는 버튼을 비활성화하고 로딩 표시(수 초 걸릴 수 있다는 안내 문구 포함)를 보여준다.
- 추천이 빈 배열이면 "추천할 후보가 없습니다" 성격의 빈 상태를 표시한다.
- 조회 실패 시 오류 상태와 재시도 버튼을 표시한다.
- 항목 "추가" 클릭 시: `GET /assets?symbol=<추천 심볼>`로 검색해 심볼이 정확히 일치하는(대소문자 무시) 항목의 `id`를 찾고, `useAddAssetToFirstWatchlist`로 추가한다. 일치 항목이 없거나 추가가 실패하면(중복 추가 4xx 포함) 해당 항목에 오류 메시지를 표시한다.
- 추가 성공한 항목은 "추가됨" 표시와 함께 버튼을 비활성화한다.
- 추가 진행 중에는 해당 항목 버튼을 비활성화한다 (다른 항목은 독립적으로 동작).
- `generated_at`을 섹션에 표시한다 (기존 페이지의 시간 포맷 패턴을 따른다).
- 접근성: 버튼에 type 지정, 상태 변화가 스크린리더에 전달되도록 적절한 aria 속성 사용.

## Test Requirements

- 추천 조회 성공 → 항목 렌더링 테스트 (queries.test / Page.test의 기존 mock 패턴을 따른다)
- 빈 배열 → 빈 상태 표시 테스트
- 조회 실패 → 오류 상태 표시 테스트
- 항목 추가 성공 경로 테스트 (심볼 검색 → asset_id 해석 → 추가 → 무효화)
- 항목 추가 실패 시 항목 단위 오류 표시 테스트
- 기존 테스트를 약화하거나 삭제하지 않는다.

## Verification Commands

- `pnpm format:check`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`

(참고: prettier 미준수 시 `pnpm format`으로 정리 후 format:check 재확인)

## Documentation Impact

`docs/designs/109-stock-recommendations.md`의 Status를 구현 완료 후 확인한다. 그 외 README 갱신 대상 아님.

## ADR Need

불필요. 기존 feature 모듈 패턴을 따르며 새 아키텍처 결정이 없다.

## Failure Record Need

불필요. 반복 실패 이력이 없다.

## Risk Level

Low — 신규 섹션·쿼리 추가이며 기존 조회 경로는 변경하지 않는다.

## Expected Output

- 변경 파일 목록 보고
- 검증 4종(format:check, typecheck, lint, test) 실행 결과 보고
- 가정·잔여 위험 보고

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
- 현재 체크아웃된 브랜치(feat/109-stock-recommendations)에서 그대로 작업한다. 새 브랜치를 만들지 않는다.
