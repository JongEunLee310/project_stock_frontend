# Codex Handoff Task — task-005: 도메인 재정렬 (FE#47)

## Source Issue

FE#47 `[계약정렬] 도메인 재정렬 — Signal/Stock/Alert/Portfolio (G8·G9)`
설계 기록: `docs/designs/47-domain-realignment.md`
계약 정렬: `docs/api/contract-alignment.md` G8·G9·C4·C5·C6·C8

## Task Summary

BE 확정 계약 기준으로 FE 도메인 타입과 어댑터(DTO→도메인 변환)를 재정의한다.
Signal·Stock·Alert·AlertCandidate·Portfolio·PriceSeries 5개 도메인을 교체하고,
기존 AlertRule(규칙 빌더·채널)은 폐기한다.

## Goal

- `src/shared/model/`에 BE 계약 기준 도메인 타입이 정의된다.
- `src/shared/api/adapters/`에 도메인별 어댑터가 존재하며 DTO → 도메인 변환을 담당한다.
- `pnpm typecheck`·`pnpm lint`·`pnpm test`가 모두 통과한다.
- 기존 Mock 데이터가 새 도메인 타입을 만족한다(컴파일 타임 검증).

## Background

- #45(머지): 어댑터 기반 계층 `src/shared/api/`(envelope 언랩·errorCodes·paging),
  `src/shared/lib/format/`(parseDecimal·금액/비율·KST 포맷·enum 라벨). 이 위에 도메인 모델을 얹는다.
- #46(머지): `src/shared/api/client.ts` 인증 클라이언트.
- BE#97 동결 계약(`project_stock/docs/designs/price-series-api.md` "Frozen Contract" 섹션):
  가격 시계열 와이어 포맷. `bars[].date`는 YYYY-MM-DD 타임존 없음 — 타임존 변환 금지.
  `last_updated_at`만 UTC Z.
- BE Signal enum: `WATCH·RISK_ALERT·THESIS_BROKEN·BUY_CANDIDATE·SELL_REVIEW·OVERHEATED`
- BE `risk_level`: `str | None` 자유 문자열 확정(enum 없음). FE는 `string | null`, 알려진 값만 한글 라벨.
- BE Alert status enum: `UNREAD·READ·DISMISSED`
- BE AlertCandidate status: `UNREAD·READ·CONFIRMED`, type: `NEWS_SURGE·PRICE_MOVEMENT·DISCLOSURE·PORTFOLIO_CONCENTRATION·BUY_CHECKLIST_REQUIRED`
- BE AlertImportance: `LOW·MEDIUM·HIGH`
- 가격 시계열 `GET /stocks/{symbol}/prices`: 공개 GET, 인증 불필요 확정.
- watchlist expand asset 응답: `AssetBriefDto({symbol, name, price, change_percent, sector?})` — `AssetDetailDto`와 다른 축약 DTO 확정. signals expand(BE 후속)도 같은 구조 재사용 예정.
- Signal symbol 해소: `SignalDto`에 `asset?: AssetBriefDto | null` 옵셔널. expand 미지원 기간은 뷰레이어가 기존 asset 목록에서 assetId로 fallback(Signal마다 개별 fetch 금지).

필드 1:1 매핑 상세, DTO 타입 표, 어댑터 시그니처 전체는
`docs/designs/47-domain-realignment.md`에 있다. 구현 전 반드시 읽을 것.

## Implementation Scope

아래 파일만 생성·수정한다.

**신규 생성**

- `src/shared/model/signal.ts` — Signal(+`asset?: AssetBrief | null`), SignalType enum + 한글 라벨 맵, riskLevel 라벨 맵
- `src/shared/model/priceSeries.ts` — PriceSeries, PriceBar + DTO 타입
- `src/shared/model/stock.ts` — StockViewModel, AssetBrief, AssetBriefDto + AssetDetailDto 타입
- `src/shared/model/alert.ts` — Alert, AlertCandidate + 관련 enum + DTO 타입
- `src/shared/model/portfolio.ts` — PortfolioSummary, PositionWeight, SectorWeight + DTO 타입
- `src/shared/api/adapters/priceSeriesAdapter.ts`
- `src/shared/api/adapters/assetAdapter.ts` — `adaptAssetBrief`(공용) + `adaptAssetDetail`
- `src/shared/api/adapters/signalAdapter.ts` — `dto.asset` 옵셔널 처리 포함
- `src/shared/api/adapters/alertAdapter.ts`
- `src/shared/api/adapters/portfolioAdapter.ts`

