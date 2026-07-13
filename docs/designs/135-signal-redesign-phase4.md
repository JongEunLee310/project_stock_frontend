# Design — Issue 135: 시그널 페이지 재설계 4단계 (BE 계약 연결)

1단계(#131)가 "준비 중"으로 남긴 자리 4곳을 BE 실계약으로 연결한다.
목록을 `view=current`로 전환해 종목당 1카드를 만들고, KPI 전일 대비·우선순위
"변화" 컬럼·최근 변경 타임라인·근거 불릿을 실데이터로 채운다.

## Background

BE가 로드맵 2·3단계 계약을 dev에 머지했다 (project_stock #252·#257·#260·#262).

- `GET /signals?view=current&expand=asset` — 자산당 dominant 시그널 1건,
  각 항목에 `change` 임베드 (`SignalCurrentExpandedResponse`).
- `GET /signals/changes?limit=&since=` — 스냅샷 기반 변경 타임라인
  (`SignalChangeTimelineItem[]`).
- `GET /signals/summary?view=current` — `{ total, by_category,
  delta_by_category }`. 카테고리 키는 FE `SignalCategory`와 동일한
  WATCH / RISK / BUY / RESEARCH (BE `SignalCategory` enum).
- `key_points: list[str]` — 모든 시그널 응답에 포함, 한국어 불릿 배열,
  기존 행은 빈 배열.

`change` 형태(BE `SignalChange`): `{ direction, score_delta, previous_type,
previous_captured_at }`. `direction`은 NEW / CLEARED / ESCALATED /
DEESCALATED / CHANGED / UNCHANGED. 스냅샷이 아직 없으면 `change: null`.

## DTO 변경 — `src/features/signals/dto.ts`

- `SignalChangeDto` — `direction: string`, `score_delta: number | null`,
  `previous_type: string | null`, `previous_captured_at: string | null`.
- `SignalDto` — `key_points?: string[] | null`, `change?: SignalChangeDto |
  null` 추가 (기존 필드 불변).
- `SignalSummaryDto` — `total: number`, `by_category: Record<string,
  number>`, `delta_by_category: Record<string, number>`.
- `SignalChangeTimelineItemDto` — `asset: { symbol?, name?, market? }`,
  `snapshot_date: string`, `captured_at: string`, `change: SignalChangeDto`,
  `dominant: { signal_id: number | null, signal_type: string, score: number }
  | null`.

## Adapters — `src/features/signals/adapters.ts`

- `SignalChange` 뷰 모델 — `direction`(원값), `directionLabel`(한국어),
  `scoreDelta: number | null`.
- `Signal` 뷰 모델 — `keyPoints: string[]`(누락·null → `[]`),
  `change: SignalChange | null` 추가.
- `adaptSignalSummary(dto): SignalSummary` — `{ total, byCategory,
  deltaByCategory }`. 알 수 없는 카테고리 키는 무시하고 4축 키 누락은 0으로
  채운다.
- `adaptChangeTimelineItem(dto): SignalChangeItem` — `{ symbol, companyName,
  market, snapshotDate, capturedAt, change, dominantType, dominantScore }`.
  `dominant: null`(CLEARED)이면 dominant 필드는 null.

### direction 표기 매핑 (신규 상수, adapters 내부)

| direction | label | 우선순위 레일 표기 |
|---|---|---|
| NEW | 신규 | `신규` |
| ESCALATED | 점수 상승 | `▲ +{score_delta}` |
| DEESCALATED | 점수 하락 | `▼ {score_delta}` |
| CHANGED | 유형 변경 | `유형 변경` |
| UNCHANGED | 변동 없음 | `—` |
| CLEARED | 해소 | `해소` (타임라인 전용) |

`change: null`(스냅샷 미적재)은 `—`로 표시한다. 색상은 ESCALATED
`text-red-400`, DEESCALATED `text-emerald-400`, 나머지
`text-cockpit-text-muted` (리스크 점수 상승 = 악화 의미. 카테고리와 무관하게
score는 "주의 필요도"이므로 상승을 적색으로 통일한다).

## Queries — `src/features/signals/queries.ts`

- `useSignals(assetId?: number, view: 'all' | 'current' = 'all')` — view
  파라미터 추가, queryKey에 view 포함. `view=current`일 때
  `/signals?view=current&expand=asset`. DashboardPage는 기존 기본값(all)을
  그대로 사용해 동작 불변.
- `useSignalSummary(): UseQueryResult<SignalSummary>` —
  `GET /signals/summary` (view 기본값 current 사용).
- `useSignalChanges(limit = 8): UseQueryResult<SignalChangeItem[]>` —
  `GET /signals/changes?limit={limit}`.

## Page 변경 — `src/pages/ui/SignalsPage.tsx`

- `useSignals(undefined, 'current')`로 전환 — 카드 그리드·필터·시장 목록이
  종목당 dominant 1건 기준이 된다.
- `SignalKpiRow` — props를 `summary: SignalSummary | undefined`로 교체하고
  `useSignalSummary()` 결과를 연결한다. 건수·비율·전일 대비 모두 summary에서
  파생한다(현재 클라이언트 집계는 페이지네이션 절단에 취약). delta 표기:
  `+n` / `-n` / `±0`, summary 로딩·오류 시 기존 `—` 유지.
- `SignalCard` — 본문을 `keyPoints` 불릿 목록(`<ul>`)으로 교체하고, 빈
  배열이면 기존 `reason` 문단 폴백. 불릿과 reason을 동시에 표시하지 않는다
  (BE 리뷰 S2에서 확정한 폴백 규칙).
- `SignalPriorityRail` — "변화" 컬럼 `—`를 `signal.change` 기반 표기(위 매핑
  표)로 교체.
- `RecentChangesRail` — `useSignalChanges()` 연결. 행: 심볼(리서치 링크) ·
  direction 라벨 · dominant 카테고리 배지(있을 때) · snapshot 날짜. 데이터
  없음(스냅샷 미적재)이면 기존 EmptyState 문구를 "아직 변경 이력이
  없습니다."로 교체.

## Mock / Test — `src/shared/mock/domain.ts`, 각 `*.test.*`

- msw 핸들러에 `/signals/summary`·`/signals/changes` 응답과 `view=current`
  분기, `key_points`·`change` 필드를 추가한다.
- 갱신: adapters(불릿·change·summary·timeline 변환), queries(신규 훅 2종 +
  view 파라미터), SignalsPage(불릿 렌더·폴백, KPI delta, 변화 컬럼, 타임라인,
  빈 상태) 테스트.
- DashboardPage 테스트는 변경 없어야 한다(회귀 확인).

## Out of Scope

- 알림 설정 버튼 활성화·deep-link (FE #134, BE #255 선행).
- 좌측 시장 요약 사이드바.
- `/signals/changes`의 since 파라미터 UI(기간 필터).
- BE 계약 변경.

## Open Questions

- 없음. direction 색상·폴백 규칙은 이 문서로 확정한다.
