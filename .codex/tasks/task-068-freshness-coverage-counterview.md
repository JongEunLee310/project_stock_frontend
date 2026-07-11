# Codex Handoff Task

## Source

이슈 #150 — 데이터 신선도·분석 커버리지·반대 관점 표시. 설계:
`docs/designs/150-freshness-coverage-counterview.md` (먼저 전체를 읽는다).

## Task Summary

BE 계약 두 가지를 리서치 상세에 연결한다.

1. `GET /assets/{asset_id}/research-coverage` 신규 소비 — DTO
   (`ResearchCoverageDto`) · adapter(`CoverageAxisItem`,
   `adaptResearchCoverage`, axis 한국어 라벨 상수) ·
   query(`useResearchCoverage`, 카드 독립 조회 패턴) · 페이지 카드
   "데이터 커버리지" (aside, 핵심 리스크 카드 아래). 확보율 배지
   `{collected}/{전체} 확보`는 FE 파생.
2. `research-summary`의 `counter_view` additive 필드 —
   `ResearchSummaryDto`에 `counter_view?: string[] | null` 추가,
   `ResearchView.counterView: string[]`로 adapt, aside의 AI 브리핑 카드
   바로 아래 "반대 관점" 카드 렌더. 신규 요청 없음 (`useResearchView`가
   이미 research-summary를 조회).

aside 최종 순서: AI 브리핑 → 반대 관점 → 핵심 리스크 → 데이터 커버리지.

상태 처리·라벨 매핑·테스트 범위는 설계 문서의 Page·Test 절을 그대로
따른다. 픽스처는 BE 실응답 형태로 만든다 (NEWS·PRICE `COLLECTED` +
나머지 3축 `NOT_COLLECTED` 혼합 케이스 포함, `last_updated_at`은 UTC
ISO 문자열).

## Out of Scope

- 벤치마크 시계열·차트 고도화(#148), 밸류에이션·실적 탭(#149).
- BE 변경, 다른 페이지·도메인.

## Rules

- 현재 브랜치 `feat/150-freshness-coverage-counterview`에서 그대로
  작업한다. 새 브랜치를 만들지 않는다.
- 커밋은 1개로 만든다. push는 하지 않는다.
- 커밋 메시지는 한국어 `type: 본문` 형식으로 작성한다.

## Verification

- `pnpm format:check`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
