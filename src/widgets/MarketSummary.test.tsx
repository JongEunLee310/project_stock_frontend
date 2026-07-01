import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'

import type { MarketIndexBoard } from '@/shared/model'

import { MarketSummary } from './MarketSummary'

interface QueryState<T> {
  data: T | undefined
  error: Error | null
  isError: boolean
  isLoading: boolean
  refetch: () => unknown
}

const refetchMarketIndices = vi.fn()
let marketIndicesQueryState: QueryState<MarketIndexBoard>

vi.mock('@/features/market-indices/queries', () => ({
  useMarketIndices: () => marketIndicesQueryState,
}))

function setMarketIndicesQueryState(
  state: Partial<QueryState<MarketIndexBoard>>,
) {
  marketIndicesQueryState = {
    data: undefined,
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchMarketIndices,
    ...state,
  }
}

describe('MarketSummary', () => {
  beforeEach(() => {
    refetchMarketIndices.mockReset()
    setMarketIndicesQueryState({
      data: {
        indices: [
          {
            symbol: 'SPX',
            name: 'S&P 500',
            value: 5278.4,
            changePercent: 0.47,
          },
          {
            symbol: 'KOSPI',
            name: 'KOSPI',
            value: 2725.49,
            changePercent: -0.16,
          },
        ],
        referenceAt: '2026-07-01T05:31:00Z',
      },
    })
  })

  it('renders loading skeletons', () => {
    setMarketIndicesQueryState({ isLoading: true })

    const { container } = render(<MarketSummary />)

    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(8)
  })

  it('renders a retryable error state', () => {
    setMarketIndicesQueryState({
      error: new Error('Network failed'),
      isError: true,
    })

    render(<MarketSummary />)

    expect(
      screen.getByRole('heading', {
        name: '시장 요약을 불러오지 못했습니다',
      }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '재시도' }))

    expect(refetchMarketIndices).toHaveBeenCalledTimes(1)
  })

  it('renders an empty state for an empty index list', () => {
    setMarketIndicesQueryState({
      data: { indices: [], referenceAt: null },
    })

    render(<MarketSummary />)

    expect(screen.getByText('표시할 시장 지수가 없습니다.')).toBeVisible()
  })

  it('renders market indices with signed percentage, tone, and reference time', () => {
    render(<MarketSummary />)

    expect(screen.getByText('S&P 500')).toBeVisible()
    expect(screen.getByText('5,278.40')).toBeVisible()
    expect(screen.getByText('+0.47%')).toHaveClass('text-emerald-300')
    expect(screen.getByText('KOSPI')).toBeVisible()
    expect(screen.getByText('2,725.49')).toBeVisible()
    expect(screen.getByText('-0.16%')).toHaveClass('text-rose-300')
    expect(screen.getByText(/데이터 기준/)).toBeVisible()
    expect(screen.queryByText('데이터 기준 14:31 KST')).not.toBeInTheDocument()
  })

  it('does not render the footer when referenceAt is null', () => {
    setMarketIndicesQueryState({
      data: {
        indices: [
          {
            symbol: 'VIX',
            name: 'VIX',
            value: 15.32,
            changePercent: 0,
          },
        ],
        referenceAt: null,
      },
    })

    render(<MarketSummary />)

    expect(screen.getByText('0.00%')).toHaveClass('text-emerald-300')
    expect(screen.queryByText(/데이터 기준/)).not.toBeInTheDocument()
  })
})
