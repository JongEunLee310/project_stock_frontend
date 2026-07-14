# Codex Handoff Task

## Source Issue

이슈 #143 — 리서치 목록 2단계: BE 큐 계약 연결. 설계:
`docs/designs/143-research-queue-connect.md` (먼저 전체를 읽는다).
에픽 #152의 1차 마지막 항목이다.

## Task Summary

리서치 목록(`/research`)을 BE `GET /api/v1/research-queue` 계약에
연결해 요약 카운트 4타일·필터 칩·확장 컬럼(리서치 상태·분석 완성도·
핵심 이슈)을 갖춘 큐 화면으로 완성한다. BE 계약 스펙은 BE 저장소
`docs/api/frontend-api-spec.md`의 `GET /api/v1/research-queue` 절에
있으며 설계 문서에 필드가 요약되어 있다.

## Goal

- 목록이 research-queue 단일 요청으로 구성된다 (기존 N+1/구계약 제거).
- 상단 요약 카운트 4타일과 필터 칩 5종이 동작한다.
- AI 판단(stance)과 리서치 상태(research_status)가 별개 컬럼으로
  표시되고, 완성도는 %로 표시된다.
- 미매핑 research_status 값은 '—' 폴백 (enum 원문 노출 금지).

## Implementation Scope

- `src/features/research/dto.ts` — 큐 응답 dto 추가.
- `src/features/research/adapters.ts` — `toResearchQueueView` +
  상태 라벨·tone 매핑 (설계 §2 표).
- `src/features/research/queries.ts` — `useResearchQueue(filter, page)`;
  기존 `useResearchList`는 목록 페이지 소비 교체 후 다른 소비처가
  없으면 제거.
- `src/pages/ui/ResearchListPage.tsx` — 설계 §3 화면 구성 (요약 타일·
  필터 칩·컬럼 확장·페이지네이션·검색 유지).
- 테스트 — 어댑터·페이지 (설계 §5 시나리오).

## Out of Scope

- 리서치 상세 화면 변경
- BE 계약 변경
- 워치리스트·시그널 진입 동선 변경

## Protected Files

없음.

## Verification

- `pnpm run format:check`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm run test`

## Constraints

- 현재 브랜치(`feat/143-research-queue-connect`)에서 그대로 작업한다.
  새 브랜치 생성·checkout 금지.
- 커밋은 한국어 `type: 본문` 형식으로 작성한다.
- 설계 문서·이 태스크 문서·구현이 같은 PR에 함께 실린다.
