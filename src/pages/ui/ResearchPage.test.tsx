import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { vi } from 'vitest'

import { appRouteObjects } from '@/app/router'
import { createQueryClient } from '@/shared/api/queryClient'
import { AuthProvider } from '@/shared/auth/AuthProvider'
import {
  setupAuthenticatedUser,
  teardownAuthenticatedUser,
} from '@/test-utils/authTestSetup'

const mockUseResearchPriceSeries = vi.hoisted(() => vi.fn())
const mockSaveBuyChecklist = vi.hoisted(() => vi.fn())
const mockUseWatchlistAssets = vi.hoisted(() => vi.fn())
const mockAddWatchlistAsset = vi.hoisted(() => vi.fn())
const mockRemoveWatchlistItem = vi.hoisted(() => vi.fn())

const researchBySymbol = {
  NVDA: {
    assetId: 1,
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    market: 'NASDAQ',
    sector: 'Technology',
    price: 142.62,
    change: 2.51,
    changePercent: 1.79,
    currency: 'USD',
    marketCap: 2540000000000,
    per: 38.4,
    peg: null,
    fiftyTwoWeekLow: 88.12,
    fiftyTwoWeekHigh: null,
    targetPrice: 1145.32,
    targetUpsidePercent: 11.8,
    nextEarningsDate: '2026-08-20',
    updatedAt: null,
    stance: 'Constructive, wait for disciplined add-on entry',
    stanceConfidence: 65,
    briefing: {
      headline: 'AI demand remains durable',
      body: 'Margins remain the key checkpoint.',
      createdAt: '2026. 5. 24. 오전 9:00',
    },
    keyRisks: [
      {
        id: 'risk-1',
        title: 'Margin pressure',
        level: '중간',
        description: 'Gross margin normalization.',
      },
      {
        id: 'risk-2',
        title: 'Supply',
        level: '낮음',
        description: 'Supply chain timing.',
      },
    ],
    buyChecklist: [
      {
        id: 'valuation',
        label: 'Valuation is acceptable',
        description: 'Wait for setup.',
        checked: false,
      },
      {
        id: 'portfolio_concentration',
        label: 'Portfolio concentration is controlled',
        description: 'Position size remains controlled.',
        checked: true,
      },
    ],
    checklistMemo: 'Server memo',
    reports: [
      {
        id: 'report-1',
        title: 'Quarterly note',
        source: 'Internal',
        summary: 'Track data center demand.',
        createdAt: '2026. 5. 24. 오전 9:00',
      },
    ],
    latestThesis: null,
  },
  MSFT: {
    assetId: 2,
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    market: null,
    sector: 'Technology',
    price: 450,
    change: -5.25,
    changePercent: -1.15,
    currency: 'USD',
    marketCap: null,
    per: null,
    peg: null,
    fiftyTwoWeekLow: null,
    fiftyTwoWeekHigh: null,
    targetPrice: null,
    targetUpsidePercent: null,
    nextEarningsDate: null,
    updatedAt: null,
    stance: 'Hold',
    stanceConfidence: null,
    briefing: {
      headline: 'Cloud growth checkpoint',
      body: 'Watch Azure.',
      createdAt: '2026. 5. 24. 오전 9:00',
    },
    keyRisks: [],
    buyChecklist: [],
    checklistMemo: null,
    reports: [],
    latestThesis: null,
  },
  NULLS: {
    assetId: 3,
    symbol: 'NULLS',
    name: 'Null Price Corp.',
    market: 'NYSE',
    sector: null,
    price: null,
    change: null,
    changePercent: null,
    currency: null,
    marketCap: null,
    per: null,
    peg: null,
    fiftyTwoWeekLow: null,
    fiftyTwoWeekHigh: null,
    targetPrice: null,
    targetUpsidePercent: null,
    nextEarningsDate: null,
    updatedAt: null,
    stance: 'Hold',
    stanceConfidence: null,
    briefing: {
      headline: 'No price data',
      body: '',
      createdAt: '2026. 5. 24. 오전 9:00',
    },
    keyRisks: [],
    buyChecklist: [],
    checklistMemo: null,
    reports: [],
    latestThesis: null,
  },
}

