# Codex Handoff Task

## Source Issue

https://github.com/JongEunLee310/project_stock_frontend/issues/120

## Task Summary

관심 종목 페이지 우측 레일에 "빠른 감시 설정" 카드를 추가한다. 설정 페이지로 이동하지
않고 알림 템플릿 4종(가격 급변·뉴스 위험도 상승·AI 판단 변경·테마 과열)을 원클릭으로
활성화·비활성화할 수 있는 `QuickWatchPanel` 컴포넌트를 신규 feature 디렉토리에 구현하고
`WatchlistPage`의 우측 레일에 배치한다.

## Goal

- 우측 레일 "새로 추가된 관심 종목" 카드 아래에 "빠른 감시 설정" 카드가 표시된다.
- 4종 템플릿 타일이 각각 활성(is_active: true)·비활성 상태를 시각적으로 구분해 렌더링된다.
- 타일을 클릭하면 해당 템플릿의 is_active가 반전되어 PUT되고, 성공 시 캐시가 즉시 갱신된다.
- 뮤테이션이 진행 중인 타일만 disabled로 렌더링하며, 나머지 3개 타일은 클릭 가능 상태를
  유지한다(전역 isPending 처리 금지).
- 카드 하단에 알림 설정 페이지(`/alerts`)로 이동하는 "알림 설정 관리" 링크가 있다.
- `corepack pnpm format:check` / `corepack pnpm typecheck` / `corepack pnpm lint` /
  `corepack pnpm test` 4종 모두 통과한다.

## Background

설계 문서: `docs/designs/120-quick-watch-panel.md` — Verified Facts·Decisions·Components·테스트
영향 확정.

구현 전 설계 문서의 Verified Facts를 실제 파일에 대해 검증하고, 불일치하면 보고 후
실계약을 우선한다.

**확인된 BE 계약 리터럴 (출처 명시)**

- `GET /api/v1/watchlists/{watchlist_id}/alert-rule-templates`
  → `ApiResponse[list[WatchlistAlertRuleTemplateProjection]]`
  출처: `app/api/v1/endpoints/watchlists.py:245-261`
  - 미설정 포함 4종 항상 반환. 미설정 항목은 `is_active: false`
  - 필드: `template_type: str`, `label: str`, `condition_description: str`, `is_active: bool`
    (출처: `app/domains/watchlists/schema.py`)
  - `template_type` enum 값 (출처: `app/domains/watchlists/types.py:34-38`):
    `"PRICE_SPIKE"` / `"NEWS_RISK_HIGH"` / `"AI_JUDGMENT_CHANGE"` / `"THEME_OVERHEAT"`

- `PUT /api/v1/watchlists/{watchlist_id}/alert-rule-templates`
  → `ApiResponse[list[WatchlistAlertRuleTemplateProjection]]` (4종 전체 반환)
  출처: `app/api/v1/endpoints/watchlists.py:264-282`
  - Body: `{ templates: [{ template_type: string, is_active: boolean }] }`
    (출처: `app/domains/watchlists/schema.py` — `WatchlistAlertRuleTemplateBulkRequest`,
    `WatchlistAlertRuleTemplateApply`)
  - 포함된 템플릿만 upsert. 응답은 4종 전체 현재 상태 반환
  - 무효 `template_type` → 422

**FE 기존 패턴**

- 자기 해결 패턴: 훅 내부에서 `GET /watchlists?page=1&size=20`으로 첫 watchlistId를 조회한
  뒤 도메인 API를 호출한다 (`src/features/watchlist/queries.ts`의 evaluations, sparklines 선례).
- `apiPut<T>(path, body)` 함수 존재 확인됨 (`src/shared/api/client.ts:139`).
- mutation `onSuccess(data)` → `queryClient.setQueryData([...watchlistQueryKey, 'alert-templates'], data)`로
  직접 갱신한다. PUT 응답이 전체 4종을 반환하므로 invalidateQueries로 재조회가 불필요하다.
- 테스트는 MSW 없이 `vi.mock` 직접 mock 패턴을 사용한다
  (`WatchlistPage.test.tsx`의 `vi.mock('@/features/watchlist/queries', ...)` 선례,
  `queries.test.tsx`의 `vi.mock('@/shared/api/client', ...)` 선례).
