import { render, screen, within } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { vi } from 'vitest'

import { appRouteObjects } from '@/app/router'
import type { AlertCandidate } from '@/features/alerts/adapters'
import type { DecisionLog } from '@/features/decision-log/adapters'
import type { Signal } from '@/features/signals/adapters'
import type { WatchlistAssetRow } from '@/features/watchlist/adapters'
import { createQueryClient } from '@/shared/api/queryClient'
import { AuthProvider } from '@/shared/auth/AuthProvider'
import type { AiBriefing, DashboardTrends } from '@/shared/model'
import {
  setupAuthenticatedUser,
  teardownAuthenticatedUser,
} from '@/test-utils/authTestSetup'

interface QueryState<T> {
  data: T | undefined
  error: Error | null
  isError: boolean
  isLoading: boolean
  refetch: () => unknown
}

const refetchDashboardSummary = vi.fn()
const refetchDashboardTrends = vi.fn()
const refetchDashboardBriefing = vi.fn()
const refetchPriorityQueue = vi.fn()
const refetchSignals = vi.fn()
const refetchDecisionLogs = vi.fn()
const refetchWatchlistAssets = vi.fn()

vi.mock('@/features/market-indices/queries', () => ({
  useMarketIndices: () => ({
    data: { indices: [], referenceAt: null },
    error: null,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  }),
}))

vi.mock('@/shared/ui', async () => {
  const actual =
    await vi.importActual<typeof import('@/shared/ui')>('@/shared/ui')

  return {
    ...actual,
    BarChart: ({
      data,
      ariaLabel,
    }: {
      data: Array<{ value: number }>
      ariaLabel?: string
    }) => (
      <div
        role="img"
        aria-label={ariaLabel}
        data-testid="mock-bar-chart"
        data-values={data.map((point) => point.value).join(',')}
      />
    ),
    Sparkline: ({
      data,
      ariaLabel,
    }: {
      data: Array<{ value: number }>
      ariaLabel?: string
    }) => (
      <div
        role="img"
        aria-label={ariaLabel}
        data-testid="mock-sparkline"
        data-values={data.map((point) => point.value).join(',')}
      />
    ),
  }
})

const signalRows: Signal[] = [
  {
    id: '1',
    assetId: 1,
    symbol: 'NVDA',
    market: 'NASDAQ',
    companyName: 'NVIDIA Corp.',
    signalType: 'BUY_CANDIDATE',
    signalTypeLabel: '매수 후보',
    score: 86,
    riskLevel: '중간',
    reason: 'Data center demand remains above the prior quarter run rate.',
    evidence: null,
    createdAt: '2026. 05. 24. 09:00',
    expiresAt: '2026. 06. 24. 09:00',
  },
  {
    id: '2',
    assetId: 2,
    symbol: 'TSLA',
    market: 'NASDAQ',
    companyName: 'Tesla Inc.',
    signalType: 'RISK_REVIEW',
    signalTypeLabel: '리스크 검토',
    score: 78,
    riskLevel: '높음',
    reason: 'Margin risk needs a fresh review.',
    evidence: null,
    createdAt: '2026. 05. 23. 09:00',
    expiresAt: '2026. 06. 23. 09:00',
  },
  {
    id: '3',
    assetId: 3,
    symbol: 'AAPL',
    market: 'NASDAQ',
    companyName: 'Apple Inc.',
    signalType: 'VALUATION',
    signalTypeLabel: '밸류에이션',
    score: 71,
    riskLevel: '낮음',
    reason: 'Valuation remains inside the target band.',
    evidence: null,
    createdAt: '2026. 05. 22. 09:00',
    expiresAt: '2026. 06. 22. 09:00',
  },
  {
    id: '4',
    assetId: 4,
    symbol: 'MSFT',
    market: 'NASDAQ',
    companyName: 'Microsoft Corp.',
    signalType: 'TECHNICAL',
    signalTypeLabel: '기술적 점검',
    score: 64,
    riskLevel: '중간',
    reason: 'Trend support needs review.',
    evidence: null,
    createdAt: '2026. 05. 21. 09:00',
    expiresAt: '2026. 06. 21. 09:00',
  },
]

