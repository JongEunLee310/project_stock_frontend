import { fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'

import { appRouteObjects } from '@/app/router'

function renderSignals() {
  const router = createMemoryRouter(appRouteObjects, {
    initialEntries: ['/signals'],
  })

  render(<RouterProvider router={router} />)

  return router
}

describe('SignalsPage', () => {
  it('renders signal cards with symbol, status, confidence, and reasons', () => {
    renderSignals()

    const nvdaCard = screen.getByRole('article', {
      name: 'NVDA 실적 시그널',
    })

    expect(within(nvdaCard).getByRole('link', { name: 'NVDA' })).toBeVisible()
    expect(within(nvdaCard).getByText('매수 검토 가능')).toBeVisible()
    expect(within(nvdaCard).getByText('86%')).toBeVisible()
    expect(
      within(nvdaCard).getByRole('meter', { name: 'NVDA 신뢰도 86%' }),
    ).toHaveAttribute('aria-valuenow', '86')
    expect(
      within(nvdaCard).getByText(
        'Data center demand remains above the prior quarter run rate.',
      ),
    ).toBeVisible()
  })

  it('shows all four required status summary cards', () => {
    renderSignals()

    expect(screen.getAllByText('매수 검토 가능').length).toBeGreaterThan(0)
    expect(screen.getAllByText('위험 증가').length).toBeGreaterThan(0)
    expect(screen.getAllByText('추가 리서치 필요').length).toBeGreaterThan(0)
    expect(screen.getAllByText('관망 유지').length).toBeGreaterThan(0)
  })

  it('renders decision log buttons on signal cards', () => {
    renderSignals()

    const signalCards = screen.getAllByRole('article')

    expect(signalCards).toHaveLength(6)
    expect(
      signalCards.every(
        (card) =>
          within(card).getByRole('button', { name: '판단 기록' }) !== null,
      ),
    ).toBe(true)
  })

  it('narrows visible cards by search, status, and kind filters, then resets', () => {
    renderSignals()

    fireEvent.change(screen.getByLabelText('검색'), {
      target: { value: 'aapl' },
    })

    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(
      screen.getByRole('article', { name: 'AAPL 밸류에이션 시그널' }),
    ).toBeVisible()

    fireEvent.change(screen.getByLabelText('검색'), {
      target: { value: '' },
    })
    fireEvent.change(screen.getByLabelText('상태'), {
      target: { value: '관망 유지' },
    })
    fireEvent.change(screen.getByLabelText('시그널 유형'), {
      target: { value: 'technical' },
    })

    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(
      screen.getByRole('article', { name: 'MSFT 기술적 흐름 시그널' }),
    ).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: '필터 초기화' }))

    expect(screen.getByLabelText('검색')).toHaveValue('')
    expect(screen.getByLabelText('상태')).toHaveValue('all')
    expect(screen.getByLabelText('시그널 유형')).toHaveValue('all')
    expect(screen.getAllByRole('article')).toHaveLength(6)
  })
})
