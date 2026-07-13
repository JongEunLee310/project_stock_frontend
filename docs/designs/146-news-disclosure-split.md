# Design — Issue 146: 뉴스·공시 분리 표시 (분류·중요도·영향·원문 링크)

BE #268(project_stock PR #273, dev 머지됨)의
`GET /assets/{asset_id}/news-disclosure` 계약을 리서치 상세의 "뉴스 및 공시
요약" 카드에 연결한다. 뉴스와 공시를 탭으로 분리하고 항목별 메타데이터와
원문 링크를 표시한다. 지금까지 이 카드가 임시로 쓰던 reports(LLM 종합
리포트) 소스는 이 카드에서 제거한다.

## Background — BE 계약

응답: `{ asset_id, news: NewsItem[], disclosures: DisclosureItem[] }`

- news 항목: `id`, `title`, `url`, `source`, `published_at`(nullable),
  `summary`(nullable), `category`(nullable), `impact_level`(nullable),
  `sentiment`(nullable).
- disclosure 항목: `title`, `url`, `source`, `published_at`(nullable),
  `category`(mock은 `OTHER`), `impact_level`·`summary`는 null.
- `limit` 쿼리(기본 20)가 양쪽 배열에 적용된다. 인증 필수, 자산 미존재 404.
- 값 표기 주의: `sentiment`·`impact_level`은 저장 경로에 따라 대소문자가
  혼재할 수 있다 (BE 테스트에 `positive`/`medium` 소문자 존재). FE 어댑터는
  대문자 정규화 후 매핑한다.

## DTO — `src/features/research/dto.ts`

- `NewsDisclosureDto` — 위 응답 형태 그대로 (news·disclosures 항목 타입
  포함, nullable 필드는 optional).

## Adapters — `src/features/research/adapters.ts`

- `NewsDisclosureItem` — `{ id: string, title, url, source,
  publishedAt: string | null(KST 포맷), summary: string | null,
  categoryLabel: string | null, impactLabel: string | null,
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | null }`.
- `NewsDisclosureView` — `{ news: NewsDisclosureItem[], disclosures:
  NewsDisclosureItem[] }`.
- `adaptNewsDisclosure(dto): NewsDisclosureView` — 정규화(대문자화)·라벨
  변환. 알 수 없는 값은 null 처리.
- 라벨 매핑 (신규 상수, `shared/lib/format`의 기존 라벨 관례를 따름):
  - category: EARNINGS 실적 / PRODUCT 제품 / PARTNERSHIP 파트너십 /
    REGULATION 규제 / PERSONNEL 인사 / CAPITAL 자본 / MARKET 시황 /
    OTHER 기타.
  - impact_level: LOW 낮음 / MEDIUM 중간 / HIGH 높음 / CRITICAL 심각.
  - sentiment 표기: POSITIVE 긍정(emerald) / NEUTRAL 중립(muted) /
    NEGATIVE 부정(red).

## Queries — `src/features/research/queries.ts`

- `useNewsDisclosure(assetId: number | undefined):
  UseQueryResult<NewsDisclosureView>` — `enabled: assetId != null`,
  queryKey `['research', 'news-disclosure', assetId]`,
  `GET /assets/{assetId}/news-disclosure`. `useResearchView`와 독립 조회
  (카드 단위 로딩·실패 격리 — 이 카드 실패가 페이지를 막지 않는다).
- `useResearchView`에서 reports 병렬 조회를 제거하고, `ResearchView`의
  `reports` 필드와 `adaptReport`·`ReportDto` 사용처를 함께 정리한다
  (이 카드가 유일한 소비처였음을 확인하고 제거 — 다른 소비처가 있으면
  유지하고 카드만 교체).

## Page — `src/pages/ui/ResearchPage.tsx`

- "뉴스 및 공시 요약" 카드(하단 열, 앵커 `research-section-news` 유지)를
  교체한다:
  - 카드 상단 탭 2개: `뉴스` (기본) / `공시`.
  - 항목 행: 분류 배지 + 제목(원문 `url`로 새 탭 링크,
    `rel="noreferrer"`) / `{source} · {publishedAt}` / summary(있을 때) /
    영향 표기(sentiment tone)와 중요도 라벨(있을 때).
  - 상태: 로딩 스켈레톤, 오류 시 카드 내 ErrorState(재시도), 빈 배열이면
    탭별 EmptyState("표시할 뉴스가 없습니다." / "표시할 공시가 없습니다.").

## Test / msw

- adapters: 정규화(소문자 입력 포함)·라벨 매핑·null 방어.
- queries: 신규 훅 호출 경로·enabled 조건, useResearchView에서 reports
  호출 제거 반영.
- ResearchPage: 탭 전환, 항목 메타데이터 렌더, 원문 링크 href·target,
  카드 오류·빈 상태가 페이지 전체를 막지 않음.
- 픽스처는 BE 실응답 형태 (소문자 sentiment 케이스 포함).

## Out of Scope

- 관련 리스크 연결 표시 (BE 계약에 필드 없음 — 후속).
- 공시 실데이터 (BE 후속 이슈).
- 촉매(#147)·탭 활성화(#149)·BE 변경.

## Open Questions

- 없음. 탭 분리 방식과 reports 소스 제거는 이 문서로 확정한다.
