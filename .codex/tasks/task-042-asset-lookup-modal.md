# Codex Handoff Task

## Source Issue

https://github.com/JongEunLee310/project_stock_frontend/issues/112

## Task Summary

종목 추가 모달을 실시장 lookup 기반 자동완성 선택 방식으로 개편하고, 관심목록이 없으면 자동 생성하도록 추가 훅을 보강한다.

## Goal

- 시장 select + 심볼/종목명 입력에서 부분 입력으로 실존 종목이 드롭다운에 표시되고, 선택만으로 관심목록 추가가 완료된다.
- 수동 등록 폼(종목명·섹터 직접 입력)과 탭 구분이 제거된다.
- 관심목록이 0개인 계정에서도 추가가 성공한다 (기본 관심목록 자동 생성).
- 검증 4종(pnpm format:check, typecheck, lint, test) 통과.

## Background

설계 문서: `docs/designs/112-asset-lookup-modal.md` — BE Contract 절에 확정 계약을 검증해 두었다. 구현 전 BE 저장소(로컬 경로 `/Users/sleepyowl/Projects/project_stock`, origin/dev)의 `app/domains/assets/schema.py`·`app/api/v1/endpoints/assets.py`와 대조하고, 불일치하면 보고 후 실계약을 우선하라.

핵심 계약:

- `GET /assets/lookup?query=&market=` → `{ items: [{ symbol, name, market, sector: string|null, registered: boolean }] }` (envelope 래핑, 부분 일치·대소문자 무시, query 1자 이상 필수)
- `POST /assets` body는 `{ symbol, market }` 2필드 (breaking 변경 반영). 201 `AssetResponse`(id 포함), 미실존 422 `ASSET_NOT_IN_MARKET`, 중복 400 `ASSET_DUPLICATE`
- `GET /assets?symbol=` 완전 일치 검색은 유지 — registered 종목 id 해석에 사용
- `POST /watchlists` body `{ name }` → 201 `WatchlistResponse`

기존 FE 패턴: `apiGet`/`apiPost`(envelope 처리), debounce 350ms(`useDebouncedValue`가 모달에 이미 있음), 무효화 키 `['watchlist']` prefix, 모달 접근성(포커스 이동·트랩·Escape)은 기존 구현 유지.

## Implementation Scope

설계 문서의 Decisions·Components·States 절을 따른다.

- `src/features/watchlist/dto.ts` — `CreateAssetBody` → `{ symbol: string, market: string }`, `AssetLookupItemDto`·`AssetLookupResponseDto` 추가
- `src/features/watchlist/queries.ts` — `useAssetLookup(query: string, market: string | null, enabled)` 추가 (query 비면 비활성), `useCreateAsset` body 변경, `useAddAssetToFirstWatchlist`: 관심목록 0개면 `POST /watchlists { name: '관심종목' }` 후 추가 (성공 시 기존과 동일하게 `['watchlist']` 무효화)
- `src/features/watchlist/AddWatchlistAssetModal.tsx` — 전면 재구성:
  - 탭·수동 등록 폼 제거
  - 시장 select: 전체(미지정)·NASDAQ·NYSE·KOSPI·KOSDAQ, 기본 전체
  - 심볼 입력과 종목명 입력 각각에서 debounce 후 lookup 호출, 결과 드롭다운 표시 (symbol, name, market, sector, registered 뱃지)
  - 드롭다운에서 선택하면 두 필드가 lookup 항목 값으로 채워지고 선택 상태 유지. 입력을 다시 수정하면 선택 해제
  - 추가 버튼: 선택 항목 필수. `registered: true`면 `GET /assets?symbol=<공식 심볼>` 결과에서 market까지 일치하는 항목의 id로 추가, `registered: false`면 `POST /assets` 후 반환 id로 추가
  - 실패 시 모달 내 오류 메시지(role="alert"), 성공 시 모달 닫기
  - 기존 접근성 구현(포커스 이동·트랩·Escape·aria) 유지, 드롭다운에도 적절한 role(listbox/option 또는 버튼 목록) 적용
- `src/shared/api/errorCodes.ts` — `ASSET_NOT_IN_MARKET: '시장 데이터에서 확인되지 않은 종목입니다'`, `ASSET_DUPLICATE: '이미 등록된 종목입니다'` 추가
- 관련 테스트 갱신·추가 (기존 모달 테스트는 새 구조에 맞게 재작성)

## Out of Scope

- 추천 섹션(`src/features/watchlist-recommendations/`) 변경 — `useAddAssetToFirstWatchlist` 보강의 간접 수혜만 받는다
- BE 변경 (필요하면 보고만 하고 중단)
- 라우팅·디자인 시스템 변경

## Protected Files

없음. 보호 파일을 수정하지 않는다.

## Requirements

- 제출은 항상 드롭다운에서 선택한 lookup 항목으로만 이루어진다. 타이핑만 한 값으로는 추가 버튼이 활성화되지 않는다.
- lookup 결과가 없으면 "해당 시장에서 종목을 찾지 못했습니다" 성격의 안내만 표시한다 (수동 등록 유도 없음).
- registered 종목의 id 해석에서 심볼은 lookup이 준 공식 심볼(대문자)을 그대로 사용하고, market 불일치 항목은 제외한다. 해석 실패 시 모달 내 오류로 표시한다.
- 관심목록 자동 생성은 추가 시점에만 수행한다 (모달 열림만으로 생성하지 않는다).
- 시장 select 변경 시 진행 중이던 선택은 해제하고 lookup을 다시 조회한다.

## Test Requirements

- lookup 자동완성: 부분 입력 → 드롭다운 표시 → 선택 → 두 필드 채움 경로
- registered 종목 추가 성공 경로 (id 해석 포함)
- 미등록 종목: POST /assets 등록 후 추가 성공 경로
- 관심목록 0개 → 자동 생성 후 추가 성공 (queries 단위 테스트 포함)
- 등록 422(`ASSET_NOT_IN_MARKET`) 시 오류 메시지 표시
- lookup 무결과 안내 표시
- 기존 테스트를 약화하거나 삭제하지 않는다 (모달 구조 변경에 따른 재작성은 허용, 커버 범위 축소 금지).

## Verification Commands

- `pnpm format:check`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`

(참고: prettier 미준수 시 `pnpm format`으로 정리 후 format:check 재확인)

## Documentation Impact

`docs/designs/112-asset-lookup-modal.md`의 Status를 구현 완료 후 `Implemented`로 갱신한다.

## ADR Need

불필요. 기존 feature 모듈·모달 패턴 내 개편이다.

## Failure Record Need

불필요.

## Risk Level

Medium — 모달 전면 재구성과 공용 훅(`useAddAssetToFirstWatchlist`) 동작 변경이 있으나, 추가 시점 자동 생성이라 기존 호출부(추천 섹션)에는 성공 경로가 넓어지는 방향의 변경이다.

## Expected Output

- 변경 파일 목록 보고
- 검증 4종 실행 결과 보고
- BE 계약 대조 결과 보고
- 가정·잔여 위험 보고

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
- 현재 체크아웃된 브랜치(feat/112-asset-lookup-modal)에서 그대로 작업한다. 새 브랜치를 만들지 않는다. 커밋하지 않는다.
