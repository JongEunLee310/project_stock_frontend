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

## Revision R1 — 요약문 클램프 추가 (R2로 대체됨)

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

## Revision R2 — 카드 단위 접기/펴기로 전환 (R0 §2·R1 대체)

개발자 피드백: 문단(요약문·항목)마다 개별 클램프와 더보기 버튼을 다는 방식은 의도가
아니다. 카드 하단에 원래 있던 "더 보기 ›" 버튼(기존에는 핸들러가 없는 장식)을 활용해
메모 영역 전체를 접었다 펴는 방식으로 하고, 접힌 상태에서 영역이 과도하게 커지지
않아야 한다.

### 결정

- R0 §2의 항목별 클램프·토글과 R1의 요약문 클램프·토글을 모두 제거하고, 문단은
  원래대로 전문 렌더링한다.
- 메모 콘텐츠 래퍼(div)에 접힌 상태에서 `max-h-56 overflow-hidden`을 적용한다.
  콘텐츠가 상한보다 짧으면 시각 변화가 없다.
- 카드 하단 기존 ghost Button에 토글 핸들러를 연결한다: 접힘 → "더 보기 ›",
  펼침 → "접기 ‹". 상태는 boolean 하나(`isObservationsExpanded`).
- 토글 노출 여부를 콘텐츠 높이로 판단하지 않는다 (jsdom에서 scrollHeight 측정
  불가, 버튼은 기존에도 항상 노출되던 요소다).

### 테스트 영향

- R0·R1의 문단 클램프 테스트 3건을 제거하고, 카드 단위 접기/펴기 시나리오 1건으로
  대체한다 (기본 접힘 `max-h-56 overflow-hidden` → 더 보기 클릭 시 해제 + "접기"
  노출 → 접기 클릭 시 복원).

## Revision R3 — 한국 종목 로고 폴백 체인·툴팁 구조화

개발자 피드백 2건.

### 1. 일부 종목이 실제 로고가 아님

원인: "새로 추가된 관심 종목" aside는 BE 요약 계약(`RecentWatchlistItemResponse`:
symbol·name·created_at)에 market이 없어 한국 종목(005930)이 접미사 없이 요청되고
404 → 글자 마크로 폴백된다. Parqet에는 `005930.KS` 실로고가 존재함을 확인했다.

결정: `StockLogo`가 단일 URL 대신 후보 체인을 순회한다.

- market이 KOSPI/KOSDAQ이면 기존 매핑 그대로 단일 후보.
- market 정보가 없거나 매핑 외 값이어도 심볼이 6자리 숫자(한국 티커 형식)이면
  `{symbol}.KS` → `{symbol}.KQ` 순으로 시도한다.
- 그 외에는 심볼 그대로 단일 후보. 후보 소진 시 글자 마크 폴백 (기존 동작).
- BE 계약 변경 없이 해결한다. 요약 계약에 market 추가는 후속 여지로 남긴다.

### 2. 헤더 ⓘ 툴팁 구조화 + 실제 배지로 설명

기존 한 문단 서술이 산만하다는 피드백. 툴팁을 구조화하고 등급 설명에 실제 배지
컴포넌트를 사용한다.

- `InfoTooltip.content`를 `string` → `ReactNode`로 확장한다 (패널 폭 `w-72` → `w-80`).
- `MetricTooltipGuide` 컴포넌트(WatchlistPage 내부)를 신설한다:
  정의 한 문장 → "판단 요소" 불릿 목록 → 배지 레전드(실제 `TableBadge` + 등급별
  한 줄 설명) → 구분선 아래 주의 문구.
- 배지 레전드는 셀과 동일한 resolver를 사용한다 (뉴스 위험도 LOW/MEDIUM/HIGH,
  밸류에이션 LOW/MODERATE/HIGH, 테마 과열 COLD/NEUTRAL/OVERHEATED —
  `app/domains/watchlists/types.py` enum 값).
- 헤더 배열은 모듈 상수 `watchlistTableHeaders`로 승격한다. 라벨 텍스트는 불변.

### 테스트 영향

- `StockLogo.test.tsx` — market 없는 6자리 심볼의 KS→KQ→글자 마크 체인 시나리오 추가.
- `WatchlistPage.test.tsx` — 툴팁 hover 시 정의·판단 요소·배지 레전드(낮음/중간/높음)·
  주의 문구가 표시되는 시나리오 추가.

## Revision R4 — 툴팁 패널 포털 배치

개발자 피드백: 툴팁을 열면 테이블에 스크롤이 생기고, 잘린 내용을 보려고 스크롤하면
호버가 풀려 툴팁이 닫힌다. 원인은 툴팁 패널이 테이블의 가로 스크롤 컨테이너
(`overflow-x-auto`) 내부에 absolute로 렌더링되어 스크롤 영역을 넓히기 때문이다.

### 결정

- 툴팁 패널을 `createPortal(document.body)`로 렌더링하고 `position: fixed`로
  배치한다. 열릴 때 버튼의 `getBoundingClientRect()`로 좌표를 계산한다
  (top = 버튼 하단 + 8px, left = 버튼 중심, 패널 반폭 160px + 여백 8px 기준으로
  뷰포트 좌우 클램프).
- 트리거 동작(hover/focus 표시, Escape 닫기)·`aria-describedby` 연결·콘텐츠는
  변경하지 않는다. 포털이어도 같은 document라 aria 연결이 유지된다.
- 열림 상태 boolean 대신 좌표 state(`position | null`)로 통합한다.

### 테스트 영향

- `InfoTooltip.test.tsx` — 툴팁이 `document.body` 직하위에 렌더링되는지 단언 추가.
  기존 시나리오는 변경 없이 통과한다.

## Revision R5 — AI 판단 헤더 툴팁 추가

개발자 요청. AI 판단 헤더에도 R3 구조(`MetricTooltipGuide`)의 ⓘ 툴팁을 추가한다.

- 판단 요소는 BE가 LLM 평가에 실제로 전달하는 스냅샷 항목
  (`WatchlistEvaluationItem`: status·per·peg·daily_change_percent)을 근거로 기술한다.
- 배지 레전드는 `resolveAiJudgmentBadge`의 STABLE(안정)/WATCH(관망)/
  RISK_INCREASING(위험 증가)을 사용한다 (`app/domains/watchlists/types.py`).
- 주의 문구: 위험 증가는 매도 지시가 아닌 관찰 신호임을 명시한다.

## Out of Scope

- 셀 클릭 시 종목별 근거 팝오버 — BE 평가 계약(summary·factors) 확장 필요, 후속 작업
- `DashboardPage.tsx`의 유사 종목 마크 (watchlist 범위 외)
- BE 변경 (project_stock #239에서 병행)
- 열 설정·내보내기·전체화면

## ADR Need

불필요. 외부 로고 CDN은 이미지 소스일 뿐 데이터 계약·아키텍처 변화가 없다.
