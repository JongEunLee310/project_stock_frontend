# Design: 빠른 감시 설정 패널 (#120)

## Status

Implemented

## Context

Phase 3 구현(PR #121)으로 평가 배지 4종 컬럼과 요약 카드 확장이 완료됐다. 이슈 #120은
관심 종목 페이지 우측 레일에 "빠른 감시 설정" 카드를 추가해 알림 템플릿을 원클릭으로
활성화·비활성화할 수 있는 패널을 제공한다. 설정 페이지로 이동하지 않고 알림 조건을
빠르게 켤 수 있는 것이 핵심 목표다. BE 계약은 PR #238로 머지 완료됐다.

## Verified Facts

확인 기준 — BE: `/Users/sleepyowl/Projects/project_stock` dev (PR #238 머지 이후);
FE: feat/120-quick-watch-panel (main에서 분기, Phase 3 머지 반영됨).

- `GET /api/v1/watchlists/{watchlist_id}/alert-rule-templates`
  → `ApiResponse[list[WatchlistAlertRuleTemplateProjection]]`
  출처: `app/api/v1/endpoints/watchlists.py:245-261`
  - 미설정 포함 4종 항상 반환. 미설정 항목은 `is_active: false`
  - `WatchlistAlertRuleTemplateProjection` (출처: `app/domains/watchlists/schema.py`):
    - `template_type: str`
    - `label: str` — 한국어 라벨 (BE 제공)
    - `condition_description: str` — 조건 설명 (BE 제공)
    - `is_active: bool`
  - `WatchlistAlertTemplateType` enum 값 (출처: `app/domains/watchlists/types.py:34-38`):
    `"PRICE_SPIKE"` / `"NEWS_RISK_HIGH"` / `"AI_JUDGMENT_CHANGE"` / `"THEME_OVERHEAT"`

- `PUT /api/v1/watchlists/{watchlist_id}/alert-rule-templates`
  → `ApiResponse[list[WatchlistAlertRuleTemplateProjection]]`
  출처: `app/api/v1/endpoints/watchlists.py:264-282`
  - Body: `WatchlistAlertRuleTemplateBulkRequest { templates: list[WatchlistAlertRuleTemplateApply] }`
    — `WatchlistAlertRuleTemplateApply`: `template_type: str`, `is_active: bool`
    (출처: `app/domains/watchlists/schema.py`)
  - 포함된 템플릿만 upsert. 응답은 4종 전체 현재 상태를 반환
  - 무효 `template_type` → 422

- FE 우측 레일 구조 (출처: `src/pages/ui/WatchlistPage.tsx:1011-1140`):
  - `<aside aria-label="AI 관찰 레일">` 안에 "AI 관찰 메모" 카드(line 1012),
    "새로 추가된 관심 종목" 카드(line 1077) 순서로 배치됨
  - `<WatchlistRecommendationsSection />` (line 1143)은 aside 바깥 페이지 하단에 위치

- 알림 설정 페이지 (출처: `src/app/router.tsx:37`, `src/shared/config/navigation.ts:7`):
  - `appRoutePaths.alerts === '/alerts'` — `AlertsPage` 존재 확인됨

- FE API 클라이언트 (출처: `src/shared/api/client.ts:139`):
  - `apiPut<T>()` 함수 존재 확인됨

- FE 계약 레이어 관례 (출처: `src/features/watchlist/queries.ts`):
  - 자기 해결 패턴: 훅 내부에서 `/watchlists?page=1&size=20`으로 첫 watchlistId 조회 후
    도메인 API 호출 (evaluations, sparklines, recommendations 선례)
  - mutation 선례: `useRemoveWatchlistItem` — `useMutation` + `useQueryClient` + `apiDelete`,
    `onSuccess`에서 `queryClient.invalidateQueries`
  - 테스트: MSW 없이 `vi.mock('@/features/watchlist/queries', ...)` 또는
    `vi.mock('@/shared/api/client', ...)` 직접 mock 패턴

## Decisions

### 1. 데이터 훅 설계

**`useWatchlistAlertTemplates()`** — GET 쿼리 훅. 훅 내부에서 watchlistId를 자기 해결해
`/watchlists/{id}/alert-rule-templates`를 호출하며, 결과를 `WatchlistAlertTemplateView[]`로
반환한다. `queryKey: [...watchlistQueryKey, 'alert-templates']`. `staleTime`은 기본값(0)을
유지해 페이지 진입 시 항상 최신 상태를 조회한다(알림 설정은 사용자가 외부에서 변경할 수
있어 캐싱보다 최신성이 중요하다). watchlist가 없으면 빈 배열을 반환하고 오류를 발생시키지
않는다.

**`useApplyWatchlistAlertTemplate()`** — PUT mutation 훅. `mutationFn` 내부에서 watchlistId를
자기 해결한 뒤 `{ templates: [{ template_type, is_active }] }`를 PUT한다. `onSuccess(data)`에서
`queryClient.setQueryData([...watchlistQueryKey, 'alert-templates'], data)`로 캐시에 직접 기록한다.
PUT 응답이 항상 전체 4종 상태를 반환하므로 `invalidateQueries`로 재조회하는 것보다 즉각적이고
불필요한 네트워크 요청이 없다. 변수 타입: `{ templateType: string; isActive: boolean }`.

### 2. 토글 UX 및 타일별 pending 처리

타일 클릭 시 해당 템플릿만 `{ templates: [{ template_type, is_active: !current }] }`로 PUT한다.
`QuickWatchPanel` 컴포넌트 내부에 `pendingType: string | null` state를 두고, 뮤테이션 시작 시
해당 `template_type`으로 설정하며 `onSettled` 시 null로 초기화한다. `pendingType === template_type`인
타일만 `disabled`로 렌더링하므로 나머지 3개 타일은 클릭 가능 상태를 유지한다.
이는 Phase 2 리뷰에서 지적된 전역 `isPending` 처리 문제를 해소한다.

실패 시: `onError` 콜백에서 `pendingType`을 null로 초기화해 타일을 복원한다. 기존
`WatchlistPage`에 toast 인프라가 없으므로 전용 오류 메시지 영역은 두지 않고 타일 상태
원복으로 처리한다.

### 3. 라벨·설명·시각 요소 처리

`label`과 `condition_description`은 BE 응답 값을 그대로 사용한다. FE에서 하드코딩하지
않는다. `template_type` 기준 아이콘과 활성 강조 색상(활성 타일 border 색상 또는 배경)만
FE에서 매핑한다.

### 4. 패널 위치

빠른 감시 설정 카드는 우측 레일(aside) 안 "새로 추가된 관심 종목" 카드 아래에 추가한다.
항상 보이는 정보 카드를 앞에, 설정 행위 카드를 뒤에 두는 것이 자연스럽고,
`<WatchlistRecommendationsSection />`은 aside 바깥이라 영향이 없다.

### 5. 알림 설정 페이지 링크

카드 하단에 `<Link to={appRoutePaths.alerts}>알림 설정 관리</Link>`를 제공한다.
`AlertsPage`가 `/alerts`에 등록되어 있음을 확인했다.

## Components

### 신규

- `src/features/watchlist-alert-templates/dto.ts`
  — `WatchlistAlertTemplateDto`: `template_type: string`, `label: string`,
    `condition_description: string`, `is_active: boolean`
  — `WatchlistAlertTemplateApplyDto`: `template_type: string`, `is_active: boolean`
  — `WatchlistAlertTemplateBulkRequestDto`: `templates: WatchlistAlertTemplateApplyDto[]`

- `src/features/watchlist-alert-templates/adapters.ts`
  — `WatchlistAlertTemplateView`: `templateType: string`, `label: string`,
    `conditionDescription: string`, `isActive: boolean`
  — `adaptWatchlistAlertTemplate(dto: WatchlistAlertTemplateDto): WatchlistAlertTemplateView`
    — snake_case → camelCase 변환 책임
  — `adaptWatchlistAlertTemplates(dtos: WatchlistAlertTemplateDto[]): WatchlistAlertTemplateView[]`
  — `TEMPLATE_VISUAL_MAP: Record<string, { icon: string; activeClassName: string }>`
    — `template_type` 기준 아이콘·활성 색상 매핑 (4종: `PRICE_SPIKE`, `NEWS_RISK_HIGH`,
      `AI_JUDGMENT_CHANGE`, `THEME_OVERHEAT`)

- `src/features/watchlist-alert-templates/adapters.test.ts`
  — `adaptWatchlistAlertTemplate`: camelCase 변환, `is_active` 전달 단위 테스트
  — `adaptWatchlistAlertTemplates`: 4종 배열 변환 단위 테스트

- `src/features/watchlist-alert-templates/queries.ts`
  — `watchlistAlertTemplatesQueryKey: [...watchlistQueryKey, 'alert-templates']`
  — `useWatchlistAlertTemplates(): UseQueryResult<WatchlistAlertTemplateView[]>`
    책임: watchlistId 자기 해결 → GET → `adaptWatchlistAlertTemplates` 변환 반환
  — `useApplyWatchlistAlertTemplate(): UseMutationResult<WatchlistAlertTemplateView[], Error, { templateType: string; isActive: boolean }>`
    책임: watchlistId 자기 해결 → `apiPut` → 응답 변환 → `setQueryData` 직접 갱신

- `src/features/watchlist-alert-templates/queries.test.tsx`
  — `useWatchlistAlertTemplates`: 4종 응답 → `WatchlistAlertTemplateView[]` 반환 확인;
    watchlist 없으면 빈 배열 반환 확인
  — `useApplyWatchlistAlertTemplate`: PUT 호출 인자 확인; 성공 시 쿼리 캐시 갱신 확인
  — 픽스처 enum 리터럴에 출처 주석 `// app/domains/watchlists/types.py` 기재

- `src/features/watchlist-alert-templates/QuickWatchPanel.tsx`
  — 담당: 4종 템플릿 타일 그리드 렌더링 + 원클릭 토글 인터랙션
  — `useWatchlistAlertTemplates` + `useApplyWatchlistAlertTemplate` 소비
  — 내부 state: `pendingType: string | null`
  — 로딩 중: 타일 4개 Skeleton 표시
  — 실패: ErrorState + refetch 버튼
  — 정상: 4종 타일 렌더링, 활성 타일 강조, `pendingType` 타일 `disabled`
  — 하단: `<Link to={appRoutePaths.alerts}>알림 설정 관리</Link>`

- `src/features/watchlist-alert-templates/QuickWatchPanel.test.tsx`
  — queries 모듈 mock(`vi.mock`): `useWatchlistAlertTemplates`, `useApplyWatchlistAlertTemplate`
  — 4종 타일 렌더링 확인
  — 활성(`is_active: true`) 타일 강조 표시 확인
  — 타일 클릭 시 mutate 호출 인자 확인 (`is_active` 반전)
  — 로딩 중 Skeleton 표시 확인
  — 실패 시 ErrorState 표시 확인
  — `pendingType` 타일 `disabled` 확인
  — "알림 설정 관리" 링크 href 확인

### 수정

- `src/pages/ui/WatchlistPage.tsx`
  — `QuickWatchPanel` import 추가
  — aside 안 "새로 추가된 관심 종목" 카드 다음에 `<QuickWatchPanel />` 추가

## Out of Scope

- 종목별 개별 알림 규칙 설정 (템플릿은 관심 종목 전체 적용)
- 실제 알림 발송 내역 표시
- 열 설정·내보내기·전체화면
- BE 변경
