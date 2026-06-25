# Codex Handoff Task

## Source Issue

JongEunLee310/project_stock_frontend#48 — [계약정렬] 화면별 API 연동 (§4). 본 핸드오프는
**Signals·Research·Alerts·Settings·DecisionLog 5화면(잔여분)**을 다룬다. 선행 3화면
(Dashboard·Watchlist·Portfolio)은 머지 완료. 설계기록: `docs/designs/48-remaining-wiring.md`.

## Task Summary

잔여 5화면을 `src/shared/mock` 직접 import에서 실제 API(`src/shared/api/client.ts`) 기반
TanStack Query + 어댑터(DTO→도메인) 연동으로 교체한다. 선행 라운드가 확립한 feature 세그먼트
패턴을 동일하게 따른다.

## Goal

완료 시 참:

- Signals 목록/상세가 `GET /signals`(+`asset_id`)·`GET /signals/{id}`로 렌더되고, 모멘텀
  스파크라인은 `GET /stocks/{symbol}/prices`로 공급된다. confidence는 `score`로 매핑.
- Research가 `GET /assets?symbol=`로 assetId 해소 후 detail/research-summary/buy-checklist/
  reports/theses + prices로 렌더된다.
- Alerts가 `GET /alerts`·`/alert-candidates`로 렌더되고 read/dismiss/confirm mutation이
  동작(성공 시 목록 무효화)한다.
- Settings가 `GET /auth/me`로 프로필을 렌더한다.
- DecisionLog가 `GET·POST /decision-logs`로 연동된다(엔드포인트 부재 시 로컬 폴백 + 주석).
- 각 연동 영역에 로딩(`Skeleton`)·에러(`ErrorState`)·빈(`EmptyState`) 상태가 연결된다.
- `pnpm lint && pnpm typecheck && TZ=UTC pnpm test && pnpm format:check`가 모두 통과한다.

## Background

- 와이어 계약 단일 출처: `project_stock/docs/api/frontend-api-spec.md`. 응답은 공통 envelope
  `{data,message,error,meta}`이며 `apiGet`/`apiPost`(`src/shared/api/client.ts`)가 언랩해
  `{data,meta}` 반환. 인증 헤더·401 lazy refresh는 client가 처리(`auth` 기본 true).
- 화면별 목표 매핑·갭은 `docs/api/contract-alignment.md` §4/§5/§6 및 설계기록 §3을 그대로 따른다.
- 금액·비율은 **문자열 Decimal**, enum은 영문 UPPER_SNAKE, datetime은 와이어 UTC / 표시 KST.
- 재사용 프리미티브(`src/shared/lib/format`): `parseDecimal`, `formatMoney`, `formatPercent`,
  `formatKstDate(Time)`, `toLabel`/`riskLevelLabels`. 페이징: `src/shared/api/paging.ts`.
  상태 컴포넌트: `src/shared/ui`의 `Skeleton`·`ErrorState`·`EmptyState`.
- 기반(QueryClientProvider·queryClient 팩토리·apiGet/apiPost)은 선행 라운드에서 도입 완료.
  본 작업은 신규 라이브러리 도입 없이 feature 세그먼트만 추가한다.
- **도메인 갭(중요)**: BE 출처 없는 mock 필드는 연동하지 말고 mock 유지 + 후속 주석. 설계기록 §3.

## Implementation Scope

설계기록 §4 파일 목록. 신규:

- `src/features/signals/{dto,adapters,queries}.ts` + `adapters.test.ts`
- `src/features/research/{dto,adapters,queries}.ts` + `adapters.test.ts`
- `src/features/alerts/{dto,adapters,queries}.ts` + `adapters.test.ts`
- `src/features/settings/{dto,adapters,queries}.ts` + `adapters.test.ts`
- `src/features/decision-log/{dto,adapters,queries}.ts` + `adapters.test.ts`

변경:

- `src/pages/ui/SignalsPage.tsx`·`ResearchPage.tsx`·`AlertsPage.tsx`·`SettingsPage.tsx`·
  `DecisionLogPage.tsx`(query 훅 연결 + 상태 처리), 필요 시 해당 `*Page.test.tsx`.

