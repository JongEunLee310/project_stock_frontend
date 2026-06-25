import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import type { PortfolioSummary } from '@/shared/api/adapters'

import { PortfolioPageView } from './PortfolioPage'

const portfolioFixture: PortfolioSummary = {
  totalValue: 128_734_000,
  cash: 29_224_000,
  cashRatio: 22.7,
  hasSectorConcentration: true,
  holdings: [
    {
      assetId: 1,
      symbol: '1',
      quantity: 120,
      avgPrice: 154_900,
      costValue: 18_588_000,
      currentValue: 15_125_520,
      weight: 11.8,
    },
    {
      assetId: 2,
      symbol: '2',
      quantity: 100,
      avgPrice: 203_800,
      costValue: 20_380_000,
      currentValue: 20_383_548,
      weight: 15.8,
    },
  ],
  sectorWeights: [
    {
      name: 'Technology',
      value: 62.5,
      amount: 80_456_000,
      exceedsThreshold: true,
    },
  ],
}

function renderPortfolio(portfolio: PortfolioSummary = portfolioFixture) {
  render(
    <MemoryRouter>
      <PortfolioPageView portfolio={portfolio} />
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
    expect(screen.queryByText('일간 손익')).not.toBeInTheDocument()
  })

  it('renders allocation, sector exposure, and concentration labels', () => {
    renderPortfolio()

    expect(screen.getByText('자산 배분')).toBeVisible()
    expect(screen.getAllByText('1').length).toBeGreaterThan(0)
    expect(screen.getAllByText('현금').length).toBeGreaterThan(0)
    expect(screen.getByText('섹터 익스포저')).toBeVisible()
    expect(screen.getAllByText('Technology').length).toBeGreaterThan(0)
    expect(screen.getByText('단일 종목 집중도')).toBeVisible()
    expect(screen.getByText('1. 2')).toBeVisible()
    expect(screen.getByText('Top 3 합계')).toBeVisible()
  })

  it('renders risk exposure badges and AI briefing guidance', () => {
    renderPortfolio()

    expect(screen.getByText('리스크 노출 분석')).toBeVisible()
    expect(screen.getAllByText('반도체 쏠림 위험').length).toBeGreaterThan(0)
    expect(screen.getAllByText('높음').length).toBeGreaterThan(0)
    expect(screen.getAllByText('포트폴리오 브리핑').length).toBeGreaterThan(0)
    expect(screen.getByText('권고 요약')).toBeVisible()
    expect(
      screen.getByText(/현금 비중을 25~30% 수준으로 확대 검토/),
    ).toBeVisible()
  })

  it('renders holdings with derived weights and research links', () => {
    renderPortfolio()

    const table = screen.getByRole('table', { name: '보유 종목' })
    const assetLink = within(table).getByRole('link', { name: '1' })

    expect(assetLink).toHaveAttribute('href', '/research/1')
    expect(within(table).getByText('asset_id 1')).toBeVisible()
    expect(within(table).queryByText('일간 변화')).not.toBeInTheDocument()
    expect(within(table).getByText('11.8%')).toBeVisible()
  })

  it('renders an empty state when there are no holdings', () => {
    renderPortfolio({
      ...portfolioFixture,
      totalValue: 0,
      holdings: [],
      sectorWeights: [],
    })

    expect(screen.getAllByText('보유 종목이 없습니다').length).toBeGreaterThan(
      0,
    )
    expect(
      screen.getByText('보유 종목이 추가되면 평가액과 비중을 계산합니다.'),
    ).toBeVisible()
  })
})
