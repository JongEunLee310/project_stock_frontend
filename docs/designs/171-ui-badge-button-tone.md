# 171 — 배지·버튼·하이라이트 공용 스타일 정리

Status: Handoff Ready

## 1. 배경

배지가 크고 톤 대비가 약하며, 기간 버튼·탭의 선택 상태가 원색 면 채움에
가까워 research.png의 정제된 저채도 칩·미묘한 선택 톤과 인상이 다릅니다.

- 이슈: JongEunLee310/project_stock_frontend#171
- 에픽: #152 (디자인 정밀화 단계)

## 2. 범위

포함:

- `src/shared/ui/Badge.tsx` — 크기·톤 조정.
- `src/shared/ui/Button.tsx` — primary(선택 상태)·ghost 변형 톤 조정.
- 리서치 페이지에서 우선 확인, 공용 컴포넌트이므로 타 페이지 회귀 점검.

제외:

- 신규 variant 추가 최소화 — 기존 variant의 토큰 값 조정이 우선.
- 색상 팔레트 토큰(`@theme`) 자체의 대규모 개편.

## 3. 변경

- `Badge` (`src/shared/ui/Badge.tsx`) — 베이스 클래스를
  `min-h-7 px-2.5 py-1 text-sm font-medium`에서
  `min-h-6 px-2 py-0.5 text-xs font-semibold` 수준으로 축소한다.
- `badgeToneClassNames` (`src/shared/ui/stockStatus.ts`) —
  - `accent`: 원색 면 채움(`bg-app-accent-strong text-app-accent-text`)을
    저채도 조합(`border-app-accent/40 bg-app-accent/15 text-app-accent`)으로
    바꾼다.
  - `info`·`warning`의 원시 Tailwind 색은 유지하되 규격만 공유한다
    (토큰화는 pr-34 리뷰에서 후속으로 남긴 사안 — 이번 범위 제외).
  - status/decision/risk 계열은 `@theme` 토큰 기반이므로 값 변경 없이
    베이스 규격 축소만 적용받는다.
- `Button` (`src/shared/ui/Button.tsx`) —
  - `primary`: 면 채움은 유지하되 선택 상태의 과한 원색 인상이 줄도록
    `font-semibold` 베이스는 그대로 두고 hover 톤을 정리한다.
  - `ghost`: hover 배경을 `hover:bg-app-surface-muted/60` 수준으로 완화하고
    텍스트 대비는 유지한다.
  - 필요 시 저채도 선택 톤 variant를 추가할 수 있으나, 기존 variant 값
    조정으로 충분하면 추가하지 않는다 (신규 variant 최소화 원칙).
- 링크형 액션("더 보기 ›" 등 ghost 소형 버튼)의 크기·색 사용을 리서치
  페이지 기준으로 점검해 통일한다.

## 4. Risks / Notes

- 공용 컴포넌트이므로 대시보드·워치리스트·시그널·알림 화면의 기존 사용처
  스냅샷·텍스트 단언이 깨질 수 있다. 클래스 변경만으로 텍스트 단언은
  영향이 없어야 하며, 깨지는 테스트는 의미 동일 범위에서만 보정한다.
- aria-pressed·role 등 접근성 속성은 변경하지 않는다.

## 5. 테스트

- 기존 전 페이지 테스트 통과 (공용 컴포넌트 회귀 확인).
- 검증 4종: `pnpm format:check` · `pnpm typecheck` · `pnpm lint` · `pnpm test -- --run`.

## 6. 관련 링크

- 이슈 #171, 에픽 #152
- 디자인: research.png (로컬 참고 이미지)
