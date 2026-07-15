# Codex Handoff Task

## Source Issue

이슈 #215 — 가격 차트 기간 프리셋 확장 (1W·5Y). 이슈 본문을 먼저
읽는다. BE 계약은 JongEunLee310/project_stock#319 (range=1W →
interval 30m·ISO datetime date, range=5Y → interval 1wk·캘린더 날짜
date)로 확정되어 병렬 진행한다.

## Task Summary

리서치 가격 차트의 기간 프리셋에 `1W`·`5Y`를 추가한다. 버튼 순서는
1D · 1W · 1M · 3M · 6M · 1Y · 5Y.

## Goal

- 1W·5Y 프리셋으로 가격 시계열이 조회·렌더된다.
- 벤치마크 비교는 1W·5Y에서 기존 1D와 동일하게 비활성 처리된다
  (토글 비활성·"비교할 수 없습니다" 문구 재사용).
- 1W 툴팁 라벨은 intraday 포맷(YYYY-MM-DD HH:mm, KST), 5Y는 일봉과
  동일한 날짜 라벨.
- 이벤트 마커·MA20·거래량 서브차트가 신규 range에서 기존 규칙대로
  동작한다.

## Implementation Scope

- `src/features/research/queries.ts` — `PriceRange`에 `1W`·`5Y` 추가,
  `BenchmarkRange`는 벤치마크 미지원 range(1D·1W·5Y)를 제외하도록
  정리.
- `src/pages/ui/ResearchPage.tsx` — `priceRanges` 순서 반영, 벤치마크
  비활성 분기(현재 `range === '1D'` 비교)를 미지원 range 집합 기반으로
  일반화.
- 테스트 — 1W·5Y 프리셋 렌더·쿼리 파라미터, 벤치마크 비활성, 1W
  툴팁 intraday 포맷 케이스.

## Out of Scope

- BE 수정 (별도 repo)
- 차트 시각 디자인 변경
- 벤치마크 비교 계약의 range 확장

## Protected Files

없음.

## Verification

- `pnpm run format:check`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm run test`

## Constraints

- 현재 브랜치(`feat/215-range-presets`)에서 그대로 작업한다. 새
  브랜치 생성·checkout 금지.
- 커밋은 한국어 `type: 본문` 형식으로 작성한다.
- 이 태스크 문서와 구현이 같은 PR에 함께 실린다.
