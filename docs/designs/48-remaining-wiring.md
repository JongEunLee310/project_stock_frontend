# 설계 기록 — #48 화면별 API 연동 잔여분 (Track A: Opus)

상태: Draft — Codex 핸드오프 입력. 스코프: Signals · Research · Alerts · Settings · DecisionLog 5화면.
선행: `docs/designs/48-screen-wiring.md`(Dashboard·Watchlist·Portfolio 3화면, 머지 완료)의 후속.

## 1. 목표

잔여 5화면이 `src/shared/mock`을 모듈 레벨에서 직접 import하던 구조를, 실제 API
(`src/shared/api/client.ts`)를 **TanStack Query + 어댑터(DTO→도메인)**로 호출하는 구조로
교체한다. 3화면 라운드에서 확립한 패턴(`src/features/<screen>/{dto,adapters,queries}.ts`
+ `adapters.test.ts`, 페이지는 query 훅만 import)을 그대로 따른다. 화면 컴포넌트는 FE 도메인
타입만 본다. 와이어 계약 단일 출처는 `project_stock/docs/api/frontend-api-spec.md`이고,
화면별 목표 매핑은 `docs/api/contract-alignment.md` §4/§5/§6다.

연동 대상 엔드포인트:

- Signals → `GET /signals?asset_id=`, `GET /signals/{id}`, `GET /stocks/{symbol}/prices`(G4)
- Research → `GET /assets/{id}/detail`·`/research-summary`·`/buy-checklist`,
  `GET /reports?asset_id=`, `GET /theses/latest`, `GET /assets?symbol=`(G6 해소),
  `GET /stocks/{symbol}/prices`(G4)
- Alerts → `GET /alerts`(+read/dismiss), `GET /alert-candidates`(+read/confirm)
- Settings → `GET /auth/me`
- DecisionLog → `GET·POST /decision-logs`(G10)

## 2. 공통 구조 결정

- 기반(`QueryClientProvider`, `apiGet`/`apiPost`, envelope 언랩, 401 lazy refresh,
  `parseDecimal`/`formatKst*`/`toLabel`/`toTablePagination`, `Skeleton`/`ErrorState`/`EmptyState`)은
  3화면 라운드에서 이미 도입됨. 본 라운드는 신규 도입 없이 그 위에 feature 세그먼트만 추가한다.
- 각 화면 `src/features/<screen>/`: `dto.ts`(와이어 타입) · `adapters.ts`(DTO→도메인 순수 변환)
  · `queries.ts`(query/mutation 훅) · `adapters.test.ts`.
- mutation(읽음/해제/확인)이 있는 화면(Alerts)은 `queries.ts`에 `useMutation` + 무효화
  (`queryClient.invalidateQueries`)로 처리. 낙관적 업데이트는 도입하지 않는다(단순 무효화).
- 출처 없는 mock 필드는 연동하지 말고 mock 유지 + 후속 주석(3화면 라운드 규율 동일).

## 3. 화면별 매핑과 갭 결정

표시는 FE 도메인(camelCase·number·한글 라벨), 와이어는 snake_case·문자열 Decimal·UPPER_SNAKE enum·UTC.

### 3.1 Signals — `GET /signals` → `GET /signals/{id}` → `GET /stocks/{symbol}/prices`

- `Signal` 도메인 재정의(§6): `signalType`/`score`/`riskLevel`/`reason`/`evidence`/`expiresAt` 기반.
  기존 mock의 `kind`/`confidence`/`previousStatus`/`trendSeries`는 BE 출처 없음 → 폐기(G9).
- confidence 게이지는 `score`로 매핑. 모멘텀 스파크라인은 `GET /stocks/{symbol}/prices`의 최근
  구간 close로 렌더(G4). symbol 없는 항목·prices 실패 시 스파크라인 숨김.
- 목록은 `GET /signals`(필요 시 `asset_id` 필터). 상세는 `GET /signals/{id}`.
- enum(`signalType`/`riskLevel`)은 `toLabel`/`riskLevelLabels`로 한글화.

### 3.2 Research — detail/research-summary/buy-checklist/reports/theses + prices