매핑·갭 처리(설계기록 §3 준수):

- **Signals**: `Signal`을 `signalType/score/riskLevel/reason/evidence/expiresAt`로 재정의.
  `kind/confidence/previousStatus/trendSeries` 폐기(G9). 스파크라인=prices 최근 close,
  게이지=score. symbol 없거나 prices 실패 시 스파크라인 숨김. enum 한글화.
- **Research**: `GET /assets?symbol=`로 assetId 해소(실패 시 에러 상태). 펀더멘털(per/peg/52w/
  target)은 nullable → 값 없으면 행 숨김(더미 금지). 가격 차트는 prices(G4).
- **Alerts**: 인박스 모델(G8). `Alert`(UNREAD/READ/DISMISSED) + `AlertCandidate`. mutation은
  spec 경로의 read/dismiss/confirm, 성공 시 해당 목록 무효화. 네이티브 confirm 금지.
- **Settings**: `GET /auth/me` 프로필만. 알림 설정 mock 섹션 유지·숨김(G11).
- **DecisionLog**: `GET·POST /decision-logs`(G10). 엔드포인트 404 시 어댑터/훅은 완비하되 페이지는
  기존 로컬 폴백 유지 + 주석.

## Out of Scope

- 머지된 3화면(Dashboard·Watchlist·Portfolio) 재작업.
- 차트 컴포넌트 신규 구현(기존 재사용, 데이터만 공급), 낙관적 업데이트, 무한스크롤, WebSocket.
- 도메인 타입(`src/shared/model`) 외 구조 변경, 포맷/어댑터/`src/shared/api/*` 프리미티브
  시그니처 변경. BE 출처 없는 mock 영역 삭제(유지·주석만).

## Protected Files

없음(`.codex/**`, `docs/harness/**`, ADR/FAILURE 수정 금지).

## Requirements

- 화면 컴포넌트는 FE 도메인/뷰 타입만 본다(DTO snake_case 직접 노출 금지).
- 어댑터는 순수·동기. fetch/엔벨로프 언랩은 query 훅·client 경계에서만.
- 네이티브 다이얼로그(alert/confirm) 금지. 인앱 상태/버튼 사용.
- 출처 없는 필드를 임의 더미값으로 채우지 말 것 — 숨기거나 mock 유지 + 주석.

## Test Requirements

- 각 `adapters.test.ts`: spec 예시 DTO→도메인 매핑, null/누락/빈 목록 경계, `parseDecimal`
  빈 문자열·null 경계, enum 라벨 매핑. 날짜 단언은 **`TZ=UTC`**.
- 각 `*Page.test.tsx`: query 훅 모킹 또는 `QueryClientProvider` 래퍼로 통과, 로딩/에러/빈 상태
  최소 1건씩. Alerts는 mutation 후 무효화 검증 1건. 기존 테스트 회귀 없음.

## Verification Commands

```
pnpm install
pnpm lint
pnpm typecheck
TZ=UTC pnpm test
pnpm format:check
```

`pnpm format` 전체 실행 금지(전 repo 리포맷 노이즈). 포맷이 필요하면 **변경 파일만** prettier.

## Documentation Impact

`docs/designs/48-remaining-wiring.md`(본 설계, 갱신 불요). 신규 ADR/spec 변경 없음(연동만).

## ADR Need

불요 — 어댑터 계층·TanStack Query 채택은 ADR-004에서 확정. 본 작업은 그 적용.

## Failure Record Need

불요 — 예견된 구현 작업.

## Risk Level

Medium — 5화면 + mutation 포함으로 표면이 넓다. BE 일부 엔드포인트(G4/G7/G10) 미머지 가능 →
연동 코드 완비 + 페이지 폴백/주석으로 분리.

## Expected Output

- 신규 feature 세그먼트 5종 + 5개 페이지 연동 + 테스트.
- 모든 검증 명령 통과. 변경 요약과 미해결(BE 미머지 엔드포인트 폴백 여부) 보고.

## Rules

- 작업 전 `main` 기준 최신 feature 브랜치(`feat/48-remaining-opus`)에서 작업.
- 스코프 밖 변경 금지. 범위 확장이 필요하면 멈추고 보고.
