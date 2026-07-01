import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

import type { PortfolioView } from '@/features/portfolio/adapters'
import type { AiBriefing } from '@/shared/model'

import { PortfolioPage, PortfolioPageView } from './PortfolioPage'

interface QueryState<T> {
  data: T | undefined
  error: Error | null
  isError: boolean
  isLoading: boolean
  refetch: () => unknown
}

const portfolioView: PortfolioView = {
  totalValue: 128_734_000,
  cash: 29_234_000,
  dayChangeValue: 1_292_000,
  dayChangePercent: 1.02,
  holdings: [
    {
      assetId: 1,
      symbol: 'QQQ',
      name: 'Invesco QQQ Trust',
      sector: 'ETF',
      quantity: 80,
      avgPrice: 480_000,
      currentValue: 45_200_000,
      weight: 35.1,
    },
    {
      assetId: 2,
      symbol: 'NVDA',
      name: 'NVIDIA Corp.',
      sector: '정보기술',
      quantity: 120,
      avgPrice: 143_000,
      currentValue: 19_600_000,
      weight: 15.2,
    },
    {
      assetId: 3,
      symbol: 'AAPL',
      name: 'Apple Inc.',
      sector: '정보기술',
      quantity: 40,
      avgPrice: 260_000,
      currentValue: 11_800_000,
      weight: 9.2,
    },
  ],
  sectorExposure: [
    { name: '정보기술', amount: 31_400_000, value: 31.6 },
    { name: 'ETF', amount: 45_200_000, value: 45.4 },
  ],
  riskExposures: [
    {
      id: 'sector-semiconductor',
      label: '반도체 쏠림 위험',
      level: '높음',
      description: '반도체 관련 종목 비중이 높습니다.',
    },
    {
      id: 'cash-buffer',
      label: '현금 완충 부족',
      level: '중간',
      description: '현금 비중이 목표보다 낮습니다.',
    },
  ],
}

const refetchPortfolioSummary = vi.fn()
const refetchPortfolioBriefing = vi.fn()
let portfolioSummaryQueryState = {
  data: portfolioView,
  error: null as Error | null,
  isError: false,
  isLoading: false,
  refetch: refetchPortfolioSummary,
}
let portfolioBriefingQueryState: QueryState<AiBriefing | null> = {
  data: {
    headline: 'Concentration needs a fresh review',
    body: 'Top holdings remain large enough to review before adding exposure.',
    riskHeadline: '권고 요약',
    riskChecks: ['현금 비중을 25~30% 수준으로 확대 검토', 'QQQ 비중 점검'],
  },
  error: null,
  isError: false,
  isLoading: false,
  refetch: refetchPortfolioBriefing,
}

vi.mock('@/features/briefing/queries', () => ({
  usePortfolioBriefing: () => portfolioBriefingQueryState,
}))

vi.mock('@/features/portfolio/queries', () => ({
  usePortfolioSummary: () => portfolioSummaryQueryState,
}))

beforeEach(() => {
  refetchPortfolioSummary.mockReset()
  refetchPortfolioBriefing.mockReset()
  portfolioSummaryQueryState = {
    data: portfolioView,
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchPortfolioSummary,
  }
  portfolioBriefingQueryState = {
    data: {
      headline: 'Concentration needs a fresh review',
      body: 'Top holdings remain large enough to review before adding exposure.',
      riskHeadline: '권고 요약',
      riskChecks: ['현금 비중을 25~30% 수준으로 확대 검토', 'QQQ 비중 점검'],
    },
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchPortfolioBriefing,
  }
})

function renderPortfolio(portfolio: PortfolioView = portfolioView) {
  render(
    <MemoryRouter>
      <PortfolioPageView
        portfolio={portfolio}
        briefingQuery={portfolioBriefingQueryState}
      />
    </MemoryRouter>,
  )
}

