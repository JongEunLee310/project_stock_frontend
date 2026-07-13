# Design — Issue 10: Stock Research Detail 페이지 (시안 반영)

> 시안 `research.png` 기준 재설계. 개별 종목의 헤더(현재가·핵심 지표 타일·AI 스탠스),
> 가격 차트 영역, AI 브리핑, 핵심 리스크, 뉴스·공시, 촉매 타임라인, 의사결정 체크리스트,
> 내 메모를 한 화면에 배치한다. 데이터는 `mockStockResearch`(+헤더 일부는 `mockStocks` 조인)에서
> 파생하되, 시안의 풍부한 필드를 담도록 도메인·Mock을 확장한다.
>
> **차트 경계**: 가격 차트는 **구조 자리표시(탭·기간 버튼·축 프레임) + CSS/SVG 스파크라인**까지만.
> 캔들·거래량·비교지수 렌더링과 차트 라이브러리는 **이슈 19**로 분리한다.

## 목적

`/research/:symbol`에서 종목 하나를 깊게 검토한다. 헤더로 현재 시세·밸류에이션 핵심 지표·AI
스탠스를 잡고, 가격 영역·브리핑·리스크·뉴스·촉매로 변수를 확인하며, 체크리스트·메모로 판단
과정을 남긴다. 모르는 심볼은 안전한 미발견 상태를 보여준다.

## 화면 구성 (시안 레이아웃)

라우트 `/research/:symbol`. `useParams`로 심볼을 받아 대문자화 후 mock을 조회한다. 좌측 글로벌
내비게이션·상단 알림/동기화 표시는 `AppShell` 소관(범위 밖).

1. **페이지 헤더** — "{SYMBOL} 리서치" 제목 + 관심종목 표시(`isFavorite`, 로컬 토글).
2. **종목 헤더 카드**
   - 좌: 로고(심볼 이니셜 대체) · 티커 · 이름 · 거래소·섹터(`market` · `sector`).
   - 중: 현재가(`price`)·전일대비(`change`/`changePercent`)·기준 시각(`priceAsOf`).
   - **AI 투자 스탠스 박스**: 상태 `Badge`(StockStatus) + 신뢰도(`stanceConfidence`%) + 스탠스 캡션(`stance`).
   - **지표 타일 5종**: 시가총액(`marketCap`) · 52주 저가~고가(`fiftyTwoWeekLow`/`High`) · 섹터(`sector`) ·
     다음 실적 발표(`nextEarningsDate`, 미래면 "예정") · 평균 목표주가(`targetPrice`, `targetUpsidePercent`%).
3. **가격 차트 영역 (구조 자리표시)**
   - 탭 프레임: 가격 / 밸류에이션 / 실적 — 활성 탭 상태만(가격 외 탭은 자리표시 안내).
   - 기간 버튼 프레임: 1D · 5D · 1M · 3M · 6M · YTD · 1Y · 3Y · 5Y(시각 프레임, 비활성).
   - 본문: `pricePoints` **CSS/SVG 스파크라인** + 최신 종가·기간 등락 텍스트.
   - 안내: "캔들·거래량·비교지수는 이슈 19에서 제공".
4. **AI 브리핑 패널** — 갱신 시각 + `briefing.headline`(강조) + `body` + 더보기(자리).
5. **핵심 리스크 패널** — 종합 리스크 수준 `Badge`(파생) + 항목별(`keyRisks`: 제목·레벨 `Badge`·설명) 3건+.
6. **뉴스·공시 요약** — `news` 리스트(카테고리 `Badge`(`category`)·헤드라인·출처·시각·위험도) + 더보기(자리).
7. **촉매 타임라인** — `catalysts` 날짜 오름차순 타임라인(점·날짜·제목·카테고리 `Badge`(`category`)).
8. **의사결정 체크리스트** — 진행도(n/총) + 항목별(`checklist`: 라벨·설명) 체크박스(로컬 토글).
9. **내 메모** — `memo` 초기값 textarea(로컬 입력) + 저장 상태 표시(자리).

## 컴포넌트 책임

| 요소                | 위치                                    | 책임                                                                               |
| ------------------- | --------------------------------------- | ---------------------------------------------------------------------------------- |
| `ResearchPage`      | `pages/ui`                              | 심볼 해석·mock 조회·미발견 처리·하위 조합·체크리스트/메모/관심종목 로컬 상태 보유. |
| 헤더 카드           | 페이지 내부                             | `mockStocks` 조인 + research 지표 타일·AI 스탠스 박스 표시.                        |
| 지표 타일           | 페이지 내부                             | 라벨 + 값(타일 반복).                                                              |
| 차트 영역(자리표시) | 페이지 내부(재사용 시 `shared/ui` 후보) | 탭·기간 프레임 + `pricePoints` 스파크라인(SVG).                                    |
| AI 브리핑 패널      | 페이지 내부                             | `briefing` 표시.                                                                   |
| 핵심 리스크 패널    | 페이지 내부                             | `keyRisks` 리스트 + 위험도 `Badge`.                                                |
| 뉴스 요약           | 페이지 내부                             | `news` 리스트(카테고리·위험도 `Badge`).                                            |
| 촉매 타임라인       | 페이지 내부                             | `catalysts` 정렬·타임라인.                                                         |
| 체크리스트          | 페이지 내부                             | 항목 체크 토글·진행도 파생.                                                        |
| 메모                | 페이지 내부                             | textarea 로컬 입력.                                                                |

