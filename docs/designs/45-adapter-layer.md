# 설계 기록 — 어댑터 계층 (이슈 #45, G2)

`API 계약 정렬 — 프론트엔드` 마일스톤. ADR-004(서버상태·API client·어댑터)의 게이트 통과 후
**어댑터 계층의 순수 변환 프리미티브**를 구현한다. 와이어 DTO(snake_case·문자열 Decimal·영문
UPPER_SNAKE enum·envelope·UTC) ↔ FE 도메인/표시(camelCase·number·한글 라벨·KST) 변환을 한 경계로
모은다. 화면은 FE 도메인만 본다.

- 이슈: #45 `[계약정렬] 어댑터 계층 구현 (G2)`
- 근거: `docs/api/contract-alignment.md` C1·C2·C5·C6·C7·C8·C9, §6 / `docs/decisions/ADR-004-server-state-api-client-adapter.md`

## 배경 / 현황

- FE는 목 전용. API client·서버 상태·인증 전무. 화면은 동기 mock(`src/shared/mock`)에서 파생.
- 현재 enum은 **한글이 정본**(`riskLevel.ts` `높음/중간/낮음`, `stockStatus.ts` 7종, `valuationLevel.ts` 등).
  계약(C8)은 **와이어 영문 UPPER_SNAKE 정본 / FE 표시계층 한글화**다. 도메인 enum의 영문 전환 자체는
  **#47(도메인 재정렬)** 범위 — 본 이슈는 변환 프리미티브와 한글 라벨 매핑만 제공한다.
- `Table`(`src/shared/ui/Table.tsx`)은 `pagination`(`page`/`total`/`onPageChange`/`pageSize`)을 받지만
  **항상 `rows.slice`로 클라이언트 슬라이싱**한다(L74-76). 서버 페이징(서버가 현재 페이지 행만 반환) 시
  이중 슬라이스가 발생 → 서버 모드 분기 필요(아래 결정 5).

## 핵심 결정

1. **순수·동기 프리미티브만**: 네트워크 없는 순수 함수/타입 모음. fetch client·`Authorization`·401 refresh·
   TanStack Query 셋업은 **#46(인증 흐름)**, 도메인 모델 교체·`assetId` 도입은 **#47**, 화면 연동은 **#48**.
   본 이슈 산출물은 단위 테스트로 완결 가능(TDD 적합).
2. **배치(FSD 컨벤션)**: 전송 형태 프리미티브는 `src/shared/api/`, 표시 변환은 `src/shared/lib/format/`.
   각 디렉터리 barrel(`index.ts`) re-export. 기존 `src/shared/{model,ui,config}` 패턴 준수.
3. **envelope 언랩 단일 지점**(C1·C9): `unwrapEnvelope`가 `data`(+`meta`)만 돌려준다. `error` 존재 시
   `error.code`→메시지 매핑한 도메인 에러를 throw. 화면·쿼리 함수는 envelope를 직접 보지 않는다.
4. **enum 한글화는 표시계층 매핑**(C8): 와이어 영문 enum → 한글 라벨 매핑 테이블. 도메인 enum 정의(영문화)는
   #47에서. 본 이슈는 매핑 인프라 + 알려진 enum 라벨 테이블 제공(미지 값은 원문 fallback).
5. **서버 페이징 분기**(C2·C7): `Table`에 서버 모드 추가 — 서버 모드면 내부 슬라이스를 건너뛰고 받은 `rows`를
   그대로 렌더(`total`/`page`/`pageCount`는 `meta` 기준). 기존 클라이언트 슬라이싱은 **하위 호환 유지**.
   `meta`→Table pagination props 매핑 헬퍼와 `sort=field`/`-field` 파라미터 빌더 제공.
6. **시간은 KST 고정 포맷**(C6): 와이어 UTC ISO를 받아 `Intl`로 `Asia/Seoul` 고정 표시. timeZone 하드코딩.
   `TZ=UTC` 검증 유지([[verify-timezone-tz-utc]]).

## 모듈 / 시그니처 (스켈레톤)

### `src/shared/api/envelope.ts`

| 심볼 | 형태 | 책임 |
|---|---|---|
| `ApiEnvelope<T>` | type | `{ data, message?, error?, meta? }` 와이어 봉투 |
| `ApiErrorBody` | type | `{ code: string; message?: string }` |
| `ApiMeta` | type | `{ page: number; size: number; total: number }` (C2) |
| `unwrapEnvelope<T>(env)` | `(ApiEnvelope<T>) => { data: T; meta?: ApiMeta }` | `error` 있으면 throw, 없으면 data/meta 반환 (C1) |
| `ApiError` | class | `code`/`message` 보유 도메인 에러(throw 대상) |

