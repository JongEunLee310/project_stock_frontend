# Codex Handoff Task — task-246: 판단 상세 화면

## Source Issue

FE #246 — 판단 상세 화면. Epic `project_stock_frontend#242`. 선행: FE #243(계약·훅·상세 라우트
골격).

## Task Summary

`/decision-log/:id` 상세 화면을 채운다. 결과보다 당시 근거를 먼저 보여주는 순서 원칙을
따른다. `useDecisionLog(id)`가 제공하는 본문·근거·위험·재검토 조건·스냅샷을 소비한다.

## Goal

- 상세가 다음 순서로 렌더된다: (1) 판단 헤더(대상·유형·작성 시각·상태·확신·다음 확인) →
  (2) 당시 판단 내용(thesis/rationale) → (3) 연결된 근거(긍정/반대/위험 구분) → (4) 당시
  데이터 스냅샷(immutable) → (5) 재검토 조건. 2차 요소(이후 변화 타임라인·복기·변경 이력)는
  자리만 예약한다.
- 없음/권한없음(404/403)·로딩 상태 처리.
- `pnpm format:check` / `pnpm lint` / `pnpm typecheck` / `pnpm test` 통과.

## Background

디자인 정본은 `project_stock` 설계문서 §10(상세)·§11(스냅샷)·§23(UI 지침). 핵심 원칙:

- 상단에 현재 수익률만 크게 띄우지 않는다. 당시 판단→근거→위험→(이후 변화)→결과 순서.
- 스냅샷은 판단 당시 값(immutable). 현재 값으로 덮어쓰지 않는다. "당시/현재 비교"는 2차.
- 근거는 관계(`SUPPORTING`/`CONTRADICTING`/`RISK`/`BACKGROUND`)로 구분해 표시한다.

## Implementation Scope

- `src/pages/ui/DecisionDetailPage.tsx` — #243이 만든 골격을 실제 상세로 채운다.
- 필요한 표시 위젯(`src/widgets/decision-timeline/` 등)은 2차 자리 예약 수준으로만.
- 근거/위험/스냅샷/재검토 조건 표시 컴포넌트. 기존 `shared/ui`(Card/Badge/EmptyState) 재사용.
- 상세 화면 테스트.

## Out of Scope

- 이후 변화 타임라인 데이터 연결, 복기 작성/표시(2차 #247), 당시/현재 비교, 버전 이력.
- 판단 수정/확정 액션(작성은 #245, 수정은 2차).
- 패턴·편향(3차).

## Protected Files

없음.

## Requirements

- 스냅샷은 `snapshot_type`별로 그룹화해 key-value로 표시(자유 JSON이므로 범용 렌더).
- 근거 관계별 섹션 구분(긍정 근거 / 반대 근거 / 위험 / 배경).
- 재검토 조건은 트리거 유형과 예정 시각을 사람이 읽을 수 있게 표시(1차는 `DATE` 중심).
- 헤더의 "다음 확인"은 가장 이른 PENDING 재검토 트리거 시각 또는 "미정".
- 존재하지 않거나 타인 소유면 명확한 안내(목록으로 돌아가는 링크).

## Test Requirements

- 상세 데이터가 순서대로 렌더(헤더→판단→근거→스냅샷→재검토).
- 근거 관계 구분 표시.
- 404/403·로딩 상태.
- 스냅샷 자유 JSON 렌더.

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

Low~Medium — 읽기 UI, 자유 JSON 스냅샷 범용 렌더 주의.

## Expected Output

- 변경 파일: DecisionDetailPage + 표시 컴포넌트 + 테스트.
- 검증 4종 통과 로그.
- 현재 브랜치 `feat/243-decision-log-redesign` 유지. 한국어 `feat:` 커밋, `#246` 참조.
