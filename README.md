# 주식 리서치·판단 보조 서비스 — 프론트엔드

개인 투자자가 종목을 조사하고 거래 판단을 내릴 때, 오늘 확인해야 할 위험·뉴스·시그널과
판단 우선순위를 한 화면에서 보조받을 수 있도록 돕는 서비스의 프론트엔드다.
AI가 정리한 브리핑·시그널·리스크를 바탕으로 사용자가 직접 판단하고, 그 판단을 기록·복기한다.

화면은 TanStack Query 기반으로 FastAPI 백엔드(확정 계약)에 연결돼 있다. BE가 아직
제공하지 않는 일부 필드는 도메인 타입(`shared/model`)을 `satisfies`로 만족시키는
`shared/mock` 데이터로 보강하며, 해당 영역은 코드 주석으로 경계를 표시한다.
API 응답은 도메인 타입과 분리된 DTO로 받아 어댑터에서 무손실 변환한다.

## 핵심 화면

- **Dashboard** — 오늘의 위험·뉴스·검토 시그널·현금 비중과 AI 브리핑, 우선 확인 큐를 요약.
- **Watchlist** — 관심 종목의 상태·변화율·뉴스 위험도·밸류에이션·AI 판단을 테이블로 확인.
- **Signals** — AI가 감지한 투자 검토 시그널을 신뢰도·근거와 함께 카드로 제시.
- **Research Detail** (`/research/:symbol`) — 가격·밸류에이션·뉴스·핵심 리스크·촉매 타임라인·
  의사결정 체크리스트·메모를 한 화면에서 검토.
- **Decision Log** — 투자 판단을 유형·인지 리스크·재검토 일정과 함께 기록하고 복기.
- **Portfolio / Alerts / Settings** — 보유 현황, 알림 규칙, 사용자 설정.

## 기술 스택

Vite + React + TypeScript + Tailwind CSS v4. 라우팅은 React Router, 테스트는 Vitest +
Testing Library. 패키지 매니저는 pnpm.

### 개발·검증

```bash
corepack enable
pnpm install
pnpm dev          # 개발 서버
pnpm format:check # Prettier 검사 (CI 게이트)
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

### 환경 변수

| 변수                | 설명                                                                                                                           | 기본값              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------- |
| `VITE_API_BASE_URL` | 백엔드 API 베이스 URL(예: `https://api.example.com`). 미설정 시 상대경로로 요청하므로 개발 프록시나 동일 출처 배포를 전제한다. | 빈 문자열(상대경로) |

로컬 개발 시 `.env.example`을 `.env.local`로 복사해 `VITE_API_BASE_URL`을 채운다
(`.env.local`은 `.gitignore` 대상). Vite 규약상 `VITE_` 접두사 변수만 클라이언트에 노출된다.

### 프론트엔드 레이어

`src/`는 Feature-Sliced Design 계열 레이어를 따른다.

- `app/` — 앱 진입점, 전역 프로바이더, 라우터 구성, 전역 스타일 연결.
- `pages/` — 라우트 단위 화면 조립. 하위 레이어를 조합하고 도메인 로직은 두지 않는다.
- `widgets/` — 여러 feature/entity를 묶은 독립 UI 블록.
- `features/` — 사용자 행동 단위 기능.
- `entities/` — 도메인 엔티티 단위 모델과 표현.
- `shared/` — 도메인 비의존 공통 UI(`ui/`), 설정, 도메인 타입(`model/`), Mock 데이터(`mock/`).

프론트엔드 작업 시 공통 컴포넌트를 우선 재사용하고 일회성 인라인 UI를 지양한다.
사용자 알림은 브라우저 네이티브 다이얼로그 대신 인앱 UI(toast 등)를 쓴다.
자세한 내용은 `docs/knowledge/frontend-conventions.md` 참고.

## API 연동 구조

서버 상태는 TanStack Query로 관리하고, 화면은 feature별 query 훅으로 데이터를 읽는다.
계층은 BE 계약(DTO)과 화면 도메인 타입을 분리해 결합도를 낮춘다.

- `shared/api/client.ts` — fetch 래퍼. 응답 envelope 해제, 에러 코드 매핑(`errorCodes.ts`),
  페이지네이션(`paging.ts`), `Authorization` 헤더 부착, 401 시 access 토큰 lazy refresh
  (single-flight)를 담당한다.
- `shared/auth/` — access+refresh 토큰 저장(`tokenStore.ts`)·인증 컨텍스트(`AuthProvider.tsx`).
- `features/<도메인>/dto.ts` — BE 응답 형태(snake_case·문자열 Decimal 등) 그대로의 타입.
- `features/<도메인>/adapters.ts` — DTO를 도메인 타입으로 변환하는 순수 함수(금액/날짜 파싱 포함).
- `features/<도메인>/queries.ts` — `useQuery`/`useMutation` 훅. `apiGet`으로 받은 DTO를
  어댑터로 변환해 화면에 전달한다.

### Mock과 실제 API

화면은 query 훅(실 API)으로 동작하되, BE가 아직 제공하지 않는 필드에 한해 `shared/mock`을
유지한다(코드 주석으로 경계 표시). Mock은 도메인 타입을 `satisfies`로 만족시키므로, 해당
필드의 BE 지원이 추가되면 어댑터 매핑만 바꿔 무손실로 교체할 수 있다. BE 선행 의존(가격
시계열·decision-log 영속화 등)은 빈 배열·`enabled: false` 경로로 선구현돼 있어, BE 완성 시
조건 제거만으로 활성화된다. FE↔BE 계약 정렬 기록은 `docs/api/contract-alignment.md` 참고.

## 개발 워크플로우

이 저장소는 Claude Code와 Codex의 역할을 분리한 Harness Engineering 워크플로우로 개발한다.

- **Claude Code** — 작업 계획 수립, 설계 검토, Codex 핸드오프 태스크 생성, 로컬 PR 리뷰,
  문서화·ADR·실패 기록 필요 여부 판단.
- **Codex** — 핸드오프 태스크 기반 구현, 테스트 작성, 로컬 검증, CI 실패 수정.
- **GitHub Actions CI** — PR 검증 게이트(`format:check`/lint/typecheck/test/build).
- **사람** — 최종 승인, merge, 위험 결정의 책임자.

역할·핸드오프·리뷰 정책은 `AGENTS.md`, `CLAUDE.md`, `docs/harness/`에 정의되어 있다.
도메인·Mock 설계 기록은 `docs/designs/`, Codex 핸드오프는 `.codex/tasks/`에 둔다.

## 디렉토리 구조

```
src/                — 프론트엔드 애플리케이션 (FSD 레이어)
docs/
  api/              — FE↔BE 공통 API 계약 정렬 기록
  designs/          — 화면·도메인 설계 기록
  decisions/        — ADR (아키텍처 결정 기록)
  failures/         — 실패 기록
  harness/          — 에이전트 역할·핸드오프·리뷰 정책
  knowledge/        — 워크플로우 및 프론트엔드 컨벤션
  reviews/          — 로컬 PR 리뷰 기록
.codex/tasks/       — Codex 핸드오프 태스크
```
