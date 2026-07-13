# Design — Issue 147: 촉매 타임라인 섹션 — 예정 이벤트 시간순 표시

BE #269(project_stock PR #274, dev 머지됨)의
`GET /assets/{asset_id}/catalysts` 계약을 리서치 상세의 촉매 타임라인 자리
카드(#142에서 만든 EmptyState)에 연결한다. 목적은 "다음 판단 시점이
언제인지"를 보여주는 것이다.

## Background — BE 계약

응답: `{ asset_id, events: CatalystEvent[] }`

- 이벤트 필드: `event_date`(date, 오름차순 정렬됨) · `title`(한국어) ·
  `event_type`(EARNINGS / PRODUCT / SHAREHOLDER_MEETING / DIVIDEND /
  REGULATORY / CONTRACT / LOCKUP / CONFERENCE / ECONOMIC / OTHER) ·
  `is_estimated`(bool).
- 오늘(UTC) 이후 이벤트만, `limit` 쿼리 기본 10 (`ge=1, le=100`).
- 인증 필수, 자산 미존재 404.

## DTO — `src/features/research/dto.ts`

- `CatalystTimelineDto` — 위 응답 형태 그대로.

## Adapters — `src/features/research/adapters.ts`

- `CatalystEventItem` — `{ key: string, dateLabel: string,
  title: string, typeLabel: string, isEstimated: boolean }`.
  - `key`는 `{event_date}:{event_type}:{index}` 조합 (내용 문자열 단독 key
    금지 관례).
  - `dateLabel`은 `MM.DD` 형식 (연도가 오늘과 다르면 `YYYY.MM.DD`).
- `adaptCatalystTimeline(dto): CatalystEventItem[]` — 순서는 응답 순서
  유지 (BE가 오름차순 보장).
- type 라벨 매핑 (신규 상수): EARNINGS 실적 / PRODUCT 제품 /
  SHAREHOLDER_MEETING 주주총회 / DIVIDEND 배당 / REGULATORY 규제 /
  CONTRACT 계약 / LOCKUP 락업 해제 / CONFERENCE 콘퍼런스 /
  ECONOMIC 경제지표 / OTHER 기타. 알 수 없는 값은 "기타"로 폴백.

## Queries — `src/features/research/queries.ts`

- `useCatalystTimeline(assetId: number | undefined):
  UseQueryResult<CatalystEventItem[]>` — `enabled: assetId != null`,
  queryKey `['research', 'catalysts', assetId]`. `useNewsDisclosure`와
  같은 카드 독립 조회 패턴 (실패가 페이지를 막지 않음).

## Page — `src/pages/ui/ResearchPage.tsx`

- 촉매 타임라인 자리 카드(하단 열)를 타임라인 렌더로 교체한다.
  - 항목 행: 날짜 도트·수직선(시안 참조, 기존 토큰 색상) + `dateLabel` +
    `title` + type 배지 + `is_estimated`면 "예상" 배지 (확정은 배지 생략).
  - 상태: 로딩 스켈레톤, 오류 시 카드 내 ErrorState(재시도), 빈 배열이면
    EmptyState("예정된 이벤트가 없습니다.").
  - 카드 제목 "촉매 타임라인"과 하단 열 배치는 유지한다.

## Test / msw

- adapters: 라벨 매핑·알 수 없는 event_type 폴백·dateLabel 연도 분기·key
  유일성.
- queries: 훅 경로·enabled 조건.
- ResearchPage: 타임라인 렌더(날짜·제목·배지·예상 표시), 카드 오류·빈
  상태 격리(페이지 나머지 렌더 유지).
- 픽스처는 BE 실응답 형태 (mock 템플릿 구조).

## Out of Scope

- "전체 타임라인 보기" 확장 (limit 초과 페이징 — 후속).
- 이벤트 마커의 차트 연동 (#148).
- BE 변경.

## Open Questions

- 없음.
