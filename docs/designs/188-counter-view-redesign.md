# 188 — 반대 관점 카드 콘텐츠·스타일 재설계

Status: Handoff Ready

## 1. 배경

사용자 지적(2026-07-14)입니다. 반대 관점 카드가 불릿 나열이라 가독성이
떨어집니다. BE가 counter_view를 구조화한 `counter_points`(근거 유형·강도·
출처)를 제공하게 되어(project_stock#298), 리스크 패널과 같은 행 기반
레이아웃으로 재설계합니다.

- 이슈: JongEunLee310/project_stock_frontend#188
- 에픽: #152, 선행: BE project_stock#298

## 2. 범위

포함:

- `src/features/research/dto.ts` — `counter_points` additive 반영.
- `src/features/research/adapters.ts` — `CounterPointItem` projection,
  `ResearchView.counterPoints` 추가 (기존 `counterView`는 fallback용 유지).
- `src/pages/ui/ResearchPage.tsx` — `CounterViewPanel` 재설계.

제외: BE 계약 외 변경 없음. counter_view 제거는 BE 후속 이슈 이후.

## 3. 계약 (BE #298 기준)

`ResearchSummaryDto`에 additive:

```
counter_points?: Array<{
  id: string
  claim: string
  basis: string
  basis_type: 'VALUATION' | 'FUNDAMENTALS' | 'COMPETITION' | 'MACRO' | 'SENTIMENT'
  strength: 'WEAK' | 'MODERATE' | 'STRONG'
  source_label: string | null
}> | null
```

## 4. 변경

### adapters

- `CounterPointItem` projection:
  - `id: string`
  - `claim: string`
  - `basis: string`
  - `basisTypeLabel: string` — 매핑: VALUATION=밸류에이션,
    FUNDAMENTALS=펀더멘털, COMPETITION=경쟁, MACRO=매크로,
    SENTIMENT=심리. 미지 값은 원문 유지.
  - `strength: 'WEAK' | 'MODERATE' | 'STRONG' | null` — 미지 값 null.
  - `sourceLabel: string | null`
- `ResearchView.counterPoints: CounterPointItem[]` 추가.
  `counterView: string[]`는 유지 (구계약 fallback).

### CounterViewPanel

- props: `{ points: CounterPointItem[]; fallbackItems: string[] }`.
- `points`가 1건 이상이면 리스크 패널과 같은 헤더 없는 행 목록으로 표시
  (`divide-y`, 행: `grid grid-cols-[auto_auto_minmax(0,1fr)] items-center
  gap-x-2`):
  - 강도 배지: STRONG=status-level-high 톤 '강함',
    MODERATE=status-level-medium 톤 '보통', WEAK=neutral 톤 '약함',
    null이면 배지 생략.
  - 근거 유형 배지: neutral 톤, `basisTypeLabel`.
  - 주장(claim) 텍스트 + `InfoTooltip` — 툴팁 내용: basis, sourceLabel이
    있으면 `출처 {sourceLabel}` 병기 (리스크 패널 evidence 툴팁 패턴).
- `points`가 비어 있고 `fallbackItems`가 있으면 기존 불릿 목록 유지.
- 둘 다 비어 있으면 기존 EmptyState 유지.
- 카드 상단 안내 문구(확증 편향)는 유지.

## 5. Risks / Notes

- BE 배포 전에도 동작해야 함 — counter_points 부재 시 fallback 렌더가
  기존과 동일해야 한다.
- 픽스처는 BE #298 계약(enum 값 대문자 문자열)을 그대로 반영한다
  (실계약 픽스처 규율).

## 6. 테스트

- adapters: counter_points 정규화(라벨 매핑·미지 값 처리·null/부재 →
  빈 배열).
- CounterViewPanel: 구조화 행 렌더(강도·유형 배지, 툴팁 내용),
  fallback 불릿 렌더, 빈 상태.
- 검증 4종.

## 7. 관련 링크

- 이슈 #188, 에픽 #152, BE project_stock#298
