import { fireEvent, render, screen, within } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryRouter,
  RouterProvider,
  type RouteObject,
} from 'react-router-dom'
import { vi } from 'vitest'

import { appRouteObjects } from '@/app/router'
import { createQueryClient } from '@/shared/api/queryClient'
import { AuthProvider } from '@/shared/auth/AuthProvider'
import {
  setupAuthenticatedUser,
  teardownAuthenticatedUser,
} from '@/test-utils/authTestSetup'

import { SignalsPage } from './SignalsPage'

const signalRows = [
  {
    id: '1',
    assetId: 1,
    symbol: 'NVDA',
    market: 'NASDAQ',
    companyName: 'NVIDIA Corp.',
    signalType: 'BUY_CANDIDATE',
    signalTypeLabel: 'BUY_CANDIDATE',
    score: 86,
    riskLevel: '중간',
    reason: 'Data center demand remains above the prior quarter run rate.',
    keyPoints: [
      'AI accelerator demand remains strong.',
      'Gross margin guidance improved.',
    ],
    change: {
      direction: 'ESCALATED',
      directionLabel: '점수 상승',
      scoreDelta: 4,
    },
    evidence: 'Guidance raised.',
    createdAt: '2026. 5. 24. 오전 9:00',
    expiresAt: '2026. 6. 24. 오전 9:00',
  },
  {
    id: '2',
    assetId: 2,
    symbol: 'TSLA',
    market: 'NASDAQ',
    companyName: 'Tesla Inc.',
    signalType: 'RISK_ALERT',
    signalTypeLabel: 'RISK_ALERT',
    score: 92,
    riskLevel: '높음',
    reason: 'Delivery expectations declined.',
    keyPoints: [],
    change: null,
    evidence: null,
    createdAt: '2026. 5. 23. 오전 9:00',
    expiresAt: '2026. 6. 23. 오전 9:00',
  },
  {
    id: '3',
    assetId: 3,
    symbol: 'AAPL',
    market: 'NASDAQ',
    companyName: 'Apple Inc.',
    signalType: 'WATCH',
    signalTypeLabel: 'WATCH',
    score: 72,
    riskLevel: '낮음',
    reason: 'Valuation remains inside the target band.',
    keyPoints: [],
    change: {
      direction: 'DEESCALATED',
      directionLabel: '점수 하락',
      scoreDelta: -3,
    },
    evidence: null,
    createdAt: '2026. 5. 22. 오전 9:00',
    expiresAt: '2026. 6. 22. 오전 9:00',
  },
  {
    id: '4',
    assetId: 4,
    symbol: 'MSFT',
    market: 'NASDAQ',
    companyName: 'Microsoft Corp.',
    signalType: 'THESIS_BROKEN',
    signalTypeLabel: 'THESIS_BROKEN',
    score: 61,
    riskLevel: '높음',
    reason: 'Trend support needs review.',
    keyPoints: [],
    change: {
      direction: 'CHANGED',
      directionLabel: '유형 변경',
      scoreDelta: 0,
    },
    evidence: null,
    createdAt: '2026. 5. 21. 오전 9:00',
    expiresAt: '2026. 6. 21. 오전 9:00',
  },
  {
    id: '5',
    assetId: 5,
    symbol: 'AMZN',
    market: 'NASDAQ',
    companyName: 'Amazon.com Inc.',
    signalType: 'SELL_REVIEW',
    signalTypeLabel: 'SELL_REVIEW',
    score: 55,
    riskLevel: '중간',
    reason: 'Margins need additional review.',
    keyPoints: [],
    change: {
      direction: 'NEW',
      directionLabel: '신규',
      scoreDelta: null,
    },
    evidence: null,
    createdAt: '2026. 5. 20. 오전 9:00',
    expiresAt: '2026. 6. 20. 오전 9:00',
  },
  {
    id: '6',
    assetId: 6,
    symbol: 'GOOG',
    market: 'NASDAQ',
    companyName: 'Alphabet Inc.',
    signalType: 'OVERHEATED',
    signalTypeLabel: 'OVERHEATED',
    score: 35,
    riskLevel: '중간',
    reason: 'Momentum looks extended.',
    keyPoints: [],
    change: {
      direction: 'UNCHANGED',
      directionLabel: '변동 없음',
      scoreDelta: 0,
    },
    evidence: null,
    createdAt: '2026. 5. 19. 오전 9:00',
    expiresAt: '2026. 6. 19. 오전 9:00',
  },
  {
    id: '7',
    assetId: 7,
    symbol: 'META',
    market: 'NYSE',
    companyName: 'Meta Platforms Inc.',
    signalType: 'BUY_CANDIDATE',
    signalTypeLabel: 'BUY_CANDIDATE',
    score: 20,
    riskLevel: '낮음',
    reason: 'Long-term growth warrants review.',
    keyPoints: [],
    change: null,
    evidence: null,
    createdAt: '2026. 5. 18. 오전 9:00',
    expiresAt: '2026. 6. 18. 오전 9:00',
  },
]