describe('PortfolioPage', () => {
  it('renders the portfolio heading and summary cards', () => {
    renderPortfolio()

    expect(screen.getByRole('heading', { name: '포트폴리오' })).toBeVisible()
    expect(screen.getAllByText('총 자산').length).toBeGreaterThan(0)
    expect(screen.getAllByText('₩128,734,000').length).toBeGreaterThan(0)
    expect(screen.getByText('현금 비중')).toBeVisible()
    expect(screen.getAllByText('22.7%').length).toBeGreaterThan(0)
    expect(screen.getByText('일간 변동')).toBeVisible()
    expect(screen.getByText('₩1,292,000')).toBeVisible()
    expect(screen.getByText('1%')).toBeVisible()
  })

  it('renders allocation, sector exposure, and concentration labels', () => {
    renderPortfolio()

    expect(screen.getByText('자산 배분')).toBeVisible()
    expect(screen.getAllByText('NVDA').length).toBeGreaterThan(0)
    expect(screen.getAllByText('현금').length).toBeGreaterThan(0)
    expect(screen.getByText('섹터 익스포저')).toBeVisible()
    expect(screen.getAllByText('정보기술').length).toBeGreaterThan(0)
    expect(screen.getByText('단일 종목 집중도')).toBeVisible()
    expect(screen.getByText('1. QQQ')).toBeVisible()
    expect(screen.getByText('Top 3 합계')).toBeVisible()
  })

  it('renders risk exposure badges and AI briefing guidance', () => {
    renderPortfolio()

    expect(screen.getByText('리스크 노출 분석')).toBeVisible()
    expect(screen.getAllByText('반도체 쏠림 위험').length).toBeGreaterThan(0)
    expect(screen.getAllByText('높음').length).toBeGreaterThan(0)
    expect(screen.getByText('현금 완충 부족')).toBeVisible()
    expect(screen.getAllByText('중간').length).toBeGreaterThan(0)
    expect(screen.getAllByText('포트폴리오 브리핑').length).toBeGreaterThan(0)
    expect(screen.getByText('권고 요약')).toBeVisible()
    expect(
      screen.getByText(/현금 비중을 25~30% 수준으로 확대 검토/),
    ).toBeVisible()
    expect(screen.getByText('Concentration needs a fresh review')).toBeVisible()
    expect(
      screen.getByText(
        'Top holdings remain large enough to review before adding exposure.',
      ),
    ).toBeVisible()
  })

  it('renders loading, error, empty, and no-risk states for portfolio briefing', () => {
    portfolioBriefingQueryState = {
      ...portfolioBriefingQueryState,
      data: undefined,
      isLoading: true,
    }
    const { unmount } = render(
      <MemoryRouter>
        <PortfolioPageView
          portfolio={portfolioView}
          briefingQuery={portfolioBriefingQueryState}
        />
      </MemoryRouter>,
    )

    expect(
      screen.queryByText('Concentration needs a fresh review'),
    ).not.toBeInTheDocument()

    unmount()
    portfolioBriefingQueryState = {
      ...portfolioBriefingQueryState,
      data: undefined,
      error: new Error('network failed'),
      isError: true,
      isLoading: false,
    }
    const { unmount: unmountError } = render(
      <MemoryRouter>
        <PortfolioPageView
          portfolio={portfolioView}
          briefingQuery={portfolioBriefingQueryState}
        />
      </MemoryRouter>,
    )

    expect(
      screen.getByText('포트폴리오 브리핑을 불러오지 못했습니다'),
    ).toBeVisible()

    unmountError()
    portfolioBriefingQueryState = {
      ...portfolioBriefingQueryState,
      data: null,
      error: null,
      isError: false,
      isLoading: false,
    }
    const { unmount: unmountEmpty } = render(
      <MemoryRouter>
        <PortfolioPageView
          portfolio={portfolioView}
          briefingQuery={portfolioBriefingQueryState}
        />
      </MemoryRouter>,
    )

    expect(
      screen.getByText('포트폴리오 브리핑 데이터가 없습니다'),
    ).toBeVisible()

    unmountEmpty()
    portfolioBriefingQueryState = {
      ...portfolioBriefingQueryState,
      data: {
        headline: 'Risk checks are quiet',
        body: 'No urgent portfolio checks are active.',
        riskChecks: [],
      },
    }
    render(
      <MemoryRouter>
        <PortfolioPageView
          portfolio={portfolioView}
          briefingQuery={portfolioBriefingQueryState}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText('Risk checks are quiet')).toBeVisible()
    expect(screen.queryByText('권고 요약')).not.toBeInTheDocument()
    expect(
      screen.queryByText('현금 비중을 25~30% 수준으로 확대 검토'),
    ).not.toBeInTheDocument()
  })

  it('renders an empty state when risk exposures are empty', () => {
    renderPortfolio({ ...portfolioView, riskExposures: [] })

    expect(screen.getByText('리스크 노출 분석')).toBeVisible()
    expect(
      screen.getByText('현재 감지된 리스크 노출이 없습니다.'),
    ).toBeVisible()
  })

  it('renders holdings with derived weights and research links', () => {
    renderPortfolio()

    const table = screen.getByRole('table', { name: '보유 종목' })
    const nvdaLink = within(table).getByRole('link', { name: 'NVDA' })

    expect(nvdaLink).toHaveAttribute('href', '/research/NVDA')
    expect(within(table).getByText('NVIDIA Corp.')).toBeVisible()
    expect(within(table).getAllByText('정보기술').length).toBeGreaterThan(0)
    expect(within(table).getByText('15.2%')).toBeVisible()
    expect(
      within(table).queryByRole('columnheader', { name: '일간 변화' }),
    ).not.toBeInTheDocument()
  })

  it('renders an empty state when there are no holdings', () => {
    renderPortfolio({
      ...portfolioView,
      totalValue: 0,
      holdings: [],
      sectorExposure: [],
    })

    expect(screen.getAllByText('보유 종목이 없습니다').length).toBeGreaterThan(
      0,
    )
    expect(
      screen.getByText('보유 종목이 추가되면 평가액과 비중을 계산합니다.'),
    ).toBeVisible()
  })

  it('renders loading, error, and empty states for PortfolioPage query', async () => {
    portfolioSummaryQueryState = {
      ...portfolioSummaryQueryState,
      data: undefined as never,
      isLoading: true,
    }
    const { unmount } = render(
      <MemoryRouter>
        <PortfolioPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '포트폴리오' })).toBeVisible()
    expect(screen.queryByText('총 자산')).not.toBeInTheDocument()

    unmount()
    portfolioSummaryQueryState = {
      ...portfolioSummaryQueryState,
      data: undefined as never,
      error: new Error('network failed'),
      isError: true,
      isLoading: false,
    }
    const { unmount: unmountError } = render(
      <MemoryRouter>
        <PortfolioPage />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '포트폴리오를 불러오지 못했습니다',
    )

    unmountError()
    portfolioSummaryQueryState = {
      ...portfolioSummaryQueryState,
      data: undefined as never,
      error: null,
      isError: false,
      isLoading: false,
    }
    render(
      <MemoryRouter>
        <PortfolioPage />
      </MemoryRouter>,
    )

    expect(
      await screen.findByText('포트폴리오 데이터가 없습니다'),
    ).toBeVisible()
  })
})
