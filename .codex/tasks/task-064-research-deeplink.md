# Codex Handoff Task

## Source Issue

#144 — 리서치 상세 deep-link 쿼리 — 시그널 근거 보기·대시보드 우선 확인 큐 연결
`gh issue view 144 --repo JongEunLee310/project_stock_frontend`

설계 문서: `docs/designs/144-research-deeplink.md` (반드시 먼저 읽는다)

## Task Summary

`/research/:symbol?section={briefing|risks|news|checklist}` 쿼리를
지원한다. 지정 섹션 카드로 스크롤·포커스하고, 시그널 "근거 보기" 버튼과
대시보드 우선 확인 큐 링크에 각각 `section=briefing`·`section=risks`를
부착한다. 이슈 본문의 `?tab=signals`는 설계 문서 결정에 따라 `section`으로
통일됐다 (`tab`은 #149 범위).

## Goal

작업 완료 시 다음 상태여야 한다.

- 리서치 상세 4개 카드(AI 브리핑·핵심 리스크·뉴스 및 공시 요약·의사결정
  체크리스트)에 앵커 id(`research-section-*`)와 `tabIndex={-1}`가 있다.
- `section` 값이 지원 값이면 research 데이터 로드 완료 후 1회 해당 카드로
  `scrollIntoView({ block: 'start' })`·`focus()`가 실행된다. 부재·지원 외
  값이면 무동작. 심볼이 바뀌면 다시 1회 실행된다.
- 시그널 카드 "근거 보기" 버튼이 `?section=briefing`을 붙여 이동한다.
  그 외 시그널 심볼 링크는 변경하지 않는다.
- 대시보드 우선 확인 큐 행의 리서치 링크가 `?section=risks`를 붙인다.
  그 외 대시보드 링크는 변경하지 않는다.
- `pnpm format:check`, `pnpm typecheck`, `pnpm lint`, `pnpm test`가 전부
  통과한다.

## Background

- 진입 지점: `src/pages/ui/SignalsPage.tsx`의 "근거 보기" Button(약 467행,
  `navigate(getResearchPath(signal.symbol))`),
  `src/pages/ui/DashboardPage.tsx`의 우선 확인 큐 행 Link(약 649행,
  `getResearchPath(item.symbol)`).
- 경로 조립은 각 페이지의 기존 `getResearchPath` 헬퍼에 optional section
  인자를 추가한다. 신규 공용 유틸을 만들지 않는다.
- jsdom에는 `scrollIntoView`가 없으므로 테스트에서 mock한다.

현재 브랜치 `feat/144-research-deeplink`에서 그대로 작업한다. 새 브랜치를
만들지 않는다.

## Implementation Scope

**갱신**
- `src/pages/ui/ResearchPage.tsx` — 앵커 id·section 처리 effect.
- `src/pages/ui/SignalsPage.tsx` — "근거 보기" 경로에 section 부착.
- `src/pages/ui/DashboardPage.tsx` — 우선 확인 큐 링크에 section 부착.
- 테스트: `ResearchPage.test.tsx`, `SignalsPage.test.tsx`,
  `DashboardPage.test.tsx` — 아래 Test Requirements.

**변경 불가**
- `src/features/`, `src/shared/` 전체
- 라우트 정의(`router.tsx`·`navigation.ts`)

## Test Requirements

- ResearchPage: `section=briefing` 진입 시 해당 카드 scrollIntoView·focus
  호출, 지원 외 값(`section=unknown`)·부재 시 미호출, 심볼 전환 시 재실행.
- SignalsPage: "근거 보기" 클릭 시 navigate 경로가
  `/research/{symbol}?section=briefing`.
- DashboardPage: 우선 확인 큐 링크 href가 `?section=risks`를 포함.

## Out of Scope

- `tab` 파라미터(#149), 촉매·메모 앵커, 목록 화면, BE 변경.

## Rules

- 커밋은 1개로 만든다. push는 하지 않는다.
- 커밋 메시지는 한국어 `type: 본문` 형식으로 작성한다.
- 필요하지 않은 추상화를 추가하지 않는다.

## Verification

- `pnpm format:check`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
