import { fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { vi } from 'vitest'

import { appRouteObjects } from '@/app/router'
import { AuthProvider } from '@/shared/auth/AuthProvider'
import {
  setupAuthenticatedUser,
  teardownAuthenticatedUser,
} from '@/test-utils/authTestSetup'

const researchBySymbol = {
  NVDA: {
    assetId: 1,
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    market: 'NASDAQ',
    sector: 'Technology',
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
        id: 'entry',
        label: 'Entry price is inside target band',
        description: 'Wait for setup.',
        checked: false,
      },
      {
        id: 'risk',
        label: 'Risk is acceptable',
        description: 'Position size remains controlled.',
        checked: true,
      },
    ],
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
    priceSparkline: [],
  },
  MSFT: {
    assetId: 2,
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    market: 'NASDAQ',
    sector: 'Technology',
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
    reports: [],
    latestThesis: null,
    priceSparkline: [],
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

vi.mock('@/features/research/queries', async () => {
  const actual = await vi.importActual<
    typeof import('@/features/research/queries')
  >('@/features/research/queries')

  return {
    SymbolNotFoundError: actual.SymbolNotFoundError,
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
})

afterEach(() => {
  teardownAuthenticatedUser()
})

function renderResearch(path = '/research/NVDA') {
  const router = createMemoryRouter(appRouteObjects, {
    initialEntries: [path],
  })

  render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  )

  return router
}

describe('ResearchPage', () => {
  it('renders the stock header, stance, and sparkline fallback', async () => {
    renderResearch()

    expect(
      await screen.findByRole('heading', { name: 'NVDA 리서치' }),
    ).toBeVisible()
    expect(screen.getByRole('heading', { name: 'NVDA' })).toBeVisible()
    expect(screen.getByText('NVIDIA Corp.')).toBeVisible()
    expect(screen.getByText('65%')).toBeVisible()
    expect(
      screen.getByText('Constructive, wait for disciplined add-on entry'),
    ).toBeVisible()
    expect(
      screen.getByRole('img', { name: 'NVDA 최근 가격 추이' }),
    ).toBeVisible()
  })

  it('renders stock metric tiles from the research view', async () => {
    renderResearch()

    await screen.findByRole('heading', { name: 'NVDA 리서치' })

    expect(screen.getByText('시가총액')).toBeVisible()
    expect(screen.getByText('$2,540,000,000,000.00')).toBeVisible()
    expect(screen.getAllByText('평균 목표주가').length).toBeGreaterThan(0)
    expect(screen.getAllByText('$1,145.32 (11.8%)').length).toBeGreaterThan(0)
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
    expect(
      within(riskPanel as HTMLElement).getAllByText('중간').length,
    ).toBeGreaterThan(0)
  })

  it('toggles checklist items locally', async () => {
    renderResearch()

    await screen.findByRole('heading', { name: 'NVDA 리서치' })

    const entryCheckbox = screen.getByRole('checkbox', {
      name: /Entry price is inside target band/,
    })

    expect(entryCheckbox).not.toBeChecked()

    fireEvent.click(entryCheckbox)

    expect(entryCheckbox).toBeChecked()
  })

  it('updates memo textarea input locally', async () => {
    renderResearch()

    await screen.findByRole('heading', { name: 'NVDA 리서치' })

    const memo = screen.getByLabelText('내 메모')

    fireEvent.change(memo, {
      target: { value: 'Wait for a better entry band.' },
    })

    expect(memo).toHaveValue('Wait for a better entry band.')
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

  it('renders MSFT research detail', async () => {
    renderResearch('/research/MSFT')

    expect(
      await screen.findByRole('heading', { name: 'MSFT 리서치' }),
    ).toBeVisible()
    expect(screen.getByRole('heading', { name: 'MSFT' })).toBeVisible()
    expect(screen.getByText('Microsoft Corp.')).toBeVisible()
    expect(
      screen.getByRole('img', { name: 'MSFT 최근 가격 추이' }),
    ).toBeVisible()
  })
})
