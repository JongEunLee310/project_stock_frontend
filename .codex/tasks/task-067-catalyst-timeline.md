# Codex Handoff Task

## Source Issue

#147 — 촉매 타임라인 섹션 — 예정 이벤트 시간순 표시
`gh issue view 147 --repo JongEunLee310/project_stock_frontend`

설계 문서: `docs/designs/147-catalyst-timeline.md` (반드시 먼저 읽는다)

## Task Summary

리서치 상세의 촉매 타임라인 자리 카드(EmptyState)를 BE
`GET /assets/{asset_id}/catalysts` 계약에 연결해 예정 이벤트 타임라인을
렌더한다. 카드 독립 쿼리 패턴(#146의 `useNewsDisclosure`와 동일)을 쓴다.

## Goal

작업 완료 시 다음 상태여야 한다.

- 촉매 타임라인 카드가 이벤트 행(날짜 도트·수직선 + dateLabel + title +
  type 배지 + 예상 배지)을 시간순으로 렌더한다.
- `useCatalystTimeline(assetId)` 독립 쿼리 — 실패해도 페이지 나머지가
  렌더되고, 카드 내 ErrorState(재시도)·빈 상태("예정된 이벤트가
  없습니다.")가 있다.
- event_type 10값의 한국어 라벨 매핑과 알 수 없는 값 "기타" 폴백이
  동작한다. `is_estimated=true`만 "예상" 배지를 단다.
- 리스트 key는 `{event_date}:{event_type}:{index}` 조합이다 (내용 문자열
  단독 key 금지).
- dateLabel은 `MM.DD`, 연도가 오늘과 다르면 `YYYY.MM.DD`.
- `pnpm format:check`, `pnpm typecheck`, `pnpm lint`, `pnpm test`가 전부
  통과한다.

## Background

- BE 실응답 예시 (mock 템플릿 구조):

```json
{
  "asset_id": 7,
  "events": [
    { "event_date": "2026-07-23", "title": "주요 계약의 갱신 조건과 매출 영향을 확인하세요.", "event_type": "CONTRACT", "is_estimated": true },
    { "event_date": "2026-08-09", "title": "락업 해제 이후 잠재 매도 물량을 점검하세요.", "event_type": "LOCKUP", "is_estimated": false }
  ]
}
```

- 카드 독립 쿼리·오류·빈 상태 패턴은 #146의 뉴스·공시 카드 구현을 참고해
  일관되게 만든다.

현재 브랜치 `feat/147-catalyst-timeline`에서 그대로 작업한다. 새 브랜치를
만들지 않는다.

## Implementation Scope

**갱신**
- `src/features/research/dto.ts` — `CatalystTimelineDto`.
- `src/features/research/adapters.ts` — `CatalystEventItem`·
  `adaptCatalystTimeline`·type 라벨 상수.
- `src/features/research/queries.ts` — `useCatalystTimeline`.
- `src/pages/ui/ResearchPage.tsx` — 자리 카드 교체 (레이아웃·다른 카드
  불변).
- 테스트·msw: `adapters.test.ts`, `queries.test.tsx`,
  `ResearchPage.test.tsx` (+ mock 갱신이 필요한 다른 페이지 테스트).

**변경 불가**
- `src/shared/api/`, 다른 페이지, 라우팅.

## Test Requirements

- adapters: 라벨 매핑·"기타" 폴백·dateLabel 연도 분기·key 형식.
- queries: 경로·enabled 조건.
- ResearchPage: 타임라인 렌더·예상 배지 유무·카드 오류/빈 상태 격리.
- 픽스처는 위 실응답 형태.

## Out of Scope

- 전체 타임라인 보기(페이징), 차트 이벤트 마커(#148), BE 변경.

## Rules

- 커밋은 1개로 만든다. push는 하지 않는다.
- 커밋 메시지는 한국어 `type: 본문` 형식으로 작성한다.
- 필요하지 않은 추상화를 추가하지 않는다.

## Verification

- `pnpm format:check`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
