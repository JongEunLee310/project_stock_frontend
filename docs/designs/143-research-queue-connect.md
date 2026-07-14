# Design: 리서치 목록 2단계 — BE 큐 계약 연결 (#143)

- Status: Accepted
- Issue: #143 (에픽 #152 1차), 선행: FE #141(목록 1단계), BE #266(큐 계약, dev 머지됨)

## 1. 배경

리서치 목록(`/research`)이 현재 기존 계약 기반 셸(심볼·시장·섹터·AI 판단·
마지막 갱신)에 머물러 있습니다. BE `GET /api/v1/research-queue`가 상태·
완성도·핵심 이슈·요약 카운트를 단일 요청으로 제공하므로 이를 연결해
"무엇을 먼저 조사해야 하는가"를 보여주는 큐로 완성합니다.

## 2. 데이터 연결

- dto: `ResearchQueueSummaryDto`, `ResearchQueueItemDto`,
  `ResearchQueueResponseDto` — BE 스펙(frontend-api-spec.md
  `GET /api/v1/research-queue`) 필드 그대로.
- adapters: `toResearchQueueView` — 스네이크→카멜, `research_status` →
  한국어 라벨·tone 매핑, `completeness_pct` → 게이지 표시용 숫자,
  `last_updated_at` → KST 상대/절대 포맷 (기존 시간 포맷 관례 재사용).
- queries: `useResearchQueue(filter, page)` —
  queryKey `['research', 'queue', filter, page]`, 필터 변경 시 재조회.
  기존 `useResearchList`는 제거하고 목록 페이지 소비를 교체한다
  (다른 소비처가 있으면 유지 — 구현에서 확인).

### research_status 라벨·tone 매핑 (FE 소관)

| 값 | 라벨 | tone |
| --- | --- | --- |
| NEEDS_ATTENTION | 추가 확인 필요 | warning/danger 계열 |
| INSUFFICIENT | 데이터 부족 | muted |
| COLLECTING | 수집 중 | info |
| PENDING_ANALYSIS | 분석 대기 | muted |
| STALE | 오래됨 | warning |
| ANALYZED | 분석 완료 | success |

(미매핑 값은 원문 노출 대신 '—' 폴백 — pr-191 소견과 같은 함정 방지)

## 3. 화면 구성 (ResearchListPage)

- 상단 요약 카운트 4타일: 리서치 대상(total) / 추가 확인 필요
  (needs_attention) / 오늘 업데이트(updated_today) / 데이터 부족
  (insufficient). 기존 대시보드/워치리스트 KPI 타일 스타일 재사용.
- 필터 칩: 전체 / 추가 리서치 필요(needs_research) / 위험 증가
  (risk_increasing) / 실적 발표 예정(earnings_upcoming) / 최근 업데이트
  (recently_updated). 단일 선택, 선택 시 쿼리 파라미터 반영.
- 목록 컬럼: 종목(로고+심볼+이름) · 시장 · AI 판단(stance) · 핵심 이슈
  (key_issue, truncate+title) · 리서치 상태(research_status 배지) ·
  분석 완성도(completeness_pct 게이지 또는 % 텍스트) · 마지막 갱신.
  섹터 컬럼은 큐 계약에 없으므로 제거한다.
- 검색 입력(심볼·이름 클라이언트 필터)은 유지.
- 페이지네이션: `meta.total` 기반 — 기존 Table 페이지네이션 관례 재사용.

## 4. Out of Scope

- 리서치 상세 화면 변경
- BE 계약 변경 (filter 추가 등)
- 워치리스트·시그널에서의 진입 동선 변경

## 5. Test / Verification

- 어댑터: 상태 라벨·미매핑 폴백·null last_updated_at 처리.
- 페이지: 요약 카운트 렌더, 필터 칩 선택 시 쿼리 재조회, 컬럼 렌더
  (게이지·배지·truncate), 로딩/에러/빈 상태.
- format:check · typecheck · lint · test 통과.
