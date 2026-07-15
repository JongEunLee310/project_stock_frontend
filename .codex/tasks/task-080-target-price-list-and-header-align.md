# Codex Handoff Task

## Source Issue

이슈 #206 (표기 개편 — 이슈의 2026-07-14 코멘트가 확정 스펙이다) ·
이슈 #214 (헤더 세로 정렬). 두 이슈 본문과 #206의 최신 코멘트를 먼저
읽는다.

## Task Summary

열려 있는 PR #213 브랜치에서 두 가지를 처리한다.

1. **목표주가 표기 개편.** 헤더의 '평균 목표주가' 한 줄 병기(현재
   `formatTargetPrice`)를 걷어내고, 라벨을 '목표주가'로 바꾼 뒤 값
   영역에 평균/최저/최고를 목록으로 나누어 표시한다. 최저·최고
   행에는 출처로 '애널리스트 N명 컨센서스'(`targetAnalystCount`
   기반)를 표기한다.
2. **종목명·로고 블록 세로 가운데 정렬.** HeaderCard 첫 열의
   로고·종목명 flex 컨테이너(`items-start`)를 상하 가운데 정렬로
   조정한다.

## Goal

- '목표주가' 항목 아래에 평균(상승 여력 포함)·최저·최고가 목록으로
  표시된다. 표기 예:
  - 평균 $1,145.32 (+11.8%)
  - 최저 $900.00 · 최고 $1,300.00 — 각 행 또는 공통 보조 행에
    '애널리스트 42명 컨센서스' 출처 표기 (레이아웃은 기존 타일
    밀도에 맞게 구현에서 결정하되, 출처가 최저·최고에 대응함이
    드러나야 한다)
- 최저·최고가 없으면(부분 null 포함) 평균 한 줄만 표시하고 출처를
  생략한다. `targetAnalystCount`가 null이면 출처 행만 생략한다.
- 종목명·로고 블록이 헤더 첫 열 안에서 상하 가운데 정렬된다
  (좌우 배치·간격 유지).
- 기존 다른 타일(시가총액·섹터 등)의 표시는 회귀가 없다.

## Implementation Scope

- `src/pages/ui/ResearchPage.tsx`
  - `formatTargetPrice` 제거 또는 목록형 렌더로 교체. 타일 렌더러가
    문자열 value 전제라면 목표주가 타일만 커스텀 렌더를 허용하는
    최소 변경을 택한다 (과한 추상화 금지).
  - HeaderCard 첫 열 컨테이너 세로 정렬 조정 (#214).
- 테스트 — 기존 목표주가 표기 테스트를 새 목록형으로 갱신:
  평균·최저·최고·출처 표시, 부분 null 폴백(PLTR 픽스처), 전체 null
  폴백, analyst_count null 시 출처 생략.

## Out of Scope

- BE 계약 변경 (증권사별 출처는 별도 이슈로 확장 예정)
- 다른 헤더 타일·페이지 변경

## Protected Files

없음.

## Verification

- `pnpm run format:check`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm run test`

## Constraints

- 현재 브랜치(`feat/206-target-price-range`)에서 그대로 작업한다.
  새 브랜치 생성·checkout 금지.
- 커밋은 한국어 `type: 본문` 형식으로 작성한다.
