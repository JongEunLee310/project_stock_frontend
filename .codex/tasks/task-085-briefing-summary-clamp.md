# Codex Handoff Task

## Source Issue

이슈 #221 — 리서치 AI Briefing 카드 요약 축소. `gh issue view 221`로 범위를 먼저 읽는다.

## Task Summary

리서치 상세(`src/pages/ui/ResearchPage.tsx`)의 AI Briefing 카드가 headline + body(약 430자) +
긍정/주의/다음확인 리스트 16개 항목을 모두 펼쳐 보여줘 지나치게 길다. 기본 표시를 headline +
body 요약 2~3줄로 축소하고, 리스트 3종은 기본적으로 숨긴다. 카드 하단의 '더 보기 ›'로 전문을
볼 수 있게 한다.

## Goal

- briefing 카드 기본 상태: headline + body(2~3줄 line-clamp) + '더 보기 ›' 진입점만 보인다.
- 긍정 요인·주의 요인·다음 확인 사항 리스트 3종은 기본 상태에서 숨긴다.
- '더 보기 ›'를 누르면 카드 내에서 body 전문과 리스트 3종이 펼쳐지고, '접기'로 다시 축약된다.
- 저장본 부재 시 빈 상태·생성 버튼(기존 PR #220 구현)은 그대로 유지한다.

## Background

PR #220(FE #219) 머지 후 briefing 카드는 `research.briefing`이 있을 때 headline + body + 리스트
3종을 무조건 렌더한다(`ResearchPage.tsx:1687` 근처 `research.briefing ? (...)` 분기). 이번 작업은
이 "값 있을 때" 렌더 블록만 축약한다. `line-clamp-2`/`line-clamp-3`은 이미 코드베이스에서
쓰인다(`DashboardPage.tsx:345`, `DecisionLogPage.tsx:306`).

'더 보기 ›'의 최종 목적지는 별도 전문 페이지지만, 그 페이지의 디자인·설계는 추후 별도 이슈에서
정해진다. 이번에는 별도 페이지로 라우팅하지 않고 카드 내 펼치기(toggle)로 구현한다. 별도 페이지가
설계되면 후속 이슈에서 toggle을 라우팅으로 교체한다.

## Implementation Scope

- `src/pages/ui/ResearchPage.tsx` — briefing 카드의 `research.briefing ? (...)` 렌더 블록:
  - 카드 로컬 펼침 상태(`useState<boolean>`, 기본 `false`)를 둔다.
  - body 문단에 접힘 상태에서 `line-clamp-2`(또는 `line-clamp-3`) 적용, 펼침 상태에서는 clamp 해제.
  - 긍정/주의/다음확인 리스트 3종은 펼침 상태에서만 렌더한다.
  - 카드 하단에 토글 버튼을 둔다. 접힘: '더 보기 ›', 펼침: '접기'. 접근성 속성(`aria-expanded`)을 붙인다.
  - 기존 헤더('AI briefing' 라벨, '갱신 {createdAt}')와 headline 표시는 유지한다.
- 토글 버튼은 기존 카드 하단 '더 보기 ›' 패턴(`ResearchPage.tsx:1386` 등 카드 내 링크/버튼 스타일)과
  일관되게 만든다. 새 공용 컴포넌트를 만들 필요는 없다.

## Out of Scope

- 전문 별도 페이지의 디자인·라우팅·구현(추후 별도 이슈).
- 저장본 부재 빈 상태·생성 버튼 로직 변경.
- BE 계약·응답 필드 변경(`ResearchView.briefing` 타입은 그대로 사용).
- 다른 카드(핵심 리스크·반대 관점 등) 표시 변경.

## Protected Files

없음.

## Requirements

1. briefing 카드 기본 상태에서 body가 2~3줄로 clamp되고 리스트 3종이 보이지 않는다.
2. '더 보기 ›' 토글로 body 전문과 리스트 3종이 펼쳐지고, '접기'로 되돌아간다.
3. 저장본 부재 시 기존 빈 상태·생성 버튼이 그대로 동작한다.
4. body가 짧아 clamp가 걸리지 않는 경우에도 레이아웃이 깨지지 않는다.

## Test Requirements

- briefing 값이 있을 때 기본 상태에서 리스트 항목(예: 긍정 요인 텍스트)이 문서에 없음(`queryByText`)을 확인.
- 토글 클릭 후 리스트 항목이 나타나는지(`findByText`) 확인.
- 저장본 부재 시 빈 상태·생성 버튼이 유지되는 기존 테스트가 회귀 없이 통과.
- 기존 ResearchPage 테스트(briefing 관련) 회귀 없음.

## Verification

- `pnpm run format:check`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm run test`

## Documentation Impact

없음. 화면 표시 축약이며 계약·spec 변경이 없다.

## ADR Need

불필요. UI 표시 변경으로 아키텍처 결정이 아니다.

## Failure Record Need

불필요.

## Risk Level

Low — 단일 카드의 표시 상태(useState) 추가와 조건부 렌더이며, 회귀 테스트로 빈 상태·기본/펼침을 고정한다.

## Expected Output

- 변경: `src/pages/ui/ResearchPage.tsx`, 관련 테스트 파일.
- PR 본문에 Verification 4종 결과와 기본/펼침/빈 상태 3경로 확인 결과를 기록.

## Rules

- 최신 `main`에서 만든 현재 브랜치(`feat/221-briefing-summary-clamp`)를 유지한다. 다른 브랜치로
  전환하거나 `main`에 직접 커밋하지 않는다.
- 커밋 메시지는 한국어 `type: 본문` 형식.
- 이 태스크 문서와 구현이 같은 PR에 함께 실린다.
- 스코프 외 파일을 변경하지 않는다. briefing 카드 외 다른 UI를 건드리지 않는다.
- 검증 명령을 생략·완화하지 않는다. prettier(`format:check`) 포함 4종 모두 통과시킨다.
