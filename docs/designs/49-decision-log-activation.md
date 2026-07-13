# 49 · DecisionLog 활성화 (G10 BE 완료 후 계약 정렬)

상태: Draft — Codex 핸드오프 입력
스코프: FE DecisionLog 화면을 mock/로컬 임시에서 실제 `/decision-logs` API로 전환

## 1. 배경

- BE G10(`decision_logs` 도메인)이 **이미 완료**되어 있다. `GET·POST·GET/{id}·PATCH /api/v1/decision-logs` 제공. 정본 계약: `project_stock/docs/designs/decision-log-domain.md`.
- FE는 `48-remaining-wiring.md` §3.5의 "G10 BE 미완 전략"에 따라 `useDecisionLogs`를 `enabled: false` + 로컬 임시(mock)로 둔 상태. **이 전제는 더 이상 유효하지 않다.**
- 그러나 FE `dto.ts`/`adapters.ts`/모델이 옛 가정(`symbol`·`rationale`·`review_date`·5종 한글 enum)대로 작성되어 실제 BE 응답과 어긋난다. 단순 `enabled` 해제만으로는 동작하지 않는다.

## 2. 현행 불일치 (FE 현행 ↔ BE 정본)

| FE 현행 (`dto.ts`)                                                                               | BE 응답 (`DecisionLogResponse`)                                                                                                                                                     | 조치                                |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `symbol`                                                                                         | `ticker`                                                                                                                                                                            | 필드명 정렬 (계약: `ticker↔symbol`) |
| `rationale`                                                                                      | `reason`                                                                                                                                                                            | 매핑 (계약: `reason↔rationale`)     |
| `review_date`                                                                                    | `reviewed_at`                                                                                                                                                                       | 필드명 정렬                         |
| `decision_type` 값 5종(`WATCH_HOLD`/`NEEDS_RESEARCH`/`BUY_REVIEW`/`REDUCE_REVIEW`/`RISK_REVIEW`) | `decision_type` 10종 UPPER_SNAKE                                                                                                                                                    | enum 전면 재매핑 + 한글 라벨        |
| `decision_status`                                                                                | `decision_status`(OPEN/REVIEWED/CLOSED)                                                                                                                                             | OK                                  |
| `cognitive_risks`                                                                                | `cognitive_risks`                                                                                                                                                                   | OK                                  |
| `created_by`                                                                                     | `created_by`(USER/AI/SYSTEM)                                                                                                                                                        | OK                                  |
| `id`, `created_at`                                                                               | 동일                                                                                                                                                                                | OK                                  |
| (없음)                                                                                           | `decided_at`(필수·기본 정렬키), `company_name`, `summary`, `risk_note`, `action_plan`, `confidence_score`, `target_price`, `stop_loss_price`, snapshot들, `closed_at`, `updated_at` | FE 선택 사용                        |

## 3. 결정사항 (가정 — 리뷰 시 확정)

- **decision_type 한글 라벨 맵** (BE 10종 → FE 표시계층 한글화, 계약 §3 정본 표기 UPPER_SNAKE 유지):

  | enum            | 라벨(제안) |
  | --------------- | ---------- |
  | `WATCH`         | 관망       |
  | `BUY_CONSIDER`  | 매수 검토  |
  | `BUY`           | 매수       |
  | `HOLD`          | 보유 유지  |
  | `SELL_CONSIDER` | 매도 검토  |
  | `SELL`          | 매도       |
  | `SKIP`          | 보류       |
  | `REBALANCE`     | 리밸런싱   |
  | `TAKE_PROFIT`   | 차익 실현  |
  | `STOP_LOSS`     | 손절       |

