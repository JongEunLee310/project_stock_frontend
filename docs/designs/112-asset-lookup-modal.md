# Design: 종목 추가 모달 개편 — 실시장 자동완성 (#112)

## Status

Implemented

## Context

종목 추가 플로우(#108) 실사용에서 세 가지 문제가 확인되었다. 관심목록이 0개인 계정은
추가가 항상 실패하고, 완전 일치 검색 탓에 부분 입력으로 기존 종목을 찾지 못했으며,
자유 입력 등록이 DB 오염을 유발했다. BE에 lookup API와 등록 검증이 도입되었으므로
(project_stock#226, PR #227 dev 머지), 모달을 자동완성 선택 방식으로 재구성한다.

## BE Contract (project_stock origin/dev 기준, 2026-07-07 확인)

- `GET /assets/lookup?query=<1자 이상>&market=<선택>` — envelope 래핑.
  data: `{ items: [{ symbol, name, market, sector: string|null, registered: boolean }] }`
  심볼·종목명 부분 일치(대소문자 무시). mock 카탈로그는 NASDAQ 7·NYSE 3·KOSPI 1 종목.
- `POST /assets` — body `{ symbol, market }` 2필드로 변경됨(breaking). 서버가 실존
  검증 후 공식 name·sector를 채워 201 `AssetResponse`(id 포함) 반환.
  미실존 422 `ASSET_NOT_IN_MARKET`, 중복 400 `ASSET_DUPLICATE`.
- `GET /assets?symbol=<정확 일치>` — 기존 유지. registered 종목의 id 해석에 사용.
- `POST /watchlists` — body `{ name(≤255) }` → 201 `WatchlistResponse`. 관심목록
  자동 생성에 사용.

## Decisions

- **탭·수동 폼 제거**: "기존 종목 선택 / 신규 종목 등록" 구분과 종목명·섹터 직접 입력을
  없앤다. 등록 여부는 lookup의 `registered`로 시스템이 판단한다.
- **필드 구성**: 시장 select(전체·NASDAQ·NYSE·KOSPI·KOSDAQ, 기본 전체) + 심볼 입력 +
  종목명 입력. 두 입력 모두 동일한 lookup을 debounce 호출해 자동완성 드롭다운을 띄우고,
  어느 쪽에서 선택해도 두 필드가 함께 채워진다. 사용자가 직접 타이핑한 값은 제출에
  쓰이지 않는다 — 항상 드롭다운에서 선택한 lookup 항목만 제출된다.
- **추가 흐름**: 선택 항목이 `registered: true`이면 `GET /assets?symbol=`(공식 심볼,
  market 일치 필터)로 id를 해석해 바로 추가한다. `registered: false`이면
  `POST /assets { symbol, market }`로 서버 검증 등록 후 반환된 id로 추가한다.
- **관심목록 자동 생성**: `useAddAssetToFirstWatchlist`에서 관심목록이 0개이면
  `POST /watchlists { name: "관심종목" }`으로 기본 목록을 만들고 추가한다. 추천
  섹션(#109)의 원클릭 추가도 같은 훅이라 자동으로 수혜를 받는다.
- **에러 표기**: `ASSET_NOT_IN_MARKET`·`ASSET_DUPLICATE`를 `errorCodeMessages`에
  추가한다. 그 외에는 기존 fallback(서버 detail) 규칙을 따른다.

## Components

- `src/features/watchlist/dto.ts` — `CreateAssetBody`를 `{symbol, market}`로 축소,
  `AssetLookupItemDto`/`AssetLookupResponseDto` 추가
- `src/features/watchlist/queries.ts` — `useAssetLookup(query, market)` 추가,
  `useCreateAsset` body 변경, `useAddAssetToFirstWatchlist`에 자동 생성 보강
- `src/features/watchlist/AddWatchlistAssetModal.tsx` — 전면 재구성
- `src/shared/api/errorCodes.ts` — 코드 2건 추가

## States

- 입력 전: 안내 문구
- 조회 중: 로딩 표시
- 결과 있음: 드롭다운 (symbol·name·market·sector, registered 뱃지)
- 결과 없음: "해당 시장에서 종목을 찾지 못했습니다" 안내 (등록 유도 없음)
- 선택됨: 두 필드 채움 + 추가 버튼 활성화
- 추가 중 / 실패(모달 내 메시지) / 성공(모달 닫힘 + `['watchlist']` 무효화)

## Out of Scope

- 추천 섹션(#109 산출물) 변경 — 훅 보강의 간접 수혜만
- BE 변경
- 라우팅·디자인 시스템 변경
