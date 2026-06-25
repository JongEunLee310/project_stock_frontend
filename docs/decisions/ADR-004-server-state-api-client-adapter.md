# ADR-004: 서버 상태 관리·API Client·어댑터 계층

## Status

Proposed

## Context

`API 계약 정렬 — 프론트엔드` 마일스톤(이슈 #44~#48)에서 프론트엔드를 백엔드 공통 API 계약(`docs/api/contract-alignment.md`)에 연결한다. 현재 FE는 **목 전용**이며 API client·서버 상태 관리·인증이 전무하다. 화면을 실제 API에 붙이기 전에 다음 구조를 한 번 정해야 이후 연동 이슈(#45 어댑터·#46 인증·#47 도메인 재정렬·#48 화면 연동)가 흔들리지 않는다. 되돌리는 비용이 크므로 ADR로 남긴다.

해결해야 할 구조적 문제는 셋이다.

1. **서버 상태 관리**: 비동기 서버 데이터(로딩/에러/캐시/재요청)를 화면 컴포넌트가 직접 다루면 중복·드리프트가 생긴다.
2. **API client**: 공통 envelope 언랩, `Authorization` 주입, 401 처리, 에러 코드 매핑을 매 호출마다 흩어 구현하면 깨지기 쉽다.
3. **계약 ↔ 도메인 불일치**: 와이어는 snake_case·문자열 Decimal·영문 UPPER_SNAKE enum·envelope·UTC인데(C1·C5·C6·C8), FE 도메인은 camelCase·number·한글 라벨이다. 변환 지점이 흩어지면 화면마다 제각각 파싱하게 된다.

## Decision

세 계층을 도입하고 책임 경계를 고정한다. 화면(pages/widgets)은 **FE 도메인 타입만** 본다.

### 1. 서버 상태 관리 = TanStack Query

- 서버에서 오는 모든 비동기 데이터는 TanStack Query(`useQuery`/`useMutation`)로 관리한다.
- 로딩/에러/empty 상태는 #18에서 만든 공통 컴포넌트(`Skeleton`/`ErrorState`/`EmptyState`)에 쿼리 상태를 연결한다.
- 쿼리 키 컨벤션과 캐시 무효화 정책은 설계 기록(`docs/designs/`)에서 다룬다. 이 ADR은 선택 이유만 남긴다.

### 2. API Client = 단일 fetch 래퍼

- `fetch` 기반의 얇은 단일 client를 둔다. 책임: base URL(`VITE_API_BASE_URL`, C10) 결합, `Authorization: Bearer` 주입, 공통 envelope `{ data, message, error, meta }` 언랩(C1), HTTP·`error.code` → 도메인 에러 매핑(C9), 401 시 refresh 위임(아래 4).
- 화면·쿼리 함수는 envelope를 직접 보지 않는다. client가 `data`(+`meta`)만 돌려준다.

### 3. 어댑터 계층 = DTO ↔ 도메인 단일 경계

- API DTO(snake_case·문자열 Decimal·영문 enum·UTC)와 FE 도메인(camelCase·number·한글 라벨·KST 표시) 사이 변환을 **한 경계에서만** 수행한다(C1·C2·C5·C6·C8).
- 변환 규칙: 문자열 Decimal → number 파싱(표시 `Intl`), 영문 UPPER_SNAKE enum → 표시계층 한글 매핑, 와이어 UTC → KST(Asia/Seoul) 표시, `symbol` 단일키 → `assetId: number` 도입(`symbol`은 표시·라우팅 보조, C4).
- 어댑터는 도메인별로 두되 위치·네이밍 컨벤션은 설계 기록에서 확정한다.

### 4. 인증 토큰 처리 = 401 기반 lazy refresh

- access·refresh 토큰 스토어를 두고 client가 `Authorization`을 주입한다(#46).
- 만료 감시는 **서버 401 기반 lazy refresh만** 한다(클라이언트 만료 타이머 없음, N2). 401 수신 시 refresh 1회 시도 → 성공하면 원요청 재시도, refresh도 실패하면 '로그인 만료' 통지 후 로그아웃(C3·Q8).

## Alternatives

- **수동 `fetch` + `useEffect`/`useState`**: 캐시·중복요청·로딩상태를 화면마다 재구현 → 드리프트. TanStack Query로 대체.
- **Redux Toolkit / RTK Query**: 서버 캐시엔 과한 보일러플레이트와 학습비용. 현재 클라이언트 전역 상태 요구가 작아 불필요. TanStack Query로 대체.
- **SWR**: 유사 대안이나 mutation·무효화·재시도 제어가 TanStack Query 대비 약함. 채택 보류.
- **axios**: 인터셉터는 편하나 번들·의존성 추가. 단일 fetch 래퍼로 동등 기능을 더 가볍게 확보. 채택 보류.
- **어댑터 없이 화면에서 직접 파싱**: 와이어 표기 변경 시 전 화면 동시 수정 필요. 단일 경계 어댑터로 대체.
- **클라이언트 만료 타이머(선제 refresh)**: 타이머·시계 드리프트 관리 부담. 서버 401 lazy refresh로 단순화(N2).

## Consequences

- 화면은 도메인 타입만 의존해, 와이어 표기(snake_case·Decimal·enum·UTC) 변경이 어댑터 1곳으로 격리된다.
- 신규 의존성으로 `@tanstack/react-query`가 추가된다(스택 확장 → 본 ADR로 기록). 패키지 매니저는 pnpm 유지(ADR-003).
- 로딩/에러/empty가 #18 공통 컴포넌트로 일관 처리된다.
- 인증이 client·스토어 한 곳에 모여, 401 흐름이 화면에 새지 않는다.
- 목 → API 전환 시 어댑터 경계에서 mock fixture를 DTO 형태로 맞추면 화면 변경 없이 교체 가능하다.

## Follow-up

- #45 어댑터 계층, #46 인증 흐름, #47 도메인 재정렬, #48 화면 연동을 본 ADR 위에서 진행한다.
- 쿼리 키 컨벤션·캐시 무효화·어댑터 배치의 구체 형태는 `docs/designs/`에 설계 기록으로 작성한다.
- 백엔드 계약 확정 이슈(특히 인증 `project_stock#96`, 가격 시계열 `project_stock#97`)와 연동 시점을 맞춘다.
- `TZ=UTC` 검증을 유지하고 표시 포매터는 timeZone `Asia/Seoul`로 고정한다(C6).

## Related Documents

- 이슈 #44~#48 (`API 계약 정렬 — 프론트엔드`)
- `docs/api/contract-alignment.md` (§1 통신 규약, §6 FE 도메인 재정렬)
- 백엔드 마일스톤 #3 (`project_stock`): `project_stock#96`(인증), `project_stock#97`(가격 시계열)
- ADR-003 (기반 스택)