const decisionLogRows: DecisionLog[] = [
  {
    id: '1',
    symbol: 'NVDA',
    decisionType: '보유 유지',
    decisionStatus: '열림',
    rationale: '실적 발표 전 보유 판단을 유지한다.',
    cognitiveRisks: ['밸류에이션'],
    createdBy: '사용자',
    reviewDate: null,
    createdAt: '2026. 05. 24. 09:00',
  },
  {
    id: '2',
    symbol: 'TSLA',
    decisionType: '매도 검토',
    decisionStatus: '검토됨',
    rationale: '마진 둔화 가능성을 확인한다.',
    cognitiveRisks: ['마진 압박'],
    createdBy: 'AI',
    reviewDate: null,
    createdAt: '2026. 05. 23. 09:00',
  },
  {
    id: '3',
    symbol: 'AAPL',
    decisionType: '관망',
    decisionStatus: '종료됨',
    rationale: '신제품 이벤트 전까지 관망한다.',
    cognitiveRisks: [],
    createdBy: '시스템',
    reviewDate: null,
    createdAt: '2026. 05. 22. 09:00',
  },
]

const watchlistRows: WatchlistAssetRow[] = [
  {
    id: 1,
    symbol: 'NVDA',
    market: 'NASDAQ',
    name: 'NVIDIA Corp.',
    price: 128.72,
    changePercent: -0.24,
    currency: 'USD',
    sector: 'Technology',
    reason: 'Core AI exposure',
    tags: ['ai'],
    memo: null,
    status: 'RISK_ALERT',
    referenceAt: '2026-05-24T00:21:00.000Z',
  },
  {
    id: 2,
    symbol: 'AAPL',
    market: 'NASDAQ',
    name: 'Apple Inc.',
    price: null,
    changePercent: null,
    currency: null,
    sector: 'Technology',
    reason: null,
    tags: [],
    memo: null,
    status: 'NORMAL',
    referenceAt: '2026-05-24T00:20:00.000Z',
  },
]

const priorityQueueRows: AlertCandidate[] = [
  {
    id: '1',
    assetId: 1,
    symbol: 'NVDA',
    candidateType: 'SIGNAL_REVIEW',
    title: '엔비디아 추가 진입 가격 점검',
    reason: 'AI 반도체 수요는 견조하지만 진입 가격을 다시 확인합니다.',
    riskLevel: '중간',
    status: '안읽음',
    createdAt: '2026. 05. 24. 09:00',
  },
  {
    id: '2',
    assetId: 2,
    symbol: 'TSLA',
    candidateType: 'NEWS_REVIEW',
    title: '테슬라 뉴스 감성 급락',
    reason: '뉴스 감성 악화로 포지션 위험을 먼저 점검합니다.',
    riskLevel: '높음',
    status: '안읽음',
    createdAt: '2026. 05. 24. 08:30',
  },
  {
    id: '3',
    assetId: null,
    symbol: null,
    candidateType: 'DISCLOSURE_REVIEW',
    title: '시장 공시 확인 필요',
    reason: '연결된 종목 정보 없이도 큐 항목은 표시됩니다.',
    riskLevel: '높음',
    status: '읽음',
    createdAt: '2026. 05. 24. 08:00',
  },
  {
    id: '4',
    assetId: 3,
    symbol: 'AAPL',
    candidateType: 'VALUATION_REVIEW',
    title: '애플 밸류에이션 유지',
    reason: '목표 밴드 안에 있어 후순위로 확인합니다.',
    riskLevel: '낮음',
    status: '안읽음',
    createdAt: '2026. 05. 24. 07:30',
  },
]

