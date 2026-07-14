# Codex Handoff Task

## Source Issue

이슈 #205 — 리서치 헤더 로고: 한국 종목 심볼 suffix 미적용으로 실제
로고가 표시되지 않음. 이슈 본문에 원인 분석이 있으므로 먼저 읽는다.

## Task Summary

`src/pages/ui/ResearchPage.tsx`의 헤더 로고가 parqet 로고 URL에 심볼
원문을 그대로 사용해, 한국 종목(6자리 심볼)은 404가 나고 이니셜
fallback으로 떨어진다. `src/shared/ui/StockLogo.tsx`의
`getLogoCandidates`(market 기반 `.KS`/`.KQ` suffix + 6자리 심볼
KS→KQ 순차 fallback) 로직을 재사용해 실제 로고가 표시되게 한다.

## Goal

- KOSPI/KOSDAQ 종목 리서치 헤더에 실제 로고가 표시된다.
- 미국 종목 로고 표시는 회귀가 없다.
- 모든 후보 URL이 실패한 경우에만 이니셜 fallback을 유지한다.

## Implementation Scope

- `src/shared/ui/StockLogo.tsx` — `getLogoCandidates`를 export하거나,
  `StockLogo`가 크기·모양 변형(className으로 해결 가능하면 그대로)을
  수용하도록 정리한다. 현재 헤더는 `h-14 w-14 rounded-control` +
  `object-contain p-1.5` 스타일이다. 중복 구현을 남기지 말 것.
- `src/pages/ui/ResearchPage.tsx` — 헤더 로고(약 950–967행)를 후보
  로직 기반으로 교체한다. market 값은 리서치 데이터의 market
  필드를 사용한다.
- 테스트 — `StockLogo.test.tsx` 또는 `ResearchPage.test.tsx`에
  한국 종목 심볼이 `.KS` 후보 URL로 렌더되는 케이스를 추가한다.

## Out of Scope

- WatchlistPage 등 다른 화면의 로고 동작 변경 (StockLogo 공용 로직
  정리에 따른 기계적 영향은 허용)
- 로고 제공자(parqet) 교체·프록시 도입
- BE 수정

## Protected Files

없음.

## Verification

- `pnpm run format:check`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm run test`

## Constraints

- 현재 브랜치(`fix/205-research-header-logo`)에서 그대로 작업한다.
  새 브랜치 생성·checkout 금지.
- 커밋은 한국어 `type: 본문` 형식으로 작성한다.
- 이 태스크 문서와 구현이 같은 PR에 함께 실린다.
