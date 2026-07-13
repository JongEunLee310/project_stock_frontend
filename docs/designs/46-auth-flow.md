# 설계 기록 — 인증 흐름 신설 (이슈 #46, G1/Q8/N2)

`API 계약 정렬 — 프론트엔드` 마일스톤. ADR-004(서버상태·API client·어댑터)의 **결정 4(401 lazy
refresh)** 위에서, FE에 전무한 인증을 신설한다. 로그인 + access/refresh 토큰 스토어 + 단일 fetch
client(`Authorization` 주입·envelope 언랩·401 lazy refresh)를 도입한다. BE 인증 확장(#96)과 페어.

- 이슈: #46 `[계약정렬] 인증 흐름 신설 — access+refresh (G1/Q8/N2)`
- 페어: BE `JongEunLee310/project_stock#96` (login 응답에 `refresh_token`·`expires_in` 추가 + `POST /auth/refresh`)
- 근거: `docs/api/contract-alignment.md` G1·C3·Q8·N2·§6 / `docs/decisions/ADR-004-server-state-api-client-adapter.md` 결정 2·4

## 배경 / 현황

- FE는 목 전용. API client·서버 상태·인증 전무. 화면은 동기 mock에서 파생.
- #45에서 **어댑터 순수 프리미티브**(`unwrapEnvelope`·`messageForErrorCode`·`parseDecimal`·KST 포맷·enum 라벨)는 완료. 본 이슈는 그 위에 **네트워크 경계(client) + 인증**을 올린다.
- 계약(C3/Q8/N2): `Authorization: Bearer <access>` + refresh 토큰. AT 15분 / RT 2일(env, BE 소관).
  만료 감시는 **서버 401 기반 lazy refresh만**(클라 타이머 없음, N2). 401 → refresh 1회 → 성공 시 원요청
  재시도, refresh도 실패 시 '로그인 만료' 통지 + 로그아웃 후 재로그인.
- BE#96 미머지 상태 → FE는 **계약 기준으로 독립 구현**, 단위 테스트(fetch stub)로 완결. 실 연동 검증은
  BE#96 머지 후 수동.

## 핵심 결정

1. **단일 fetch client**(ADR-004 결정 2): `src/shared/api/client.ts`. 책임 — base URL(`VITE_API_BASE_URL`,
   C10) 결합, `Authorization: Bearer` 주입, 공통 envelope 언랩(#45 `unwrapEnvelope` 재사용, C1),
   `error.code`→메시지 매핑(#45 `messageForErrorCode`, C9), **401 시 refresh 위임**(결정 3). 화면·쿼리
   함수는 envelope·토큰을 직접 보지 않는다. `data`(+`meta`)만 반환.
2. **토큰 스토어 = 순수 모듈**: `src/shared/auth/tokenStore.ts`. access/refresh 저장·조회·삭제. **client와
   인증 컨텍스트가 공유**(React 비의존)해 순환 의존을 끊는다. 저장 매체는 **localStorage persist**(BE가
   refresh를 응답 바디로 발급 → httpOnly 쿠키 불가, MVP 새로고침 세션 유지). 트레이드오프(XSS 노출)는
   범위 밖 — 후속 강화 시 재검토(범위 밖 참조).
3. **401 lazy refresh = single-flight**: client가 401 수신 시 refresh 1회 시도. **동시 다발 401에서 refresh
   중복 호출 방지**를 위해 진행 중 refresh Promise를 공유(single-flight)하고, 성공 시 새 access로 **원요청
   1회 재시도**. refresh 응답이 새 refresh를 주면 회전 반영(N2, 정책은 BE). refresh 실패(또는 refresh 부재)
   시 `tokenStore.clear()` + **만료 이벤트 발행** → 무한 재시도 금지(재시도는 1회만).
4. **client ↔ 인증 상태 디커플링**: client는 React를 모른다. 만료 시 콜백/이벤트(`onAuthExpired`,
   예: `EventTarget`/구독 함수)만 발행한다. `AuthProvider`가 이를 구독해 로그아웃 상태 전환 + **인앱 통지
   (toast/배너)**를 띄운다 — 네이티브 `alert`/`confirm` 금지([[frontend-reusable-component-rule]], 기존 공통
   통지 컴포넌트 우선 재사용, 없으면 최소 인앱 배너).
5. **인증 컨텍스트 + 로그인 화면 + 보호 라우팅**: `src/shared/auth/AuthProvider.tsx`(`useAuth`: `status`/
   `login`/`logout`). `src/pages/LoginPage`(이메일·비밀번호 폼 → `login()`). 라우팅 — `/login` 공개,
   나머지는 가드(미인증 시 `/login` 리다이렉트, 만료 시 동일 흐름). 로그인 성공 후 원래 경로 복귀.
6. **TanStack Query는 본 이슈 미도입**: 인증 토큰/상태는 *서버 데이터 캐시*가 아닌 *전역 클라이언트
   상태*다. 로그인/refresh는 client 직접 호출 + 컨텍스트로 처리한다. `QueryClientProvider`·쿼리 키 컨벤션은
   **첫 서버 데이터 화면을 붙이는 #48**에서 도입(ADR-004 결정 1은 유지, 도입 시점만 #48). 본 이슈에 query를
   당기면 범위가 비대해진다.
7. **신규 런타임 의존 없음**: 순수 `fetch` + React Context. MSW 등 목 서버 미도입 — client 단위 테스트는
   global `fetch` stub으로 검증(기존 vitest 패턴 일관).

## 모듈 / 시그니처 (스켈레톤)

### `src/shared/auth/tokenStore.ts` (순수 모듈)

| 심볼                          | 형태                                          | 책임                                            |
| ----------------------------- | --------------------------------------------- | ----------------------------------------------- |
| `AuthTokens`                  | type                                          | `{ accessToken: string; refreshToken: string }` |
| `getTokens()` / `getAccess()` | `() => AuthTokens \| null` / `string \| null` | localStorage 조회                               |
| `setTokens(tokens)`           | `(AuthTokens) => void`                        | 저장(로그인·refresh 성공 시)                    |
| `clearTokens()`               | `() => void`                                  | 삭제(로그아웃·만료)                             |
| `subscribeAuthExpired(fn)`    | `(fn) => unsubscribe`                         | 만료 이벤트 구독(컨텍스트용)                    |
| `emitAuthExpired()`           | `() => void`                                  | 만료 통지 발행(client용)                        |

### `src/shared/api/client.ts`

| 심볼                            | 형태                                                       | 책임                                                    |
| ------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------- |
| `apiRequest<T>(path, options?)` | `(string, RequestInit & {auth?}) => Promise<{data,meta?}>` | base URL·`Authorization` 주입·envelope 언랩·401 refresh |
| `apiGet/apiPost/...`            | 얇은 래퍼                                                  | 메서드별 단축(선택)                                     |
| (내부) `refreshAccessToken()`   | single-flight Promise                                      | `POST /auth/refresh` 1회, 토큰 갱신/clear+emit          |

- 401 흐름: 요청 → 401 → (재시도 아님일 때) refresh single-flight → 성공: `setTokens` 후 원요청 1회 재시도 /
  실패: `clearTokens` + `emitAuthExpired` 후 `ApiError`(인증 만료) throw.
- `VITE_API_BASE_URL`(C10) 결합. 인증 불필요 호출(`auth: false`)은 `Authorization` 미주입·refresh 미적용.

### `src/shared/auth/authApi.ts`

| 심볼                 | 형태                                              | 책임                                        |
| -------------------- | ------------------------------------------------- | ------------------------------------------- |
| `login(credentials)` | `({email,password}) => Promise<AuthTokens & me?>` | `POST /auth/login` → 토큰(+`me`) DTO 어댑트 |
| `fetchMe()`          | `() => Promise<MeUser>`                           | `GET /auth/me`(C3, Settings G11)            |

### `src/shared/auth/AuthProvider.tsx`

| 심볼           | 형태                                     | 책임                                                  |
| -------------- | ---------------------------------------- | ----------------------------------------------------- |
| `AuthProvider` | 컴포넌트                                 | 부팅 시 토큰 유무로 초기 상태, 만료 구독, 통지        |
| `useAuth()`    | `() => { status, user?, login, logout }` | `status`: `authenticated`/`unauthenticated`/`loading` |
| `RequireAuth`  | 라우트 가드 컴포넌트                     | 미인증 시 `/login` 리다이렉트(복귀 경로 보존)         |

### `src/pages/LoginPage.tsx`

- 이메일·비밀번호 폼 → `useAuth().login`. 실패 시 인앱 에러 표시(공통 컴포넌트). 성공 시 복귀 경로 이동.

### 라우팅(`src/app/router.tsx`) / 엔트리(`App.tsx`)

- `App`을 `AuthProvider`로 감싼다. `/login` 공개 라우트 추가, 기존 `AppShell` 트리를 `RequireAuth`로 보호.

## 계약 의존 (BE#96 미확정 시 기본값)

- `POST /auth/login` 응답: `{ access_token, refresh_token, token_type, expires_in, (user?) }` 가정
  (Q8 계약 변경분). 키 명은 BE#96 `frontend-api-spec.md` 확정값에 맞춘다 — **어댑터에서 흡수**.
- `POST /auth/refresh` 요청: refresh 제시(바디 `{ refresh_token }` 가정) → `{ access_token, token_type,
expires_in, (refresh_token?) }`.
- 키/위치 차이는 `authApi`의 DTO→도메인 어댑트 1곳에서 정렬(화면·client 본문 불변).

## 범위 밖

- TanStack Query 설치·`QueryClientProvider`·쿼리 키 컨벤션 (**#48**, ADR-004 결정 1 유지).
- 도메인 모델 교체·`symbol`→`assetId`·enum 영문화 (**#47**).
- 실제 화면(Dashboard 등)의 API 연동·mock 제거 (**#48**).
- 토큰 저장 보안 강화(httpOnly 쿠키·인메모리 전용·refresh 회전 강제) — BE 정책 동반 시 후속.
- 회원가입·비밀번호 재설정·소셜 로그인(계약·이슈 범위 밖).

## 검증 / 회귀면

- 단위 테스트(TDD, global `fetch` stub):
  - `tokenStore`: set/get/clear, 만료 구독·발행(localStorage jsdom).
  - `client`: 정상 envelope 언랩, `Authorization` 주입, 401→refresh 성공→원요청 재시도(1회),
    401→refresh 실패→`clearTokens`+`emitAuthExpired`+throw, **재시도 무한루프 없음**, single-flight(동시
    401에서 refresh 1회).
  - `authApi`: login/refresh DTO 어댑트(키 매핑).
  - `AuthProvider`/`RequireAuth`(testing-library): 미인증 가드 리다이렉트, login→authenticated 전환,
    만료 이벤트→로그아웃+통지, `LoginPage` 폼 제출.
- 회귀면: 기존 라우트는 `RequireAuth` 추가 — **테스트 환경에서 인증 상태 주입 필요**. 기존 페이지 테스트가
  라우터 전체를 거치면 `AuthProvider` 래핑/모킹 추가. 페이지 단위 테스트(컴포넌트 직접 렌더)는 영향 없음.
- 게이트: `pnpm format:check`(**변경 파일만** `pnpm exec prettier --write <files>`, `pnpm format` 전체 금지)
  · `lint` · `typecheck` · `build` · `TZ=UTC pnpm test`. [[handoff-include-format-check]]

## ADR / 실패 기록

- ADR 불요 — 인증 아키텍처는 ADR-004 결정 4에서 확정. 본 이슈는 그 구현. [[handoff-needs-design-record]]
- 토큰 저장 매체(localStorage) 선택은 본 설계 기록에 트레이드오프로 남김(별도 ADR 불요, MVP 기본값).
