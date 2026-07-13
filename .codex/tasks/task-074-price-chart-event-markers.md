# Codex Handoff Task

## Source

이슈 #163 — 가격 차트 이벤트 마커. 설계:
`docs/designs/163-price-chart-event-markers.md` (먼저 전체를 읽는다).

## Task Summary

BE 과거 이벤트 이력 계약(`GET /assets/{asset_id}/events?range=`)을
소비해 리서치 상세 가격 차트에 실적 발표 마커를 표시한다. 설계 문서
1~5절을 그대로 따른다:

1. `AssetEventDto`·`AssetEventHistoryDto` (eps 3종은
   `string | null` — BE Decimal 문자열 직렬화, `parseDecimal` 필수).
2. `useAssetEvents(assetId, range, enabled)` 쿼리 훅 (기존 훅 관례).
3. adapters 순수 함수 2개 — `adaptAssetEvents`(라벨 구성, null 조각
   생략)와 `snapEventsToChartPoints`(event_date 이하 최근접 거래일
   스냅, 범위 이전 제외, x는 포인트 `date` 문자열 그대로).
4. `LineChart`에 additive `markers` prop — `ReferenceDot` custom
   shape(`<circle>` + `<title>` + `tabIndex={0}` + `aria-label` +
   `role="img"`). 기존 사용처 영향 없음.
5. `ResearchPage` 가격 모드에만 markers 전달 (벤치마크 비교 모드
   제외), 범례에 `실적 발표` 항목 추가, 쿼리 실패·빈 events는 마커
   없이 차트 정상 렌더.

## Test

설계 문서 Test 절을 그대로 따른다. 픽스처는 BE 실계약 형태(eps 3종
decimal 문자열, `event_type: "EARNINGS"`, event_date 오름차순).
수치 단언은 픽스처 출처 주석, id 리터럴 단언 금지.

## Out of Scope

- 촉매(미래) 이벤트, 공시 타입, 벤치마크 모드 마커, 마커 클릭
  상호작용.
- BE 계약 형태 가정 변경, 다른 페이지·차트 사용처, `BarChart.tsx`.

## Rules

- 현재 브랜치 `feat/163-event-markers`에서 그대로 작업한다.
  새 브랜치를 만들지 않는다.
- 커밋은 1개로 만든다. push는 하지 않는다.
- 커밋 메시지는 한국어 `type: 본문` 형식으로 작성한다.

## Verification

- `corepack pnpm format:check`
- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `corepack pnpm test`
