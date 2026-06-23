# 설계 기록 — Loading / Empty / Error 상태 컴포넌트 (이슈 18)

마일스톤 3 두 번째 라운드. 데이터 로딩·없음·오류 상황에서 화면이 깨지지 않도록
공통 상태 컴포넌트(`Skeleton`/`EmptyState`/`ErrorState`)를 `src/shared/ui`에 추가하고,
현재 산재한 ad-hoc 빈 상태를 공통 `EmptyState`로 수렴한다.

## 배경 / 현황

- 빈 상태가 페이지마다 제각각: `Table`의 `emptyMessage` prop(Dashboard/DecisionLog),
  Research 로컬 `EmptyResearchState`(Card 기반), Watchlist/Signals 인라인 텍스트(`조건에 맞는 … 없습니다`).
- **로딩 Skeleton·에러 상태·재시도 UI는 전무.**
- 데이터는 현재 동기 mock 파생 → 실제 비동기 로딩/에러 상태가 아직 없다.
  비동기 API client + TanStack Query는 **#17**(시퀀스상 #18 이후).

## 핵심 결정

1. **공통 컴포넌트 우선** ([[frontend-reusable-component-rule]]): 3종을 `src/shared/ui`에 추가하고
   barrel(`shared/ui/index.ts`) re-export. 기존 `Button`/`Card`/`classNames`·`app-*` 토큰 컨벤션 준수.
   네이티브 다이얼로그 금지 — 모두 인앱 UI.
2. **로딩/에러 와이어링은 #17로 분리**: #18은 컴포넌트 완성 + **기존 빈 상태의 EmptyState 수렴**까지.
   현재 동기 mock에는 진짜 로딩/에러 흐름이 없으므로 가짜 async(setTimeout 등)를 만들지 않는다
   (불필요한 추상화 금지). `Skeleton`/`ErrorState`는 완성·단위 테스트된 채 제공되어, #17에서 쿼리
   상태(isLoading/isError/refetch)에 바로 연결한다. 이 분리는 사용자 확정 시퀀스(#18 = #17 토대)와 일치.
3. **결정성·접근성**: 애니메이션은 CSS(`animate-pulse`)만 사용(JS 애니메이션 없음 → jsdom 결정성).
   접근성 역할 부여(아래 표). 자체 SVG/텍스트 아이콘은 장식이면 `aria-hidden`.

## 컴포넌트 API (스켈레톤)

### `Skeleton`

| prop | 타입 | 책임 |
|---|---|---|
| `className?` | `string` | 크기·모양 지정(호출부에서 width/height/rounded 합성) |
| `lines?` | `number` | 지정 시 텍스트 줄 플레이스홀더 n개 렌더(미지정=단일 블록) |
| `aria-hidden` | (고정) | 장식 — 스크린리더 무시. 로딩 영역 라이브 안내는 소비처가 담당 |

- 책임: `animate-pulse` 배경 블록 렌더. 레이아웃은 호출부가 className으로 구성(과한 변형 prop 금지).

### `EmptyState`

| prop | 타입 | 책임 |
|---|---|---|
| `title` | `ReactNode` | 빈 상태 제목 |
| `description?` | `ReactNode` | 보조 설명 |
| `icon?` | `ReactNode` | 장식 아이콘(`aria-hidden`) |
| `action?` | `ReactNode` | 선택 액션 슬롯(예: 필터 초기화 버튼) |
| `className?` | `string` | 컨테이너 보정 |
| role | (고정) `status` | 비긴급 안내 |

- 책임: 중앙 정렬 안내 블록. `Card` 내부에 둘 수 있도록 자체는 배경 없는 패딩 컨테이너.

### `ErrorState`

| prop | 타입 | 책임 |
|---|---|---|
| `title?` | `ReactNode` | 기본 "문제가 발생했습니다" |
| `description?` | `ReactNode` | 오류 보조 설명 |
| `onRetry?` | `() => void` | 지정 시 "재시도" `Button` 렌더 |
| `retryLabel?` | `string` | 기본 "재시도" |
| `className?` | `string` | 컨테이너 보정 |
| role | (고정) `alert` | 오류 즉시 안내 |

- 책임: 오류 안내 + 선택적 재시도 버튼(공통 `Button`, `variant="secondary"`). `onRetry` 미지정 시 버튼 없음.

## 채택 범위 (이번 라운드)

- **EmptyState 수렴**: Research `EmptyResearchState` 내부를 공통 `EmptyState`로 치환(Card 래퍼는 유지),
  Watchlist/Signals 인라인 "없습니다" 텍스트 → `EmptyState`. `Table`의 `emptyMessage`는 ReactNode를
  받으므로 호출부에서 `EmptyState` 전달 가능(기본 문자열 동작은 하위 호환 유지, 강제 치환 안 함).
- **Skeleton/ErrorState**: 컴포넌트·단위 테스트 제공. 실제 로딩/에러 트리거 연결은 #17.

## 범위 밖

- 비동기 데이터 패칭·로딩/에러 트리거 도입(#17 API client + TanStack Query).
- 가짜 async(setTimeout 시뮬레이션) 추가.
- Portfolio/Alerts/Settings 페이지 신규 콘텐츠(#14/#15/#16).
- 도메인 타입/Mock 변경.
- @theme 토큰 추가/수정(기존 `app-*` 사용).

## 검증 / 회귀면

- 단위 테스트: 3종 각 렌더(역할·재시도 콜백·lines 분기). `TZ=UTC pnpm test`.
- 회귀면: 빈 상태 치환 페이지(Research/Watchlist/Signals). 기존 테스트 유지.
- `format:check`/`lint`/`typecheck`/`build` 전 게이트.

## ADR / 실패 기록

- 불필요. 신규 라이브러리/아키텍처 없음(기존 스택 내 컴포넌트 추가). [[handoff-needs-design-record]]
