import { fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'

import { appRouteObjects } from '@/app/router'

function renderResearch(path = '/research/NVDA') {
  const router = createMemoryRouter(appRouteObjects, {
    initialEntries: [path],
  })

  render(<RouterProvider router={router} />)

  return router
}

describe('ResearchPage', () => {
  it('renders the stock header, status, AI stance, and sparkline', () => {
    renderResearch()

    expect(screen.getByRole('heading', { name: 'NVDA 리서치' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'NVDA' })).toBeVisible()
    expect(screen.getByText('NVIDIA Corp.')).toBeVisible()
    expect(screen.getAllByText('매수 검토 가능').length).toBeGreaterThan(0)
    expect(screen.getByText('65%')).toBeVisible()
    expect(
      screen.getByText('Constructive, wait for disciplined add-on entry'),
    ).toBeVisible()
    expect(
      screen.getByRole('img', { name: 'NVDA 최근 가격 추이' }),
    ).toBeVisible()
  })

  it('renders stock metric tiles from the research mock', () => {
    renderResearch()

    expect(screen.getByText('시가총액')).toBeVisible()
    expect(screen.getByText('2.54T USD')).toBeVisible()
    expect(screen.getByText('평균 목표주가')).toBeVisible()
    expect(screen.getByText('$1,145.32 (+11.8%)')).toBeVisible()
  })

  it('shows at least three key risks with risk badges', () => {
    renderResearch()

    const riskPanel = screen
      .getByRole('heading', {
        name: '핵심 리스크',
      })
      .closest('section')

    expect(riskPanel).not.toBeNull()

    const risks = within(riskPanel as HTMLElement).getAllByRole('listitem')

    expect(risks.length).toBeGreaterThanOrEqual(3)
    expect(within(risks[0]).getByText('중간')).toBeVisible()
  })

  it('toggles checklist items locally', () => {
    renderResearch()

    expect(screen.getByText('1/2')).toBeVisible()

    const entryCheckbox = screen.getByRole('checkbox', {
      name: /Entry price is inside target band/,
    })

    expect(entryCheckbox).not.toBeChecked()

    fireEvent.click(entryCheckbox)

    expect(entryCheckbox).toBeChecked()
    expect(screen.getByText('2/2')).toBeVisible()
  })

  it('updates memo textarea input locally', () => {
    renderResearch()

    const memo = screen.getByLabelText('내 메모')

    fireEvent.change(memo, {
      target: { value: 'Wait for a better entry band.' },
    })

    expect(memo).toHaveValue('Wait for a better entry band.')
  })

  it('shows an empty state for unsupported symbols', () => {
    renderResearch('/research/UNKNOWN')

    expect(
      screen.getByRole('heading', {
        name: 'UNKNOWN 리서치 데이터를 찾을 수 없습니다',
      }),
    ).toBeVisible()
    expect(
      screen.getByRole('link', { name: '워치리스트로 돌아가기' }),
    ).toHaveAttribute('href', '/watchlist')
  })

  it('renders MSFT research detail from mock data', () => {
    renderResearch('/research/MSFT')

    expect(screen.getByRole('heading', { name: 'MSFT 리서치' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'MSFT' })).toBeVisible()
    expect(screen.getByText('Microsoft Corp.')).toBeVisible()
    expect(
      screen.getByRole('img', { name: 'MSFT 최근 가격 추이' }),
    ).toBeVisible()
  })
})
