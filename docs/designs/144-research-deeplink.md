# Design — Issue 144: 리서치 상세 deep-link 쿼리

리서치 상세는 여러 화면이 수렴하는 종착역이다. 시그널 "근거 보기"와
대시보드 우선 확인 큐에서 진입할 때 관련 섹션으로 바로 스크롤·포커스하는
`section` 쿼리를 지원한다. #142(레이아웃)·#145(브리핑 구조화) 머지 후
기준이다.

## 파라미터 설계

- `/research/:symbol?section={value}` — 지원 값:
  `briefing` | `risks` | `news` | `checklist`. 값이 없거나 지원 외 값이면
  무동작(현행 렌더 그대로).
- 이슈 본문의 `?tab=signals` 표기는 `section`으로 통일한다 — 상세 화면에
  시그널 탭이 없고, 시그널 근거의 도착지는 AI 브리핑 카드이기 때문이다.
  `tab` 파라미터는 #149(밸류에이션·실적 탭 활성화)에서 차트 탭 선택용으로
  도입한다 (이번 범위 제외).

## Page — `src/pages/ui/ResearchPage.tsx`

- 섹션 카드 4곳에 앵커 id를 부여한다: `research-section-briefing`(AI
  브리핑), `research-section-risks`(핵심 리스크), `research-section-news`
  (뉴스 및 공시 요약), `research-section-checklist`(의사결정 체크리스트).
  각 카드 컨테이너에 `tabIndex={-1}`.
- `useSearchParams`로 `section`을 읽고, research 데이터 로드 완료 후 1회
  해당 요소에 `scrollIntoView({ block: 'start' })`와 `focus()`를 적용한다.
  같은 심볼에서 반복 실행되지 않도록 처리 완료를 ref로 기록하고, 심볼이
  바뀌면 초기화한다.
- 로딩·오류·빈 상태에서는 동작하지 않는다.

## 링크 부착

- `src/pages/ui/SignalsPage.tsx` — 카드의 "근거 보기" 버튼 navigate 경로에
  `?section=briefing` 부착. 그 외 심볼 링크(카드 헤더·레일)는 그대로 둔다.
- `src/pages/ui/DashboardPage.tsx` — 우선 확인 큐 행의 리서치 링크
  (`item.symbol` 기반)에 `?section=risks` 부착. 그 외 링크는 그대로 둔다.
- 경로 조립은 각 페이지의 기존 `getResearchPath` 헬퍼에 optional
  `section` 인자를 추가하는 방식으로 한다 (신규 공용 유틸 불필요).

## Test

- ResearchPage: `section=briefing` 진입 시 해당 카드로 scrollIntoView·
  focus 호출(jsdom mock), 지원 외 값·부재 시 무동작, 심볼 전환 시 재실행.
- SignalsPage: "근거 보기" 클릭 시 navigate 인자가
  `/research/{symbol}?section=briefing`.
- DashboardPage: 우선 확인 큐 링크 href에 `?section=risks`.

## Out of Scope

- `tab` 파라미터 (#149), 촉매·메모 섹션 앵커 (해당 도착 링크 없음),
  목록 화면 변경, BE 변경.

## Open Questions

- 없음. section 값 4종과 도착지 매핑(근거 보기 → briefing, 우선 확인 큐 →
  risks)은 이 문서로 확정한다.
