# Codex Handoff Task

## Source

이슈 #149 — 밸류에이션·실적 탭. 설계:
`docs/designs/149-valuation-earnings-tabs.md` (먼저 전체를 읽는다).

## Task Summary

BE 계약 두 개(`GET /assets/{asset_id}/valuation-metrics`,
`GET /assets/{asset_id}/earnings-summary`)를 리서치 상세 차트 카드의
disabled 탭 두 개에 연결한다.

- DTO(`ValuationMetricsDto`·`EarningsSummaryDto`) ·
  adapter(`ValuationView`·`EarningsView`, 라벨 매핑·폴백·
  `isHighlighted` 파생) · query(`useValuationMetrics`·
  `useEarningsSummary`, 탭 활성 시에만 조회하는 enabled 게이트).
- `PriceChartCard` 탭 상태 도입 (`price | valuation | earnings`),
  disabled·"준비 중" 제거. **모든 탭에 id·aria-controls, 패널에
  aria-labelledby 연결 (PR #154 S1 요건).**
- 밸류에이션 패널: 지표 표 7행 고정 순서, 강조 지표 표시, 백분위
  "하위/상위 nn%" 텍스트, null이면 "-", `종목 성격: {profileLabel}`
  캡션.
- 실적 패널: 분기 표 4행 오름차순(매출 YoY·영업이익·마진·EPS 컨센서스
  상회/하회 색상), 가이던스 블록, 사업부문 목록. 로딩 스켈레톤·오류
  ErrorState(재시도) 패널 격리.

세부 필드·라벨·상태 규칙은 설계 문서의 Adapters·Page·Test 절을 그대로
따른다. 픽스처는 BE 실응답 형태로 만든다 — DEFICIT null 케이스와
surprise 양·음 혼재를 포함하고, enum 값은 영문을 유지한다 (PR #159 B1
선례).

## Out of Scope

- 벤치마크 오버레이·거래량·이동평균·이벤트 마커(#148), 가격 탭 내부
  변경, BE 변경.

## Rules

- 현재 브랜치 `feat/149-valuation-earnings-tabs`에서 그대로 작업한다.
  새 브랜치를 만들지 않는다.
- 커밋은 1개로 만든다. push는 하지 않는다.
- 커밋 메시지는 한국어 `type: 본문` 형식으로 작성한다.

## Verification

- `pnpm format:check`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