**수정 가능**

- `src/shared/model/` 기존 파일(구 도메인 타입 교체)
- 기존 Mock 데이터 파일(새 타입에 맞게 갱신)
- 기존 `src/shared/api/` 인덱스(export 추가)

## Out of Scope

- 실제 API 호출·훅·서버 상태 관리 구현 (#48 범위)
- 화면/컴포넌트 실제 렌더 로직 변경
- 라우팅 변경
- 인증 흐름(#46 완료)
- DecisionLog 도메인(G10 BE 신규 완료 전 — FE 로컬 임시 유지)
- 새 의존성 패키지 추가
- `pnpm format` 전체 실행 금지 — 변경 파일만 format

## Protected Files

- `docs/designs/47-domain-realignment.md` — 읽기 전용(설계 기록). 수정 금지.
- `.codex/tasks/task-005-domain-realignment.md` — 수정 금지.
- `docs/decisions/ADR-*.md` — 수정 금지.
- `docs/harness/` 하위 전체 — 수정 금지.
- `src/shared/api/client.ts` — #46 결과. 수정 금지.

## Requirements

1. **Signal 타입 교체**: 구 `kind/confidence/trendSeries/previousStatus` → 신 `signalType/score/riskLevel/reason/evidence/expiresAt/isExpired/asset?`. `assetId: number` 추가, `symbol: string` 보조 유지.
2. **SignalType enum**: `WATCH·RISK_ALERT·THESIS_BROKEN·BUY_CANDIDATE·SELL_REVIEW·OVERHEATED` + 한글 라벨 맵 `Record<SignalType, string>`. `riskLevel` 라벨 맵도 추가(`HIGH/MEDIUM/LOW` → 한글, 그 외 원문 fallback).
3. **Signal asset optional**: `Signal.asset?: AssetBrief | null`. `SignalDto`에서 `dto.asset`이 있으면 `adaptAssetBrief`로 매핑, 없으면 `null`. expand 미지원 기간 fallback(뷰레이어가 assetId로 조회)은 Codex가 별도 구현하지 않아도 된다 — Signal 타입에 필드만 자리를 잡아두면 충분하다.
4. **PriceSeries 신규**: `PriceBarDto`(snake_case) + `PriceBar`(camelCase) + `PriceSeries` + `PriceSeriesDto`. `adaptPriceSeries` 어댑터는 `bars[].date`를 **타임존 변환 없이** 그대로 통과시켜야 한다(`new Date()` 생성 금지). `PriceSeries` fetch는 인증 헤더 필수 의존 없이 작동해야 한다.
5. **AssetBrief 공용 DTO/타입**: `AssetBriefDto({symbol, name, price, change_percent, sector?})` + `AssetBrief` 도메인 타입 + `adaptAssetBrief`. `AssetDetailDto` 재사용 금지.
6. **StockViewModel**: `AssetDetailDto` 기준 합성 뷰모델. Decimal 문자열 필드는 `parseDecimal`로 변환. G7 nullable 펀더멘털 필드 포함.
7. **Alert + AlertCandidate 인박스 모델**: 기존 AlertRule 타입 및 Mock 참조 제거. `AlertStatus`, `AlertCandidateType`, `AlertImportance`, `AlertCandidateStatus` enum 정의.
8. **PortfolioSummary**: `cash_weight`·`sector_weights` BE 계산값 직접 수용. 클라이언트 파생 로직 제거.
9. **식별자 C4**: 모든 도메인 타입 `assetId: number` 정본. `symbol: string` 보조 병존.
10. **enum 표기 C8**: 와이어 enum 영문 UPPER_SNAKE 유지. 한글 라벨은 라벨 맵을 통해서만 제공.
11. **Decimal C5**: OHLC·가격·비율 모든 Decimal 문자열 필드는 어댑터 경계에서 `parseDecimal`로 `number` 변환.
12. Mock 데이터가 새 타입을 `satisfies` 또는 명시 타입 주석으로 컴파일 타임 만족해야 한다.

## Test Requirements

- 어댑터 단위 테스트(각 파일별 최소 1케이스):
  - `priceSeriesAdapter`: `bars[].date`가 원본 `YYYY-MM-DD` 문자열 그대로인지 단언. `lastUpdatedAt`은 `...Z` 유지 확인.
  - `signalAdapter`: `signalType` enum 매핑, `score` number 변환. `asset` 옵셔널 처리(`dto.asset=null`이면 `null` 반환, 있으면 `adaptAssetBrief` 경유).
  - `assetAdapter(adaptAssetBrief)`: `AssetBriefDto` → `AssetBrief` Decimal 변환, `sector null` 통과.
  - `assetAdapter(adaptAssetDetail)`: nullable 펀더멘털 필드 `null` 통과 확인.
  - `alertAdapter`: `AlertStatus`·`AlertCandidateStatus` enum 매핑.
  - `portfolioAdapter`: `cashWeight`, `sectorWeights[].weight` Decimal 변환.
- 날짜 단언 테스트는 `TZ=UTC` 환경에서 실행한다(package.json 또는 vitest.config에 env 추가 권장).
- 기존 테스트 통과 유지.

## Verification Commands

```bash
pnpm lint
pnpm typecheck
pnpm test
# 변경 파일만 format (전체 금지)
pnpm exec prettier --write <변경된 파일 목록>
pnpm format:check
```

## Documentation Impact

- `docs/designs/6-domain-types-and-mock-data.md` — 구 도메인 타입 문서. 파일 상단에 "Superseded by FE#47 — `47-domain-realignment.md` 참조" 한 줄 추가. 내용 삭제 금지.
- `docs/designs/47-domain-realignment.md` — 이미 작성됨. 수정 금지.

## ADR Need

ADR-004(서버 상태·API 클라이언트·어댑터 계층 도입)의 후속이다. 신규 ADR 불필요.
단, 어댑터 계층 구조가 ADR-003(파운데이션 스택) 범위를 벗어난다고 판단되면 구현 중단하고 보고.

## Failure Record Need

불필요(정상 범위). 단, `bars[].date` 타임존 처리에서 오프바이원이 발생하면 `FAILURE-002`로 기록.

## Risk Level

**중간**. 도메인 타입 전면 교체로 기존 Mock 데이터·컴포넌트 참조가 깨질 수 있다. 타입 오류는
`pnpm typecheck`가 잡아주므로 typecheck 통과를 핵심 게이트로 삼는다.

가장 까다로운 포인트: `bars[].date` 타임존 변환 금지. `new Date("2026-06-24")`는 브라우저에서
UTC 자정으로 파싱돼 KST 환경에서 `2026-06-23`으로 표시되는 오프바이원이 발생한다.
어댑터는 `date` 문자열을 변환 없이 통과시켜야 한다.

## Expected Output

- `src/shared/model/` 신규 타입 파일 5개
- `src/shared/api/adapters/` 신규 어댑터 파일 5개
- 기존 Mock 데이터 갱신(새 타입 만족)
- `docs/designs/6-domain-types-and-mock-data.md` 상단 Superseded 주석 1줄
- `feat/fe-47-domain-realignment` 브랜치(최신 `feat/fe-foundation-setup` 기준)에서 PR 1건
- 검증 결과, 열린 질문(OQ-1~4) 중 구현 중 결정한 항목 보고

## Rules

- `docs/designs/47-domain-realignment.md` 설계 기록 기준으로 구현. 범위 이탈 시 중단하고 보고.
- 검증 약화 금지. typecheck·lint·test 모두 통과해야 한다.
- 보호 파일 수정 금지.
- 가정·결정·열린 질문 처리 결과를 PR 본문에 명시.
