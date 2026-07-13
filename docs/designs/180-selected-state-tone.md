# 180 — 버튼·하이라이트 톤 2차: 선택 상태 저채도화

Status: Handoff Ready

## 1. 배경

PR #176은 배지 축소·accent 배지 저채도화·ghost hover 완화만 반영해 화면
체감이 약했습니다. 기간 버튼·탭 등 선택 상태가 여전히 primary 원색 면
채움(bg-app-accent-strong)이라 무겁습니다.

- 이슈: JongEunLee310/project_stock_frontend#180
- 에픽: #152 (디자인 정밀화 단계), 선행 #171 (PR #176)

## 2. 범위

포함:

- `src/shared/ui/Button.tsx` — 선택용 저채도 variant `selected` 추가.
- `src/pages/ui/ResearchPage.tsx` — 기간 버튼·차트 탭·뉴스/공시 탭·
  벤치마크 토글의 선택 상태를 `selected` variant로 교체.

제외:

- `primary`(진짜 CTA — 폼 제출·판단 기록 등) 값 변경 없음.
- 다른 페이지의 동일 패턴 교체는 후속 (회귀 범위 최소화).

## 3. 변경

- `Button` — `ButtonVariant`에 `selected` 추가:
  `border-app-accent/40 bg-app-accent/15 text-app-accent
  hover:bg-app-accent/25 focus-visible:outline-app-accent`
  (배지 accent 톤과 동일 계열로 통일).
- `ResearchPage` — 선택 상태 삼항의 `'primary'`를 `'selected'`로 교체:
  - 기간 버튼(`range === priceRange`)
  - 벤치마크 비교 토글(`isBenchmarkEnabled`)
  - 차트 탭 3종(`activeTab === ...`)
  - 뉴스/공시 탭(`isNewsTab`)

### 3.1 사용자 피드백 반영 (2026-07-14, R2)

- 차트 탭(가격·밸류에이션·실적)은 면 하이라이트 대신 밑줄 + bold +
  accent 색의 밑줄형 탭으로 바꾼다 (plain button, role=tab 유지).
  뉴스/공시 탭과 기간 버튼은 selected variant 유지.
- 차트 현재가 pill(`renderLastValueShape`)을 저채도화한다: 표면색
  베이스 rect 위에 accent 틴트(fillOpacity 0.16)·보더(strokeOpacity
  0.45)를 얹고 텍스트는 accent 색으로 표시한다.

## 4. Risks / Notes

- `selected`는 신규 variant라 기존 화면(primary 사용처)에 영향이 없다.
  #180 이슈 본문의 "사용처에서 variant 교체" 방안을 채택한 것.
- 저채도 배경에서 선택 상태 인지가 약해질 수 있어 텍스트는 accent 색
  + font-semibold(베이스 유지)로 위계를 지킨다.

## 5. 테스트

- Button: `selected` variant 렌더 클래스 확인 테스트 추가.
- ResearchPage: 기존 aria-pressed/aria-selected 단언은 variant와 무관하게
  유지되는지 확인 (클래스 단언이 있으면 보정).
- 검증 4종: `pnpm format:check` · `pnpm typecheck` · `pnpm lint` ·
  `pnpm test -- --run`.

## 6. 관련 링크

- 이슈 #180, 에픽 #152, 선행 PR #176
- 디자인: research.png (로컬 참고 이미지)
