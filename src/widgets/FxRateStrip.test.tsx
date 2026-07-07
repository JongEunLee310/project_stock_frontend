import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

import type { FxRate } from '@/features/fx/adapters'

import { FxRateStrip } from './FxRateStrip'

interface QueryState<T> {
  data: T | undefined
  error: Error | null
  isError: boolean
  isLoading: boolean
}

let fxRatesQueryState: QueryState<FxRate[]>

vi.mock('@/features/fx/queries', () => ({
  useFxRates: () => fxRatesQueryState,
}))

function setFxRatesQueryState(state: Partial<QueryState<FxRate[]>>) {
  fxRatesQueryState = {
    data: undefined,
    error: null,
    isError: false,
    isLoading: false,
    ...state,
  }
}

describe('FxRateStrip', () => {
  beforeEach(() => {
    setFxRatesQueryState({
      data: [
        {
          pair: 'USD/KRW',
          rate: 1390.5,
          changePercent: 0.35,
          referenceAt: '2026-07-07T01:00:00Z',
        },
      ],
    })
  })

  it('renders loading skeletons', () => {
    setFxRatesQueryState({ isLoading: true })

    const { container } = render(<FxRateStrip />)

    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(2)
  })

  it('renders an error state', () => {
    setFxRatesQueryState({
      error: new Error('Network failed'),
      isError: true,
    })

    render(<FxRateStrip />)

    expect(screen.getByText('환율을 불러오지 못했습니다')).toBeVisible()
  })

  it('renders USD/KRW rate with signed change and reference time', () => {
    render(<FxRateStrip />)

    expect(screen.getByRole('region', { name: 'USD/KRW 환율' })).toBeVisible()
    expect(screen.getByText('USD/KRW')).toBeVisible()
    expect(screen.getByText('1,390.50')).toBeVisible()
    expect(screen.getByText('+0.35%')).toHaveClass('text-emerald-300')
    expect(screen.getByText(/기준/)).toBeVisible()
  })
})
