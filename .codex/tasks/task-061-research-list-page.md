# Codex Handoff Task

## Source Issue

#141 — 리서치 목록 화면 신설 — /research 리서치 큐 및 라우팅 재구성 (1단계)
`gh issue view 141 --repo JongEunLee310/project_stock_frontend`

설계 문서: `docs/designs/141-research-list-page.md` (반드시 먼저 읽는다)

## Task Summary

`/research`에 리서치 목록 화면을 신설하고 사이드바 리서치 메뉴를 목록으로
연결한다. 상세는 `/research/:symbol`로 유지한다. 기존 BE 계약만 사용한다.

## Goal

작업 완료 시 다음 상태여야 한다.

- 사이드바 리서치 메뉴 클릭 시 `/research` 목록이 렌더된다.
- 목록 테이블: 종목(심볼·회사명) · 시장 · 섹터 · AI 판단 · 마지막 갱신.
  행의 종목 클릭 시 `/research/{symbol}` 상세로 이동한다.
- 종목명·티커 검색(클라이언트 필터)이 동작한다.
- 로딩 스켈레톤 / 오류 ErrorState(재시도) / 자산 0건 EmptyState가 있다.
- 기존 상세 딥링크(`/research/NVDA`)와 워치리스트·시그널의 상세 직행
  링크가 깨지지 않는다 (`appRoutePaths.research` 소비처 전수 확인).
- summary 조회가 404 등으로 실패한 자산도 행이 유지되고 AI 판단·마지막
  갱신만 비워진다.
- `pnpm format:check`, `pnpm typecheck`, `pnpm lint`, `pnpm test`가 전부
  통과한다.

## Background

- `GET /assets` 응답: `{ data: AssetResponse[], meta: { page, size,
total } }`, 필드는 `id, symbol, name, market, sector, is_active,
created_at`.
- `GET /assets/{id}/research-summary` 응답 data: `stance`,
  `stance_confidence`, `headline`, `body`, `key_risks`, `created_at`.
  stance 라벨 변환은 기존 `researchStanceLabels`(`shared/lib/format`)를
  재사용한다.
- 목록 계약이 없으므로 자산별 summary 병렬 조회(N+1)로 합성한다. BE 큐
  계약(project_stock #266) 머지 후 #143에서 교체될 임시 구조다 —
  불필요한 추상화 없이 단순하게 구성한다.

현재 브랜치 `feat/141-research-list-page`에서 그대로 작업한다. 새
브랜치를 만들지 않는다.

## Implementation Scope

**신설**

- `src/pages/ui/ResearchListPage.tsx`, `src/pages/ui/ResearchListPage.test.tsx`

**갱신**

- `src/shared/config/navigation.ts` — `research: '/research'`,
  `researchDetail: '/research/:symbol'` 신설, research 항목 href 변경.
- `src/app/router.tsx` — 목록·상세 라우트 분리.
- `appRoutePaths.research`를 상세 링크로 쓰던 소비처 전부 —
  `researchDetail` 기반으로 치환 (grep으로 전수 확인).
- `src/features/research/queries.ts` — `useResearchList` 신설.
- `src/features/research/adapters.ts` — `ResearchListRow`·
  `adaptResearchListRow` 신설.
- 관련 테스트·msw 픽스처.

**변경 불가**

- `src/pages/ui/ResearchPage.tsx` (상세 화면)
- `src/shared/api/`, `src/features/watchlist/`

## Test Requirements

- navigation 테스트: research href `/research`, matchPrefix 동작.
- queries: assets 2건 + summary 1건 성공·1건 오류 조합에서 두 행 모두
  유지되고 실패 행의 stance가 null. 픽스처는 BE 실응답 envelope 형태.
- ResearchListPage: 테이블 렌더, 검색 필터, 행 링크 경로, 빈 상태·오류
  상태.
- 기존 ResearchPage·워치리스트·시그널 테스트가 라우팅 변경 후에도
  통과한다.

## Out of Scope

- 요약 카운트·필터 칩·리서치 상태·분석 완성도 (#143).
- deep-link 쿼리 (#144).
- BE 계약 변경.

## Rules

- 커밋은 1개로 만든다. push는 하지 않는다.
- 필요하지 않은 추상화를 추가하지 않는다.
- 커밋 메시지는 한국어로 작성한다.

## Verification

- `pnpm format:check`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