### 위험도/상태/카테고리 표시

- `Stock.status`(StockStatus)·`ResearchRisk.level`·`NewsItem.risk`(RiskLevel)·뉴스/촉매 `category`는
  모두 기존 `Badge` 재사용(인라인 색상 복제 금지). 카테고리는 라벨 매핑만 페이지/공용 유틸로 둔다.

## 도메인·Mock 확장 (시안 필드 반영)

시안의 풍부한 필드가 현재 타입에 없어 확장한다(기존 타입에 필드 추가 + 신규 카테고리 enum).
신규 enum은 기존 `as const` 배열 + 파생 union 패턴을 따른다. 모든 mock 엔트리를 채우고
`satisfies`를 유지한다.

### 신규 enum (`src/shared/model/`)

| 파일                  | 정의                                      | 값                            |
| --------------------- | ----------------------------------------- | ----------------------------- |
| `newsCategory.ts`     | `newsCategories` + `NewsCategory`         | 실적 · 제품 · 파트너십 · 규제 |
| `catalystCategory.ts` | `catalystCategories` + `CatalystCategory` | 이벤트 · 실적 · 제품 · 공급   |

### 타입 필드 추가 (`src/shared/model/domain.ts`)

| 타입            | 추가 필드                                              | 의미                                                    |
| --------------- | ------------------------------------------------------ | ------------------------------------------------------- |
| `StockResearch` | `priceAsOf: string`                                    | 시세 기준 시각 표시(예 "05.24 16:00 ET · 종가")         |
| `StockResearch` | `stanceConfidence: number`                             | AI 스탠스 신뢰도(0~100)                                 |
| `StockResearch` | `marketCap: string`                                    | 시가총액 표시값(예 "2.54T USD")                         |
| `StockResearch` | `fiftyTwoWeekLow: number` / `fiftyTwoWeekHigh: number` | 52주 저가/고가                                          |
| `StockResearch` | `sector: string`                                       | 섹터(예 "정보기술")                                     |
| `StockResearch` | `nextEarningsDate: string`                             | 다음 실적 발표일(YYYY-MM-DD); 미래면 "예정" 표시는 파생 |
| `StockResearch` | `targetPrice: number` / `targetUpsidePercent: number`  | 평균 목표주가·상승여력%                                 |
| `NewsItem`      | `category: NewsCategory`                               | 뉴스 분류 태그                                          |
| `CatalystItem`  | `category: CatalystCategory`                           | 촉매 분류 태그                                          |
| `ChecklistItem` | `description: string`                                  | 체크 항목 보조 설명                                     |

> `marketCap`은 조 단위 표기를 위한 포매팅 유틸 도입을 피하려 표시 문자열로 둔다(WHY: 현 단계
> 불필요한 추상화 회피). 가격/목표가/52주가는 숫자 유지.

## 결정 (2026-06-22 확정, 시안 재설계)

- **차트 = 구조 자리표시 + 스파크라인**. 탭(가격/밸류에이션/실적)·기간(1D~5Y) 프레임과 `pricePoints`
  SVG 스파크라인까지만 구현. **캔들·거래량·비교지수·차트 라이브러리는 이슈 19**로 분리.
- **도메인·Mock 시안대로 확장**(위 표). 신규 enum 2종 + 기존 타입 필드 추가. Watchlist 재설계(task-009)
  처럼 동일 task에 도메인·Mock 확장(Part A)을 포함.
- **체크리스트·메모·관심종목 = 로컬 상태**(`useState`). 서버 영속화 없음(새로고침 초기화). 완료 조건의
  "체크 가능"·"메모 입력 UI"를 충족.
- **AI 스탠스 박스** = 상태 `Badge`(Stock.status) + 신뢰도(`stanceConfidence`) + `stance` 캡션.
- **미발견 심볼** = mock에 없으면 안전한 미발견 안내(빈 상태) + 워치리스트 복귀 링크.

## Out of Scope

- 캔들·거래량·비교지수 차트, 밸류에이션/실적 탭 콘텐츠, 기간 전환 데이터(모두 이슈 19).
- 실시간 시세·서버 연동·메모/체크리스트/관심종목 영속화(현 단계 mock·로컬 상태).
- 다른 페이지·라우팅·네비게이션·AppShell(알림·동기화 표시) 변경.
- 뉴스/촉매 "더보기" 상세 화면(자리 링크만).