vi.mock('@/features/market-indices/queries', () => ({
  useMarketIndices: () => ({
    data: { indices: [], referenceAt: null },
    error: null,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  }),
}))

vi.mock('@/features/watchlist/queries', async () => {
  const actual = await vi.importActual<
    typeof import('@/features/watchlist/queries')
  >('@/features/watchlist/queries')

  return {
    ...actual,
    useWatchlistAssets: mockUseWatchlistAssets,
    useAddAssetToFirstWatchlist: () => ({
      isPending: false,
      mutate: mockAddWatchlistAsset,
    }),
    useRemoveWatchlistItem: () => ({
      isPending: false,
      mutate: mockRemoveWatchlistItem,
    }),
  }
})

vi.mock('@/features/research/queries', async () => {
  const actual = await vi.importActual<
    typeof import('@/features/research/queries')
  >('@/features/research/queries')
  const React = await vi.importActual<typeof import('react')>('react')

  return {
    SymbolNotFoundError: actual.SymbolNotFoundError,
    useResearchPriceSeries: mockUseResearchPriceSeries,
    useSaveBuyChecklist: () => {
      const [mutationState, setMutationState] = React.useState<{
        variables: { memo: string | null; checked_item_keys: string[] } | null
        isPending: boolean
      }>({ variables: null, isPending: false })
      const mutate = React.useCallback(
        (
          body: { memo: string | null; checked_item_keys: string[] },
          options?: {
            onSuccess?: () => void
            onError?: () => void
          },
        ) => {
          setMutationState({ variables: body, isPending: true })
          void Promise.resolve(mockSaveBuyChecklist(body)).then(
            () => {
              setMutationState((current) => ({
                ...current,
                isPending: false,
              }))
              options?.onSuccess?.()
            },
            () => {
              setMutationState((current) => ({
                ...current,
                isPending: false,
              }))
              options?.onError?.()
            },
          )
        },
        [],
      )
      const mutateAsync = React.useCallback(
        async (body: { memo: string | null; checked_item_keys: string[] }) => {
          setMutationState({ variables: body, isPending: true })

          try {
            return await mockSaveBuyChecklist(body)
          } finally {
            setMutationState((current) => ({
              ...current,
              isPending: false,
            }))
          }
        },
        [],
      )

      return {
        mutate,
        mutateAsync,
        variables: mutationState.variables ?? undefined,
        isPending: mutationState.isPending,
      }
    },
    useResearchView: (symbol: string) => {
      const data = researchBySymbol[symbol as keyof typeof researchBySymbol]

      if (!data) {
        return {
          data: undefined,
          error: new actual.SymbolNotFoundError(symbol),
          isError: true,
          isLoading: false,
          refetch: vi.fn(),
        }
      }

      return {
        data,
        error: null,
        isError: false,
        isLoading: false,
        refetch: vi.fn(),
      }
    },
  }
})

beforeEach(() => {
  setupAuthenticatedUser()
  mockUseResearchPriceSeries.mockReturnValue({
    data: {
      closes: [],
      currency: null,
      source: null,
      lastUpdatedAt: null,
    },
    error: null,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  })
  mockUseWatchlistAssets.mockReturnValue({
    data: { rows: [] },
    error: null,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  })
  mockSaveBuyChecklist.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.useRealTimers()
  teardownAuthenticatedUser()
  vi.clearAllMocks()
})

function renderResearch(path = '/research/NVDA') {
  const router = createMemoryRouter(appRouteObjects, {
    initialEntries: [path],
  })
  const queryClient = createQueryClient()

  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  )

  return router
}

