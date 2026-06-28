# 접근성·키보드 사용성 점검 (이슈 #20)

## 1. 목적

FE-M3 운영 화면이 키보드·스크린리더 환경에서 최소 사용성을 갖는지 점검하고, 발견된 갭을 수정한다. 신규 기능이 아닌 **감사(audit) + 갭 수정** 성격.

## 2. 점검 항목·결과

이슈 #20 완료조건 4개 기준 전수 점검.

| 항목                       | 결과                   | 근거                                                                                                                                                            |
| -------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 주요 버튼 focus 스타일     | 대체로 충족 → 1건 수정 | `Button.tsx`는 `focus-visible:outline-2/offset-2` 보유. 네이티브 버튼(Watchlist 행 메뉴·즐겨찾기 등)도 focus-visible 보유. **AlertsPage 탭 버튼만 누락 → 수정** |
| 아이콘 버튼 접근성 라벨    | 충족                   | Watchlist `⋮ 행 메뉴`(`aria-label`+`aria-expanded`)·즐겨찾기(`aria-label`+`aria-pressed`), Signals 액션은 `<Button aria-label>`                                 |
| 입력 필드 label/aria-label | 충족                   | Signals/Watchlist `<label>` 래핑 또는 `sr-only`+`aria-label`, DecisionLog `FieldLabel htmlFor`+`id`, Research textarea `htmlFor`+`id`                           |
| 색상 단독 상태 구분 금지   | 대체로 충족 → 1건 보강 | `Badge`는 항상 텍스트 라벨 동반(색상+텍스트). **AlertsPage 탭 활성상태가 색상 단독 → `aria-pressed` 보강**                                                      |

### 추가 점검 (완료조건 외 기본 항목)

| 항목                     | 결과                                                      |
| ------------------------ | --------------------------------------------------------- |
| 테이블 헤더 구조         | `Table.tsx` `<th scope="col">` 적용                       |
| 클릭 가능 행 키보드 조작 | Watchlist 행 `tabIndex={0}`+`onKeyDown`(Enter/Space) 보유 |

## 3. 수정 내역

- `src/pages/ui/AlertsPage.tsx` 탭 버튼: `focus-visible` outline 추가(키보드 포커스 가시화) + `aria-pressed`로 활성 탭을 스크린리더에 전달(색상 단독 의존 해소).

## 4. 스코프 밖 (비차단 후속)

- 색상 대비비(WCAG AA 수치)는 정적 코드 점검으로 단정 불가 — 디자인 토큰 대비 측정은 별도 후속.
- Watchlist 클릭 가능 `<tr>`에 `role`/`aria-label` 부재(키보드 조작은 가능, 스크린리더 역할 안내만 약함) — 행 내부에 동등 동작 버튼이 있어 비차단.
- AlertsPage 탭을 정식 `role="tablist"/"tab"/"tabpanel"` 구조로 승격 — 현 패널 구조 변경 필요해 범위 밖.
