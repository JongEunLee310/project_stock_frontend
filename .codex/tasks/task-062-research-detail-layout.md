# Codex Handoff Task

## Source Issue

#142 — 리서치 상세 화면 레이아웃 정밀 정렬 — research.png 2단 구성·세부 디자인
`gh issue view 142 --repo JongEunLee310/project_stock_frontend`

설계 문서: `docs/designs/142-research-detail-layout.md` (반드시 먼저 읽는다)

## Task Summary

리서치 상세 화면(`ResearchPage`)의 배치를 research.png 시안 구성으로
재정렬한다. 데이터 소스·훅·계약은 바꾸지 않는다 — 레이아웃과 카드 구성만
변경한다.

## Goal

작업 완료 시 다음 상태여야 한다 (설계 문서의 시안 구조 절 참조).

- 헤더 밴드: 심볼·회사명·시장·섹터 + 현재가·등락 + AI 투자 스탠스 박스
  (라벨·신뢰도 배지) + 메트릭 그리드(시가총액·섹터·52주 범위·다음 실적
  발표·평균 목표주가) 구성.
- 본문 상단 2단: 좌측 차트 카드(탭 3개 — 가격 활성, 밸류에이션·실적
  disabled + "준비 중"), 우측 AI 브리핑·핵심 리스크 카드.
- 차트 카드의 "평균 목표주가" 보조 블록은 제거 (헤더 밴드로 흡수).
- 본문 하단 열: 뉴스 및 공시 요약 · 촉매 타임라인 자리 카드(EmptyState
  "예정 이벤트 데이터가 아직 수집되지 않았습니다.") · 의사결정 체크리스트 ·
  내 메모.
- 기존 기능(체크리스트·메모 저장, debounce, 관심종목 토글, 기간 탭
  재조회)이 동작 변화 없이 유지된다.
- `pnpm format:check`, `pnpm typecheck`, `pnpm lint`, `pnpm test`가 전부
  통과한다.

## Background

- 현재 브랜치는 main(PR #140 머지 반영) 기준이다. PR #153(목록)은 아직
  미머지이므로 목록 관련 코드는 이 브랜치에 없다 — 참조하지 말 것.
- 컴포넌트 내부 로직(mutation·ref·effect)은 수정 금지. 이동·배치만 한다.
- 스타일은 기존 토큰(app-border, app-surface-muted 등)과 기존 카드 관례를
  따른다.

현재 브랜치 `feat/142-research-detail-layout`에서 그대로 작업한다. 새
브랜치를 만들지 않는다.

## Implementation Scope

**갱신**
- `src/pages/ui/ResearchPage.tsx` — 레이아웃 재배치 (설계 문서 Page 변경 절).
- `src/pages/ui/ResearchPage.test.tsx` — 아래 Test Requirements.

**변경 불가**
- `src/features/research/` 전체 (dto·adapters·queries)
- `src/shared/` 전체
- 다른 페이지

## Test Requirements

- 기존 테스트는 셀렉터 갱신 외 로직 수정 없이 통과한다.
- 추가: 탭 3개 렌더와 가격 외 탭 disabled 상태, 촉매 자리 카드 빈 상태
  문구, 헤더 밴드에 현재가·등락·스탠스·메트릭 5종 표시.

## Out of Scope

- 데이터·훅·계약 변경, 브리핑 구조화(#145), 뉴스·공시 분리(#146),
  촉매 데이터(#147), 탭 활성화(#149), 목록 화면·뒤로가기.

## Rules

- 커밋은 1개로 만든다. push는 하지 않는다.
- 커밋 메시지는 한국어 `type: 본문` 형식으로 작성한다.
- 필요하지 않은 추상화를 추가하지 않는다.

## Verification

- `pnpm format:check`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
