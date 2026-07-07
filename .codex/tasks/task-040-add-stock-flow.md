# Codex Handoff Task

## Source Issue

https://github.com/JongEunLee310/project_stock_frontend/issues/108

## Task Summary

WatchlistPage의 죽은 '+ 종목 추가' 버튼에 종목 추가 모달 플로우를 연결한다: 심볼/이름으로 등록 종목 검색 → 선택(또는 신규 종목 등록) → 관심종목에 추가 → 목록 갱신.

## Goal

- '+ 종목 추가' 버튼 클릭 시 종목 추가 모달이 열린다.
- 모달에서 심볼로 기존 종목을 검색해 선택하거나, 검색 결과가 없으면 신규 종목을 등록할 수 있다.
- 선택/등록한 종목이 관심종목에 추가되고, 관심종목 목록·요약 쿼리가 무효화되어 즉시 갱신된다.
- 중복 추가 등 실패 시 사용자에게 오류 메시지가 표시된다.

## Background

BE 엔드포인트는 모두 존재하며 계약은 아래와 같다 (출처: project_stock BE 저장소 `app/domains/assets/schema.py`, `app/domains/watchlists/schema.py`, `app/api/v1/endpoints/assets.py`, `watchlists.py`. 모든 응답은 기존 envelope 형식).

- `GET /assets?symbol=<필터>&page=1&size=20` — 등록 종목 검색 (paginated `AssetResponse[]`)
- `POST /assets` — 신규 종목 등록. body: `{ symbol: string(≤20), name: string(≤255), market: string(≤20), sector?: string|null, industry?: string|null, description?: string|null }` → 201 `AssetResponse`
- `POST /watchlists/{watchlist_id}/items` — 관심종목 추가. body: `{ asset_id: number, priority?: number(기본 0), reason?: string|null, tags?: string[], memo?: string|null }` → 201 `WatchlistItemDto`
- `AssetResponse`는 최소 `id, symbol, name, market, sector` 필드를 갖는다. 실제 필드는 구현 전에 BE 저장소(로컬 경로 `/Users/sleepyowl/Projects/project_stock/app/domains/assets/schema.py`)에서 검증하고, DTO는 실계약과 일치시킨다.

기존 FE 패턴:

- feature 모듈 구조: `src/features/<name>/{dto.ts, adapters.ts, queries.ts}` + 테스트
- HTTP 클라이언트: `src/shared/api/client.ts`의 `apiGet`/`apiPost` (envelope 처리 포함)
- 관심종목 조회는 `src/features/watchlist/queries.ts`의 `useWatchlistAssets`가 첫 번째 watchlist(`GET /watchlists` 결과의 `[0]`)를 사용한다. 추가도 같은 규칙(첫 번째 watchlist)을 따른다.
- 무효화 대상 쿼리 키: `['watchlist', ...]` prefix (`['watchlist', 'assets']`, `['watchlist', 'summary']` 등)
- 죽은 버튼 위치: `src/pages/ui/WatchlistPage.tsx` 415행 부근 `+ 종목 추가` Button (onClick 없음)

## Implementation Scope

- `src/features/watchlist/` — 종목 검색 쿼리(`useAssetSearch` 등), 종목 등록·관심종목 추가 mutation, 필요한 DTO 추가. 별도 feature 모듈(`src/features/asset-search/` 등)로 나눠도 좋다 — 기존 구조와 자연스러운 쪽을 선택.
- 종목 추가 모달 컴포넌트 — 기존 UI 컴포넌트(`src/shared/ui` 또는 프로젝트에서 쓰는 공용 컴포넌트)를 재사용해 페이지 스타일과 일관되게 구현.
- `src/pages/ui/WatchlistPage.tsx` — 버튼에 모달 열기 연결.
- 관련 테스트 추가.

## Out of Scope

- 종목 추천 기능 (별도 이슈 #109).
- BE 변경 (필요하면 보고만 하고 중단).
- 라우팅 구조 변경 (모달 방식이므로 새 페이지 라우트는 불필요).
- 기존 watchlist 조회 로직·디자인 시스템 변경.

## Protected Files

없음. 보호 파일을 수정하지 않는다.

## Requirements

- 검색은 입력 후 일정 시간(debounce) 뒤 `GET /assets?symbol=`로 조회한다.
- 검색 결과가 없을 때 신규 등록 폼(symbol, name, market 필수 / sector 선택)으로 전환할 수 있다.
- 추가 성공 시 모달을 닫고 `['watchlist']` prefix 쿼리를 무효화한다.
- 실패 시(HTTP 4xx 포함) 모달 안에 오류 메시지를 표시하고 모달은 닫지 않는다.
- 접근성: 모달에 적절한 role/aria 속성, 버튼에 type 지정.

## Test Requirements

- 검색 → 선택 → 추가 성공 경로 테스트 (기존 queries.test / Page.test 패턴, MSW 또는 기존 mock 방식을 따른다).
- 추가 실패 시 오류 표시 테스트.
- DTO/adapter 신규 로직이 있으면 adapter 단위 테스트.
- 기존 테스트를 약화하거나 삭제하지 않는다.

## Verification Commands

- `pnpm format:check`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`

(참고: prettier 미준수 시 `pnpm format`으로 정리 후 format:check 재확인)

## Documentation Impact

불필요. 기존 패턴 내 기능 추가라 README 갱신 대상이 아니다.

## ADR Need

불필요. 새 아키텍처 결정이 없고 기존 feature 모듈 패턴을 따른다.

## Failure Record Need

불필요. 반복 실패 이력이 없다.

## Risk Level

Low — 신규 모달과 mutation 추가이며 기존 조회 경로는 변경하지 않는다.

## Expected Output

- 변경 파일 목록 보고
- 검증 4종(format:check, typecheck, lint, test) 실행 결과 보고
- 가정·잔여 위험 보고

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
- 현재 체크아웃된 브랜치(feat/108-add-stock-flow)에서 그대로 작업한다. 새 브랜치를 만들지 않는다.
