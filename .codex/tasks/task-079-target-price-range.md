# Codex Handoff Task

## Source Issue

이슈 #206 — 리서치 헤더 목표 주가 최고·최저 병기. 이슈 본문을 먼저
읽는다. 선행인 BE 컨센서스 계약(project_stock#295, PR #312)은 dev에
머지되었다.

## Task Summary

BE asset detail 계약에 추가된 목표 주가 컨센서스 필드
(`target_price_high`·`target_price_low`·`target_analyst_count`)를
소비해, 리서치 헤더의 '평균 목표주가' 항목에 최고·최저를 병기한다.
BE 계약 스펙은 ../project_stock/docs/api/frontend-api-spec.md의
asset detail 절 참조.

## Goal

- 컨센서스가 있는 종목의 헤더에 평균 목표주가와 함께 최고·최저가
  병기된다 (기존 헤더 밀도 유지 — 간결한 한 줄 표기).
- 컨센서스 부재(null) 시 기존 평균 목표주가 표시로 폴백하고 병기는
  생략된다.
- 기존 target_price·상승 여력 표시는 회귀가 없다.

## Implementation Scope

- `src/features/research/dto.ts` — `AssetDetailDto`에
  `target_price_high`·`target_price_low`·`target_analyst_count`
  (nullable) 추가.
- `src/features/research/adapters.ts` — `ResearchView`에 파생 필드
  추가 (`parseDecimal` 재사용).
- `src/pages/ui/ResearchPage.tsx` — 헤더 '평균 목표주가' 항목에
  최고·최저 병기 (형식은 기존 formatCurrency 관례 재사용,
  예: "평균 (최저–최고)" 계열의 간결한 표기 중 기존 톤에 맞게 결정).
- 테스트 — 병기 표시·null 폴백 케이스.

## Out of Scope

- BE 수정
- 목표주가 이외 헤더 항목 변경
- analyst_count의 별도 노출 (표기가 과밀해지면 생략 가능 — 구현에서
  판단하고 태스크 결과에 명시)

## Protected Files

없음.

## Verification

- `pnpm run format:check`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm run test`

## Constraints

- 현재 브랜치(`feat/206-target-price-range`)에서 그대로 작업한다.
  새 브랜치 생성·checkout 금지.
- 커밋은 한국어 `type: 본문` 형식으로 작성한다.
- 이 태스크 문서와 구현이 같은 PR에 함께 실린다.
