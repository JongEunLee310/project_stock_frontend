# Codex Handoff Task

## Source Issue

#146 — 뉴스·공시 분리 표시 — 분류·중요도·영향 메타데이터와 원문 링크
`gh issue view 146 --repo JongEunLee310/project_stock_frontend`

설계 문서: `docs/designs/146-news-disclosure-split.md` (반드시 먼저 읽는다)

## Task Summary

리서치 상세의 "뉴스 및 공시 요약" 카드를 BE
`GET /assets/{asset_id}/news-disclosure` 계약에 연결한다. 뉴스/공시 탭
분리, 분류 배지·중요도·영향(sentiment tone)·원문 링크 표시. 임시 소스였던
reports는 이 카드에서 제거한다.

## Goal

작업 완료 시 다음 상태여야 한다.

- "뉴스 및 공시 요약" 카드에 뉴스(기본)/공시 탭이 있고, 항목이 분류 배지 ·
  제목(원문 새 탭 링크) · 출처·게시 시각 · summary · 영향/중요도 표기로
  렌더된다. 앵커 id `research-section-news`는 유지된다 (deep-link 회귀
  금지).
- 카드가 `useNewsDisclosure(assetId)` 독립 쿼리로 로드되어, 실패해도
  페이지의 나머지가 렌더된다 (카드 내 ErrorState + 재시도).
- `useResearchView`에서 reports 병렬 조회가 제거된다. 제거 전에
  `ResearchView.reports`·`adaptReport`·`ReportDto`의 다른 소비처가 없는지
  grep으로 확인하고, 없으면 함께 정리한다 (있으면 유지하고 카드만 교체 후
  커밋 본문에 사유 명시).
- sentiment·impact_level·category는 대문자 정규화 후 매핑하고 알 수 없는
  값은 null 처리한다 (BE에 소문자 `positive`/`medium` 데이터 존재).
- `pnpm format:check`, `pnpm typecheck`, `pnpm lint`, `pnpm test`가 전부
  통과한다.

## Background

- BE 실응답 형태·라벨 매핑 표는 설계 문서를 따른다.
- 탭 UI는 차트 카드의 기존 탭 구현 관례를 참고한다 (disabled 없음, 둘 다
  활성).
- 리스트 항목 key는 내용 문자열이 아닌 id(공시는 url) 기반으로 한다
  (PR #155 리뷰 S3 재발 방지).

현재 브랜치 `feat/146-news-disclosure-split`에서 그대로 작업한다. 새
브랜치를 만들지 않는다.

## Implementation Scope

**갱신**
- `src/features/research/dto.ts` — `NewsDisclosureDto` 신설, `ReportDto`
  정리(소비처 확인 후).
- `src/features/research/adapters.ts` — `adaptNewsDisclosure`·라벨 상수,
  `ResearchView.reports` 정리.
- `src/features/research/queries.ts` — `useNewsDisclosure` 신설,
  `useResearchView` reports 제거.
- `src/pages/ui/ResearchPage.tsx` — 카드 교체 (레이아웃 그리드·다른 카드
  불변).
- 테스트·msw 픽스처: `adapters.test.ts`, `queries.test.tsx`,
  `ResearchPage.test.tsx` (+ mock 갱신이 필요한 다른 페이지 테스트).

**변경 불가**
- `src/shared/api/`, 다른 페이지 컴포넌트, 라우팅.

## Test Requirements

- adapters: 소문자 입력 정규화, 라벨 매핑, 알 수 없는 값·null 방어.
- queries: 훅 경로·enabled 조건, reports 제거 반영.
- ResearchPage: 탭 전환, 항목 메타 렌더(배지·링크 href/target·tone),
  카드 오류·빈 상태 격리(페이지 나머지 렌더 유지), 앵커 유지.
- 픽스처는 BE 실응답 형태 (소문자 sentiment 케이스 포함).

## Out of Scope

- 관련 리스크 연결, 공시 실데이터, 촉매(#147), 탭 활성화(#149), BE 변경.

## Rules

- 커밋은 1개로 만든다. push는 하지 않는다.
- 커밋 메시지는 한국어 `type: 본문` 형식으로 작성한다.
- 필요하지 않은 추상화를 추가하지 않는다.

## Verification

- `pnpm format:check`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
