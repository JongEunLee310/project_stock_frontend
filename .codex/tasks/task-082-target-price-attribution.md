# Codex Handoff Task

## Source Issue

이슈 #217 — 리서치 헤더 목표주가 최저·최고 기관 귀속 표기. 이슈
본문을 먼저 읽는다. 선행 BE 계약(project_stock#318, PR #321)은 dev에
머지되었다.

## Task Summary

BE `GET /assets/{asset_id}/analyst-opinions?limit=` (기관명·action·
등급·기관 목표가·발표 시각 최근순, 미제공 종목 빈 목록)를 소비해,
리서치 헤더 목표주가의 최저·최고 행 옆 출처를 '애널리스트 N명
컨센서스'에서 실제 기관명으로 교체한다. 계약 상세는 BE 저장소
`docs/api/frontend-api-spec.md`의 analyst-opinions 절 참조.

## Goal

- 최저·최고 각 행의 출처가 해당 목표가를 낸 기관명으로 표시된다
  (예: `최저 $180.00 · KGI Securities`).
- **귀속 정책**: 최근 의견 목록(limit 20)에서 기관 목표가가 컨센서스
  최저(또는 최고)와 정확히 일치하는 의견이 있을 때만 그 기관명을
  표기한다. 일치 의견이 여럿이면 가장 최근 발표 기관을 쓴다.
- 귀속 불가(빈 목록·일치 없음·목표가 null)면 기존 '애널리스트 N명
  컨센서스' 표기로 폴백한다. 컨센서스 자체가 없으면 기존 규칙대로
  출처를 생략한다.
- 헤더 로딩이 의견 조회에 블로킹되지 않는다 — 의견 로딩 중·실패
  시에는 폴백 표기를 그대로 쓴다.

## Implementation Scope

- `src/features/research/dto.ts` — analyst-opinions 응답 dto.
- `src/features/research/adapters.ts` — 의견 목록 어댑터
  (`parseDecimal` 재사용) + 최저·최고 귀속 파생 헬퍼 (순수 함수,
  단위 테스트 대상).
- `src/features/research/queries.ts` — `useAnalystOpinions(assetId)`
  (다른 파생 쿼리 관례를 따르고, 실패해도 헤더에 에러를 띄우지
  않는다).
- `src/pages/ui/ResearchPage.tsx` — `TargetPriceSourceSuffix`를 행별
  기관명 우선·컨센서스 폴백으로 확장 (mock 데이터 기준: 최저 180 →
  KGI Securities, 최고 250 → JPMorgan).
- 테스트 — 귀속 성공(최저·최고 각각)·복수 일치 시 최근 우선·귀속
  불가 폴백·의견 조회 실패 폴백·국내 종목(빈 목록) 폴백.

## Out of Scope

- BE 수정 (별도 repo)
- 기관 의견 목록 자체의 화면 노출 (후속 후보)
- 목표주가 목록 표기 구조 변경 (#206에서 확정된 구조 유지)

## Protected Files

없음.

## Verification

- `pnpm run format:check`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm run test`

## Constraints

- 현재 브랜치(`feat/217-target-price-attribution`)에서 그대로
  작업한다. 새 브랜치 생성·checkout 금지.
- 커밋은 한국어 `type: 본문` 형식으로 작성한다.
- 이 태스크 문서와 구현이 같은 PR에 함께 실린다.
