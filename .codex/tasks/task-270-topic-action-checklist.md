# Codex Handoff Task

## Source Issue

JongEunLee310/project_stock_frontend#270 — FE: 토픽 액션·연결 (팔로우·판단기록·알림·유사사례·버전비교,
골격) (에픽 #198 3차). 설계문서: `docs/designs/198-news-insights.md`.

## Task Summary

토픽 상세 "액션 체크리스트"(§5.12) placeholder를 실제 위젯으로 교체한다. 분석에서 사용자 행동으로
이어지는 마무리 레이어로, **BE가 준비된 이동 액션은 활성**, **BE 미비 항목은 "준비 중"**으로 정직하게
구분한다. 이 이슈는 **골격(skeleton)**이다 — 없는 기능을 지어내지 않는다.

## Goal

- 토픽 상세 `plannedPanels.actionChecklist` placeholder를 `TopicActionChecklist` 위젯으로 교체한다.
- 흐름(스펙 §5.12): 토픽 발견 → 근거 확인 → 종목 리서치 → 포트폴리오 영향 → 판단 기록 → 변화 알림.
- 이동 가능한 액션은 네비게이션으로 연결, BE 미비 액션은 비활성 + "준비 중" 안내.
- **직접 매수·매도 버튼은 두지 않는다**(§5.12).

## Background

- 토픽 상세 `src/pages/ui/TopicInsightDetailPage.tsx`의 `plannedPanels.actionChecklist`(#270)를
  제거하고 `TopicActionChecklist` 위젯으로 교체한다. 위젯은 `topicId`와 `affectedSymbols`(리서치
  이동용, `detailQuery.data?.affectedSymbols`)를 받는다.
- 사용 가능한 라우트(`src/shared/config/navigation.ts` `appRoutePaths`): `researchDetail`
  (`/research/:symbol`)·`portfolio`(`/portfolio`)·`decisionLog`(`/decision-log`)·`alerts`
  (`/alerts`). 이동은 `useNavigate` + `generatePath`(symbol) 사용.
- **BE 미비 항목**(엔드포인트 없음): 토픽 팔로우(관심 토픽 등록·알림 대상 지정 — 영속화 API 없음),
  과거 유사 토픽 비교·인사이트 버전 비교(BE 골격 이슈 미구현). 이 항목들은 **비활성 버튼 + "준비 중"
  배지/툴팁**으로 둔다. 로컬 state만으로 팔로우된 것처럼 보이게 하지 마라(영속화 없는 가짜 상태 금지).
- 색만으로 상태 표현 금지 — 텍스트 라벨 병기. 활성/준비 중을 명확히 구분.

## Implementation Scope

- `src/widgets/TopicActionChecklist/`(신규) — 액션 행 목록. 각 행: 제목·설명·버튼.
  - 관련 종목 리서치 열기 → 첫 `affectedSymbols` 종목의 `/research/:symbol`(종목 없으면 비활성).
  - 포트폴리오 영향 확인 → `/portfolio`.
  - 판단 기록 연결 → `/decision-log`.
  - 변화 알림 생성 → `/alerts`.
  - 관심 토픽 팔로우 → 비활성 "준비 중"(영속화 API 없음).
  - 유사 토픽·버전 비교 → 비활성 "준비 중"(BE 골격 미구현).
- `src/pages/ui/TopicInsightDetailPage.tsx` — `actionChecklist` placeholder를 `TopicActionChecklist`
  로 교체(`topicId`·`affectedSymbols` 전달), `plannedPanels`에서 항목 제거(빈 객체가 되면 관련
  const·import 정리).

## Out of Scope

- 토픽 팔로우 영속화·유사/버전 비교 실구현(BE 필요). 폴링(#266). 개요 페이지 변경. 매수·매도 액션.
- 새 npm 의존성. BE 계약 변경. 새 features 슬라이스(이번엔 위젯 내 네비게이션으로 충분).

## Protected Files

없음.

## Requirements

- 이동 액션(리서치·포트폴리오·판단기록·알림)은 존재하는 라우트로만 연결. 없는 라우트 생성 금지.
- BE 미비 액션(팔로우·유사/버전 비교)은 비활성 + "준비 중" 명시. 영속화 없는 가짜 상태 금지.
- 매수·매도 버튼 없음. 색만으로 상태 표현 금지 — 텍스트 병기.
- 종목이 없으면 리서치 액션 비활성.

## Test Requirements

- `TopicActionChecklist` 테스트: 활성 액션 네비게이션 호출(리서치·포트폴리오·판단기록·알림), 종목 없을
  때 리서치 비활성, 준비 중 액션 비활성 표기. `MemoryRouter` 래핑.
- 토픽 상세 페이지 테스트: placeholder → 위젯 교체, affectedSymbols 전달, 부분 실패 무영향.
- 기존 테스트를 약화하지 않는다.

## Verification Commands

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Documentation Impact

- 설계문서 `docs/designs/198-news-insights.md` 화면-API 매핑·features 목록(액션·연결 3차)과 일치.
  이탈 시 문서 먼저 갱신.

## ADR Need

불요. 기존 라우팅·위젯 패턴을 따르는 골격 위젯 추가.

## Failure Record Need

불요.

## Risk Level

Low — 네비게이션 위주 골격 위젯. BE 미비 항목의 정직한 "준비 중" 처리와 종목 없음 비활성이 핵심.

## Expected Output

- `TopicActionChecklist` 위젯·페이지 교체·테스트 커밋(한국어 메시지). PR·push는 하지 마라.
- 검증 5종 결과 보고.

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
- 현재 체크아웃된 브랜치(feat/270-topic-action-checklist)를 유지한다(자체 브랜치 생성·push·PR 금지).
