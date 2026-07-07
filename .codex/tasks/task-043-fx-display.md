# Codex Handoff Task

## Source Issue

https://github.com/JongEunLee310/project_stock_frontend/issues/115

## Task Summary

사이드바 시장 요약 위에 USD/KRW 환율 스트립을 추가하고, 관심종목 테이블의 현재가(USD 종목)에 원화 환산을 병기한다.

## Goal

- 모든 페이지에서 사이드바에 환율(율·변동률·기준 시각)이 표시된다.
- 관심종목 현재가에 `currency === "USD"`인 행만 원화 환산이 병기된다.
- 검증 4종(pnpm format:check, typecheck, lint, test) 통과.

## Background

설계 문서: `docs/designs/115-fx-display.md` — BE Contract·Decisions·Components 확정. 구현 전 BE 저장소(`/Users/sleepyowl/Projects/project_stock`, origin/dev)의 `app/domains/market/schema.py`(`ExchangeRateResponse`)·`app/domains/watchlists/schema.py`(`AssetBriefResponse.currency`)와 대조하고, 불일치하면 보고 후 실계약을 우선하라.

핵심 계약:

- `GET /market/fx` → envelope `[{ pair, rate, change_percent, reference_at }]` (pairs 생략 시 USD/KRW). Decimal 직렬화는 기존 `GET /market/indices`와 동일 — `src/features/market-indices/`의 dto·adapter 처리 방식을 그대로 따른다.
- 관심종목 확장 조회 asset에 `currency: string | null` 추가됨.

기존 패턴: `apiGet` envelope 처리, `parseDecimal`(`src/shared/lib/format/decimal.ts`), Sidebar의 `<MarketSummary />` 삽입 위치는 `src/widgets/Sidebar.tsx:91`, WatchlistPage 현재가 셀은 `src/pages/ui/WatchlistPage.tsx:602-606` 부근 `priceFormatter`.

## Implementation Scope

설계 문서의 Components 절을 따른다.

- `src/features/fx/` — dto, adapters(필요 시), queries (`useFxRates`, 쿼리 키 `['market', 'fx']`, staleTime 등 옵션은 market-indices 쿼리와 동일 규칙)
- `src/widgets/FxRateStrip.tsx` — 환율 스트립: 정상 시 `USD/KRW 1,390.50 +0.35%` 형태 + 기준 시각(기존 시간 포맷 유틸), 로딩 Skeleton, 오류 시 간결한 오류 표시. 변동률 색상은 MarketSummary의 상승/하락 색상 규칙을 따른다.
- `src/widgets/Sidebar.tsx` — `<MarketSummary />` 바로 위에 삽입
- `src/features/watchlist/dto.ts` — `WatchlistItemAssetDto.currency?: string | null`
- `src/features/watchlist/adapters.ts` — `WatchlistAssetRow`에 `currency` 전달
- `src/pages/ui/WatchlistPage.tsx` — 현재가 셀: `currency === "USD"`이고 환율이 로딩된 경우에만 `≈ ₩263,000` 형태(소수점 없이 반올림)로 병기. 환율 미로딩·오류·비USD·currency null이면 기존 표시 그대로.
- 관련 테스트 추가·갱신

## Out of Scope

- Topbar 변경
- 종목 상세·추천 섹션 등 다른 화면의 원화 병기
- BE 변경 (필요하면 보고만 하고 중단)
- MarketSummary 자체 변경

## Protected Files

없음. 보호 파일을 수정하지 않는다.

## Requirements

- 원화 병기는 부가 정보다: 환율 조회 실패가 관심종목 테이블 렌더링을 깨뜨리거나 오류를 표면화하지 않아야 한다.
- 환산은 표시 시점 계산만 하고 상태로 저장하지 않는다.
- 원화 표기는 `ko-KR` 로케일 천 단위 구분 + 소수점 없음.
- 환율 스트립과 관심종목의 환율 조회는 동일 쿼리(`useFxRates`)를 공유한다 (중복 호출 없음, react-query 캐시 공유).
- 접근성: 스트립에 적절한 aria-label, 병기 텍스트는 스크린리더가 읽을 수 있는 일반 텍스트.

## Test Requirements

- `useFxRates` 쿼리 테스트 (envelope 파싱·숫자 변환)
- FxRateStrip 렌더링: 정상·로딩·오류 상태
- WatchlistPage 현재가 병기: USD 행 병기 표시, 비USD(KRW) 행 병기 없음, 환율 오류 시 달러만 표시
- adapters currency 전달 단위 테스트
- 기존 테스트를 약화하거나 삭제하지 않는다.

## Verification Commands

- `pnpm format:check`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`

(참고: prettier 미준수 시 개별 파일 대상 `pnpm prettier --write <파일>`로 정리 — repo 전체 `pnpm format`은 샌드박스에서 EPERM으로 실패한 전례가 있다)

## Documentation Impact

`docs/designs/115-fx-display.md`의 Status를 구현 완료 후 `Implemented`로 갱신한다.

## ADR Need

불필요.

## Failure Record Need

불필요.

## Risk Level

Low — 표시 계층 추가와 필드 전달이며 기존 데이터 흐름 변경이 없다.

## Expected Output

- 변경 파일 목록 보고
- 검증 4종 실행 결과 보고
- BE 계약 대조 결과 보고
- 가정·잔여 위험 보고

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
- 현재 체크아웃된 브랜치(feat/115-fx-display)에서 그대로 작업한다. 새 브랜치를 만들지 않는다. 커밋하지 않는다.