let dashboardSummaryQueryState = {
  data: {
    riskAlertCount: 3,
    importantNewsCount: 8,
    reviewSignalCount: 5,
    cashRatio: 22.7,
    riskAlertDelta: null,
    importantNewsDelta: null,
    reviewSignalDelta: null,
    cashRatioDelta: null,
  },
  error: null as Error | null,
  isError: false,
  isLoading: false,
  refetch: refetchDashboardSummary,
}
let dashboardTrendsQueryState: QueryState<DashboardTrends> = {
  data: {
    riskAlerts: [1, 2, 3],
    reviewSignals: [4, 5, 6],
    importantNews: [7, 8, 9],
  },
  error: null,
  isError: false,
  isLoading: false,
  refetch: refetchDashboardTrends,
}
let dashboardBriefingQueryState: QueryState<AiBriefing> = {
  data: {
    headline: 'AI demand remains resilient',
    body: 'Cash and concentration risk should be checked before new buys.',
    riskHeadline: '리스크 체크',
    riskChecks: ['현금 비중 확인', '단일 종목 집중도 확인'],
  },
  error: null,
  isError: false,
  isLoading: false,
  refetch: refetchDashboardBriefing,
}
let signalsQueryState: QueryState<Signal[]> = {
  data: signalRows,
  error: null,
  isError: false,
  isLoading: false,
  refetch: refetchSignals,
}
let priorityQueueQueryState: QueryState<AlertCandidate[]> = {
  data: priorityQueueRows,
  error: null,
  isError: false,
  isLoading: false,
  refetch: refetchPriorityQueue,
}
let decisionLogsQueryState: QueryState<DecisionLog[]> = {
  data: decisionLogRows,
  error: null,
  isError: false,
  isLoading: false,
  refetch: refetchDecisionLogs,
}
let watchlistAssetsQueryState: QueryState<{
  rows: WatchlistAssetRow[]
  meta: { page: number; size: number; total: number }
}> = {
  data: { rows: watchlistRows, meta: { page: 1, size: 4, total: 2 } },
  error: null,
  isError: false,
  isLoading: false,
  refetch: refetchWatchlistAssets,
}

vi.mock('@/features/dashboard/queries', () => ({
  useDashboardSummary: () => dashboardSummaryQueryState,
  useDashboardTrends: () => dashboardTrendsQueryState,
}))

vi.mock('@/features/briefing/queries', () => ({
  useDashboardBriefing: () => dashboardBriefingQueryState,
}))

vi.mock('@/features/alerts/queries', () => ({
  useAlertCandidates: () => priorityQueueQueryState,
  useUnreadAlertSummary: () => ({
    data: { unreadCount: 0, recent: [] },
    error: null,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  }),
}))

vi.mock('@/features/signals/queries', () => ({
  useSignals: () => signalsQueryState,
}))

vi.mock('@/features/decision-log/queries', () => ({
  useDecisionLogs: () => decisionLogsQueryState,
}))

vi.mock('@/features/watchlist/queries', () => ({
  useWatchlistAssets: () => watchlistAssetsQueryState,
}))

beforeEach(() => {
  setupAuthenticatedUser()
  refetchDashboardSummary.mockReset()
  refetchDashboardTrends.mockReset()
  refetchDashboardBriefing.mockReset()
  refetchPriorityQueue.mockReset()
  refetchSignals.mockReset()
  refetchDecisionLogs.mockReset()
  refetchWatchlistAssets.mockReset()
  dashboardSummaryQueryState = {
    data: {
      riskAlertCount: 3,
      importantNewsCount: 8,
      reviewSignalCount: 5,
      cashRatio: 22.7,
      riskAlertDelta: null,
      importantNewsDelta: null,
      reviewSignalDelta: null,
      cashRatioDelta: null,
    },
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchDashboardSummary,
  }
  dashboardTrendsQueryState = {
    data: {
      riskAlerts: [1, 2, 3],
      reviewSignals: [4, 5, 6],
      importantNews: [7, 8, 9],
    },
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchDashboardTrends,
  }
  dashboardBriefingQueryState = {
    data: {
      headline: 'AI demand remains resilient',
      body: 'Cash and concentration risk should be checked before new buys.',
      riskHeadline: '리스크 체크',
      riskChecks: ['현금 비중 확인', '단일 종목 집중도 확인'],
    },
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchDashboardBriefing,
  }
  signalsQueryState = {
    data: signalRows,
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchSignals,
  }
  priorityQueueQueryState = {
    data: priorityQueueRows,
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchPriorityQueue,
  }
  decisionLogsQueryState = {
    data: decisionLogRows,
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchDecisionLogs,
  }
  watchlistAssetsQueryState = {
    data: { rows: watchlistRows, meta: { page: 1, size: 4, total: 2 } },
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchWatchlistAssets,
  }
})

