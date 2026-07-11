# Codex Handoff Task

## Source

이슈 #148 — 가격 차트 고도화. 설계:
`docs/designs/148-price-chart-enhancement.md` (먼저 전체를 읽는다).

## Task Summary

리서치 상세 가격 탭에 세 가지를 추가한다. BE 변경은 없다.

1. **거래량 서브차트 + MA20 + 실제 date x축** — `PriceBarDto`에
   `date`·`volume` additive 추가(BE 실계약 필드), adapter에서 MA20
   파생(순수 함수 분리, 20개 미만 구간 null), 메인 라인차트 아래
   BarChart 거래량(전부 null이면 생략), Tooltip 활성화.
2. **LineChart 다중 시리즈 지원** — `series?: Array<{ dataKey, color,
   strokeWidth?, strokeDasharray? }>` prop을 additive로 추가. 기존
   단일 시리즈 API 불변 (다른 소비처 수정 없음). 범례는 페이지 쪽
   렌더.
3. **벤치마크 비교 모드** — `GET
   /assets/{asset_id}/benchmark-comparison?range=` (1M/3M/6M/1Y) 소비:
   DTO·adapter·`useBenchmarkComparison(assetId, range, enabled)` (비교
   ON일 때만 조회). "벤치마크 비교" 토글(`aria-pressed`), 1D에서
   disabled·ON이면 해제, 비교 모드는 세 시리즈(ASSET·INDEX·SECTOR_ETF)
   수익률 라인 + label 범례, 거래량·MA 미표시, 오류 격리(ErrorState
   재시도, 가격 모드 복귀 정상).

세부 규칙(모드별 표시·상태·캡션)은 설계 문서의 Page 절을 그대로
따른다. 픽스처는 BE 실응답 형태 — enum·label 영문 유지(PR #159 B1
선례), 벤치마크 첫 포인트 `return_percent` 0.

## Out of Scope

- 이벤트 마커, 기간 확장, 다중 이동평균, 캔들 차트, BE 변경,
  밸류에이션·실적 탭 변경.

## Rules

- 현재 브랜치 `feat/148-price-chart-enhancement`에서 그대로 작업한다.
  새 브랜치를 만들지 않는다.
- 커밋은 1개로 만든다. push는 하지 않는다.
- 커밋 메시지는 한국어 `type: 본문` 형식으로 작성한다.

## Verification

- `pnpm format:check`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