const signalSparklineStates = vi.hoisted(
  () =>
    new Map<
      string,
      {
        data: number[] | undefined
        error: Error | null
        isError: boolean
        isLoading: boolean
        refetch: ReturnType<typeof vi.fn>
      }
    >(),
)

const summaryData = {
  total: 7,
  byCategory: { WATCH: 1, RISK: 2, BUY: 2, RESEARCH: 2 },
  deltaByCategory: { WATCH: 0, RISK: 1, BUY: -1, RESEARCH: 2 },
}

const changeRows = [
  {
    symbol: 'NVDA',
    companyName: 'NVIDIA Corp.',
    market: 'NASDAQ',
    snapshotDate: '2026-05-24',
    capturedAt: '2026-05-24T00:00:00.000Z',
    change: {
      direction: 'NEW',
      directionLabel: '신규',
      scoreDelta: null,
    },
    dominantType: 'BUY_CANDIDATE',
    dominantScore: 86,
  },
  {
    symbol: 'TSLA',
    companyName: 'Tesla Inc.',
    market: 'NASDAQ',
    snapshotDate: '2026-05-23',
    capturedAt: '2026-05-23T00:00:00.000Z',
    change: {
      direction: 'CLEARED',
      directionLabel: '해소',
      scoreDelta: null,
    },
    dominantType: null,
    dominantScore: null,
  },
]

let summaryQueryState: {
  data: typeof summaryData | undefined
  isError: boolean
  isLoading: boolean
} = {
  data: summaryData,
  isError: false,
  isLoading: false,
}