- 기존 feature 디렉토리 네이밍 관례: `watchlist-observations/`, `watchlist-recommendations/`
  → 신규 디렉토리명: `watchlist-alert-templates/`

**테스트 픽스처 주의사항**

- `template_type` enum 리터럴은 대문자 원문 그대로 사용하고
  출처 주석 `// app/domains/watchlists/types.py`를 기재한다.
- `label`과 `condition_description`은 BE가 제공하는 값이므로 테스트 픽스처에서는 임의
  한국어 문자열을 사용해도 무방하다.

## Implementation Scope

설계 문서 `docs/designs/120-quick-watch-panel.md`의 Components 절을 그대로 따른다.

**신규 파일:**

- `src/features/watchlist-alert-templates/dto.ts`
  — `WatchlistAlertTemplateDto`: `template_type: string`, `label: string`,
    `condition_description: string`, `is_active: boolean`
  — `WatchlistAlertTemplateApplyDto`: `template_type: string`, `is_active: boolean`
  — `WatchlistAlertTemplateBulkRequestDto`: `templates: WatchlistAlertTemplateApplyDto[]`

- `src/features/watchlist-alert-templates/adapters.ts`
  — `WatchlistAlertTemplateView` 인터페이스:
    `templateType: string`, `label: string`, `conditionDescription: string`, `isActive: boolean`
  — `adaptWatchlistAlertTemplate(dto: WatchlistAlertTemplateDto): WatchlistAlertTemplateView`
    snake_case → camelCase 변환
  — `adaptWatchlistAlertTemplates(dtos: WatchlistAlertTemplateDto[]): WatchlistAlertTemplateView[]`
  — `TEMPLATE_VISUAL_MAP: Record<string, { icon: string; activeClassName: string }>`
    4종 매핑:
    - `PRICE_SPIKE`: icon `"±"`, activeClassName (amber 계열 border 또는 background Tailwind 유틸리티 클래스)
    - `NEWS_RISK_HIGH`: icon `"▣"`, activeClassName (rose 계열)
    - `AI_JUDGMENT_CHANGE`: icon `"⊙"`, activeClassName (blue 계열)
    - `THEME_OVERHEAT`: icon `"↑"`, activeClassName (orange 계열)
    (기존 `WatchlistPage.tsx`의 색상 시스템 `cockpit-*` 토큰 및 Tailwind 팔레트와 일관성 유지)

- `src/features/watchlist-alert-templates/adapters.test.ts`
  — `adaptWatchlistAlertTemplate`: camelCase 변환 확인, `is_active` → `isActive` 전달 확인
  — `adaptWatchlistAlertTemplates`: 4종 배열 전체 변환 확인

- `src/features/watchlist-alert-templates/queries.ts`
  — `watchlistAlertTemplatesQueryKey` 상수: `[...watchlistQueryKey, 'alert-templates'] as const`
    (`watchlistQueryKey`는 `@/features/watchlist/queries`에서 import)
  — `useWatchlistAlertTemplates(): UseQueryResult<WatchlistAlertTemplateView[]>`
    - queryKey: `watchlistAlertTemplatesQueryKey`
    - queryFn: watchlistId 자기 해결(`GET /watchlists?page=1&size=20`) →
      `GET /watchlists/{id}/alert-rule-templates` → `data`를 `adaptWatchlistAlertTemplates`로 변환
    - watchlist 없으면 빈 배열(`[]`) 반환, 에러 미발생
  — `useApplyWatchlistAlertTemplate(): UseMutationResult<WatchlistAlertTemplateView[], Error, { templateType: string; isActive: boolean }>`
    - mutationFn: watchlistId 자기 해결 →
      `apiPut('/watchlists/{id}/alert-rule-templates', { templates: [{ template_type: templateType, is_active: isActive }] })` →
      응답 `data`를 `adaptWatchlistAlertTemplates`로 변환 후 반환
    - onSuccess(data): `queryClient.setQueryData(watchlistAlertTemplatesQueryKey, data)` 직접 갱신

