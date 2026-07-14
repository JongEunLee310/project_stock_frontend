# Codex Handoff Task

## Source Issue

이슈 #197 · #207 — 리서치 상세 후속 정리 두 건. 각 이슈 본문을 먼저
읽는다.

## Task Summary

1. **#197 — counter_view fallback 제거.** BE가 구조화된
   `counter_points`를 제공하므로(BE #298, PR #299 머지됨) 반대 관점
   카드의 구계약 `counter_view` 불릿 fallback 경로를 걷어낸다.
2. **#207 — 커버리지 축 라벨 overflow 방어.** `CoverageAxisRow`의
   `axisLabel` span에 `truncate` + `title` 속성을 적용한다.

## Goal

- 반대 관점 카드가 `counter_points`만 소비하고, 비어 있으면 기존
  empty 상태 표시를 유지한다.
- `counter_view` 관련 dto 필드·어댑터 매핑·뷰모델 필드·fallback
  렌더링 경로가 모두 제거된다.
- 커버리지 축 라벨이 길어도 배지 열을 침범하지 않고, `title`로 전체
  라벨을 확인할 수 있다.

## Implementation Scope

- `src/features/research/dto.ts` — `counter_view` 필드 제거.
- `src/features/research/adapters.ts` — `counterView` 매핑 제거.
- `src/pages/ui/ResearchPage.tsx`
  - 반대 관점 카드의 `fallbackItems` prop과 fallback 렌더링 분기 제거
    (약 1177–1231행·1877행).
  - `CoverageAxisRow`의 `axisLabel`에 `truncate`+`title` 적용
    (RiskPanel 제목 열과 같은 min-width 보호 관례를 따른다).
- 관련 테스트 — fallback 경로 테스트 제거·갱신, 긴 축 라벨이
  truncate 클래스로 렌더되는 케이스 추가.

## Out of Scope

- BE `counter_view` 필드 제거 (BE #300에서 별도 처리 — FE가 먼저
  전환되어야 한다)
- counter_points 표시 디자인 변경
- 다른 카드·페이지의 스타일 변경

## Protected Files

없음.

## Verification

- `pnpm run format:check`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm run test`

## Constraints

- 현재 브랜치(`chore/197-207-research-followups`)에서 그대로
  작업한다. 새 브랜치 생성·checkout 금지.
- 커밋은 한국어 `type: 본문` 형식으로 작성한다.
- 이 태스크 문서와 구현이 같은 PR에 함께 실린다.