- 라우팅 키는 `symbol`. `GET /assets?symbol=`(G6)로 `assetId` 해소 후 나머지 호출.
- `GET /assets/{id}/detail`(펀더멘털 per/peg/52w/target 모두 nullable, G7) +
  `/research-summary` + `/buy-checklist` + `GET /reports?asset_id=` + `GET /theses/latest`.
- 가격 차트는 `GET /stocks/{symbol}/prices`(G4). nullable 펀더멘털은 값 없으면 행 숨김(더미 금지).
- 출처 없는 mock 전용 섹션은 유지·주석.

### 3.3 Alerts — `GET /alerts`(read/dismiss) + `GET /alert-candidates`(read/confirm)

- 인박스 모델로 재정의(G8). `AlertRule`·채널 설정 폐기. `Alert`(status UNREAD/READ/DISMISSED) +
  `AlertCandidate`(read/confirm).
- mutation: `POST /alerts/{id}/read`·`/dismiss`, `POST /alert-candidates/{id}/read`·`/confirm`
  (와이어 경로는 spec 확인). 성공 시 목록 쿼리 무효화. 네이티브 confirm 금지 — 인앱 버튼.
- 미읽음 카운트·필터(status)는 클라 파생.

### 3.4 Settings — `GET /auth/me`

- 프로필 카드(email/name 등 spec 필드)만 연동. 알림 설정 API 불요(G11) → 해당 mock 섹션 유지·숨김.

### 3.5 DecisionLog — `GET·POST /decision-logs`(G10)

- 클라 로컬 임시 저장을 API 영속화로 교체. 목록 `GET /decision-logs`(서버 페이징 `meta.total`),
  생성 `POST /decision-logs`. 컬럼·enum은 `docs/designs/decision-log-domain.md` 준수.
- BE #102 미머지로 엔드포인트 404 시: 어댑터/훅은 구현하되 페이지는 기존 로컬 폴백 유지하고
  주석으로 표시(연동 코드는 완비, 실데이터 전환은 BE 머지 후).

## 4. 신규/변경 파일 (시그니처·책임만)

신규:

- `src/features/signals/{dto,adapters,queries}.ts` + `adapters.test.ts`
- `src/features/research/{dto,adapters,queries}.ts` + `adapters.test.ts`
- `src/features/alerts/{dto,adapters,queries}.ts` + `adapters.test.ts`
- `src/features/settings/{dto,adapters,queries}.ts` + `adapters.test.ts`
- `src/features/decision-log/{dto,adapters,queries}.ts` + `adapters.test.ts`

변경:

- `SignalsPage`·`ResearchPage`·`AlertsPage`·`SettingsPage`·`DecisionLogPage`(query 훅 연결 +
  로딩/에러/빈 상태), 필요 시 각 `*Page.test.tsx`(query 래퍼/모킹 갱신).

## 5. 테스트

- 각 `adapters.test.ts`: spec 예시 DTO→도메인 매핑, null/누락/빈 목록·`parseDecimal` 경계,
  enum 라벨 매핑. 날짜 단언은 `TZ=UTC`.
- 각 `*Page.test.tsx`: query 훅 모킹 또는 `QueryClientProvider` 래퍼로 통과, 로딩/에러/빈 상태
  최소 1건씩. Alerts는 mutation 후 무효화 1건. 기존 테스트 회귀 없음.

## 6. 스코프 밖

- 이미 머지된 Dashboard·Watchlist·Portfolio 재작업.
- 가격 시계열 차트 컴포넌트 자체 신규 구현(기존 차트 컴포넌트 재사용, 데이터만 G4로 공급).
- 도메인 타입(`src/shared/model`) 외 구조 변경, 포맷/어댑터 프리미티브 시그니처 변경.
- 낙관적 업데이트, 무한스크롤, 실시간(WebSocket) 등 계약 외 기능.

## 7. 위험·미해결

- Medium. 5화면·mutation 포함으로 표면이 넓다. BE 일부 엔드포인트(G4/G7/G10) 미머지 가능 →
  연동 코드 완비 + 페이지 폴백/주석 전략으로 분리.
- spec과 실제 BE 응답 필드 불일치 가능 — spec 단일 출처 우선, 불일치는 리뷰에서 식별.
