# Design — Issue 145: AI 브리핑·핵심 리스크 구조화 렌더

BE #267(project_stock PR #272, dev 머지됨)이 추가한 구조화 필드를 리서치
상세 화면에 렌더한다. #142(PR #154) 레이아웃 위에서 카드 내용만 확장한다.
에픽 원칙: 신뢰도는 수치 단독이 아니라 근거 문장과 함께, 스탠스는 검토
상태이므로 한 줄 설명을 동반한다.

## Background — BE 계약 (dev 머지 확인)

`GET /assets/{id}/research-summary` 응답에 추가된 필드 (모두 optional,
list는 기본 빈 배열):

- `stance_comment: string | null` — 스탠스 한 줄 설명
- `positive_factors: string[]` — 긍정 요인 불릿
- `caution_factors: string[]` — 주의 요인 불릿
- `next_checks: string[]` — 다음 확인 사항 불릿
- `confidence_basis: string | null` — 신뢰도 근거 문장
- `key_risks[].evidence: string[]` — 리스크 근거 불릿

기존 필드(stance·stance_confidence·headline·body·key_risks)는 불변.

## DTO — `src/features/research/dto.ts`

- `ResearchSummaryDto`에 위 5개 필드 optional 추가, `key_risks` 항목에
  `evidence?: string[] | null` 추가.

## Adapters — `src/features/research/adapters.ts`

- `ResearchView` 확장:
  - `stanceComment: string | null`
  - `confidenceBasis: string | null`
  - `briefing`에 `positiveFactors: string[]`, `cautionFactors: string[]`,
    `nextChecks: string[]` 추가 (누락·null은 `[]`).
- `ResearchRisk`에 `evidence: string[]` 추가 (누락·null은 `[]`).

## Page — `src/pages/ui/ResearchPage.tsx`

- **AI 투자 스탠스 박스(헤더 밴드)** — 스탠스 라벨 아래에 `stanceComment`
  한 줄 표시 (null이면 생략). 신뢰도 배지 아래(또는 옆)에
  `confidenceBasis` 문장 표시 (null이면 수치만 — 기존 동작 유지).
- **AI 브리핑 카드** — headline·body 아래에 불릿 그룹 3개를 소제목과 함께
  렌더: `긍정 요인` / `주의 요인` / `다음 확인 사항`. 빈 그룹은 소제목째
  생략하고, 세 그룹이 모두 비면 기존 문단만 표시한다(폴백 — 기존 데이터
  행 호환).
- **핵심 리스크 카드** — 각 리스크 항목의 설명 아래에 `근거` 불릿 목록을
  렌더. `evidence`가 빈 배열이면 생략.

레이아웃(카드 배치·그리드)은 #142 결과를 유지한다. 시각 요소는 기존 토큰과
불릿 스타일(시그널 카드 key_points 렌더 관례)을 따른다.

## Test / msw

- adapters: 신규 필드 매핑, 누락·null → `[]`/null 처리.
- ResearchPage: 불릿 그룹 렌더와 빈 그룹 생략, 3그룹 모두 빈 경우 폴백,
  stanceComment·confidenceBasis 표시와 null 생략, 리스크 evidence 렌더.
- 픽스처는 BE 실계약 형태(머지된 템플릿 구조)를 따른다.

## Out of Scope

- 뉴스·공시 분리(#146), 촉매 데이터(#147), 탭 활성화(#149).
- BE 계약 변경.
- "더 보기" 접기 — 브리핑 분량이 문제되면 카드 단위 접기로 후속 검토
  (문단별 클램프 금지 관례).

## Open Questions

- 없음.
