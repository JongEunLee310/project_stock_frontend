import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { mockPortfolio } from '@/shared/mock'
import type { Portfolio } from '@/shared/model'

import { PortfolioPageView } from './PortfolioPage'

function renderPortfolio(portfolio: Portfolio = mockPortfolio) {
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
    expect(screen.getByText('일간 손익')).toBeVisible()
    expect(screen.getByText('₩1,292,000')).toBeVisible()
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
    expect(screen.getAllByText('포트폴리오 브리핑').length).toBeGreaterThan(0)
    expect(screen.getByText('권고 요약')).toBeVisible()
    expect(
      screen.getByText(/현금 비중을 25~30% 수준으로 확대 검토/),
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
    expect(within(table).getByText('+2.64%')).toBeVisible()
  })

  it('renders an empty state when there are no holdings', () => {
    renderPortfolio({
      ...mockPortfolio,
      totalValue: 0,
      holdings: [],
    })

    expect(screen.getAllByText('보유 종목이 없습니다').length).toBeGreaterThan(
      0,
    )
    expect(
      screen.getByText('보유 종목이 추가되면 평가액과 비중을 계산합니다.'),
    ).toBeVisible()
  })
})
