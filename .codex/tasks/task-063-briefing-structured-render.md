# Codex Handoff Task

## Source Issue

#145 — AI 브리핑·핵심 리스크 구조화 렌더 — 현재 판단/긍정/주의/다음 확인·신뢰도 근거·리스크 근거
`gh issue view 145 --repo JongEunLee310/project_stock_frontend`

설계 문서: `docs/designs/145-briefing-structured-render.md` (반드시 먼저 읽는다)

## Task Summary

BE research-summary 구조화 필드(dev 머지됨)를 리서치 상세 화면에 렌더한다.
DTO·어댑터에 필드를 추가하고, AI 투자 스탠스 박스·AI 브리핑 카드·핵심
리스크 카드의 내용을 확장한다. 레이아웃(#142 결과)은 바꾸지 않는다.

## Goal

작업 완료 시 다음 상태여야 한다.

- AI 투자 스탠스 박스에 `stanceComment` 한 줄과 신뢰도 근거
  (`confidenceBasis`)가 표시된다 (null이면 각각 생략, 기존 표시 유지).
- AI 브리핑 카드에 긍정 요인 / 주의 요인 / 다음 확인 사항 불릿 그룹이
  렌더된다. 빈 그룹은 소제목째 생략, 세 그룹 모두 비면 기존 문단만 표시.
- 핵심 리스크 각 항목에 근거 불릿(`evidence`)이 렌더된다 (빈 배열 생략).
- 구조화 필드가 없는 기존 응답에서도 화면이 기존과 동일하게 렌더된다
  (하위 호환 폴백).
- `pnpm format:check`, `pnpm typecheck`, `pnpm lint`, `pnpm test`가 전부
  통과한다.

## Background

BE 실응답 필드는 설계 문서 Background 절과 같다. 픽스처 참고용 실계약
예시 (BE `_SUMMARY_TEMPLATES` 형태):

```json
{
  "stance": "BUY_CANDIDATE",
  "stance_confidence": "0.72",
  "stance_comment": "성장성과 현금흐름 개선을 확인하되 가격 부담을 함께 검토할 단계입니다.",
  "headline": "...",
  "body": "...",
  "positive_factors": ["...", "..."],
  "caution_factors": ["...", "..."],
  "next_checks": ["...", "..."],
  "confidence_basis": "매출 성장과 현금흐름 지표는 긍정적이지만 밸류에이션과 환율 변수의 불확실성이 남아 있습니다.",
  "key_risks": [
    {
      "id": "valuation",
      "title": "...",
      "level": "MEDIUM",
      "description": "...",
      "evidence": ["...", "..."]
    }
  ],
  "created_at": "..."
}
```

불릿 렌더는 시그널 카드의 `key_points` 목록 렌더 관례(`<ul>`)를 따른다.

현재 브랜치 `feat/145-briefing-structured-render`에서 그대로 작업한다.
새 브랜치를 만들지 않는다.

## Implementation Scope

**갱신**

- `src/features/research/dto.ts` — `ResearchSummaryDto` 확장.
- `src/features/research/adapters.ts` — `ResearchView`·`ResearchRisk` 확장
  (설계 문서 Adapters 절).
- `src/pages/ui/ResearchPage.tsx` — 스탠스 박스·브리핑 카드·리스크 카드
  내용 확장 (레이아웃 변경 금지).
- 테스트: `adapters.test.ts`, `ResearchPage.test.tsx` — 아래 Test
  Requirements.

**변경 불가**

- `src/features/research/queries.ts` (호출 경로 변화 없음)
- `src/shared/`, 다른 페이지, 레이아웃 그리드 구조

## Test Requirements

- adapters: 신규 필드 매핑과 누락·null → `[]`/null 처리.
- ResearchPage: 불릿 3그룹 렌더·빈 그룹 생략·전부 빈 경우 폴백,
  stanceComment·confidenceBasis 표시와 null 생략, 리스크 evidence
  렌더·빈 배열 생략.
- 픽스처는 위 실계약 예시 형태를 따른다.

## Out of Scope

- 뉴스·공시 분리(#146), 촉매(#147), 탭 활성화(#149), BE 계약 변경,
  더 보기 접기.

## Rules

- 커밋은 1개로 만든다. push는 하지 않는다.
- 커밋 메시지는 한국어 `type: 본문` 형식으로 작성한다.
- 필요하지 않은 추상화를 추가하지 않는다.

## Verification

- `pnpm format:check`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