- `src/features/watchlist-alert-templates/queries.test.tsx`
  — `vi.mock('@/shared/api/client', ...)` 직접 mock 패턴 (기존 `queries.test.tsx` 선례)
  — `useWatchlistAlertTemplates`:
    - 정상 응답(4종) → `WatchlistAlertTemplateView[]` 반환 확인
    - watchlist 배열이 비어 있으면 빈 배열 반환 확인
    - 픽스처 `template_type` 리터럴에 출처 주석 `// app/domains/watchlists/types.py` 기재
  — `useApplyWatchlistAlertTemplate`:
    - mutate 호출 후 `apiPut`에 올바른 path·body 전달 확인
    - 성공 시 `queryClient.getQueryData(watchlistAlertTemplatesQueryKey)`가 응답으로 갱신됨 확인

- `src/features/watchlist-alert-templates/QuickWatchPanel.tsx`
  — 담당: 4종 템플릿 타일 그리드 렌더링 + 원클릭 토글 인터랙션
  — `useWatchlistAlertTemplates` + `useApplyWatchlistAlertTemplate` 내부 소비 (props 없음)
  — 내부 state: `const [pendingType, setPendingType] = useState<string | null>(null)`
  — 로딩 중(`isLoading: true`): 타일 4개 위치에 Skeleton 표시
  — 실패(`isError: true`): `<ErrorState ... onRetry={() => void refetch()} />` 표시
  — 정상 렌더링:
    - `<Card>` 안에 카드 제목("빠른 감시 설정"), 타일 그리드, 하단 링크
    - 타일 그리드: `grid grid-cols-2 gap-2` (2열 2행)
    - 각 타일: `<button type="button" disabled={pendingType === template.templateType} onClick={...}>`
      - 활성 타일: `TEMPLATE_VISUAL_MAP[template.templateType].activeClassName` 적용
      - 비활성 타일: 기본 `cockpit-surface-muted` 스타일
      - 타일 내부: 아이콘, label, conditionDescription (BE 응답값 그대로)
    - 클릭 핸들러:
      ```
      setPendingType(template.templateType)
      mutate(
        { templateType: template.templateType, isActive: !template.isActive },
        { onSettled: () => setPendingType(null) }
      )
      ```
    - 하단 링크: `<Link to={appRoutePaths.alerts} className="...">알림 설정 관리</Link>`
  — `appRoutePaths`는 `@/shared/config/navigation`에서 import

- `src/features/watchlist-alert-templates/QuickWatchPanel.test.tsx`
  — `vi.mock('@/features/watchlist-alert-templates/queries', ...)` 패턴
    (`vi.mock('@/features/watchlist/queries', ...)` 선례와 동일 구조)
  — 픽스처 4종 템플릿 (2개 active, 2개 inactive):
    ```
    { templateType: 'PRICE_SPIKE', label: '가격 급변', conditionDescription: '±3% 이상', isActive: true },
    { templateType: 'NEWS_RISK_HIGH', label: '뉴스 위험도 상승', conditionDescription: '위험도 HIGH', isActive: false },
    { templateType: 'AI_JUDGMENT_CHANGE', label: 'AI 판단 변경', conditionDescription: '판단 변경', isActive: true },
    { templateType: 'THEME_OVERHEAT', label: '테마 과열', conditionDescription: '과열 감지', isActive: false },
    // template_type 원본: app/domains/watchlists/types.py
    ```
  — 테스트 케이스:
    - 4종 타일 label이 모두 렌더링됨 확인
    - `isActive: true` 타일에 활성 스타일 클래스가 적용됨 확인
    - 타일 클릭 시 `mutate({ templateType, isActive: !current })`이 호출됨 확인
    - `useWatchlistAlertTemplates`가 `{ isLoading: true }` 상태일 때 Skeleton 표시 확인
    - `useWatchlistAlertTemplates`가 `{ isError: true }` 상태일 때 ErrorState 표시 확인
    - `pendingType`에 해당하는 타일이 `disabled` 속성을 가짐 확인
      (뮤테이션 `isPending` mock을 사용해 pendingType 상태를 시뮬레이션)
    - "알림 설정 관리" 링크의 href가 `/alerts`임 확인

**수정 파일:**

- `src/pages/ui/WatchlistPage.tsx`
  — `QuickWatchPanel` import 추가:
    `import { QuickWatchPanel } from '@/features/watchlist-alert-templates/QuickWatchPanel'`
  — aside 안 "새로 추가된 관심 종목" 카드(`line 1077`) 바로 다음에 `<QuickWatchPanel />` 추가
  — 그 외 기존 코드 수정 금지

