# 73 · Decision Log Stats Wiring (판단 통계 연동)

Status: Frozen
작성: Claude Code (orchestrator)
관련: BE 052 (decision-log-stats), DecisionLogPage `mockDecisionPatterns`·`mockReviewMemos` 제거

## 1. 배경

DecisionLogPage 우측 aside의 두 mock 카드를 BE 052 신규 엔드포인트 `GET /decision-logs/stats`로 교체한다.

- "자주 나온 판단 패턴"(`mockDecisionPatterns`) → `decision_type_counts`(전체 기간) 기반 유형별 분포.
- "최근 복기 메모"(`mockReviewMemos`) → "최근 검토한 판단"으로 재해석, `recent_reviewed` 기반.

## 2. 범위

포함:

- `features/decision-log` dto/queries/adapters에 stats 추가.
- DecisionLogPage 두 카드를 실데이터로 교체.
- mock import/사용 제거(정의는 `shared/mock`에 유지).

비포함:

- 상단 요약 카드 4종 로직 변경 없음(BE `total` 교정은 후속).
- 신규 라우팅/페이지 없음.
- 회고 메모 작성 UI 없음.

## 3. 계약

### 3.1 dto `DecisionLogStatsDto`

| 필드                   | 타입                     |
| ---------------------- | ------------------------ |
| `decision_type_counts` | `Record<string, number>` |
| `total`                | `number`                 |
| `recent_reviewed`      | `ReviewedDecisionDto[]`  |

`ReviewedDecisionDto`: `id:number`, `ticker:string`, `company_name?:string\|null`, `decision_type:string`, `reason?:string\|null`, `risk_note?:string\|null`, `reviewed_at:string`.

### 3.2 queries

- `decisionLogStatsQueryKey = ['decision-logs', 'stats']`
- `useDecisionLogStats()` — `GET /decision-logs/stats`, `apiGet`로 `data` 추출 후 어댑터 적용. 실패 시 TanStack 표준 에러 상태(페이지에서 graceful 처리).

### 3.3 adapters

- `adaptDecisionTypeCounts(counts, total)` → 정렬된 패턴 배열 `{ type, label, count, percent }[]`. `label`은 `toDecisionTypeLabel`로 매핑, count desc 정렬, `percent`는 `total` 기준 반올림.
- `adaptReviewedDecision(dto)` → `{ id, symbol, decisionTypeLabel, note, reviewedAt }`. `note`는 `reason?.trim() || risk_note?.trim() || ''` 우선순위(둘 다 없으면 빈 문자열), `reviewedAt`은 표시용 포맷(`formatKstDateTime` 재사용).

### 3.4 DecisionLogPage 변경

- `mockDecisionPatterns`/`mockReviewMemos` import·사용 제거. `sortedPatterns`/`patternTotal`(mock 기반) 제거.
- `useDecisionLogStats()` 추가.
- "자주 나온 판단 패턴" 카드: stats 패턴 배열로 막대 렌더. 로딩 Skeleton, 에러/0건 EmptyState("집계된 판단이 없습니다."). 기존 막대 UI(meter, percent) 유지.
- "최근 복기 메모" 카드 → 제목 "최근 검토한 판단". `recent_reviewed` 목록 렌더(종목·유형 배지·note·검토 시각). 로딩 Skeleton, 0건 EmptyState("검토한 판단이 없습니다."). 기존 메모 리스트 마크업 재사용.
- 기존 TODO 주석(BE 미지원) 제거.

## 4. 검증

- `pnpm lint`
- `pnpm typecheck`
- `pnpm format:check`
- `TZ=UTC pnpm test` — 신규/갱신: adapters(정렬·percent·note 우선순위), DecisionLogPage(카드 실데이터 렌더·로딩·빈 상태).
- `pnpm build`

## 5. 비고

- BE 052 미배포 시 stats 쿼리는 에러 → 두 카드만 빈/에러 상태로 degrade, 페이지의 목록·작성 폼·요약은 정상. FE 단독 머지 안전(단, 카드는 BE 배포 후 채워짐).
- 진실값 원칙: 회고 반성문 텍스트는 합성하지 않으며, "최근 검토한 판단"은 실제 검토 라이프사이클 데이터만 표시.