describe('ResearchPage', () => {
  it('renders the stock header with a positive price change', async () => {
    renderResearch()

    expect(
      await screen.findByRole('heading', { name: 'NVDA 리서치' }),
    ).toBeVisible()
    expect(screen.getByRole('heading', { name: 'NVDA' })).toBeVisible()
    expect(screen.getByText('NVIDIA Corp.')).toBeVisible()
    expect(screen.getByLabelText('현재가')).toHaveTextContent('$142.62')

    const change = screen.getByText('+$2.51 (+1.79%)')
    expect(change).toHaveClass('text-emerald-400')
    expect(mockUseResearchPriceSeries).toHaveBeenCalledWith(
      'NVDA',
      'NASDAQ',
      '3M',
    )
  })

  it('renders negative and null price changes', async () => {
    renderResearch('/research/MSFT')

    const negativeChange = await screen.findByText('-$5.25 (-1.15%)')
    expect(negativeChange).toHaveClass('text-red-400')

    renderResearch('/research/NULLS')

    await screen.findByRole('heading', { name: 'NULLS 리서치' })
    const changes = await screen.findAllByLabelText('등락')
    const nullChange = changes.at(-1)
    expect(nullChange).toHaveTextContent('- (-)')
    expect(nullChange).toHaveClass('text-app-text-muted')
  })

  it('renders a loading skeleton while the price series is loading', async () => {
    mockUseResearchPriceSeries.mockReturnValue({
      data: undefined,
      error: null,
      isError: false,
      isLoading: true,
      refetch: vi.fn(),
    })

    renderResearch()

    await screen.findByRole('heading', { name: 'NVDA 리서치' })
    expect(
      screen.queryByRole('img', { name: 'NVDA 최근 가격 추이' }),
    ).not.toBeInTheDocument()
  })

  it('renders chart metadata and refetches for the selected range', async () => {
    mockUseResearchPriceSeries.mockReturnValue({
      data: {
        closes: [128.5, 130.25],
        currency: 'USD',
        source: 'polygon',
        lastUpdatedAt: '2026-07-10T00:00:00Z',
      },
      error: null,
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    })
    renderResearch()

    expect(
      await screen.findByRole('img', { name: 'NVDA 최근 가격 추이' }),
    ).toBeVisible()
    expect(
      screen.getByText('차트 데이터: polygon · 2026-07-10T00:00:00Z'),
    ).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: '1Y' }))

    expect(mockUseResearchPriceSeries).toHaveBeenLastCalledWith(
      'NVDA',
      'NASDAQ',
      '1Y',
    )
    expect(screen.getByRole('button', { name: '1Y' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('renders the header band investment stance and metric tiles', async () => {
    renderResearch()

    await screen.findByRole('heading', { name: 'NVDA 리서치' })

    expect(screen.getByLabelText('현재가')).toHaveTextContent('$142.62')
    expect(screen.getByLabelText('등락')).toHaveTextContent('+$2.51 (+1.79%)')
    expect(screen.getByText('AI 투자 스탠스')).toBeVisible()
    expect(
      screen.getByText('Constructive, wait for disciplined add-on entry'),
    ).toBeVisible()
    expect(screen.getByText('신뢰도 65%')).toBeVisible()
    expect(screen.getByText('시가총액')).toBeVisible()
    expect(screen.getByText('섹터')).toBeVisible()
    expect(screen.getByText('52주 범위')).toBeVisible()
    expect(screen.getByText('다음 실적 발표')).toBeVisible()
    expect(screen.getByText('평균 목표주가')).toBeVisible()
    expect(screen.queryByText('PER / PEG')).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: '뉴스 및 공시 요약' }),
    ).toBeVisible()
  })

  it('renders the price tab and disabled future chart tabs', async () => {
    renderResearch()

    await screen.findByRole('heading', { name: 'NVDA 리서치' })

    const priceTab = screen.getByRole('tab', { name: '가격' })
    const valuationTab = screen.getByRole('tab', { name: /밸류에이션/ })
    const earningsTab = screen.getByRole('tab', { name: /실적/ })

    expect(priceTab).toHaveAttribute('aria-selected', 'true')
    expect(valuationTab).toBeDisabled()
    expect(valuationTab).toHaveAttribute('aria-disabled', 'true')
    expect(earningsTab).toBeDisabled()
    expect(earningsTab).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getAllByText('준비 중')).toHaveLength(2)
  })

  it('renders the catalyst timeline placeholder', async () => {
    renderResearch()

    expect(
      await screen.findByRole('heading', { name: '촉매 타임라인' }),
    ).toBeVisible()
    expect(
      screen.getByRole('heading', {
        name: '예정 이벤트 데이터가 아직 수집되지 않았습니다.',
      }),
    ).toBeVisible()
  })

  it('shows key risks with risk badges', async () => {
    renderResearch()

    await screen.findByRole('heading', { name: 'NVDA 리서치' })
    const riskPanel = screen
      .getByRole('heading', { name: '핵심 리스크' })
      .closest('section')

    expect(riskPanel).not.toBeNull()
    expect(
      within(riskPanel as HTMLElement).getAllByRole('listitem'),
    ).toHaveLength(2)
  })

  it('saves all checked item keys and the current memo when toggled', async () => {
    renderResearch()

    const checkbox = await screen.findByRole('checkbox', {
      name: /Valuation is acceptable/,
    })
    await act(async () => fireEvent.click(checkbox))

    expect(mockSaveBuyChecklist).toHaveBeenCalledWith({
      memo: 'Server memo',
      checked_item_keys: ['portfolio_concentration', 'valuation'],
    })
  })

  it('seeds and automatically saves the memo after one second', async () => {
    renderResearch()
    const memo = await screen.findByLabelText('내 메모')
    expect(memo).toHaveValue('Server memo')
    vi.useFakeTimers()

    fireEvent.change(memo, { target: { value: 'Wait for a better entry.' } })
    act(() => vi.advanceTimersByTime(999))
    expect(mockSaveBuyChecklist).not.toHaveBeenCalled()

    await act(async () => vi.advanceTimersByTime(1))

    expect(mockSaveBuyChecklist).toHaveBeenCalledWith({
      memo: 'Wait for a better entry.',
      checked_item_keys: ['portfolio_concentration'],
    })
    expect(screen.getByText('자동 저장됨')).toBeVisible()
  })

  it('keeps the memo debounce deadline while including a toggled checklist item', async () => {
    renderResearch()
    const memo = await screen.findByLabelText('내 메모')
    const checkbox = screen.getByRole('checkbox', {
      name: /Valuation is acceptable/,
    })
    vi.useFakeTimers()

    fireEvent.change(memo, { target: { value: 'Keep the original deadline.' } })
    act(() => vi.advanceTimersByTime(500))
    mockSaveBuyChecklist.mockReturnValueOnce(new Promise(() => undefined))
    fireEvent.click(checkbox)

    expect(checkbox).toBeChecked()
    act(() => vi.advanceTimersByTime(499))
    expect(mockSaveBuyChecklist).toHaveBeenCalledTimes(1)

    await act(async () => vi.advanceTimersByTime(1))

    expect(mockSaveBuyChecklist).toHaveBeenCalledTimes(2)
    expect(mockSaveBuyChecklist).toHaveBeenLastCalledWith({
      memo: 'Keep the original deadline.',
      checked_item_keys: ['portfolio_concentration', 'valuation'],
    })
  })

  it('shows a memo save failure', async () => {
    mockSaveBuyChecklist.mockRejectedValueOnce(new Error('save failed'))
    renderResearch()
    const memo = await screen.findByLabelText('내 메모')
    vi.useFakeTimers()

    fireEvent.change(memo, { target: { value: 'Retry this memo.' } })
    await act(async () => vi.advanceTimersByTime(1_000))

    expect(screen.getByRole('alert')).toHaveTextContent('저장 실패')
  })

  it('adds an asset that is not registered in a watchlist', async () => {
    renderResearch()

    fireEvent.click(
      await screen.findByRole('button', { name: '관심종목 추가' }),
    )

    expect(mockUseWatchlistAssets).toHaveBeenCalledWith(1, 100)
    expect(mockAddWatchlistAsset).toHaveBeenCalledWith({ asset_id: 1 })
  })

  it('removes an asset that is already registered in a watchlist', async () => {
    mockUseWatchlistAssets.mockReturnValue({
      data: { rows: [{ id: 77, symbol: 'NVDA' }] },
      error: null,
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    })
    renderResearch()

    fireEvent.click(
      await screen.findByRole('button', { name: '관심종목 등록됨' }),
    )

    expect(mockRemoveWatchlistItem).toHaveBeenCalledWith({ itemId: 77 })
  })

  it('shows an empty state for unsupported symbols', async () => {
    renderResearch('/research/UNKNOWN')

    await screen.findByRole('heading', {
      name: 'UNKNOWN 리서치 데이터를 찾을 수 없습니다',
    })
    expect(
      screen.getByRole('link', { name: '워치리스트로 돌아가기' }),
    ).toHaveAttribute('href', '/watchlist')
  })
})