## Out of Scope

- 종목별 개별 알림 규칙 설정
- 실제 알림 발송 내역 표시
- 열 설정·내보내기·전체화면
- BE 변경 (계약 불일치 발견 시 보고 후 중단)

## Protected Files

없음. 보호 파일을 수정하지 않는다.

## Requirements

- `QuickWatchPanel`은 props 없이 자기 완결 컴포넌트로 구현한다.
  `WatchlistPage`에 watchlistId나 상태를 별도 전달하지 않는다.
- `pendingType === template.templateType`인 타일만 `disabled`로 렌더링한다.
  mutation `isPending` 전역 플래그로 모든 타일을 비활성화하지 않는다.
- `label`과 `condition_description`은 BE 응답 값을 그대로 렌더링한다. FE에서 하드코딩하지 않는다.
- 아이콘과 활성 색상만 `TEMPLATE_VISUAL_MAP`을 통해 FE에서 매핑한다.
- `useApplyWatchlistAlertTemplate`의 `onSuccess`에서는 `invalidateQueries`가 아닌
  `setQueryData`로 캐시를 직접 갱신한다.
- `WatchlistPage.tsx`의 수정은 `QuickWatchPanel` import·삽입에 한정한다. 그 외 기존 코드를
  건드리지 않는다.
- 기존 테스트를 약화하거나 삭제하지 않는다. 커버리지는 현행 수준 이상을 유지한다.

## Test Requirements

- `adaptWatchlistAlertTemplate`: camelCase 변환, isActive 전달 단위 테스트
- `adaptWatchlistAlertTemplates`: 4종 배열 변환 단위 테스트
- `useWatchlistAlertTemplates`: 정상 응답 → 뷰 배열 반환, watchlist 없음 → 빈 배열
- `useApplyWatchlistAlertTemplate`: PUT 인자 확인, 성공 시 setQueryData 갱신 확인
- `QuickWatchPanel` 타일 렌더링: 4종 label 표시
- `QuickWatchPanel` 활성 상태 강조 표시
- `QuickWatchPanel` 클릭 → mutate 호출 인자 확인 (is_active 반전)
- `QuickWatchPanel` 로딩 중 Skeleton, 실패 ErrorState
- `QuickWatchPanel` pendingType 타일 disabled
- `QuickWatchPanel` "알림 설정 관리" 링크 href
- 픽스처 `template_type` 리터럴에 출처 주석 `// app/domains/watchlists/types.py` 기재

## Verification Commands

- `corepack pnpm format:check`
- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `corepack pnpm test`

(prettier 미준수 시 해당 파일만 `corepack pnpm prettier --write <파일>`로 정리.
repo 전체 `pnpm format`은 샌드박스에서 EPERM 실패 전례가 있다.)

## Documentation Impact

- `docs/designs/120-quick-watch-panel.md` — 구현 완료 후 Status를 `Implemented`로 갱신한다.

## ADR Need

불필요. 기존 BE 계약 소비이며 신규 외부 의존성이 없다.

## Failure Record Need

불필요.

## Risk Level

Medium — PUT mutation의 `setQueryData` 직접 갱신 패턴은 기존 `invalidateQueries` 선례와
다르므로 queryKey가 정확히 일치해야 캐시 갱신이 동작한다. queryKey 불일치 시 화면 갱신이
되지 않으며 테스트에서 확인 가능하다. 또한 `QuickWatchPanel` 내부 state(`pendingType`)와
TanStack Query 뮤테이션 생명주기(`onSettled`) 간 타이밍을 테스트에서 검증해야 한다.

## Expected Output

- 신규·수정 파일 목록 보고
- 검증 4종 실행 결과 보고
- BE 계약 대조 결과 보고 (특히 `template_type` enum 대소문자, 응답 envelope 구조,
  `condition_description` 필드 존재 여부 확인)
- 가정·잔여 위험 보고

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
- 현재 브랜치 `feat/120-quick-watch-panel`에서 작업한다. 새 브랜치를 생성하지 않는다.
- 커밋하지 않는다 (커밋은 오케스트레이터가 별도 지시한다).
- BE 계약 불일치 발견 시 중단하고 보고한다.
