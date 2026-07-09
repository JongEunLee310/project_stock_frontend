# Design: watchlist 디테일 개선 — 로고·메모 더보기·헤더 툴팁·1D 스파크라인 (#125)

## Status

Implemented

## Source Issue

https://github.com/JongEunLee310/project_stock_frontend/issues/125

## Context

watchlist 페이지의 디테일 개선 4건이다. 종목 마크를 실제 회사 로고로 교체하고,
AI 관찰 메모가 전문 노출로 레일을 과점하는 문제를 더보기 토글로 해결하며, 평가 지표
3종(뉴스 위험도·밸류에이션·테마 과열) 헤더에 지표 정의 툴팁을 추가하고, 변화(1D)
스파크라인을 15분 간격 당일 데이터로 전환한다.

헤더 옆 ⓘ는 "이 지표가 무엇을 의미하는지"를 설명하는 장치다. 셀 단위의 "이 종목이
왜 이 상태인지"(종목별 근거 팝오버)는 BE 평가 계약에 근거 텍스트(summary·factors)가
없어 후속 작업으로 분리한다. `!` 기호는 danger 배지 인디케이터로 이미 사용 중이므로
헤더 아이콘은 ⓘ를 사용한다.

## Verified Facts

확인 기준 — feat/watchlist-detail-polish (origin/main에서 분기, PR #124 머지 반영됨).

- 종목 마크: `src/pages/ui/WatchlistPage.tsx:82-89` — `symbolMarks`가 6개 심볼의
  색상+글자 마크를 하드코딩. `StockIdentity`(WatchlistPage.tsx:190-221)가 테이블
  종목 셀에서, "새로 추가된 관심 종목" aside(WatchlistPage.tsx:1140-1160 부근)가
  같은 맵을 사용한다.
- `WatchlistAssetRow`에 `market: string` 필드가 있다 (`src/features/watchlist/adapters.ts:14`,
  값은 `item.asset.market ?? 'UNKNOWN'`, adapters.ts:256). aside가 쓰는
  `RecentWatchlistView`(adapters.ts:27-31)는 symbol·name·addedAt뿐이고 market이 없다.
- 로고 CDN 검증(2026-07-08, curl): `https://assets.parqet.com/logos/symbol/AAPL`·
  `NVDA`·`005930.KS` 모두 200, 미존재 심볼은 404 — `<img onError>` 폴백이 동작한다.
- AI 관찰 메모: `WatchlistPage.tsx:1074-1095` — `observations.items[].note` 전문을
  그대로 렌더링한다. 데이터 소스는 `useWatchlistObservations()`
  (`src/features/watchlist-observations/queries.ts`), note는 LLM 생성 텍스트로 길이
  제한이 없다.
- 테이블 헤더: `WatchlistPage.tsx:780-803` — 12개 헤더가 문자열 배열 map으로
  렌더링된다 (`text-center`, th `scope="col"`).
- `src/shared/ui/`에 툴팁·팝오버 컴포넌트가 없다 (신규 필요).
- 스파크라인: `src/features/watchlist/queries.ts:153` `useWatchlistSparklines(range = '1M')`,
  queryKey에 range 포함. 호출처는 `WatchlistPage.tsx:392`(인자 없음 → 1M).
  쿼리 에러 시 `sparklines = watchlistSparklinesQuery.data ?? {}`(WatchlistPage.tsx:407)로
  빈 맵이 되어 셀은 `—`를 표시한다(WatchlistPage.tsx:904-925) — BE 미지원 환경에서도
  페이지가 깨지지 않는다.
- BE 병행 작업: project_stock #239 (feat/watchlist-intraday-sparkline) —
  `GET /watchlists/{id}/sparklines?range=1D`가 15분 바를 반환하도록 확장 중.

## Decisions

### 1. 실제 회사 로고 — StockLogo 컴포넌트

`src/shared/ui/StockLogo.tsx`를 신설한다.

- props: `{ symbol: string; market?: string; className?: string }`.
- 로고 URL: `https://assets.parqet.com/logos/symbol/{sym}` — `sym`은 market이
  `KOSPI`면 `{symbol}.KS`, `KOSDAQ`이면 `{symbol}.KQ`, 그 외(NASDAQ·NYSE·미지정)는
  symbol 그대로.
- `<img loading="lazy" alt="">` + 컨테이너는 기존 마크와 동일 크기. 로고는 장식이므로
  `alt=""`로 두고 종목 식별은 인접 텍스트(심볼·이름)가 담당한다.
- `onError` 시 내부 state로 폴백 전환: 기존 `symbolMarks[symbol]` 스타일 글자 마크,
  맵에 없으면 `symbol[0]` + 기본 클래스. 로딩 전 빈 영역 방지를 위해 폴백과 동일한
  배경 위에 이미지를 얹는다.
- 소비처: `StockIdentity`(테이블)와 "새로 추가된 관심 종목" aside. aside는 market이
  없으므로 symbol 그대로 요청하고, KR 종목은 404 → 글자 마크 폴백으로 자연 처리된다.
- `symbolMarks` 맵은 폴백 용도로 유지한다.

### 2. AI 관찰 메모 더보기

- note가 긴 항목은 `line-clamp-3`으로 자르고 "더보기" 버튼을 노출한다. 확장 시
  전문 표시 + "접기" 버튼.
- 토글 노출 판단은 길이 임계값으로 한다: `note.length > 120`. CSS 오버플로 측정
  (ref + scrollHeight) 방식은 jsdom에서 검증 불가하므로 채택하지 않는다.
- 확장 상태는 항목별로 관리한다 (`Set<string>` of symbol). 요약문(`observations.summary`)은
  짧은 고정 문장이므로 변경하지 않는다.

### 3. 헤더 ⓘ 툴팁 — InfoTooltip 컴포넌트

`src/shared/ui/InfoTooltip.tsx`를 신설한다.

- props: `{ label: string; content: string; className?: string }` — label은 버튼
  접근 이름("~ 지표 설명"), content는 툴팁 본문.
- 마크업: `<button type="button" aria-label={label} aria-describedby={id}>` + ⓘ 글자
  (U+24D8). hover(onMouseEnter/Leave)와 keyboard focus(onFocus/Blur)에서 표시,
  Escape로 닫기. 툴팁은 `role="tooltip"` + 고유 id, 열려 있지 않으면 렌더링하지 않는다.
- 배치: th 안에서 `inline-flex` 정렬, 툴팁 패널은 절대 배치
  (`absolute z-20 w-72 whitespace-normal text-left`), 어두운 서피스 + 보더 톤은
  기존 Card 팔레트를 따른다.
- 헤더 배열을 `{ label: string; info?: string }` 객체 배열로 바꾸고 뉴스 위험도·
  밸류에이션·테마 과열 3개에만 info를 부여한다.

툴팁 문구 (개발자 제공 원문 기반, 그대로 사용):

- 뉴스 위험도: "최근 뉴스, 공시, 실적 발표, 규제 이슈를 분석해 해당 종목에 부정적
  이벤트가 얼마나 강하게 감지되는지 나타냅니다. 판단 요소: 부정 뉴스 비율 · 뉴스
  발생량 증가 · 실적/규제/소송/수요 둔화 등 주요 이벤트 · 출처 신뢰도 · 최근성.
  높음은 즉시 매도 신호가 아니라 추가 확인이 필요한 상태를 의미합니다."
- 밸류에이션: "현재 주가가 실적, 성장률, 과거 평균, 동종 기업 대비 얼마나 부담스러운
  수준인지 나타냅니다. 판단 요소: PER/Forward PER · PSR · EV/EBITDA · PEG · 최근
  3~5년 밸류에이션 밴드 · 동종 기업 및 섹터 평균 비교. 높음은 성장성이 나쁘다는 뜻이
  아니라 현재 가격에 기대가 많이 반영되었을 가능성을 의미합니다."
- 테마 과열: "해당 종목이 속한 테마에 시장 관심과 자금이 얼마나 과도하게 몰려
  있는지 나타냅니다. 판단 요소: 테마 관련 뉴스 증가 · 관련 종목 동반 상승 · 단기
  가격 모멘텀 · 거래량 급증 · 밸류에이션 확장. 높음은 해당 기업이 나쁘다는 뜻이
  아니라 FOMO 매수와 단기 변동성 위험이 커졌다는 의미입니다."

### 4. 변화(1D) 스파크라인 15분 간격

- `WatchlistPage.tsx:392`의 호출을 `useWatchlistSparklines('1D')`로 바꾼다.
  훅 시그니처·queryKey는 이미 range를 지원하므로 다른 변경이 없다.
- BE(#239) 머지 전 환경에서는 range=1D가 422로 실패하고 기존 에러 폴백(빈 맵 → `—`)이
  동작한다. 페이지 기능 저하는 스파크라인 셀에 국한된다.

## Components

### 신규

- `src/shared/ui/StockLogo.tsx` — 로고 이미지 + 글자 마크 폴백 (Decisions §1)
- `src/shared/ui/InfoTooltip.tsx` — 접근성 지원 지표 설명 툴팁 (Decisions §3)
- 둘 다 `src/shared/ui/index.ts`에 export 추가

### 수정

- `src/pages/ui/WatchlistPage.tsx`
  — `StockIdentity`·aside 마크를 `StockLogo`로 교체 (§1)
  — AI 관찰 메모 항목 line-clamp + 더보기/접기 토글 (§2)
  — 헤더 배열 객체화 + 3개 헤더 `InfoTooltip` (§3)
  — `useWatchlistSparklines('1D')` (§4)

### 테스트 영향

- `src/shared/ui/StockLogo.test.tsx` (신규) — NASDAQ 심볼은 그대로, KOSPI 심볼은
  `.KS` 접미사 URL 렌더링, `fireEvent.error(img)` 후 글자 마크 폴백 단언.
- `src/shared/ui/InfoTooltip.test.tsx` (신규) — 기본 비표시, hover·focus 표시,
  Escape 닫기, `role="tooltip"`·`aria-describedby` 연결 단언.
- `src/pages/ui/WatchlistPage.test.tsx` — 긴 note 더보기 토글 시나리오, ⓘ 버튼
  3개 존재 단언. 기존 라벨 기반 단언은 그대로 통과해야 한다.
- `src/features/watchlist/queries.test.tsx` — sparklines 요청 URL이 `range=1D`인지
  단언 갱신.

## Revision R1 — 요약문 클램프 추가

개발자 피드백: R0 반영 후에도 AI 관찰 메모가 길게 표시된다. 원인은 R0 Decisions §2의
가정("요약문은 짧은 고정 문장") 오류다. BE `ObservationsResult.summary: str`은 길이
제약이 없는 LLM 생성 텍스트라 요약 단락이 클램프 없이 전문 노출된다.

### 결정

- `observations.summary`에도 항목 note와 동일한 규칙을 적용한다:
  `summary.length > 120`일 때 `line-clamp-3` + "더보기/접기" 토글.
- 확장 상태는 boolean state 하나로 관리한다 (항목 Set과 별도).
- 항목 note의 기존 동작(임계값·클램프·토글)은 변경하지 않는다.

### 테스트 영향

- `WatchlistPage.test.tsx` — 긴 summary(120자 초과)에서 더보기 토글로 전문이
  확장·축소되는 시나리오 추가. 짧은 summary는 토글이 노출되지 않는다.

## Out of Scope

- 셀 클릭 시 종목별 근거 팝오버 — BE 평가 계약(summary·factors) 확장 필요, 후속 작업
- `DashboardPage.tsx`의 유사 종목 마크 (watchlist 범위 외)
- BE 변경 (project_stock #239에서 병행)
- 열 설정·내보내기·전체화면

## ADR Need

불필요. 외부 로고 CDN은 이미지 소스일 뿐 데이터 계약·아키텍처 변화가 없다.
