import { fireEvent, screen, within } from '@testing-library/react'
import { vi } from 'vitest'

import {
  createAlertsQueriesMock,
  createFxQueriesMock,
  createMarketIndicesQueriesMock,
  createResearchQueriesMock,
  createSharedUiMock,
  createWatchlistAlertTemplatesQueriesMock,
  createWatchlistObservationsQueriesMock,
  createWatchlistQueriesMock,
  createWatchlistRecommendationsQueriesMock,
  cleanupWatchlistTestState,
  resetWatchlistTestState,
  watchlistTestState,
} from './__tests__/watchlistPageTestUtils'
import { renderWatchlist } from './__tests__/watchlistPageRenderUtils'

vi.mock('@/shared/ui', async (importOriginal) =>
  createSharedUiMock(await importOriginal<typeof import('@/shared/ui')>()),
)
vi.mock('@/features/market-indices/queries', () =>
  createMarketIndicesQueriesMock(),
)
vi.mock('@/features/fx/queries', () => createFxQueriesMock())
vi.mock('@/features/watchlist/queries', () => createWatchlistQueriesMock())
vi.mock('@/features/watchlist-alert-templates/queries', () =>
  createWatchlistAlertTemplatesQueriesMock(),
)
vi.mock('@/features/watchlist-observations/queries', () =>
  createWatchlistObservationsQueriesMock(),
)
vi.mock('@/features/watchlist-recommendations/queries', () =>
  createWatchlistRecommendationsQueriesMock(),
)
vi.mock('@/features/alerts/queries', () => createAlertsQueriesMock())
vi.mock('@/features/research/queries', () => createResearchQueriesMock())

beforeEach(resetWatchlistTestState)
afterEach(cleanupWatchlistTestState)