afterEach(() => {
  teardownAuthenticatedUser()
})

function renderDashboard() {
  const router = createMemoryRouter(appRouteObjects, {
    initialEntries: ['/'],
  })
  const queryClient = createQueryClient()

  const renderResult = render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  )

  return { router, ...renderResult }
}

describe('DashboardPage', () => {
  it('renders the dashboard heading and today brief metrics', async () => {
    renderDashboard()

    expect(
      await screen.findByRole('heading', { name: 'AI 투자 관제실' }),
    ).toBeVisible()
    expect(screen.getByText('위험 증가 종목')).toBeVisible()
    expect(screen.getByText('중요 뉴스')).toBeVisible()
    expect(screen.getByText('검토 시그널')).toBeVisible()
    expect(screen.getByText('현금 비중')).toBeVisible()
    expect(screen.getAllByText('3').length).toBeGreaterThan(0)
    expect(screen.getAllByText('8').length).toBeGreaterThan(0)
    expect(screen.getAllByText('5').length).toBeGreaterThan(0)
    expect(screen.getByText('22.7%')).toBeVisible()
    expect(screen.queryByText('전일 대비 +1')).not.toBeInTheDocument()
  })

  it('renders dashboard AI briefing from query data', async () => {
    renderDashboard()

    expect(await screen.findByText('AI demand remains resilient')).toBeVisible()
    expect(
      screen.getByText(
        'Cash and concentration risk should be checked before new buys.',
      ),
    ).toBeVisible()
    expect(screen.getByText('리스크 체크')).toBeVisible()
    expect(screen.getByText('• 현금 비중 확인')).toBeVisible()
  })

  it('renders loading, error, empty, and no-risk states for dashboard AI briefing', async () => {
    dashboardBriefingQueryState = {
      ...dashboardBriefingQueryState,
      data: undefined,
      isLoading: true,
    }
    const { unmount } = renderDashboard()

    expect(
      await screen.findByRole('heading', { name: 'AI 투자 관제실' }),
    ).toBeVisible()
    expect(
      screen.queryByText('AI demand remains resilient'),
    ).not.toBeInTheDocument()

    unmount()
    dashboardBriefingQueryState = {
      ...dashboardBriefingQueryState,
      data: undefined,
      error: new Error('network failed'),
      isError: true,
      isLoading: false,
    }
    const { unmount: unmountError } = renderDashboard()

    expect(
      await screen.findByText('AI 브리핑을 불러오지 못했습니다'),
    ).toBeVisible()

    unmountError()
    dashboardBriefingQueryState = {
      ...dashboardBriefingQueryState,
      data: undefined,
      error: null,
      isError: false,
      isLoading: false,
    }
    const { unmount: unmountEmpty } = renderDashboard()

    expect(await screen.findByText('AI 브리핑 데이터가 없습니다')).toBeVisible()

    unmountEmpty()
    dashboardBriefingQueryState = {
      ...dashboardBriefingQueryState,
      data: {
        headline: 'Risk checks are quiet',
        body: 'No urgent briefing checks are active.',
        riskChecks: [],
      },
    }
    renderDashboard()

    expect(await screen.findByText('Risk checks are quiet')).toBeVisible()
    expect(screen.queryByText('• 현금 비중 확인')).not.toBeInTheDocument()
  })

  it('renders loading, error, and empty states for Today Brief', async () => {
    dashboardSummaryQueryState = {
      ...dashboardSummaryQueryState,
      data: undefined as never,
      isLoading: true,
    }
    const { unmount } = renderDashboard()

    expect(
      await screen.findByRole('heading', { name: 'AI 투자 관제실' }),
    ).toBeVisible()
    expect(screen.queryByText('22.7%')).not.toBeInTheDocument()

    unmount()
    dashboardSummaryQueryState = {
      ...dashboardSummaryQueryState,
      data: undefined as never,
      error: new Error('network failed'),
      isError: true,
      isLoading: false,
    }
    const { unmount: unmountError } = renderDashboard()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Today Brief를 불러오지 못했습니다',
    )

    unmountError()
    dashboardSummaryQueryState = {
      ...dashboardSummaryQueryState,
      data: undefined as never,
      error: null,
      isError: false,
      isLoading: false,
    }
    renderDashboard()

    expect(
      await screen.findByText('Today Brief 데이터가 없습니다'),
    ).toBeVisible()
  })

  it('renders Today Brief visual skeletons while trends are loading', async () => {
    dashboardTrendsQueryState = {
      ...dashboardTrendsQueryState,
      data: undefined,
      isLoading: true,
    }
    const { container } = renderDashboard()

    expect(
      await screen.findByRole('heading', { name: 'AI 투자 관제실' }),
    ).toBeVisible()
    expect(screen.getByText('22.7%')).toBeVisible()
    expect(container.querySelectorAll('.h-14.w-24.animate-pulse')).toHaveLength(
      2,
    )
    expect(container.querySelectorAll('.h-12.w-24.animate-pulse')).toHaveLength(
      1,
    )
  })

  it('keeps Today Brief metrics but hides trend visuals on trend error or empty data', async () => {
    dashboardTrendsQueryState = {
      ...dashboardTrendsQueryState,
      data: undefined,
      error: new Error('trend failed'),
      isError: true,
    }
    const { unmount } = renderDashboard()

    expect(await screen.findByText('22.7%')).toBeVisible()
    expect(screen.queryByTestId('mock-sparkline')).not.toBeInTheDocument()
    expect(screen.queryByTestId('mock-bar-chart')).not.toBeInTheDocument()

    unmount()
    dashboardTrendsQueryState = {
      ...dashboardTrendsQueryState,
      data: {
        riskAlerts: [],
        reviewSignals: [],
        importantNews: [],
      },
      error: null,
      isError: false,
    }
    renderDashboard()

    expect(await screen.findByText('22.7%')).toBeVisible()
    expect(screen.queryByTestId('mock-sparkline')).not.toBeInTheDocument()
    expect(screen.queryByTestId('mock-bar-chart')).not.toBeInTheDocument()
  })

  it('passes real trend series to Today Brief visuals without fallback decoration data', async () => {
    dashboardTrendsQueryState = {
      ...dashboardTrendsQueryState,
      data: {
        riskAlerts: [101, 0, 103],
        reviewSignals: [201, 202, 0],
        importantNews: [301, 302, 303],
      },
    }
    renderDashboard()

    expect(
      await screen.findByRole('img', { name: '위험 증가 종목 추이' }),
    ).toHaveAttribute('data-values', '101,0,103')
    expect(
      screen.getByRole('img', { name: '검토 시그널 추이' }),
    ).toHaveAttribute('data-values', '201,202,0')
    expect(screen.getByRole('img', { name: '중요 뉴스 추이' })).toHaveAttribute(
      'data-values',
      '301,302,303',
    )
    expect(
      screen.getByRole('img', { name: '위험 증가 종목 추이' }),
    ).not.toHaveAttribute('data-values', '22,24,23,27,26,31,28,34,33,38')
  })

  it('renders watchlist prices and change percentages with research links', async () => {
    renderDashboard()

    const table = await screen.findByRole('table', { name: '관심 종목 상태' })
    const nvdaLink = within(table).getByRole('link', { name: 'NVDA' })

    expect(nvdaLink).toHaveAttribute('href', '/research/NVDA')
    expect(within(table).getByText('NVIDIA Corp.')).toBeVisible()
    expect(within(table).getByText('128.72')).toBeVisible()
    expect(within(table).getByText('-0.24%')).toBeVisible()
    expect(within(table).getAllByText('—')).toHaveLength(2)
    expect(within(table).queryByText('관망')).not.toBeInTheDocument()
    expect(within(table).queryByText('PER')).not.toBeInTheDocument()
    expect(within(table).queryByText('PEG')).not.toBeInTheDocument()
    expect(within(table).queryByText('60.3')).not.toBeInTheDocument()
    expect(within(table).queryByText('1.32')).not.toBeInTheDocument()
  })

  it('renders loading, error, and empty states for watchlist assets', async () => {
    watchlistAssetsQueryState = {
      ...watchlistAssetsQueryState,
      data: undefined,
      isLoading: true,
    }
    const { container, unmount } = renderDashboard()

    expect(
      await screen.findByRole('heading', { name: 'AI 투자 관제실' }),
    ).toBeVisible()
    expect(
      screen.queryByRole('table', { name: '관심 종목 상태' }),
    ).not.toBeInTheDocument()
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(
      0,
    )

    unmount()
    watchlistAssetsQueryState = {
      ...watchlistAssetsQueryState,
      data: undefined,
      error: new Error('network failed'),
      isError: true,
      isLoading: false,
    }
    const { unmount: unmountError } = renderDashboard()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '관심 종목을 불러오지 못했습니다',
    )

    unmountError()
    watchlistAssetsQueryState = {
      ...watchlistAssetsQueryState,
      data: { rows: [], meta: { page: 1, size: 4, total: 0 } },
      error: null,
      isError: false,
      isLoading: false,
    }
    renderDashboard()

    expect(await screen.findByText('표시할 관심 종목이 없습니다')).toBeVisible()
  })

  it('renders priority queue titles and risk badges', async () => {
    renderDashboard()

    expect(await screen.findByText('테슬라 뉴스 감성 급락')).toBeVisible()
    expect(screen.getByText('엔비디아 추가 진입 가격 점검')).toBeVisible()
    expect(screen.getByText('시장 공시 확인 필요')).toBeVisible()
    expect(screen.queryByText('애플 밸류에이션 유지')).not.toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: '테슬라 뉴스 감성 급락' }),
    ).toHaveAttribute('href', '/research/TSLA')
    expect(
      screen.queryByRole('link', { name: '시장 공시 확인 필요' }),
    ).not.toBeInTheDocument()
    expect(screen.getAllByText('높음').length).toBeGreaterThan(0)
    expect(screen.getAllByText('중간').length).toBeGreaterThan(0)
  })

  it('renders loading, error, and empty states for priority queue', async () => {
    priorityQueueQueryState = {
      ...priorityQueueQueryState,
      data: undefined,
      isLoading: true,
    }
    const { container, unmount } = renderDashboard()

    expect(
      await screen.findByRole('heading', { name: 'AI 투자 관제실' }),
    ).toBeVisible()
    expect(screen.queryByText('테슬라 뉴스 감성 급락')).not.toBeInTheDocument()
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(
      0,
    )

    unmount()
    priorityQueueQueryState = {
      ...priorityQueueQueryState,
      data: undefined,
      error: new Error('network failed'),
      isError: true,
      isLoading: false,
    }
    const { unmount: unmountError } = renderDashboard()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '우선 확인 큐를 불러오지 못했습니다',
    )

    unmountError()
    priorityQueueQueryState = {
      ...priorityQueueQueryState,
      data: [],
      error: null,
      isError: false,
      isLoading: false,
    }
    renderDashboard()

    expect(await screen.findByText('우선 확인할 후보가 없습니다')).toBeVisible()
  })

  it('renders top signals with score values', async () => {
    renderDashboard()

    await screen.findByRole('heading', { name: 'AI 투자 관제실' })

    expect(
      within(
        screen.getByRole('article', { name: 'NVDA 대시보드 시그널' }),
      ).getByText('86%'),
    ).toBeVisible()
    expect(
      within(
        screen.getByRole('article', { name: 'TSLA 대시보드 시그널' }),
      ).getByText('78%'),
    ).toBeVisible()
    expect(
      within(
        screen.getByRole('article', { name: 'AAPL 대시보드 시그널' }),
      ).getByText('71%'),
    ).toBeVisible()
    expect(
      screen.queryByRole('article', { name: 'MSFT 대시보드 시그널' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByText(/Data center demand remains above the prior quarter/),
    ).toBeVisible()
  })

  it('renders loading, error, and empty states for top signals', async () => {
    signalsQueryState = {
      ...signalsQueryState,
      data: undefined,
      isLoading: true,
    }
    const { container, unmount } = renderDashboard()

    expect(
      await screen.findByRole('heading', { name: 'AI 투자 관제실' }),
    ).toBeVisible()
    expect(
      screen.queryByRole('article', { name: 'NVDA 대시보드 시그널' }),
    ).not.toBeInTheDocument()
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(
      0,
    )

    unmount()
    signalsQueryState = {
      ...signalsQueryState,
      data: undefined,
      error: new Error('network failed'),
      isError: true,
      isLoading: false,
    }
    const { unmount: unmountError } = renderDashboard()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '시그널을 불러오지 못했습니다',
    )

    unmountError()
    signalsQueryState = {
      ...signalsQueryState,
      data: [],
      error: null,
      isError: false,
      isLoading: false,
    }
    renderDashboard()

    expect(await screen.findByText('표시할 시그널이 없습니다')).toBeVisible()
  })

  it('renders recent decision logs with symbols, decision types, and rationales', async () => {
    renderDashboard()

    const table = await screen.findByRole('table', { name: '최근 판단 기록' })

    expect(within(table).getByRole('link', { name: 'NVDA' })).toBeVisible()
    expect(within(table).getByRole('link', { name: 'TSLA' })).toBeVisible()
    expect(within(table).getAllByText('보유 유지').length).toBeGreaterThan(0)
    expect(within(table).getByText('매도 검토')).toBeVisible()
    expect(
      within(table).getByText('실적 발표 전 보유 판단을 유지한다.'),
    ).toBeVisible()
    expect(
      within(table).getByText('마진 둔화 가능성을 확인한다.'),
    ).toBeVisible()
    expect(within(table).queryByText('decision')).not.toBeInTheDocument()
  })

  it('renders loading, error, and empty states for recent decision logs', async () => {
    decisionLogsQueryState = {
      ...decisionLogsQueryState,
      data: undefined,
      isLoading: true,
    }
    const { container, unmount } = renderDashboard()

    expect(
      await screen.findByRole('heading', { name: 'AI 투자 관제실' }),
    ).toBeVisible()
    expect(
      screen.queryByRole('table', { name: '최근 판단 기록' }),
    ).not.toBeInTheDocument()
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(
      0,
    )

    unmount()
    decisionLogsQueryState = {
      ...decisionLogsQueryState,
      data: undefined,
      error: new Error('network failed'),
      isError: true,
      isLoading: false,
    }
    const { unmount: unmountError } = renderDashboard()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '판단 기록을 불러오지 못했습니다',
    )

    unmountError()
    decisionLogsQueryState = {
      ...decisionLogsQueryState,
      data: [],
      error: null,
      isError: false,
      isLoading: false,
    }
    renderDashboard()

    expect(await screen.findByText('최근 판단 기록이 없습니다')).toBeVisible()
  })

  it('renders section links to related routes', async () => {
    renderDashboard()

    await screen.findByRole('heading', { name: 'AI 투자 관제실' })

    expect(
      screen.getByRole('link', { name: '더 많은 종목 보기' }),
    ).toHaveAttribute('href', '/watchlist')
    expect(
      screen.getByRole('link', { name: '전체 시그널 보기' }),
    ).toHaveAttribute('href', '/signals')
    expect(
      screen.getByRole('link', { name: '전체 기록 보기' }),
    ).toHaveAttribute('href', '/decision-log')
  })
})
