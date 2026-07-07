# Design: 환율 표시와 현재가 원화 병기 (#115)

## Status

Implemented

## Context

현재가가 달러로만 표시되어 원화 환산을 병기하고, 환율 자체도 전 페이지에서 상시
노출한다. BE 계약은 project_stock#228(PR #229, dev 머지)로 확정되었다.

## BE Contract (project_stock origin/dev 기준, 2026-07-07 확인)

- `GET /market/fx?pairs=USD/KRW` — envelope 래핑 `ExchangeRateResponse[]`:
  `{ pair: str, rate: Decimal, change_percent: Decimal, reference_at: datetime }`.
  `pairs` 생략 시 기본 `USD/KRW`. mock provider 결정적 값.
- 관심종목 확장 조회의 `AssetBriefResponse`에 `currency: str | null` 추가됨.
- Decimal 필드의 JSON 직렬화 형태는 기존 `GET /market/indices`(`value`,
  `change_percent`)와 동일 — FE의 `market-indices` dto·adapter가 처리하는 방식을
  그대로 따른다.

## Decisions

- **환율 위치**: `Sidebar` 안의 `<MarketSummary />`(src/widgets/Sidebar.tsx:91) 바로
  위에 환율 스트립을 배치한다. 사이드바는 전 페이지 공통이라 상시 노출 요구를
  충족한다. Topbar는 공간 제약으로 제외.
- **원화 병기 범위**: WatchlistPage 관심종목 테이블의 현재가 셀. `currency`가
  `"USD"`인 행만 환산 병기하고, 그 외(KOSPI 원화 원본, null)는 기존 표시 유지.
- **환산 표기**: 달러 값 아래(또는 옆)에 `≈ ₩263,000` 형태, 원화는 소수점 없이
  반올림. 환율 미로딩·오류 시 병기를 생략하고 달러만 표시한다 (병기는 부가 정보 —
  오류를 표면화하지 않는다).
- **환율 스트립 상태**: 로딩 Skeleton, 오류 시 조용히 숨기지 않고 간결한 오류
  표시(기존 MarketSummary의 ErrorState보다 축소된 형태 허용), 정상 시
  `USD/KRW 1,390.50 +0.35%` 형태와 기준 시각.

## Components

- `src/features/fx/dto.ts` — `ExchangeRateDto`
- `src/features/fx/adapters.ts` — 필요 시 숫자 변환 (market-indices 패턴)
- `src/features/fx/queries.ts` — `useFxRates()` (`['market', 'fx']` 키, staleTime은
  market-indices와 동일 규칙)
- `src/widgets/FxRateStrip.tsx` — 환율 스트립 (Sidebar에 삽입)
- `src/features/watchlist/dto.ts` — `WatchlistItemAssetDto.currency?: string | null`
- `src/features/watchlist/adapters.ts` — `WatchlistAssetRow.currency` 전달
- `src/pages/ui/WatchlistPage.tsx` — 현재가 셀 원화 병기

## Out of Scope

- Topbar 변경
- 종목 상세·추천 섹션 등 다른 화면의 원화 병기 (후속)
- BE 변경