### `src/shared/api/errorCodes.ts`

| 심볼 | 형태 | 책임 |
|---|---|---|
| `errorCodeMessages` | `Record<string,string>` | 알려진 `ErrorCode`→한글 메시지 (C9) |
| `messageForErrorCode(code, fallback?)` | `(string, string?) => string` | 매핑 조회, 미지 코드 fallback |

### `src/shared/api/paging.ts`

| 심볼 | 형태 | 책임 |
|---|---|---|
| `toTablePagination(meta, onPageChange)` | `(ApiMeta, (p:number)=>void) => TablePagination` | meta→Table props(C2) |
| `buildSortParam(field, dir)` | `(string, 'asc'\|'desc') => string` | `field`/`-field` 직렬화(C7) |

### `src/shared/lib/format/decimal.ts`

| 심볼 | 형태 | 책임 |
|---|---|---|
| `parseDecimal(value)` | `(string\|null) => number\|null` | 문자열 Decimal→number(C5) |
| `formatMoney(value, opts?)` | `(number, …) => string` | `Intl.NumberFormat` 통화/금액 표시 |
| `formatPercent(value, opts?)` | `(number, …) => string` | 비율 표시(소수 자리 옵션) |

### `src/shared/lib/format/datetime.ts`

| 심볼 | 형태 | 책임 |
|---|---|---|
| `formatKstDate(iso)` | `(string) => string` | UTC ISO→KST 날짜(`Asia/Seoul` 고정, C6) |
| `formatKstDateTime(iso)` | `(string) => string` | UTC ISO→KST 일시 |

### `src/shared/lib/format/enumLabel.ts`

| 심볼 | 형태 | 책임 |
|---|---|---|
| `riskLevelLabels` 등 | `Record<WireEnum,string>` | 영문 UPPER_SNAKE→한글 라벨(C8) |
| `toLabel(map, wire, fallback?)` | 제네릭 조회 | 미지 값 fallback=원문 |

알려진 매핑(C8): `HIGH/MEDIUM/LOW`→`높음/중간/낮음`, Alert status `UNREAD/READ/DISMISSED`,
`StockStatus`/`ValuationLevel` 와이어 영문값은 계약(`frontend-api-spec.md`) 확정값에 맞춘다.
계약에 영문 enum 원본이 아직 명시되지 않은 도메인은 본 이슈에서 라벨 테이블만 정의하고
실제 와이어 값 확정은 #47/계약 갱신 시 정렬한다.

### `src/shared/ui/Table.tsx` (확장)

| 변경 | 책임 |
|---|---|
| `TablePagination`에 `manual?: boolean`(또는 동등 플래그) | 서버 페이징 모드: 내부 `rows.slice` 건너뜀, 받은 rows 그대로 렌더 |
| 기존 동작 | `manual` 미지정 시 현행 클라이언트 슬라이싱 유지(하위 호환) |

## 범위 밖

- fetch client·`Authorization` 주입·401 lazy refresh·토큰 스토어 (**#46**).
- TanStack Query 설치·QueryClientProvider·쿼리 키 컨벤션 (**#46** 또는 후속).
- 도메인 모델 교체(`Signal`/`Stock`/`Alert`/`Portfolio`), `symbol`→`assetId` 전환, enum 영문화 (**#47**).
- 실제 화면의 API 연동·mock 제거 (**#48**).
- 신규 라이브러리 추가(순수 TS·기존 `Intl`만 사용).

## 검증 / 회귀면

- 단위 테스트(TDD): `unwrapEnvelope`(정상/error throw), `parseDecimal`(정상/null/비정상),
  포맷터(금액·비율 자리수), `formatKst*`(**`TZ=UTC` 환경에서 KST 단언**), enum 라벨(매핑/fallback),
  paging 헬퍼(meta 매핑·sort 직렬화), `Table` manual 모드(슬라이스 미발생·pageCount=meta 기준).
- 회귀면: `Table` 기존 호출부(Dashboard/DecisionLog 등) — `manual` 기본 off라 동작 불변. 기존 테스트 유지.
- 게이트: `pnpm format:check`(변경 파일 `pnpm format`) · `lint` · `typecheck` · `build` · `TZ=UTC pnpm test`.
  [[handoff-include-format-check]] [[verify-timezone-tz-utc]]

## ADR / 실패 기록

- ADR 불요 — 아키텍처 결정은 ADR-004에서 완료. 본 이슈는 그 위의 구현. [[handoff-needs-design-record]]
