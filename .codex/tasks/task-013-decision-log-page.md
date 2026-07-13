# Codex Handoff Task — task-013: Decision Log(판단 기록) 페이지 (이슈 11, 시안 반영)

## Source Issue

- 이슈 11. `[FE] Decision Log 페이지 구현` (Closes #11)
- 설계 기록: `docs/designs/11-decision-log-page.md` (시안 `decision-log.png` 반영)
- 의존(머지됨): task-005 Badge(PR #28), task-006 Table(PR #29), task-007 도메인·Mock 확장(PR #30),
  task-012 Research(PR #34)
- 기반 브랜치: `feat/fe-decision-log-page`(최신 `main` 404e530에서 분기, 본 설계·핸드오프 커밋 포함)

## Task Summary

`DecisionLogPage`를 플레이스홀더에서 시안 기반 실제 화면으로 교체한다. 먼저 시안의 판단유형·결과·인지
리스크를 담도록 **도메인·Mock을 확장(Part A)**하고, 그 위에 KPI 요약 카드, **판단 기록 로그 테이블
(공통 `Table` 재사용)**, **새 판단 기록 폼(로컬 추가)**, 자주 나온 판단 패턴(CSS 막대), 최근 복기 메모를
**구현(Part B)**한다.

> **enum 교체 주의**: 기존 `decisionTypes`(매수/비중 확대/관망/비중 축소/매도/보류)를 시안 5값으로
> **재정의**한다(사용자 확정). 기존 mock 2건·테스트는 새 값으로 재작성. 차트 라이브러리 도입 금지(패턴은 CSS 막대바).

## Goal

- `/decision-log`에서 시안 레이아웃의 판단 기록 화면이 표시된다.
- **KPI 요약 카드 4**: 총 기록 수 · 이번 주 기록 · 관망 유지 · 리스크 증가 검토(모두 mock 파생 집계).
- **판단 기록 로그 테이블**: 공통 `Table<DecisionLog>`. 컬럼 = 날짜/시간 · 종목(→`/research/:symbol` 링크) ·
  판단(`decisionType` `Badge`) · 판단 이유(말줄임) · 인지 리스크(`cognitiveRisks` 태그 `Badge` 다중) ·
  재검토 일정 · 결과(`outcome` `Badge`). pageSize 10 내장 페이지네이션. 상단 필터는 자리표시.
- **새 판단 기록 폼**: 종목 `Input` · 판단유형 select · 판단 이유 textarea(최대 500자 카운터) · 인지 리스크
  체크박스(9종) · 재검토 일정 날짜 · 추가 메모 textarea · 초기화/저장. **저장 시 목록 상단에 로컬 추가**
  (영속화 없음, 새로고침 초기화), 초기화는 입력 리셋.
- **자주 나온 판단 패턴**: `mockDecisionPatterns`(판단유형별 누적) 내림차순 + 비율%(파생) + 건수 CSS 막대바.
- **최근 복기 메모**: `mockReviewMemos` 리스트(날짜·종목·복기 제목·본문·"복기 보기" 자리 링크).
- 기존 공통 컴포넌트(`Badge`/`Button`/`Card`/`Input`/`Table`) 재사용.

## Background

- 기존 `DecisionLogPage`는 `PagePlaceholder` 래퍼(`src/pages/ui/DecisionLogPage.tsx`).
- 데이터: `src/shared/mock/domain.ts`의 `mockDecisionLogs`(현재 2건, 영문·구 enum) ·
  `mockDecisionPatterns`(현재 3건 영문) · `mockReviewMemos`(현재 2건 영문) — 모두 시안에 맞춰 재작성.
- 공통 `Table<T>`(`src/shared/ui/Table.tsx`): `columns`(key/header/cell/align/sortable) · `rows` ·
  `getRowKey` · `onRowClick` · `emptyMessage` · `pagination`({pageSize, …}) 지원. Watchlist(task-009)에서
  컬럼·페이지네이션·`onRowClick` 사용 선례.
- `Badge`(`src/shared/ui/Badge.tsx`)는 `status`(StockStatus)·`riskLevel`(RiskLevel)·`tone`(BadgeTone) 판별
  유니온. 색상은 `src/shared/ui/stockStatus.ts`의 `*ClassNames` 레코드(@theme `status-*` 토큰)로 매핑.
- 라우트: `appRoutePaths.research`·`appRoutePaths.decisionLog`(`src/shared/config/navigation.ts`). 종목 링크는
  `react-router-dom`의 `Link`(`/research/${symbol}`).
- 시간 표시 포매터는 **명시적 `timeZone: 'Asia/Seoul'`** 고정(Watchlist·Signals·Research 선례 — 미지정 시
  CI(UTC) 시간 단언 테스트가 깨짐). 날짜 문자열(YYYY-MM-DD)·표시 문자열은 그대로 표기 가능.
- 컨벤션: `docs/knowledge/frontend-conventions.md` — 공통 컴포넌트 우선, 네이티브 다이얼로그 금지.

## Implementation Scope

### A. 도메인·Mock 확장

enum 처리(기존 `as const` 배열 + 파생 union 패턴 = `stockStatus.ts` 선례):

- `src/shared/model/decisionType.ts` — **재정의(교체)**:
  `decisionTypes = ['관망 유지','추가 리서치 필요','매수 검토','비중 축소 검토','리스크 증가 검토'] as const`
  (기존 매수/비중 확대/관망/비중 축소/매도/보류 6값 폐기). `type DecisionType = (typeof decisionTypes)[number]`.
- `src/shared/model/decisionOutcome.ts` — 신규:
  `decisionOutcomes = ['진행 중','대기','리서치 중'] as const` + `type DecisionOutcome`.
- `src/shared/model/cognitiveRisk.ts` — 신규:
  `cognitiveRisks = ['밸류에이션','마진 압박','경쟁 심화','수요 둔화','규제','거시·금리','환율','공급망','기타'] as const`
  - `type CognitiveRisk`. (배열명이 `DecisionLog.cognitiveRisks` 필드명과 겹치니 export 충돌 없게 주의 —
    enum 배열 export명은 그대로 `cognitiveRisks`로 두되, 도메인 타입 필드는 `CognitiveRisk[]` 타입만 참조.)
- `src/shared/model/index.ts`에 신규 enum 값·타입 re-export 추가.

`src/shared/model/domain.ts` 타입 변경:

- `DecisionLog.cognitiveRisks: string[]` → `cognitiveRisks: CognitiveRisk[]`.
- `DecisionLog` += `outcome: DecisionOutcome`.
- (유지) `id`·`symbol`·`decision`·`decisionType`·`rationale`·`reviewDate`·`createdAt`. `decisionType`은 재정의된
  enum을 그대로 참조(타입 시그니처 변화 없음).

`src/shared/mock/domain.ts` 보강(파괴적 변경 주의):

- `mockDecisionLogs`: 한국어로 **12~14건** 재작성(NVDA/AAPL/TSLA/MSFT/AMZN/META/GOOGL/AVGO/CRM/AMD 등 시안
  종목). 각 항목에 재정의 `decisionType`·신규 `outcome`·`cognitiveRisks`(enum 다중, 1~3개)·구체 `rationale`·
  `reviewDate`(YYYY-MM-DD)·`createdAt`(ISO) 채움. pageSize 10 페이지네이션 노출 위해 **10건 초과**. `satisfies` 유지.
- `mockDecisionPatterns`: 판단유형 5종 분포로 재작성(`label`=각 판단유형 문자열, `count`=누적 건수, 합이 KPI
  총 기록 수와 일관되게). 내림차순. `satisfies DecisionPattern[]` 유지.
- `mockReviewMemos`: 한국어 3~4건 재작성(`symbol`·`memo`·`reviewedAt`). `satisfies` 유지.
- 시안값 참고: 판단유형 분포(관망 유지 최다 → … → 리스크 증가 검토), 인지 리스크는 위 9종에서 선택.
- 기존 `src/shared/mock/domain.test.ts`가 `decisionType`을 단언(길이>0)하므로 재작성 후에도 통과해야 함.
- 신규 enum·필드 추가는 `src/shared/README.md` mock 설명에 한 줄 반영.

### Badge 판단유형 매핑 (`src/shared/ui/stockStatus.ts`, `src/shared/ui/Badge.tsx`)

- `src/shared/ui/stockStatus.ts`에 `decisionTypeClassNames: Record<DecisionType, string>` 추가. **신규
  @theme 토큰 없이 기존 `status-*` 토큰 재사용**:
  관망 유지→`status-watch-hold-*`, 추가 리서치 필요→`status-research-*`, 매수 검토→`status-buy-*`,
  비중 축소 검토→`status-reduce-*`, 리스크 증가 검토→`status-risk-*`. `DecisionType` 타입 re-export.
- `src/shared/ui/Badge.tsx` 판별 유니온에 `{ decisionType: DecisionType }` 오버로드 추가(기존 status/
  riskLevel/tone 유지, 하위 호환). `toneClassName` 체인에 `decisionType` 분기 추가.
- `src/shared/ui/index.ts`에 `decisionTypeClassNames`·`DecisionType` re-export 추가.
- **결과**(`outcome`)와 **인지 리스크 태그**는 기존 `tone`으로 표현: 진행 중→`info`, 대기→`neutral`,
  리서치 중→`warning`; 인지 리스크 태그→`neutral`. (신규 토큰/오버로드 불필요.)

### B. 페이지 구현 (`src/pages/ui/DecisionLogPage.tsx`)

설계 `docs/designs/11-decision-log-page.md` 레이아웃대로 구현:

- **페이지 헤더** — "판단 기록".
- **KPI 카드 4**(`Card`) — 총 기록 수 · 이번 주 기록 · 관망 유지 · 리스크 증가 검토. `mockDecisionLogs`/
  `mockDecisionPatterns` 파생 집계(이번 주 = `createdAt` 최근 7일, 판단유형별 건수). 신규 요약 타입 금지.
- **판단 기록 로그 테이블** — `Table<DecisionLog>`. 컬럼 정의(날짜/시간·종목 링크·판단 `Badge`·이유 말줄임·
  인지 리스크 태그 `Badge` 다중·재검토 일정·결과 `Badge`), `getRowKey`=id, `pagination={{ pageSize: 10 }}`.
  상단 필터(일별/기간)는 비활성 자리표시.
- **새 판단 기록 폼**(`Card`) — 제어 입력(`useState`): 종목 `Input`, 판단유형 select(`decisionTypes`),
  판단 이유 textarea(`maxLength={500}` + 글자 수 표시), 인지 리스크 체크박스(`cognitiveRisks` 9종 다중),
  재검토 일정 `<input type="date">`, 추가 메모 textarea, 초기화·저장 `Button`. **저장**: 최소 검증(종목·
  판단유형) 후 새 `DecisionLog`를 생성해 목록 상태 **prepend**, 폼 리셋. **초기화**: 입력만 리셋. 영속화 없음.
  네이티브 `alert/confirm` 금지(검증 실패는 인앱 안내 텍스트).
- **자주 나온 판단 패턴**(`Card`) — `mockDecisionPatterns` 내림차순, 비율%(count/합 파생) + 건수 + CSS 막대바
  (예: `role="meter"` 또는 단순 width% div). 차트 라이브러리 금지.
- **최근 복기 메모**(`Card`) — `mockReviewMemos` 리스트(날짜·종목·복기 제목·본문·"복기 보기" 자리 링크).
- 판단유형/결과/인지 리스크 라벨·톤 매핑은 `Badge` 재사용(인라인 색상 복제 금지).

## Out of Scope

- 판단 기록 서버 영속화·실시간 동기화(현 단계 mock·로컬 상태).
- 상단 필터(일별/기간) 실제 필터링, 페이지 크기 셀렉터 동작, "복기 보기" 상세 화면(자리표시/링크만).
- 다른 페이지·라우팅·네비게이션·AppShell 변경. 차트 라이브러리 도입(패턴은 CSS 막대바).

## Protected Files

- `src/index.css`는 `@theme` 토큰 **추가만** 허용(기존 토큰 수정/삭제 금지). 본 task는 **기존 `status-*`
  토큰 재사용**으로 신규 토큰 추가 불필요(추가 시 최소화).
- 그 외 보호 파일(AGENTS.md/CLAUDE.md/.codex/instructions·agents·config/ci.yml/docs/harness·decisions·
  failures) **수정 금지**.

## Requirements

- enum은 `as const` + 파생 union 패턴(`stockStatus.ts` 선례). `decisionTypes`는 시안 5값으로 교체.
- 도메인 필드 변경 시 모든 mock 엔트리를 채우고 `satisfies` 유지(파괴적 변경 회피).
- 상태·판단유형·결과·인지 리스크 표시는 `Badge` 재사용 — 색상 클래스 인라인 복제 금지.
- 시간 포매터는 `timeZone: 'Asia/Seoul'` 고정. 날짜 문자열·표시 문자열은 그대로 표기 가능.
- 네이티브 다이얼로그(alert/confirm/prompt) 금지 — 필요 시 인앱 UI.
- 폼·기록 목록은 제어 컴포넌트(`useState`)로 동작. 차트 라이브러리 추가 금지(CSS 막대만).

## Test Requirements

- `src/pages/ui/DecisionLogPage.test.tsx` 신규: (1) 헤더·KPI 카드 렌더, (2) 로그 테이블에 mock 행 표시
  (종목·판단유형 Badge·결과 Badge), (3) 새 판단 기록 폼 저장 시 목록 상단에 새 행 추가(종목·판단유형 입력 →
  저장 → 행 수 증가/새 종목 노출), (4) 초기화가 입력을 리셋, (5) 자주 나온 판단 패턴 항목 렌더, (6) 최근 복기
  메모 렌더.
- 시간 단언이 있으면 **타임존 독립**(포매터 `timeZone` 고정 전제). 가능하면 종목/판단유형/결과/숫자/라벨로
  단언해 시간 문자열 단언 회피. `createMemoryRouter`로 라우트 진입(종목 `Link` 렌더 위해 Router 컨텍스트 필요,
  Signals/Research 테스트 선례).
- `App.test.tsx` 등 기존 테스트가 `/decision-log` 플레이스홀더 제목("Decision Log")을 단언하면 실제 제목
  ("판단 기록")으로 정합 갱신. `src/shared/mock/domain.test.ts`는 재작성한 mock에서도 통과해야 함.

## Verification Commands

```bash
pnpm format:check
pnpm lint
pnpm typecheck
TZ=UTC pnpm test   # CI(UTC) 환경 재현 — 시간 단언이 있으면 반드시 통과해야 함
pnpm build
```

> 커밋 전 변경 파일에 한정해 `prettier --write`. 로컬이 KST라 시간 단언은 `TZ=UTC pnpm test`로 재현 확인.

## Documentation Impact

- 설계 `docs/designs/11-decision-log-page.md`와 구현 일치. mock 재작성·enum 변경은 `src/shared/README.md`
  도메인/mock 설명에 반영. ADR·실패 기록 불필요(기존 FSD·도메인 점진 확장, 신규 아키텍처 결정 없음).
  Badge `decisionType` 추가는 기존 컴포넌트의 하위 호환 확장.

## ADR Need

불필요.

## Failure Record Need

불필요.

## Risk Level

Medium. 기존 `decisionTypes` enum 교체 + `DecisionLog` 타입 변경(필수 필드 추가·필드 타입 변경) → 기존
mock·테스트 재작성 필요. 파괴적 변경 회피를 위해 mock 전수 채움·`satisfies`·`typecheck` 통과 확인 필수.

## Expected Output

- 변경: `src/shared/model/decisionType.ts`(재정의)·`decisionOutcome.ts`·`cognitiveRisk.ts`(신규)·
  `src/shared/model/domain.ts`(필드 변경)·`src/shared/model/index.ts`(re-export)·`src/shared/mock/domain.ts`
  (재작성)·`src/shared/ui/stockStatus.ts`(decisionTypeClassNames)·`src/shared/ui/Badge.tsx`(decisionType
  오버로드)·`src/shared/ui/index.ts`(re-export)·`src/pages/ui/DecisionLogPage.tsx`(구현)·
  `src/pages/ui/DecisionLogPage.test.tsx`(신규)·`src/shared/README.md`(설명), 필요 시 `App.test.tsx`·
  `src/shared/mock/domain.test.ts` 정합.
- 브랜치 `feat/fe-decision-log-page`에 커밋(새 PR은 Claude가 생성, Codex는 push까지).
- `TZ=UTC pnpm test` 통과 결과 보고.

## Rules

- 범위 내(이슈 11 Decision Log + 시안 도메인·Mock 확장)만. 다른 페이지·리팩터링·기능 변경 금지.
- 도메인 변경은 시안 표 범위로 한정(임의 신규 타입·필드 추가 금지). 공통 컴포넌트(`Table`/`Badge` 등) 우선 재사용.
- 보호 파일 수정 금지(`src/index.css`는 토큰 추가만, 본 task는 기존 토큰 재사용). 차트 라이브러리 추가 금지.
- `TZ=UTC pnpm test`로 CI 환경 재현 확인 후 보고.