let changesQueryState: {
  data: typeof changeRows | undefined
  isError: boolean
  isLoading: boolean
} = {
  data: changeRows,
  isError: false,
  isLoading: false,
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

vi.mock('@/features/signals/queries', () => ({
  useSignals: () => ({
    data: signalRows,
    error: null,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  }),
  useSignalSummary: () => summaryQueryState,
  useSignalChanges: () => changesQueryState,
  useSignalSparkline: (symbol: string | null, market: string | null) =>
    signalSparklineStates.get(`${symbol ?? 'null'}:${market ?? 'null'}`) ?? {
      data: [],
      error: null,
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    },
}))

beforeEach(() => {
  setupAuthenticatedUser()
  signalSparklineStates.clear()
  summaryQueryState = {
    data: summaryData,
    isError: false,
    isLoading: false,
  }
  changesQueryState = {
    data: changeRows,
    isError: false,
    isLoading: false,
  }
})

afterEach(() => {
  teardownAuthenticatedUser()
})

function renderSignals(routes: RouteObject[] = appRouteObjects) {
  const router = createMemoryRouter(routes, {
    initialEntries: ['/signals'],
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

function getSignalCard(symbol: string, signalType: string) {
  return screen.getByRole('article', {
    name: `${symbol} ${signalType} 시그널`,
  })
}

describe('SignalsPage', () => {
  it('renders counts, ratios, and deltas from the summary response', async () => {
    renderSignals()

    await screen.findByRole('article', {
      name: 'NVDA BUY_CANDIDATE 시그널',
    })

    expect(
      within(screen.getByLabelText('총 시그널 KPI')).getByText('7'),
    ).toBeVisible()
    expect(
      within(screen.getByLabelText('관망 유지 KPI')).getByText('1'),
    ).toBeVisible()
    expect(
      within(screen.getByLabelText('관망 유지 KPI')).getByText(/전체 14.3%/),
    ).toBeVisible()
    expect(
      within(screen.getByLabelText('관망 유지 KPI')).getByText(/전일 대비 ±0/),
    ).toBeVisible()

    for (const label of [
      '리스크 증가 KPI',
      '매수 검토 가능 KPI',
      '추가 리서치 필요 KPI',
    ]) {
      expect(within(screen.getByLabelText(label)).getByText('2')).toBeVisible()
      expect(
        within(screen.getByLabelText(label)).getByText(/전체 28.6%/),
      ).toBeVisible()
    }
    expect(
      within(screen.getByLabelText('리스크 증가 KPI')).getByText(
        /전일 대비 \+1/,
      ),
    ).toBeVisible()
    expect(
      within(screen.getByLabelText('매수 검토 가능 KPI')).getByText(
        /전일 대비 -1/,
      ),
    ).toBeVisible()
    expect(
      within(screen.getByLabelText('총 시그널 KPI')).getByText(/전일 대비 \+2/),
    ).toBeVisible()
  })

  it('shows dashes while the summary is loading', async () => {
    summaryQueryState = { data: undefined, isError: false, isLoading: true }
    renderSignals()

    await screen.findByRole('article', {
      name: 'NVDA BUY_CANDIDATE 시그널',
    })

    expect(
      within(screen.getByLabelText('총 시그널 KPI')).getByText('전일 대비 —'),
    ).toBeVisible()
    expect(
      within(screen.getByLabelText('관망 유지 KPI')).getByText(
        '전체 — · 전일 대비 —',
      ),
    ).toBeVisible()
  })

  it('shows dashes when the summary request fails with cached data', async () => {
    summaryQueryState = { data: summaryData, isError: true, isLoading: false }
    renderSignals()

    await screen.findByRole('article', {
      name: 'NVDA BUY_CANDIDATE 시그널',
    })

    expect(
      within(screen.getByLabelText('총 시그널 KPI')).getByText('전일 대비 —'),
    ).toBeVisible()
    expect(
      within(screen.getByLabelText('리스크 증가 KPI')).getByText(
        '전체 — · 전일 대비 —',
      ),
    ).toBeVisible()
  })

  it('filters cards by category', async () => {
    renderSignals()
    await screen.findByRole('article', {
      name: 'NVDA BUY_CANDIDATE 시그널',
    })

    fireEvent.change(screen.getByLabelText('신호 유형'), {
      target: { value: 'RISK' },
    })

    expect(screen.getAllByRole('article')).toHaveLength(2)
    expect(getSignalCard('TSLA', 'RISK_ALERT')).toBeVisible()
    expect(getSignalCard('MSFT', 'THESIS_BROKEN')).toBeVisible()
  })

  it('filters cards by symbol or company name search', async () => {
    renderSignals()
    await screen.findByRole('article', {
      name: 'NVDA BUY_CANDIDATE 시그널',
    })

    fireEvent.change(screen.getByLabelText('종목 검색'), {
      target: { value: 'apple' },
    })
    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(getSignalCard('AAPL', 'WATCH')).toBeVisible()

    fireEvent.change(screen.getByLabelText('종목 검색'), {
      target: { value: 'nvda' },
    })
    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(getSignalCard('NVDA', 'BUY_CANDIDATE')).toBeVisible()
  })

  it('resets every filter and restores all cards', async () => {
    renderSignals()
    await screen.findByRole('article', {
      name: 'NVDA BUY_CANDIDATE 시그널',
    })

    fireEvent.change(screen.getByLabelText('신호 유형'), {
      target: { value: 'BUY' },
    })
    fireEvent.change(screen.getByLabelText('신뢰도'), {
      target: { value: 'low' },
    })
    fireEvent.change(screen.getByLabelText('시장'), {
      target: { value: 'NYSE' },
    })
    fireEvent.change(screen.getByLabelText('종목 검색'), {
      target: { value: 'meta' },
    })
    fireEvent.click(screen.getByRole('button', { name: '필터 초기화' }))

    expect(screen.getByLabelText('신호 유형')).toHaveValue('all')
    expect(screen.getByLabelText('신뢰도')).toHaveValue('all')
    expect(screen.getByLabelText('시장')).toHaveValue('all')
    expect(screen.getByLabelText('종목 검색')).toHaveValue('')
    expect(screen.getAllByRole('article')).toHaveLength(7)
  })

  it('renders key-point bullets without the reason and keeps three actions', async () => {
    renderSignals()
    const card = await screen.findByRole('article', {
      name: 'NVDA BUY_CANDIDATE 시그널',
    })

    expect(within(card).getByText('매수 검토 가능')).toBeVisible()
    expect(
      within(card).getByRole('meter', { name: 'NVDA 신뢰도 86%' }),
    ).toHaveAttribute('aria-valuenow', '86')
    expect(within(card).getByText('신뢰도')).toBeVisible()
    expect(within(card).getByText('86%')).toBeVisible()
    expect(
      within(card).getByText('AI accelerator demand remains strong.'),
    ).toBeVisible()
    expect(
      within(card).getByText('Gross margin guidance improved.'),
    ).toBeVisible()
    expect(
      within(card).queryByText(
        'Data center demand remains above the prior quarter run rate.',
      ),
    ).not.toBeInTheDocument()
    expect(within(card).queryByText('Guidance raised.')).not.toBeInTheDocument()
    expect(
      within(card).getByRole('button', { name: '근거 보기' }),
    ).toBeEnabled()
    expect(
      within(card).getByRole('button', { name: '판단 기록' }),
    ).toBeEnabled()
    expect(
      within(card).getByRole('button', {
        name: '이 시그널 변화 알림 받기',
      }),
    ).toBeEnabled()
  })

  it('opens the briefing section from the evidence action', async () => {
    const router = renderSignals()
    const card = await screen.findByRole('article', {
      name: 'NVDA BUY_CANDIDATE 시그널',
    })

    fireEvent.click(within(card).getByRole('button', { name: '근거 보기' }))

    expect(router.state.location.pathname).toBe('/research/NVDA')
    expect(router.state.location.search).toBe('?section=briefing')
  })

  it('opens the alert rule builder deep-link for the signal symbol', async () => {
    const router = renderSignals([
      { path: '/signals', element: <SignalsPage /> },
      { path: '/settings', element: <div>설정</div> },
    ])
    const card = await screen.findByRole('article', {
      name: 'NVDA BUY_CANDIDATE 시그널',
    })

    fireEvent.click(
      within(card).getByRole('button', {
        name: '이 시그널 변화 알림 받기',
      }),
    )

    expect(router.state.location.pathname).toBe('/settings')
    expect(router.state.location.search).toBe('?builder=create&symbol=NVDA')
  })

  it('falls back to the reason when key points are empty', async () => {
    renderSignals()
    const card = await screen.findByRole('article', {
      name: 'TSLA RISK_ALERT 시그널',
    })

    expect(
      within(card).getByText('Delivery expectations declined.'),
    ).toBeVisible()
    expect(
      within(card).queryByText('AI accelerator demand remains strong.'),
    ).not.toBeInTheDocument()
  })

  it('calculates positive and negative one-month changes', async () => {
    signalSparklineStates.set('NVDA:NASDAQ', {
      data: [100, 110],
      error: null,
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    })
    signalSparklineStates.set('TSLA:NASDAQ', {
      data: [200, 150],
      error: null,
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    })

    renderSignals()

    expect(
      within(
        await screen.findByRole('article', {
          name: 'NVDA BUY_CANDIDATE 시그널',
        }),
      ).getByText('+10.0%'),
    ).toBeVisible()
    expect(
      within(getSignalCard('TSLA', 'RISK_ALERT')).getByText('-25.0%'),
    ).toBeVisible()
  })

  it('shows a dash when sparkline data has fewer than two values', async () => {
    signalSparklineStates.set('AAPL:NASDAQ', {
      data: [100],
      error: null,
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    })

    renderSignals()
    const card = await screen.findByRole('article', {
      name: 'AAPL WATCH 시그널',
    })

    expect(within(card).getByText('—')).toBeVisible()
  })

  it('keeps the existing sparkline loading and unavailable states', async () => {
    signalSparklineStates.set('NVDA:NASDAQ', {
      data: undefined,
      error: null,
      isError: false,
      isLoading: true,
      refetch: vi.fn(),
    })
    signalSparklineStates.set('TSLA:NASDAQ', {
      data: undefined,
      error: new Error('prices unavailable'),
      isError: true,
      isLoading: false,
      refetch: vi.fn(),
    })

    renderSignals()
    const nvdaCard = await screen.findByRole('article', {
      name: 'NVDA BUY_CANDIDATE 시그널',
    })

    expect(nvdaCard.querySelector('.animate-pulse')).toBeInTheDocument()
    expect(
      within(getSignalCard('TSLA', 'RISK_ALERT')).getByText('가격 시계열 대기'),
    ).toBeVisible()
  })

  it('renders only the top six priority signals in score order', async () => {
    renderSignals()
    await screen.findByRole('article', {
      name: 'NVDA BUY_CANDIDATE 시그널',
    })
    const rail = screen.getByLabelText('시그널 우선순위')
    const rows = within(rail).getAllByRole('listitem')

    expect(rows).toHaveLength(6)
    expect(rows[0]).toHaveAccessibleName('1위 TSLA')
    expect(rows[1]).toHaveAccessibleName('2위 NVDA')
    expect(within(rows[0]).getByText('TSLA')).toBeVisible()
    expect(within(rows[0]).getByText('리스크 증가')).toBeVisible()
    expect(within(rows[0]).getByText('—')).toBeVisible()
    expect(within(rows[1]).getByText('▲ +4')).toBeVisible()
    expect(within(rows[2]).getByText('▼ -3')).toBeVisible()
    expect(within(rail).queryByText('META')).not.toBeInTheDocument()
  })

  it('renders recent change rows with links, labels, badges, and dates', async () => {
    renderSignals()
    await screen.findByRole('article', {
      name: 'NVDA BUY_CANDIDATE 시그널',
    })

    const recentChanges = screen.getByLabelText('최근 변경')
    expect(
      within(recentChanges).getByRole('link', { name: 'NVDA' }),
    ).toHaveAttribute('href', '/research/NVDA')
    expect(within(recentChanges).getByText('신규')).toBeVisible()
    expect(within(recentChanges).getByText('매수 검토 가능')).toBeVisible()
    expect(within(recentChanges).getByText('2026-05-24')).toBeVisible()
    expect(
      within(recentChanges).getByRole('link', { name: 'TSLA' }),
    ).toHaveAttribute('href', '/research/TSLA')
    expect(within(recentChanges).getByText('해소')).toBeVisible()
    expect(within(recentChanges).getByText('2026-05-23')).toBeVisible()
  })

  it('renders the recent changes empty state', async () => {
    changesQueryState = { data: [], isError: false, isLoading: false }
    renderSignals()
    await screen.findByRole('article', {
      name: 'NVDA BUY_CANDIDATE 시그널',
    })

    expect(
      within(screen.getByLabelText('최근 변경')).getByText(
        '아직 변경 이력이 없습니다.',
      ),
    ).toBeVisible()
  })
})
