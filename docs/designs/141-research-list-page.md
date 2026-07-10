# Design — Issue 141: 리서치 목록 화면 신설 (1단계: 기존 계약)

리서치 재설계 로드맵(#152)의 1단계. `/research`에 리서치 목록을 신설하고
사이드바 리서치 메뉴를 목록으로 연결한다. 상세(`/research/:symbol`)는
기존대로 유지하며 워치리스트·시그널의 상세 직행 링크도 바뀌지 않는다.
BE 큐 계약(project_stock #266)이 오기 전이므로 기존 계약만 사용한다.

## Background — 사용 계약

- `GET /assets?page=&size=` — 등록 자산 목록 (`AssetResponse[]`, meta에
  page/size/total). symbol 필터 파라미터가 있으나 접두 일치가 아니므로
  1단계 검색은 클라이언트 필터로 한다.
- `GET /assets/{id}/research-summary` — 자산별 AI 판단
  (`stance`, `created_at`). 목록 계약이 없어 자산별 병렬 조회(N+1)로
  구성하고, BE #266 머지 후 #143에서 대체한다. 자산 수가 등록 종목
  수준(수십 개)이라 허용한다.

## Routing — `src/shared/config/navigation.ts`, `src/app/router.tsx`

- `appRoutePaths.research`를 `'/research'`로 바꾸고
  `researchDetail: '/research/:symbol'`을 신설한다.
- router: `/research` → `ResearchListPage`(신설), `/research/:symbol` →
  기존 `ResearchPage`.
- navigation의 research 항목: `href: '/research'`,
  `path: appRoutePaths.research`, `matchPrefix: '/research'` 유지.
- 기존에 `appRoutePaths.research`로 상세 링크를 만들던 소비처(워치리스트·
  시그널 등)는 `researchDetail` 기반 헬퍼로 치환한다. 전 소비처를
  grep으로 확인해 빠짐없이 옮긴다.

## Queries — `src/features/research/queries.ts`

- `useResearchList(): UseQueryResult<ResearchListRow[]>` — `/assets`
  조회 후 자산별 `research-summary`를 병렬 조회해 행으로 합성한다.
  summary 실패·미존재는 행 전체를 깨뜨리지 않고 해당 컬럼만 비운다.

## Adapters — `src/features/research/adapters.ts`

- `ResearchListRow` — `{ assetId, symbol, name, market, sector,
  stanceLabel: string | null, summaryUpdatedAt: string | null }`.
- `adaptResearchListRow(asset, summary | null): ResearchListRow`.

## Page — `src/pages/ui/ResearchListPage.tsx` (신설)

- 제목·설명 헤더, 검색 입력(종목명·티커 클라이언트 필터), 목록 테이블.
- 테이블 컬럼: 종목(심볼·회사명) · 시장 · 섹터 · AI 판단 · 마지막 갱신.
- 행 클릭(또는 종목 링크) 시 `/research/{symbol}` 이동.
- 상태: 로딩 스켈레톤, 오류 ErrorState(재시도), 자산 0건 EmptyState
  (종목 추가 유도 — 워치리스트 링크).
- 요약 카운트·필터 칩·리서치 상태·완성도는 2단계(#143) 범위로 이번에는
  넣지 않는다.

## Test

- navigation: research 항목 href가 `/research`, 상세 경로 매칭 회귀.
- queries: 목록 합성(assets 2건 + summary 1건 성공·1건 404 → 행 유지,
  stance null), msw 픽스처는 BE 실응답 형태.
- ResearchListPage: 렌더·검색 필터·행 링크·빈/오류 상태.
- 기존 ResearchPage(상세) 테스트가 라우팅 변경 후에도 통과.

## Out of Scope

- 요약 카운트·필터·리서치 상태·분석 완성도 (#143, BE #266 후).
- deep-link 쿼리 (#144).
- BE 계약 변경.

## Open Questions

- 없음. 1단계는 테이블형으로 확정한다 (카드형은 #143에서 재검토).
