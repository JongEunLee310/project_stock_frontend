# Design: 관심 종목 페이지 UI 폴리시 (#123)

## Status

Implemented

## Context

watchlist 페이지 기능 범위(#117, #120)가 완결된 뒤 확인된 시각 개선 작업이다.
세 가지를 다룬다: 상단 툴바가 데스크톱에서 2행으로 감겨 공간을 과점하는 문제,
테이블 헤더 정렬, 그리고 상태·평가 배지 5종의 디자인 개선.

## Verified Facts

확인 기준 — feat/123-watchlist-ui-polish (main에서 분기, #120 머지 반영됨).

- 툴바: `src/pages/ui/WatchlistPage.tsx:454-528` — Card 안에서 좌측이
  `grid md:grid-cols-2 xl:grid-cols-[minmax(18rem,1.2fr)_minmax(10rem,auto)_minmax(10rem,auto)]`
  3열 그리드인데 컨트롤이 4개(검색·정렬·시장·위험)라 xl에서도 2행으로 감긴다.
  우측 버튼 그룹(정렬 방향·필터 초기화·종목 추가)은 별도 flex 컨테이너.
  컨트롤 높이는 `min-h-11`, Card 패딩은 `p-4`.
- 테이블 헤더: `WatchlistPage.tsx:760-768` — 12개 th 전부 `text-left`,
  `first:w-10 last:w-10`.
- 상태 배지: `WatchlistPage.tsx:795-801` — `rounded-full border px-2 py-1 text-xs
  font-semibold min-w-16` pill + `resolveStatusBadge`가 반환하는
  `stockStatusClassNames`(공유 토큰, `src/shared/ui/stockStatus.ts`) 조합.
- 평가 배지: `EvaluationBadgeCell`(WatchlistPage.tsx) — 상태 배지와 동일한 pill
  마크업 + `evaluationBadgeClassNames`(`src/features/watchlist/adapters.ts:87-92`,
  danger/warning/safe/neutral 4톤: `border-*-500/50 bg-*-500/15 text-*-200`).
- `resolveStatusBadge`의 UI 소비처는 `WatchlistPage.tsx`뿐이다 (그 외는
  adapters.ts 내부와 테스트). `stockStatusClassNames`는 다른 페이지도 공유하므로
  이 파일은 수정하지 않는다.
- 평가 resolver 4종(`resolveNewsRiskBadge` 등)의 반환 타입은
  `{ label: string; className: string }`이며 소비처는 `EvaluationBadgeCell`과
  adapters.test.ts뿐이다.

## Decisions

### 1. 툴바 한 줄 배치

Card 내부를 그리드 + 별도 버튼 그룹 대신 단일 `flex flex-wrap items-center gap-2`
컨테이너로 재구성한다.

- 검색 Input: `min-w-[14rem] max-w-sm flex-1` — 남는 공간을 흡수하되 과도하게
  길어지지 않는다. 검색 아이콘(⌕) 오버레이는 유지한다.
- select 3종(정렬·시장·위험): 고정 콘텐츠 폭(`w-auto`). 라벨 프리픽스("정렬:" 등)
  옵션 텍스트는 유지한다.
- 버튼 그룹(정렬 방향·필터 초기화·종목 추가): 첫 버튼에 `ml-auto`를 주어 우측 정렬.
- 컨트롤 높이 `min-h-11` → `min-h-9`, Card 패딩 `p-4` → `p-3`으로 수직 공간을 줄인다.
  Input·select·Button 모두 동일하게 적용해 높이를 맞춘다.
- 좁은 화면에서는 `flex-wrap`으로 자연스럽게 여러 줄로 감긴다. 별도 브레이크포인트
  분기를 두지 않는다.

### 2. 테이블 헤더 가운데 정렬

- th 공통 클래스의 `text-left` → `text-center`.
- 배지가 들어가는 5개 셀(상태 + 평가 4종)은 헤더와 시각적으로 정렬되도록 셀을
  `text-center`로 맞춘다 (배지 span은 `inline-flex`라 `text-center`로 중앙 배치됨).
  `EvaluationBadgeCell`의 로딩 Skeleton·`—` 표시도 같은 정렬을 따른다
  (Skeleton은 `mx-auto`).
- 종목·섹터·현재가 등 나머지 셀 본문 정렬은 바꾸지 않는다 (헤더만 요청 범위).

### 3. 배지 리디자인 — dot + soft tint

pill(두꺼운 테두리 + 캡슐형)을 버리고, 컬러 dot + 옅은 배경의 낮은 대비 스타일로
바꾼다. 정보 위계상 배지가 행 전체보다 튀지 않으면서 색으로 상태가 구분된다.

공통 마크업: `inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs
font-medium` + 톤별 `bg-*-500/10 text-*-300` + dot `h-1.5 w-1.5 rounded-full
bg-*-400`. border는 제거한다.

톤 매핑 (adapters.ts에서 정의, `stockStatusClassNames` 의존 제거):

| tone | 배경/텍스트 | dot | 사용처 |
|---|---|---|---|
| danger | `bg-rose-500/10 text-rose-300` | `bg-rose-400` | 위험 증가, 높음, 고평가, 과열 |
| warning | `bg-amber-500/10 text-amber-300` | `bg-amber-400` | 관망, 중간 |
| safe | `bg-emerald-500/10 text-emerald-300` | `bg-emerald-400` | 안정, 낮음, 저평가, 냉각 |
| neutral | `bg-slate-500/10 text-slate-300` | `bg-slate-400` | 적정, 중립, 폴백 |

구현 방식:

- adapters.ts의 `evaluationBadgeClassNames`를 위 스타일로 교체하고
  `evaluationBadgeDotClassNames`(tone → dot 클래스)를 추가한다.
- resolver 5종(`resolveStatusBadge` + 평가 4종)의 반환 타입을
  `{ label: string; className: string; dotClassName: string }`으로 확장한다.
  `resolveStatusBadge`는 `stockStatusClassNames` 대신 위 톤 매핑을 사용한다
  (안정 → safe, 관망 → warning, 위험 증가 → danger). 라벨 매핑은 바꾸지 않는다.
- `WatchlistPage.tsx`의 상태 배지 span과 `EvaluationBadgeCell`을 공통 렌더링으로
  통일한다: dot용 `<span aria-hidden="true" className={...dotClassName} />` +
  라벨 텍스트. 별도 컴포넌트로 추출해도 좋다 (예: `TableBadge`).
- `stockStatusClassNames`(`src/shared/ui/stockStatus.ts`)는 다른 페이지가 공유하므로
  수정하지 않는다. 이 변경은 watchlist 테이블 배지에만 적용된다.

## Components

### 수정

- `src/features/watchlist/adapters.ts`
  — `evaluationBadgeClassNames` 스타일 교체, `evaluationBadgeDotClassNames` 추가
  — resolver 5종 반환 타입에 `dotClassName` 추가,
    `resolveStatusBadge`의 `stockStatusClassNames` 의존 제거
- `src/pages/ui/WatchlistPage.tsx`
  — 툴바 단일 flex 행 재구성 (Decisions §1)
  — th `text-center`, 배지 셀 5개 `text-center` (Decisions §2)
  — 상태 배지·`EvaluationBadgeCell` dot 배지 마크업 (Decisions §3)

### 테스트 영향

- `src/features/watchlist/adapters.test.ts`
  — resolver 5종 단언을 새 반환 형태(`className`·`dotClassName`)에 맞게 갱신.
    enum 픽스처와 출처 주석은 유지한다.
- `src/pages/ui/WatchlistPage.test.tsx`
  — 배지 라벨 기반 단언은 그대로 통과해야 한다 (라벨 변경 없음).
    클래스 문자열을 직접 단언하는 테스트가 있으면 새 스타일로 갱신한다.

## Out of Scope

- `stockStatusClassNames` 등 공유 토큰 변경 (다른 페이지 영향)
- 테이블 본문 텍스트 셀 정렬 변경
- 열 설정·내보내기·전체화면
- BE 변경
