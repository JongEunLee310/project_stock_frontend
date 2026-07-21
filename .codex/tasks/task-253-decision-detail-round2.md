# Codex Handoff Task — task-253: 판단 상세 2차 (당시/현재 비교·변화 타임라인·버전 이력)

## Source Issue

FE #253 — 판단 상세 2차. 상위 #247(2차). Epic `project_stock_frontend#242`.

## Task Summary

판단 상세 화면(`widgets/decision-detail`)의 "2차 기능" placeholder 카드(이후 변화 타임라인·
변경 이력)를 실제 구현으로 채운다. 당시/현재 비교, 변화 타임라인, 버전 이력을 추가한다.
대부분 상세 응답과 복기 목록에 이미 있는 데이터로 구성한다.

## Goal

- **당시/현재 비교**: 스냅샷(`detail.snapshots`)의 당시 값과 현재 값을 나란히 표시(가능한
  지표부터 — 종목 대상의 현재가). 스냅샷은 immutable로 유지, 현재 값으로 덮어쓰지 않는다.
- **변화 타임라인**: 판단 라이프사이클(작성·확정·복기·재검토 트리거 발동)을 시간순으로 표시.
  상세 응답의 `created_at`·`activated_at`·`reviewed_at`·`review_triggers[].triggered_at`와
  복기 목록(`useDecisionReviews`)에서 구성.
- **버전 이력**: `superseded_by_id`가 있으면 "이 판단을 대체한 판단 보기" 링크를 제공.
- placeholder "2차 기능" 카드를 제거하고 위 섹션으로 대체.
- `pnpm format:check` / `pnpm lint` / `pnpm typecheck` / `pnpm test` 통과.

## Background

- 상세 응답(`useDecisionLog(id)`)에 `snapshots`, `review_triggers`(triggered_at 포함),
  `superseded_by_id`, 라이프사이클 타임스탬프가 이미 있다.
- 복기는 `useDecisionReviews(id)`(#252)로 조회.
- 현재가는 기존 가격 훅/소스를 재사용한다(리서치·워치리스트에서 쓰는 방식 확인). 현재값
  소스가 없는 스냅샷 지표는 당시 값만 표시하고 현재값은 "—"로 둔다.
- 설계 원칙(§10·§11): 결과보다 당시 근거 우선, 상단에 현재 수익률만 크게 띄우지 않음,
  스냅샷 immutable.

## Implementation Scope

- `src/widgets/decision-detail/DecisionDetail.tsx` — placeholder 대체:
  - 당시/현재 비교 표(스냅샷 지표별 당시 vs 현재).
  - 변화 타임라인(라이프사이클·트리거·복기 이벤트 시간순).
  - 버전 이력(대체 판단 링크).
- 필요 시 `src/widgets/decision-timeline/` 컴포넌트 분리.
- 현재가 조회 훅 재사용(기존 features/entities). 없으면 최소 소비만.
- `src/pages/ui/DecisionDetailPage.tsx` — 복기 목록 연동(당시/현재·타임라인에 복기 반영).
- 테스트.

## Out of Scope

- 외부 이벤트(뉴스·시그널 변화) 전체 타임라인의 신규 데이터 소스 구축(라이프사이클·복기·
  트리거 기반 타임라인으로 한정).
- 딥링크(#254), 복기 작성(#252, 완료).
- BE 변경(상세·복기·revise 계약 이미 존재).

## Protected Files

없음.

## Requirements

- 스냅샷은 당시 값 보존, 현재 값과 나란히 비교만 한다(덮어쓰기 금지).
- 타임라인은 시간 오름차순 또는 최신순 일관되게.
- 버전 이력은 `superseded_by_id` 존재 시에만 링크 노출.
- enum·라벨은 `shared/model` 사용.
- 현재값 소스가 없는 지표는 안전하게 "—"/미표시.

## Test Requirements

- 스냅샷 있는 판단에서 당시/현재 비교 렌더(현재가 있으면 비교, 없으면 당시만).
- 타임라인이 라이프사이클·트리거·복기 이벤트를 시간순으로 표시.
- `superseded_by_id` 있을 때 대체 판단 링크 노출, 없을 때 미노출.
- placeholder "2차 기능" 카드가 사라졌는지.

## Verification Commands

```
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
```

## Documentation Impact

불필요.

## ADR Need

불필요.

## Failure Record Need

불필요.

## Risk Level

Medium — 상세 화면 확장·현재값 소비.

## Expected Output

- 변경 파일: decision-detail 위젯(+타임라인 컴포넌트), DecisionDetailPage, 테스트.
- 검증 4종 통과 로그.
- 현재 브랜치 `feat/253-decision-detail-round2` 유지(새 브랜치 금지). 한국어 `feat:` 커밋,
  `#253` 참조.
