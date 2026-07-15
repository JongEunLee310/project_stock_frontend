# Codex Handoff Task

## Source Issue

이슈 #217의 2026-07-15 정책 변경 코멘트 (gh issue view 217 --comments
로 최신 코멘트를 먼저 읽는다). 열려 있는 PR #218 브랜치에서 계속한다.

## Task Summary

목표주가 최저·최고 표기를 "컨센서스 값 + 정확 일치 귀속"에서
"최근 의견(limit 20) 기준 min/max + 해당 기관명 상시 표기"로
재정의한다. 평균(컨센서스) 행은 그대로 둔다.

## Goal

- 의견 목록에 목표가가 하나 이상 있으면: 최저·최고 행의 값이 최근
  의견의 min/max로 표시되고 각 행 옆에 해당 기관명이 붙는다
  (동률이면 가장 최근 발표 기관 — 기존 방어적 재정렬 유지).
- 의견이 없거나 목표가가 전무하면(국내 종목·조회 실패·로딩 포함):
  기존 컨센서스 최저·최고 + '애널리스트 N명 컨센서스' 폴백을 그대로
  유지한다.
- 평균 행(컨센서스 평균 + 상승 여력)은 변경 없음.
- 헤더 렌더는 의견 조회에 블로킹되지 않는다 (기존 유지).

## Implementation Scope

- `src/features/research/adapters.ts` —
  `deriveTargetPriceAttribution`(정확 일치)을 최근 의견 기준 범위
  파생(값+기관명 쌍)으로 교체. 순수 함수 유지.
- `src/pages/ui/ResearchPage.tsx` — 최저·최고 행이 파생 범위 값을
  우선 사용하고, 부재 시 컨센서스 값+폴백 표기.
- 테스트 — 재정의 표기(값·기관명), 동률 최근 우선, 폴백 3종(빈
  목록·전부 null·컨센서스 부재), 기존 목록 구조(#206) 회귀 없음.

## Out of Scope

- BE 수정, limit 변경 (기본 20 유지)
- 평균 행·목표주가 목록 구조 변경

## Protected Files

없음.

## Verification

- `pnpm run format:check`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm run test`

## Constraints

- 현재 브랜치(`feat/217-target-price-attribution`)에서 그대로
  작업한다. 새 브랜치 생성·checkout 금지.
- 커밋은 한국어 `type: 본문` 형식으로 작성한다.