- **rationale → reason**: FE 단일 `rationale`(판단 이유)는 BE `reason`에 매핑한다.
- **생성(POST) body**: 최소 필수 `ticker`, `decision_type`. FE 폼에서 `reason`(rationale), `cognitive_risks` 전달. **`reviewDate`는 POST에서 제외**한다 — BE POST는 `reviewed_at`을 받지 않으며 재검토 시점은 PATCH 라이프사이클(v0.2)에서 다룬다.
- **patterns / review memos**: 대응 BE 엔드포인트 없음 → 이번 스코프 제외. mock 유지하되 "BE 미지원" 주석/TODO 명시.
- **로컬 임시(mock 폴백) 제거**: `useDecisionLogs` 활성화 후 서버 데이터를 단일 소스로 사용. loading/empty/error 상태로 대체.

## 4. 변경 대상 (시그니처·책임)

### `src/features/decision-log/dto.ts`

- `DecisionLogDto`: BE `DecisionLogResponse` 정렬 — `ticker`, `reason`, `reviewed_at`, `decided_at` 등 실제 필드명. 화면이 쓰는 필드 + 정렬키(`decided_at`) 포함.
- `CreateDecisionLogBody`: `ticker`, `decision_type`, `reason?`, `cognitive_risks` (POST 계약 정렬). `review_date` 제거.

### `src/features/decision-log/adapters.ts`

- `adaptDecisionLog(dto): DecisionLog` — `ticker→symbol`, `reason→rationale`, `reviewed_at→reviewDate`, `decision_type`는 한글 라벨 맵(§3)으로 변환. 도메인 모델 `DecisionLog` 외부 형태는 화면 호환 유지.

### `src/features/decision-log/queries.ts`

- `useDecisionLogs()`: `enabled: false` 제거(또는 `true`). `initialData`/로컬 임시 제거. 페이지네이션 응답에서 목록 추출(기존 list 어댑터 패턴과 동일).
- `useCreateDecisionLog()`: 실제 `apiPost('/decision-logs', body)` 활성화. 성공 시 `['decision-logs']` 무효화.

### `src/shared/model/decisionType.ts`

- `decisionTypes` 라벨 세트를 BE 10종 기반으로 재정의(또는 enum↔라벨 맵 도입). 폼 드롭다운·`toLabel` 양쪽에서 사용.

### `src/pages/ui/DecisionLogPage.tsx`

- `useDecisionLogs`·`useCreateDecisionLog`를 단일 데이터 소스로 연결. `mockDecisionLogs`/`adaptMockDecisionLog`/`localLogs` 폴백 제거.
- 생성 폼: 드롭다운을 10종 enum 라벨로, 제출 시 `CreateDecisionLogBody`로 매핑(`reviewDate` 미전송). 제출 핸들러의 `void createBody`/`void mutate` 스텁 제거.
- loading(Skeleton)·empty(EmptyState)·error(ErrorState) 분기 정리. "G10 대기: 로컬 임시" 안내 문구 제거.
- patterns/memos 섹션은 mock 유지 + TODO 주석.

## 5. 테스트 영향

- `decision-log/adapters.test.ts`: 신규 필드명(`ticker`/`reason`/`reviewed_at`)·10종 enum 한글 라벨 단언으로 교체.
- `DecisionLogPage.test.tsx`: 서버 데이터 렌더, 생성 mutation 호출 body 단언, mock 폴백 제거에 따른 fixture 갱신.
- 시간 단언은 `TZ=UTC`.

## 6. Out of Scope

- patterns 통계·review memos의 BE 연동(엔드포인트 부재).
- PATCH 라이프사이클(재검토/종료) UI, snapshot·confidence·목표가 입력 UI.
- 다른 화면(Dashboard/Portfolio/Watchlist)의 mock 정리.
- BE 레포 변경(불요).

## 7. Open Questions

- decision_type 한글 라벨 문구 최종 확정(§3 제안 기준).
- 생성 폼의 `note`(메모) 필드 매핑처 — BE `summary`로 보낼지, 미전송할지.
- 생성 폼 드롭다운에 10종 전부 노출 vs 일부만.
