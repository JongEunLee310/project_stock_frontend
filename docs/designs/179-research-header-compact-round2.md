# 179 — 리서치 헤더 컴팩트 2차 (실제 로고·별/기록 아이콘·스탠스 호버 상세)

Status: Handoff Ready

## 1. 배경

#167에서 헤더를 텍스트 중심으로 바꿨지만, 상단에 액션 버튼 3종
(관심종목·워치리스트·판단 기록)이 별도 행으로 남아 있고 스탠스 박스에
근거·코멘트 문단이 그대로 노출되어 헤더가 여전히 높습니다. 종목 로고도
이니셜 타일이라 완성도가 떨어집니다. 목표는 위아래 공간 축소와 모던한
인상입니다.

- 이슈: JongEunLee310/project_stock_frontend#179
- 에픽: #152 (디자인 정밀화 단계), 선행 #167

## 2. 범위

포함:

- `src/pages/ui/ResearchPage.tsx`의 `HeaderCard`와 그 호출부.

제외:

- 계약 변경 없음 (로고 URL의 BE 계약 추가는 별도 후속).
- 헤더 밖 영역 변경 없음.

## 3. 변경

- 로고 — 이니셜 타일 자리에 `<img>`를 사용한다.
  - src: `https://assets.parqet.com/logos/symbol/{SYMBOL}?format=png`
  - `useState` 기반 `onError` 폴백: 로드 실패 시 기존 이니셜 타일 렌더.
  - 컨테이너는 기존 타일 규격(h-14 w-14 rounded-control border) 유지,
    이미지 `object-contain p-1.5`, `alt=""`(장식) + 심볼 텍스트는 옆에
    이미 존재.
- 액션 행 제거 — 상단 `mb-5` 버튼 행(관심종목·워치리스트·판단 기록)을
  삭제한다.
  - 관심종목: 심볼 `h2` 옆에 별 아이콘 토글 버튼(`react-icons/lu`
    `LuStar`, 활성 시 fill·accent 색, 비활성 시 muted 외곽선).
    `aria-pressed`·`aria-label="관심종목 추가/해제"`·pending 시 disabled
    유지.
  - 판단 기록: 별 아이콘 옆에 기록 아이콘 링크(`LuClipboardList` 또는
    `LuNotebookPen`) — 기존과 동일하게
    `decisionLog?symbol={symbol}`로 이동. `aria-label="판단 기록 보기"`.
  - 워치리스트 버튼: 제거.
- AI 투자 스탠스 박스 — 라벨 + 스탠스 배지 + 신뢰도 텍스트만 남긴다.
  `confidenceBasis`·`stanceComment`는 박스에서 제거하고, 신뢰도 옆
  `InfoTooltip`(호버/포커스)으로 두 텍스트를 표시한다. 둘 다 없으면
  툴팁 트리거를 렌더하지 않는다.

## 4. Risks / Notes

- 외부 로고 CDN 의존이 생긴다. 실패 폴백이 있으므로 렌더는 안전하지만,
  오프라인·차단 환경에서는 항상 이니셜이 보인다. BE 계약(logo_url)
  추가를 후속 이슈로 남긴다.
- HeaderCard가 navigate를 계속 쓰므로 `useNavigate` 유지. 기록 아이콘은
  Link 컴포넌트로 바꿔도 무방하다 (구현 시 택일).
- 별 토글은 기존 toggleFavorite 로직·props를 그대로 재사용한다.

## 5. 테스트

- 별 토글: aria-pressed 상태 반영, 클릭 시 기존 mutate 호출 (기존
  '관심종목' 버튼 테스트를 아이콘 기준으로 보정).
- 기록 링크: 해당 심볼 쿼리를 가진 경로로 이동.
- 스탠스: basis/comment가 있으면 툴팁 content로 접근 가능, 둘 다 없으면
  트리거 미노출.
- 로고: onError 시 이니셜 폴백 렌더.
- 검증 4종: `pnpm format:check` · `pnpm typecheck` · `pnpm lint` ·
  `pnpm test -- --run`.

## 6. 관련 링크

- 이슈 #179, 에픽 #152, 선행 #167 (PR #173)
- 디자인: research.png (로컬 참고 이미지)
