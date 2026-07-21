# Codex Handoff Task — task-243: 판단 기록 재설계 셸·계약 타입·API 클라이언트

## Source Issue

FE #243 — 판단 기록 페이지 셸·라우팅 + entities/API 클라이언트. Epic
`project_stock_frontend#242`. BE 계약: `project_stock` PR #355(머지됨), ADR-016.

## Task Summary

판단 기록(Decision Log) 재설계의 FE 기반을 만든다. 기존 구 계약(`ticker`·`decision_status`·
`/stats`) 기반의 `features/decision-log`(dto/adapters/queries)와 `shared/model`의 판단 유형
매핑을 **신규 BE 계약으로 전면 교체**하고, 페이지 셸과 라우팅을 재설계 구조로 정리한다.
요약 카드·테이블(#244), 작성 패널(#245), 상세(#246)의 실제 UI는 이 태스크 범위가 아니다 —
이 태스크는 계약 타입·API 훅·라벨 매핑·셸을 제공해 후속을 받칠 준비만 한다.

## Goal

- `features/decision-log/dto.ts`가 신규 BE 계약(list-item·detail·overview·nested·create·
  activate·review-queue)을 반영한다.
- `features/decision-log/adapters.ts`가 신규 DTO를 도메인 모델로 변환한다.
- `features/decision-log/queries.ts`가 overview·list(필터)·detail·create·update-draft·
  activate·review-queue react-query 훅을 제공한다.
- `shared/model`의 판단 유형이 신규 9종으로 바뀌고, target 유형·상태·확신 수준·위험 태그·
  근거 관계 라벨 매핑이 추가된다.
- `/decision-log` 셸과 `/decision-log/:id` 상세 라우트 골격이 렌더된다.
- `pnpm format:check` / `pnpm lint` / `pnpm typecheck` / `pnpm test` 모두 통과.

## Background

BE 정본 계약은 `project_stock`의 `docs/designs/348-decision-log-redesign.md` §2(enum)·§4(API)다.
FE는 이 저장소에 없으므로 아래에 요지를 옮긴다. 값이 애매하면 이 요지를 따른다.

와이어 컨벤션: snake_case 필드, 금액 없음(이번 계약), 시각은 `...Z` ISO. 공통 엔벨로프
`ApiResponse`(`data` 래핑). 목록은 page 메타. `apiGet`/`apiPost`/`apiPatch`(`@/shared/api/
client`) 사용.

신규 enum(정본 영문, FE에서 한글 라벨):

- `TargetType`: `SYMBOL | PORTFOLIO | TOPIC | SECTOR | MARKET` → 종목/포트폴리오/토픽/섹터/시장.
- `DecisionType`(9종): `WATCH`(관찰 지속) · `RESEARCH_REQUIRED`(추가 리서치 필요) ·
  `HOLD`(관망 유지) · `BUY_REVIEW`(매수 검토) · `SELL_REVIEW`(매도 검토) ·
  `REDUCE_REVIEW`(비중 축소 검토) · `REBALANCE_REVIEW`(리밸런싱 검토) ·
  `THESIS_INVALIDATED`(투자 가설 훼손) · `NO_ACTION`(행동하지 않음).
- `DecisionStatus`: `DRAFT`(초안) · `ACTIVE`(진행 중) · `REVIEW_DUE`(재검토 예정) ·
  `REVIEWED`(복기됨) · `CLOSED`(종료) · `CANCELLED`(취소).
- `ConfidenceLevel`: `LOW`(낮음) · `MEDIUM`(중간) · `HIGH`(높음).
- `EvidenceRelationship`: `SUPPORTING`(긍정 근거) · `CONTRADICTING`(반대 근거) ·
  `RISK`(위험) · `BACKGROUND`(배경).
- `RiskSeverity`: `LOW`(낮음) · `MEDIUM`(중간) · `HIGH`(높음).
- `ReviewTriggerType`: `DATE | PRICE | METRIC | EVENT | SIGNAL_CHANGE | MANUAL`. 1차 UI는
  `DATE`만 다룬다.
- 위험 태그(`risk_type`, 자유 문자열): `VALUATION`(밸류에이션) · `DEMAND_SLOWDOWN`(수요 둔화)
  · `COMPETITION`(경쟁 심화) · `REGULATION`(규제) · `MARGIN_PRESSURE`(마진 압박) ·
  `SUPPLY_CHAIN`(공급망) · `MACRO_RATE`(금리) · `CURRENCY`(환율) · `CONCENTRATION`(포트폴리오
  쏠림) · `LIQUIDITY`(유동성) · `MANAGEMENT`(경영진) · `ACCOUNTING`(회계). 미지 값은 코드 그대로.

엔드포인트(base `/decision-logs`):

- `GET /overview` → `{ total_count, created_this_week, review_due_count, active_count,
  decision_type_distribution: [{type,count,share}], as_of }`.
- `GET /` (목록, page/size/sort + 필터 `target_type`·`symbol`·`decision_type`·`status`·
  `risk_type`·`review_due_before`) → `data: DecisionLogListItem[]`, page 메타.
  `DecisionLogListItem`: `{ id, target:{type,id,label?}, decision_type, summary,
  risks:string[], confidence_level, status, review_at?, created_at }`.
- `POST /` (생성, DRAFT) body: `{ target:{type,id}, decision_type, thesis?, rationale?,
  confidence_level?, supporting_reasons?:string[], counter_arguments?:string[],
  risks?:[{type,severity,description?}], evidence?:[...], review_triggers?:[{type,condition,
  scheduled_at?}] }`.
- `GET /{id}` (상세) → 본문 + `evidence:[{id,type,evidence_id?,version?,title,summary?,
  snapshot?,relationship,created_at}]` + `risks:[{id,type,description?,severity,created_at}]`
  + `review_triggers:[{id,type,condition,scheduled_at?,status,triggered_at?,created_at}]` +
  `snapshots:[{id,snapshot_type,data,captured_at}]`.
- `PATCH /{id}` (DRAFT 수정), `POST /{id}/activate` body `{ snapshots?:[{snapshot_type,data}] }`.
- `GET /review-queue` → `DecisionLogListItem[]`.

에러: 없음 404 `DECISION_LOG_NOT_FOUND`, 타인 403 `DECISION_LOG_FORBIDDEN`, 상태 위반 409
`DECISION_LOG_INVALID_STATE`, 검증 422 `VALIDATION_ERROR`.

## Implementation Scope

- `src/features/decision-log/dto.ts` — 신규 계약 DTO 전면 재작성(`*Dto` 네이밍 유지).
- `src/features/decision-log/adapters.ts` — 신규 DTO→도메인 모델 어댑터. 목록/상세/overview/
  근거/위험/트리거/스냅샷 변환.
- `src/features/decision-log/queries.ts` — react-query 훅: `useDecisionOverview`,
  `useDecisionLogs(filters)`, `useDecisionLog(id)`, `useCreateDecisionLog`,
  `useUpdateDecisionDraft`, `useActivateDecision`, `useReviewQueue`. 쿼리 키 정리.
- `src/shared/model/decisionType.ts` — 라벨을 신규 9종으로 교체.
- `src/shared/model/`(신규 파일들) — target 유형·상태·확신 수준·근거 관계·위험 태그 라벨
  매핑. `index.ts`에 export 추가. 기존 `cognitiveRisk.ts`는 위험 태그 매핑으로 대체하거나
  신규 파일로 두고 정리(구 판단 유형 참조 제거).
- `src/pages/ui/DecisionLogPage.tsx` — 셸로 축소. 후속(#244 카드·테이블, #245 폼)이 채울 수
  있게 레이아웃 골격과 데이터 훅 배선만 남긴다. 기존 구 계약 로직(ticker·stats·구 폼)은
  제거한다.
- `src/pages/ui/DecisionDetailPage.tsx`(신규) — 상세 라우트용 골격(#246이 채움).
- `src/app/router.tsx`·`src/shared/config/navigation.ts` — `/decision-log/:id` 상세 라우트
  추가(`appRoutePaths.decisionDetail` 등). 기존 `/decision-log` 유지.
- 깨지는 기존 테스트(`features/decision-log/adapters.test.ts`,
  `pages/ui/DecisionLogPage.test.tsx`) 갱신.

## Out of Scope

- 요약 카드·테이블 UI(#244), 작성 패널 UI(#245), 상세 화면 UI(#246)의 실제 구현.
- 복기·버전·이벤트 트리거·타 페이지 연결(2차 #247), 패턴·편향(3차 #248).
- BE, 다른 도메인 feature.
- 새로운 FSD 레이어(`entities/`) 신설 금지 — 이 저장소는 `features/<domain>` +
  `shared/model` 관례를 쓰므로 그 관례를 따른다(불필요한 추상화 금지).

## Protected Files

없음. `src/app/router.tsx`·`navigation.ts`는 라우트/경로 추가만 한다.

## Requirements

- 정본 enum은 DTO에 영문 그대로 두고, 표시 라벨은 `shared/model` 매핑으로만 만든다.
- 어댑터는 미지 enum 값에 안전하게 동작한다(코드 그대로 노출, throw 금지).
- 시각은 기존 `shared/lib/format`의 KST 포맷 유틸을 재사용한다.
- 목록 응답이 배열 또는 `{items}` 두 형태로 올 수 있으니 기존 `extractDecisionLogItems`
  패턴을 유지한다.
- 셸은 로딩·에러·빈 상태를 기존 `shared/ui`(Skeleton/ErrorState/EmptyState)로 처리한다.

## Test Requirements

- 어댑터 테스트: 신규 list-item·detail·overview DTO가 도메인 모델로 정확히 변환되는지,
  미지 enum 값 안전 처리.
- 셸 렌더 테스트: `/decision-log`가 로딩·에러·빈 상태를 렌더하고, 훅 배선이 동작하는지.
- 라우팅 테스트: `/decision-log/:id`가 상세 골격으로 매칭되는지.
- 기존 테스트는 삭제가 아니라 신규 계약에 맞게 갱신한다.
- 테스트는 기존 방식(MSW 또는 react-query mock)을 따른다.

## Verification Commands

```
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
```

네 개 모두 통과해야 한다(FE CI 4종).

## Documentation Impact

FE 로컬 문서 갱신은 불필요. BE 계약 정본은 `project_stock`에 있다. ADR 불필요(FE는 BE
결정을 소비). Failure Record 불필요.

## ADR Need

불필요.

## Failure Record Need

불필요.

## Risk Level

Medium — 계약 전면 교체로 기존 소비처·테스트가 넓게 바뀐다. UI 신설이 아니라 배선이 핵심.

## Expected Output

- 변경 파일: dto/adapters/queries, shared/model(다수), DecisionLogPage 셸,
  DecisionDetailPage 골격, router/navigation, 갱신된 테스트.
- 검증 4종 통과 로그.
- 현재 브랜치 `feat/243-decision-log-redesign` 유지(새 브랜치 금지). 한국어 `feat:` 커밋,
  `#243` 참조.
