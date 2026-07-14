# 187 — 뉴스 페이지 신설 (리서치 '더 보기'를 페이지 링크로 전환)

Status: Handoff Ready

## 1. 배경

사용자 피드백(2026-07-14)입니다. 리서치 상세의 '뉴스 및 공시 요약' 카드에서
더 보기를 누르면 카드가 그대로 커져 하단 3열 행의 균형이 깨집니다. 카드 내
펼침 대신 종목별 뉴스·공시 전체를 보여주는 별도 페이지를 만들고, 카드의
더 보기를 해당 페이지 링크로 전환합니다.

- 이슈: JongEunLee310/project_stock_frontend#187
- 에픽: #152, 선행 #183 (PR #191)

## 2. 범위

포함:

- `src/shared/config/navigation.ts` — 라우트 경로 추가.
- `src/app/router.tsx` — 자식 라우트 추가.
- `src/pages/ui/ResearchNewsPage.tsx` (신규) + `src/pages` export.
- `src/pages/ui/ResearchPage.tsx` — `NewsDisclosurePanel` 펼침 로직 제거,
  더 보기를 페이지 링크로 전환.
- 뉴스 목록 컴포넌트·카테고리 톤 헬퍼를 두 페이지가 공유할 수 있는
  위치로 추출.

제외: 계약 변경 없음. 카테고리·감성·중요도 필터는 BE 카테고리 자동 분류
(project_stock#296) 이후 후속으로 미룬다 — 현재 categoryLabel이 대부분
null이라 필터 실효성이 없다.

## 3. 변경

### 라우트

- `appRoutePaths.researchNews = '/research/:symbol/news'`.
  `navigationItems`에는 추가하지 않는다 (사이드바 비노출, 리서치 하위
  상세 페이지). 기존 `research`의 `matchPrefix: '/research'`로 사이드바
  활성 표시는 자동 유지.
- `router.tsx`에 `ResearchNewsPage` 자식 라우트 추가. 라우트 순서상
  `:symbol`보다 먼저 매칭되도록 배치(정적 세그먼트 우선이라 react-router가
  자동 처리하지만, 선언 위치는 researchDetail 앞에 둔다).

### 공유 컴포넌트 추출

- `NewsDisclosureList`(full/compact variant)와
  `sentimentClassNames`를 ResearchPage에서 추출해 재사용 가능한 위치에
  둔다 (예: `src/widgets/NewsDisclosureList/`). 기존 props 시그니처 유지.
- `categoryToneClassNames`/`getCategoryToneClassNames`는 ResearchPage의
  타임라인에서도 쓰므로 공용 모듈로 이동한다 (예:
  `src/features/research/categoryTone.ts`). ResearchPage는 import로 전환.

### ResearchNewsPage (신규)

- `useParams`로 symbol 취득 → assetId 해석은 기존
  `fetchAssetIdBySymbol`을 감싼 경량 쿼리 훅으로 처리한다
  (`useResearchView` 전체 재사용 금지 — 요약·체크리스트 등 불필요 호출).
  - `queries.ts`에 `useAssetIdBySymbol(symbol): UseQueryResult<number>`
    추가 (queryKey: `['asset-id', normalizedSymbol]`).
- 페이지 구성 (위→아래):
  - 뒤로 가기 링크: `‹ {SYMBOL} 리서치` → `/research/{symbol}`.
  - 제목: `뉴스 및 공시 — {SYMBOL}`.
  - 탭: 뉴스 / 공시 — 리서치 상세와 동일한 밑줄 탭 스타일
    (border-b-2 + active border-app-accent font-bold text-app-accent).
  - 목록: `NewsDisclosureList` full variant 전체 항목 (제한 없음).
  - 로딩 Skeleton, 오류 ErrorState(재시도), 빈 목록 EmptyState —
    리서치 상세와 동일 패턴.
- 데이터는 기존 `useNewsDisclosure(assetId)` 그대로 사용.

### ResearchPage — NewsDisclosurePanel

- `isExpanded` 상태·토글 제거, 항상 compact 3건(`slice(0, 3)`) 표시.
- 더 보기 버튼을 `Link`(react-router)로 전환:
  `더 보기 ›` → `/research/{symbol}/news`. 데이터 로드 성공 후 현재 탭
  항목이 1건 이상이면 노출.
- `NewsDisclosurePanel`에 `symbol` prop 추가 (링크 생성용).

## 4. Risks / Notes

- `NewsDisclosureList` 추출 시 렌더 결과가 바뀌지 않아야 한다 —
  기존 ResearchPage 뉴스 관련 테스트 통과 유지.
- 라우트 추가로 `NotFoundPage` 와일드카드 매칭에 영향 없어야 한다.

## 5. 테스트

- 라우트: `/research/AAPL/news` 진입 시 페이지 렌더.
- ResearchNewsPage: 탭 전환(뉴스↔공시), full variant 항목(요약·감성·
  중요도 배지) 렌더, 뒤로 가기 링크 href, 로딩·오류·빈 상태.
- ResearchPage: 더 보기가 링크(`/research/{symbol}/news`)로 렌더되고
  클릭해도 카드가 펼쳐지지 않음(펼침 로직 제거 확인), 3건 초과 데이터에서
  compact 3건만 표시.
- 검증 4종.

## 6. 관련 링크

- 이슈 #187, 에픽 #152
- 후속: 필터(카테고리·감성·중요도)는 project_stock#296 이후
