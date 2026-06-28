# 설계 기록: 이슈 #67 P1 문서·주석 정리 (+P2 FE 이름)

## 1. 목적

이슈 #67의 P1 항목과 FE 한정 P2 항목을 처리한다. 동작 변경 없는 **문서·주석·메타데이터 정리**. (ADR 불요)

## 2. 대상·방향

### P1-A. `VITE_API_BASE_URL` 규칙에 `/api/v1` 명시

- 현재: `.env.example`/README가 베이스 URL 예시를 `https://api.example.com` 수준으로만 안내. API 클라이언트(`shared/api/client.ts`)는 `/auth/login` 등 prefix 없는 경로로 호출하고 BE는 `/api/v1` prefix → 베이스에 prefix 누락 시 404.
- 방향: `.env.example` 주석과 README 환경변수 설명에 **로컬 예시 `http://localhost:8000/api/v1`** 를 명시하고, "베이스 URL에 `/api/v1`까지 포함해야 한다"는 점을 분명히 한다. 코드 변경 없음(prefix 코드 고정은 v0.2 후속).

### P1-B. 가격 시계열 주석 정리 (BE 완료 반영)

- 현재: `signals/queries.ts`(sparkline `enabled:false`, `range=1mo`, "G4 BE 미완")·`research/queries.ts`("G4 BE 미완")가 BE 미완으로 표기.
- 사실: BE `GET /api/v1/stocks/{symbol}/prices` 완료(`range=1M|3M|6M|1Y`, `interval=1d`, `market` 필수).
- 방향: 주석을 **"BE 준비됨 — 활성화 블로커: 심볼→market 매핑 확정 + FE DTO를 `PriceSeriesDto{ bars: PriceBarDto[] }`로 정렬"** 으로 갱신. 차트는 MVP 1차에서 **비활성 유지**(`enabled:false`, 빈 배열). 동작/DTO 타입 변경 없음(활성화 시 별도 작업).

### P2 (FE 한정). 템플릿 잔존 이름

- 현재: `package.json` `"name": "ai-assisted-react-template"`.
- 방향: 프로젝트 이름으로 변경(`project-stock-frontend`). 빌드/배포 영향 없는 메타데이터.
- 비고: BE README·`pyproject.toml`은 별도 레포 → 범위 밖.

## 3. 스코프 밖

- 기본 브랜치 변경(레포 설정, 사람 승인 대기), 가격 시계열 실제 활성화, prefix 코드 고정, BE 레포 항목, 수동 smoke test.

## 4. 검증

`pnpm lint` · `pnpm typecheck` · `pnpm format:check` · `TZ=UTC pnpm test` · `pnpm build` 전부 통과. (동작 무변경이라 테스트 영향 없음)
