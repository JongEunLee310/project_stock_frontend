# Design — Issue 11: Decision Log(판단 기록) 페이지 (시안 반영)

> 시안 `decision-log.png` 기준 설계. 종목별 투자 판단을 기록·복기하는 화면.
> 좌측 본문은 KPI 요약 카드 + 판단 기록 로그 테이블, 우측 레일은 새 판단 기록 폼 +
> 자주 나온 판단 패턴 + 최근 복기 메모를 배치한다. 데이터는 `mockDecisionLogs`·
> `mockDecisionPatterns`·`mockReviewMemos`에서 파생하되, 시안의 필드를 담도록 도메인을 확장한다.

## 목적

`/decision-log`에서 과거 판단을 한눈에 검토하고(언제·무엇을·왜·어떤 인지 리스크로 판단했는지,
재검토 일정과 진행 결과), 새 판단을 빠르게 기록하며, 반복되는 판단 패턴과 최근 복기 메모로
의사결정 습관을 점검한다.

## 화면 구성 (시안 레이아웃)

라우트 `/decision-log`. 좌측 글로벌 내비게이션·상단 알림/동기화 표시는 `AppShell` 소관(범위 밖).
2단 구성: 좌측(요약 + 로그 테이블), 우측 레일(기록 폼 + 패턴 + 복기 메모).

1. **페이지 헤더** — "판단 기록" 제목.
2. **KPI 요약 카드 4** — 총 기록 수 · 이번 주 기록 · 관망 유지 · 리스크 증가 검토.
   `mockDecisionLogs`/`mockDecisionPatterns` **파생 집계**(신규 타입 없음, 시안 절대수는 예시).
3. **판단 기록 로그 테이블** — 공통 `Table<DecisionLog>` 재사용. 컬럼: 날짜/시간(`createdAt`) ·
   종목(`symbol`, `/research/:symbol` 링크) · 판단(`decisionType` `Badge`) · 판단 이유(`rationale`, 말줄임) ·
   인지 리스크(`cognitiveRisks` 태그 `Badge` 다중) · 재검토 일정(`reviewDate`) · 결과(`outcome` `Badge`).
   페이지네이션(pageSize 10, `Table` 내장). 상단 필터(일별/기간)는 자리표시(시각 프레임).
4. **새 판단 기록 폼 (우측 레일 상단)** — 입력 후 저장 시 목록 상단에 **로컬 추가**(영속화 없음).
   - 종목명/티커 `Input`(검색형).
   - 판단유형 select(`decisionTypes`).
   - 판단 이유 textarea(최대 500자, 글자 수 카운터).
   - 인지 리스크 체크박스(`cognitiveRisks` enum 9종 다중 선택).
   - 재검토 일정 날짜 입력.
   - 추가 메모 textarea.
   - 초기화(입력 리셋) · 저장(`Button`) 액션.
5. **자주 나온 판단 패턴 (우측 레일 중단)** — `mockDecisionPatterns`(판단유형별 누적 건수) 내림차순,
   CSS 막대바 + 비율%(파생) + 건수. 차트 라이브러리 미사용(Signals 신뢰도 막대 선례).
6. **최근 복기 메모 (우측 레일 하단)** — `mockReviewMemos` 리스트(날짜·종목·복기 제목·본문·"복기 보기" 자리 링크).

## 컴포넌트 책임

| 요소 | 위치 | 책임 |
| --- | --- | --- |
| `DecisionLogPage` | `pages/ui` | mock 조회·KPI/패턴 파생·하위 조합·기록 목록 로컬 상태(폼 저장) 보유. |
| KPI 카드 | 페이지 내부 | 라벨 + 값(파생 집계). |
| 로그 테이블 | 페이지 내부 | `Table<DecisionLog>` 컬럼 정의 + Badge 매핑 + 심볼 링크 + 페이지네이션. |
| 새 판단 기록 폼 | 페이지 내부 | 제어 입력(`useState`)·검증(최소 종목·판단유형)·저장 시 목록 prepend·초기화. |
| 판단 패턴 위젯 | 페이지 내부 | `mockDecisionPatterns` 정렬 + 비율 파생 + 막대바. |
| 복기 메모 위젯 | 페이지 내부 | `mockReviewMemos` 리스트. |

### 상태/유형/결과/인지 리스크 표시

- `DecisionLog.decisionType`(DecisionType)·`outcome`(DecisionOutcome)·`cognitiveRisks`(CognitiveRisk[])는
  모두 기존 `Badge` 재사용(인라인 색상 복제 금지).
  - **판단유형**: `Badge`에 `decisionType` 오버로드 추가 + `decisionTypeClassNames`로 매핑. 색상은
    **기존 `status-*` @theme 토큰 재사용**(관망 유지→watch-hold, 추가 리서치 필요→research, 매수 검토→buy,
    비중 축소 검토→reduce, 리스크 증가 검토→risk) → 신규 토큰 불필요.
  - **결과**: `Badge` `tone`(진행 중→info, 대기→neutral, 리서치 중→warning).
  - **인지 리스크 태그**: `Badge` `tone="neutral"`.