describe('WatchlistPage display and layout', () => {
  it('renders the redesigned watchlist structure', async () => {
    renderWatchlist()

    expect(
      await screen.findByRole('heading', { name: '관심 종목' }),
    ).toBeVisible()
    expect(screen.getByText('전체 관심 종목')).toBeVisible()
    expect(screen.getByText('위험 증가 종목')).toBeVisible()
    expect(screen.getByText('12')).toBeVisible()
    expect(screen.getAllByText('3').length).toBeGreaterThan(0)
    expect(screen.getByText('추가 리서치 필요')).toBeVisible()
    expect(screen.getByText('신규 매수 여력')).toBeVisible()
    expect(screen.getAllByText('2').length).toBeGreaterThan(0)
    expect(screen.getByText('제한적')).toBeVisible()
    expect(
      screen.getByText('현금 비중이 낮아 신규 매수 여력이 제한적입니다.'),
    ).toBeVisible()
    expect(screen.getAllByText('전일 대비 +1').length).toBeGreaterThan(0)
    expect(
      screen.getByRole('img', { name: '전체 관심 종목 추세 차트' }),
    ).toBeVisible()
    expect(
      screen.getByRole('img', { name: '위험 증가 종목 추세 차트' }),
    ).toBeVisible()
    expect(
      screen.getByRole('complementary', { name: 'AI 관찰 레일' }),
    ).toBeVisible()
    expect(screen.getByText('AI 관찰 메모')).toBeVisible()
    expect(screen.getByText('새로 추가된 관심 종목')).toBeVisible()
    expect(screen.getByText('AMD')).toBeVisible()
    expect(screen.getByText('Advanced Micro Devices')).toBeVisible()
    expect(screen.getByText('관망')).toBeVisible()
    expect(screen.getAllByText('안정').length).toBeGreaterThan(0)
    expect(screen.queryByText('알림 현황')).not.toBeInTheDocument()
    expect(screen.queryByText('미읽음 알림 7건')).not.toBeInTheDocument()
    expect(screen.queryByText('빠른 알림 설정')).not.toBeInTheDocument()
    expect(screen.getByText(/NVDA와 TSLA는 최근 뉴스 흐름/)).toBeVisible()
    expect(screen.getByText(/AI 수요는 견조하지만/)).toBeVisible()
    expect(screen.getByText(/인도량 업데이트 전까지/)).toBeVisible()
    expect(screen.queryByText('가격 변동')).not.toBeInTheDocument()
    expect(screen.getByText('추천 종목')).toBeVisible()
    expect(screen.getByRole('button', { name: '추천 받기' })).toBeVisible()
    expect(
      screen.getByRole('button', { name: '뉴스 위험도 지표 설명' }),
    ).toBeVisible()
    expect(
      screen.getByRole('button', { name: '밸류에이션 지표 설명' }),
    ).toBeVisible()
    expect(
      screen.getByRole('button', { name: '테마 과열 지표 설명' }),
    ).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'AI 판단 지표 설명' }),
    ).toBeVisible()
  })

  it('renders a bullet icon before each KPI card title', async () => {
    renderWatchlist()

    const kpiTitles = [
      '전체 관심 종목',
      '위험 증가 종목',
      '추가 리서치 필요',
      '신규 매수 여력',
    ]
    for (const title of kpiTitles) {
      const titleElement = await screen.findByText(title)
      const icon = titleElement.querySelector('svg')
      expect(icon).not.toBeNull()
      expect(icon).toHaveAttribute('aria-hidden', 'true')
      // 아이콘이 제목 텍스트보다 앞(글머리 위치)에 렌더링되어야 한다
      expect(titleElement.firstChild).toBe(icon)
    }
  })

  it('shows a structured metric guide with badge legend in the header tooltip', async () => {
    renderWatchlist()

    const infoButton = await screen.findByRole('button', {
      name: '뉴스 위험도 지표 설명',
    })
    fireEvent.mouseEnter(infoButton)

    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toHaveTextContent('부정적 이벤트가 얼마나 강하게')
    expect(tooltip).toHaveTextContent('판단 요소')
    expect(within(tooltip).getByText('낮음')).toBeVisible()
    expect(within(tooltip).getByText('중간')).toBeVisible()
    expect(within(tooltip).getByText('높음')).toBeVisible()
    expect(tooltip).toHaveTextContent(
      '높음은 즉시 매도 신호가 아니라 추가 확인이 필요한 상태를 의미합니다.',
    )
  })

  it('expands and collapses the observation memo with the footer toggle', async () => {
    renderWatchlist()

    const observationRail = await screen.findByRole('complementary', {
      name: 'AI 관찰 레일',
    })
    const summary = within(observationRail).getByText(
      'NVDA와 TSLA는 최근 뉴스 흐름상 변동성 확대를 주시해야 합니다.',
    )
    const memoBox = summary.parentElement
    expect(memoBox).not.toBeNull()
    expect(memoBox).toHaveClass('max-h-56', 'overflow-hidden')
    expect(
      within(observationRail).queryByRole('button', { name: '접기' }),
    ).not.toBeInTheDocument()

    const [memoToggle] = within(observationRail).getAllByRole('button', {
      name: '더 보기',
    })
    fireEvent.click(memoToggle)

    expect(memoBox).not.toHaveClass('max-h-56')
    expect(memoBox).not.toHaveClass('overflow-hidden')
    const collapseToggle = within(observationRail).getByRole('button', {
      name: '접기',
    })
    expect(collapseToggle).toBeVisible()

    fireEvent.click(collapseToggle)

    expect(memoBox).toHaveClass('max-h-56', 'overflow-hidden')
  })

  it('renders skeletons in sparkline slots while summary trends are loading', async () => {
    watchlistTestState.watchlistSummaryTrendsQueryState = {
      ...watchlistTestState.watchlistSummaryTrendsQueryState,
      data: undefined as never,
      isLoading: true,
    }
    const { container } = renderWatchlist()

    expect(
      await screen.findByRole('heading', { name: '관심 종목' }),
    ).toBeVisible()
    expect(
      container.querySelectorAll('[class~="h-10"][class~="w-20"]').length,
    ).toBeGreaterThanOrEqual(2)
    expect(
      screen.queryByRole('img', { name: '전체 관심 종목 추세 차트' }),
    ).not.toBeInTheDocument()
  })

  it('renders sparklines from summary trends data', async () => {
    renderWatchlist()

    expect(
      await screen.findByRole('img', { name: '전체 관심 종목 추세 차트' }),
    ).toHaveAttribute('data-values', '10,11,12')
    expect(
      screen.getByRole('img', { name: '위험 증가 종목 추세 차트' }),
    ).toHaveAttribute('data-values', '1,2,3')
  })

  it('hides sparklines when summary trend series are empty while cards remain visible', async () => {
    watchlistTestState.watchlistSummaryTrendsQueryState = {
      ...watchlistTestState.watchlistSummaryTrendsQueryState,
      data: {
        watchlistTotal: [],
        riskIncreasing: [],
      },
    }

    renderWatchlist()

    expect(await screen.findByText('전체 관심 종목')).toBeVisible()
    expect(screen.getByText('위험 증가 종목')).toBeVisible()
    expect(
      screen.queryByRole('img', { name: '전체 관심 종목 추세 차트' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('img', { name: '위험 증가 종목 추세 차트' }),
    ).not.toBeInTheDocument()
  })
})