## 도메인·Mock 확장 (시안 필드 반영)

시안의 판단유형·결과·인지 리스크가 현재 타입과 맞지 않아 확장한다. 신규 enum은 기존
`as const` 배열 + 파생 union 패턴(`stockStatus.ts` 선례)을 따른다. 모든 mock 엔트리를 채우고
`satisfies`를 유지한다.

### enum 변경/신규 (`src/shared/model/`)

| 파일 | 처리 | 값 |
| --- | --- | --- |
| `decisionType.ts` | **재정의(교체)** | 관망 유지 · 추가 리서치 필요 · 매수 검토 · 비중 축소 검토 · 리스크 증가 검토 |
| `decisionOutcome.ts` | 신규 | 진행 중 · 대기 · 리서치 중 |
| `cognitiveRisk.ts` | 신규 | 밸류에이션 · 마진 압박 · 경쟁 심화 · 수요 둔화 · 규제 · 거시·금리 · 환율 · 공급망 · 기타 |

> 기존 `decisionTypes`(매수/비중 확대/관망/비중 축소/매도/보류)는 어떤 페이지도 사용하지 않는
> placeholder 값이라 시안 5값으로 **교체**한다(사용자 확정 2026-06-22). 기존 mock 2건·테스트는 새 값으로 재작성.

### 타입 필드 변경 (`src/shared/model/domain.ts`)

| 타입 | 변경 | 의미 |
| --- | --- | --- |
| `DecisionLog` | `cognitiveRisks: string[]` → `cognitiveRisks: CognitiveRisk[]` | 인지 리스크 태그(enum) |
| `DecisionLog` | `outcome: DecisionOutcome` 추가 | 판단 진행 결과(진행 중/대기/리서치 중) |

> `decision`·`rationale`·`reviewDate`·`createdAt`·`decisionType`·`symbol`·`id`는 유지. `decisionType`은
> 재정의된 enum을 그대로 참조한다(타입 시그니처 변화 없음, 허용 값만 변경).

### Mock 보강 (`src/shared/mock/domain.ts`, 파괴적 변경 주의)

- `mockDecisionLogs`: 시안처럼 한국어로 **12~14건** 재작성(NVDA/AAPL/TSLA/MSFT/AMZN/META/GOOGL/AVGO/CRM/AMD
  등). 각 항목에 재정의된 `decisionType`·신규 `outcome`·`cognitiveRisks`(enum 다중)·`rationale`·`reviewDate`·
  `createdAt` 채움. 페이지네이션 노출용으로 10건 초과. `satisfies DecisionLog[]` 유지.
- `mockDecisionPatterns`: 판단유형 5종 분포로 재작성(`label`=각 판단유형, `count`=누적 건수, 합≈전체).
  내림차순. `satisfies DecisionPattern[]` 유지.
- `mockReviewMemos`: 한국어 3~4건 재작성(`symbol`·`memo`·`reviewedAt`). `satisfies` 유지.
- 신규 enum·필드는 `src/shared/README.md` mock 설명에 한 줄 반영.

## 결정 (2026-06-22 확정, 시안 설계)

- **판단유형 enum 교체**: 기존 `decisionTypes`를 시안 5값으로 재정의(사용자 확정). 신규 토큰 없이 기존
  `status-*` @theme 토큰을 `decisionTypeClassNames`로 재사용.
- **신규 enum 2종**: `DecisionOutcome`(결과), `CognitiveRisk`(인지 리스크 태그/체크박스).
- **새 판단 기록 폼 = 로컬 추가**(사용자 확정): 저장 시 `useState` 목록에 prepend(영속화 없음, 새로고침
  초기화). Research 체크리스트·메모, Watchlist 즐겨찾기와 동일한 로컬 상태 선례.
- **로그 테이블 = 공통 `Table<DecisionLog>`** 재사용(task-006), pageSize 10 내장 페이지네이션. 필터는 자리표시.
- **KPI·패턴 = 파생 집계**(신규 요약 타입 없음, Signals 선례). 패턴 막대는 CSS(차트 라이브러리 금지).

## Out of Scope

- 판단 기록 서버 영속화·실시간 동기화(현 단계 mock·로컬 상태).
- 상단 필터(일별/기간) 실제 필터링, 페이지 크기 셀렉터 동작, "복기 보기" 상세 화면(모두 자리표시/링크만).
- 다른 페이지·라우팅·네비게이션·AppShell(알림·동기화 표시) 변경.
- 차트 라이브러리 도입(패턴은 CSS 막대바).
