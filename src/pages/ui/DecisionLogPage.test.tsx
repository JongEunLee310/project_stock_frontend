import { QueryClientProvider } from '@tanstack/react-query'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { vi } from 'vitest'

import { appRouteObjects } from '@/app/router'
import type {
  DecisionAnalytics,
  DecisionLogDetail,
  DecisionLogListItem,
  DecisionOverview,
  DecisionReview,
} from '@/features/decision-log/adapters'
import type { DecisionLogFilters } from '@/features/decision-log/queries'
import { ApiError } from '@/shared/api'
import { createQueryClient } from '@/shared/api/queryClient'
import { AuthProvider } from '@/shared/auth/AuthProvider'
import {
  setupAuthenticatedUser,
  teardownAuthenticatedUser,
} from '@/test-utils/authTestSetup'

interface QueryState<T> {
  data: T | undefined
  error: Error | null
  isError: boolean
  isLoading: boolean
  refetch: ReturnType<typeof vi.fn>
}

const refetchOverview = vi.fn()
const refetchAnalytics = vi.fn()
const refetchDecisionLogs = vi.fn()
const refetchDecisionLog = vi.fn()
const refetchReviewQueue = vi.fn()
const refetchReviews = vi.fn()
const refetchSimilarDecisions = vi.fn()
let latestDecisionLogFilters: DecisionLogFilters | undefined
let latestSimilarDecisionId: string | undefined
let latestPriceQuery:
  | [symbol: string | null, market: string | null, range: string]
  | undefined

const listItem: DecisionLogListItem = {
  id: '42',
  target: { type: 'SYMBOL', typeLabel: '종목', id: 'NVDA', label: 'NVIDIA' },
  decisionType: 'HOLD',
  decisionTypeLabel: '관망 유지',
  summary: '실적 발표까지 기존 판단을 유지한다.',
  riskTypes: ['VALUATION'],
  riskLabels: ['밸류에이션'],
  confidenceLevel: 'MEDIUM',
  confidenceLevelLabel: '중간',
  status: 'ACTIVE',
  statusLabel: '진행 중',
  reviewAt: null,
  createdAt: '2026. 07. 21. 09:00',
}

const similarDecision: DecisionLogListItem = {
  ...listItem,
  id: '84',
  target: { type: 'SYMBOL', typeLabel: '종목', id: 'AMD', label: 'AMD' },
  decisionType: 'BUY_REVIEW',
  decisionTypeLabel: '매수 검토',
  summary: '실적 성장과 밸류에이션을 함께 검토한다.',
  createdAt: '2026. 06. 30. 11:00',
}

const overview: DecisionOverview = {
  totalCount: 1,
  createdThisWeek: 1,
  reviewDueCount: 0,
  activeCount: 1,
  decisionTypeDistribution: [
    { type: 'HOLD', label: '관망 유지', count: 1, share: 1 },
  ],
  asOf: '2026. 07. 21. 09:00',
}

const detail: DecisionLogDetail = {
  id: '42',
  target: listItem.target,
  decisionType: listItem.decisionType,
  decisionTypeLabel: listItem.decisionTypeLabel,
  thesis: '데이터센터 수요가 성장을 지지한다.',
  rationale: '실적 발표까지 관찰한다.',
  confidenceLevel: 'MEDIUM',
  confidenceLevelLabel: '중간',
  supportingReasons: [],
  counterArguments: [],
  status: 'ACTIVE',
  statusLabel: '진행 중',
  reviewAt: null,
  activatedAt: '2026. 07. 21. 10:00',
  reviewedAt: '2026. 07. 24. 09:00',
  closedAt: null,
  supersededById: '84',
  createdAt: '2026. 07. 21. 09:00',
  updatedAt: '2026. 07. 21. 09:00',
  evidence: [
    {
      id: 'e-1',
      type: 'RESEARCH',
      evidenceId: 'research-1',
      version: 2,
      title: '데이터센터 매출 성장',
      summary: '최근 실적이 예상치를 상회했다.',
      snapshot: null,
      relationship: 'SUPPORTING',
      relationshipLabel: '긍정 근거',
      createdAt: '2026. 07. 21. 08:00',
    },
    {
      id: 'e-2',
      type: 'NEWS',
      evidenceId: 'news-1',
      version: null,
      title: '대중 수출 규제 강화',
      summary: '단기 공급 계획의 불확실성이 커졌다.',
      snapshot: null,
      relationship: 'CONTRADICTING',
      relationshipLabel: '반대 근거',
      createdAt: '2026. 07. 21. 08:10',
    },
    {
      id: 'e-3',
      type: 'CHART',
      evidenceId: null,
      version: null,
      title: '단기 과매수 구간',
      summary: '변동성 확대 가능성이 있다.',
      snapshot: null,
      relationship: 'RISK',
      relationshipLabel: '위험',
      createdAt: '2026. 07. 21. 08:20',
    },
    {
      id: 'e-4',
      type: 'USER_MEMO',
      evidenceId: null,
      version: null,
      title: '실적 발표 전 관망 원칙',
      summary: '기존 투자 원칙을 참고했다.',
      snapshot: null,
      relationship: 'BACKGROUND',
      relationshipLabel: '배경',
      createdAt: '2026. 07. 21. 08:30',
    },
  ],
  risks: [
    {
      id: 'risk-1',
      type: 'VALUATION',
      typeLabel: '밸류에이션',
      description: '선행 배수가 역사적 상단에 가깝다.',
      severity: 'HIGH',
      severityLabel: '높음',
      createdAt: '2026. 07. 21. 08:40',
    },
  ],
  reviewTriggers: [
    {
      id: 'trigger-later',
      type: 'DATE',
      typeLabel: '날짜',
      condition: '실적 발표 후 가설을 재검토한다.',
      scheduledAt: '2026. 08. 20. 09:00',
      status: 'TRIGGERED',
      triggeredAt: '2026. 07. 23. 09:00',
      createdAt: '2026. 07. 21. 09:00',
    },
    {
      id: 'trigger-earlier',
      type: 'DATE',
      typeLabel: '날짜',
      condition: '다음 실적 일정을 확인한다.',
      scheduledAt: '2026. 08. 10. 09:00',
      status: 'PENDING',
      triggeredAt: null,
      createdAt: '2026. 07. 21. 09:00',
    },
  ],
  snapshots: [
    {
      id: 'snapshot-price-1',
      snapshotType: 'PRICE',
      data: {
        price: 172.4,
        session: { market: 'NASDAQ', delayed: false },
        levels: [168, 175],
        note: null,
      },
      capturedAt: '2026. 07. 21. 09:00',
    },
    {
      id: 'snapshot-price-2',
      snapshotType: 'PRICE',
      data: { price: 173.1 },
      capturedAt: '2026. 07. 21. 09:01',
    },
    {
      id: 'snapshot-valuation',
      snapshotType: 'VALUATION',
      data: { forward_per: 32.8 },
      capturedAt: '2026. 07. 21. 09:00',
    },
  ],
}

let overviewState: QueryState<DecisionOverview>
let analyticsState: QueryState<DecisionAnalytics>
let decisionLogsState: QueryState<{
  items: DecisionLogListItem[]
  meta?: { page: number; size: number; total: number }
}>
let decisionLogState: QueryState<DecisionLogDetail>
let reviewQueueState: QueryState<DecisionLogListItem[]>
let reviewsState: QueryState<DecisionReview[]>
let similarDecisionsState: QueryState<DecisionLogListItem[]>
let priceSeriesState: {
  data: { closes: number[]; currency: string | null } | undefined
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

vi.mock('@/features/decision-log/queries', () => ({
  useDecisionOverview: () => overviewState,
  useDecisionAnalytics: () => analyticsState,
  useDecisionLogs: (filters: DecisionLogFilters) => {
    latestDecisionLogFilters = filters
    return decisionLogsState
  },
  useReviewQueue: () => reviewQueueState,
  useDecisionLog: () => decisionLogState,
  useDecisionReviews: () => reviewsState,
  useSimilarDecisions: (id: string | undefined) => {
    latestSimilarDecisionId = id
    return similarDecisionsState
  },
  useCreateDecisionLog: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useActivateDecision: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useDecisionAssist: () => ({
    data: undefined,
    isPending: false,
    mutateAsync: vi.fn(),
  }),
}))

vi.mock('@/features/research/queries', () => ({
  useResearchPriceSeries: (
    symbol: string | null,
    market: string | null,
    range: string,
  ) => {
    latestPriceQuery = [symbol, market, range]
    return priceSeriesState
  },
}))

beforeEach(() => {
  setupAuthenticatedUser()
  refetchOverview.mockReset()
  refetchAnalytics.mockReset()
  refetchDecisionLogs.mockReset()
  refetchDecisionLog.mockReset()
  refetchReviewQueue.mockReset()
  refetchReviews.mockReset()
  refetchSimilarDecisions.mockReset()
  latestDecisionLogFilters = undefined
  latestSimilarDecisionId = undefined
  latestPriceQuery = undefined
  overviewState = {
    data: overview,
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchOverview,
  }
  analyticsState = {
    data: {
      totalCount: 1,
      decisionTypeDistribution: [
        { code: 'HOLD', label: '관망 유지', count: 1, share: 1 },
      ],
      counterArgumentRate: 1,
      confidenceDistribution: [
        { code: 'MEDIUM', label: '중간', count: 1, share: 1 },
      ],
      outcomeByConfidence: [],
      riskTagFrequency: [],
      reviewAdherence: {
        reviewedCount: 1,
        overdueCount: 0,
        adherenceRate: 1,
      },
      processQualityAverages: [],
      asOf: '2026. 07. 21. 09:00',
    },
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchAnalytics,
  }
  decisionLogsState = {
    data: { items: [listItem], meta: { page: 1, size: 20, total: 1 } },
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchDecisionLogs,
  }
  decisionLogState = {
    data: detail,
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchDecisionLog,
  }
  reviewQueueState = {
    data: [listItem],
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchReviewQueue,
  }
  reviewsState = {
    data: [
      {
        id: 'review-1',
        decisionId: '42',
        outcomeStatus: 'THESIS_CONFIRMED',
        outcomeStatusLabel: '가설 확인',
        thesisResult: 'CONFIRMED',
        thesisResultLabel: '확인',
        processQuality: {},
        resultMetrics: {},
        whatWentWell: '',
        whatWasMissed: '',
        whatToChange: '',
        reviewedAt: '2026. 07. 22. 09:00',
      },
    ],
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchReviews,
  }
  similarDecisionsState = {
    data: [similarDecision],
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchSimilarDecisions,
  }
  priceSeriesState = {
    data: { closes: [179.4, 181.25], currency: 'USD' },
  }
})

afterEach(() => {
  teardownAuthenticatedUser()
})

type RouteEntry = string | { pathname: string; state?: unknown }

function renderRoute(path: RouteEntry = '/decision-log') {
  const router = createMemoryRouter(appRouteObjects, {
    initialEntries: [path],
  })

  return render(
    <QueryClientProvider client={createQueryClient()}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  )
}

describe('DecisionLogPage shell', () => {
  it('renders the shell with summary cards and the decision table', async () => {
    renderRoute()

    expect(
      await screen.findByRole('heading', { name: '판단 기록' }),
    ).toBeVisible()
    expect(screen.getByLabelText('전체 기록 요약')).toHaveTextContent('1')
    expect(
      screen.getByRole('heading', { name: '판단 기록 목록' }),
    ).toBeVisible()
    expect(screen.getByRole('table', { name: '판단 기록' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'NVIDIA' })).toBeVisible()
    expect(screen.getByRole('heading', { name: '판단 작성' })).toBeVisible()
  })

  it('navigates from the decision log entry point to the analytics route', async () => {
    renderRoute()

    fireEvent.click(await screen.findByRole('link', { name: '판단 분석 보기' }))

    expect(
      await screen.findByRole('heading', { name: '판단 분석' }),
    ).toBeVisible()
    expect(
      screen.getByRole('heading', { name: '판단 유형 분포' }),
    ).toBeVisible()
    expect(screen.getByRole('link', { name: '판단 기록으로' })).toHaveAttribute(
      'href',
      '/decision-log',
    )
  })

  it('uses a legacy symbol query only for filtering and keeps the form empty', async () => {
    renderRoute('/decision-log?symbol=nvda')

    expect(await screen.findByLabelText(/종목 티커/)).toHaveValue('')
    expect(screen.getByLabelText('종목 심볼')).toHaveValue('NVDA')
    expect(latestDecisionLogFilters).toEqual({ symbol: 'NVDA' })
  })

  it('prefills target and evidence from router state without saving automatically', async () => {
    renderRoute({
      pathname: '/decision-log',
      state: {
        decisionPrefill: {
          target: { type: 'PORTFOLIO', id: 'portfolio-7' },
          evidence: [
            {
              type: 'PORTFOLIO',
              id: 'risk-1',
              title: '반도체 쏠림 위험',
              summary: '반도체 관련 종목 비중이 높습니다.',
              snapshot: { cashRatio: 22.7, topHolding: 'QQQ' },
              relationship: 'BACKGROUND',
            },
          ],
        },
      },
    })

    expect(await screen.findByLabelText(/포트폴리오 식별자/)).toHaveValue(
      'portfolio-7',
    )
    expect(screen.getByLabelText(/근거 제목/)).toHaveValue('반도체 쏠림 위험')
    expect(screen.getByLabelText('근거 요약')).toHaveValue(
      '반도체 관련 종목 비중이 높습니다.',
    )
    expect(screen.getByLabelText('근거 관계')).toHaveValue('BACKGROUND')
    expect(screen.getByText('당시 스냅샷')).toBeVisible()
  })

  it('keeps a direct entry without valid prefill state empty', async () => {
    renderRoute({
      pathname: '/decision-log',
      state: { decisionPrefill: { target: { type: 'UNKNOWN', id: 'NVDA' } } },
    })

    expect(await screen.findByLabelText(/종목 티커/)).toHaveValue('')
    expect(screen.queryByText('연결 근거')).not.toBeInTheDocument()
  })

  it('passes combined filters to the decision log query and resets them', async () => {
    renderRoute()

    fireEvent.change(await screen.findByLabelText('대상 유형'), {
      target: { value: 'SYMBOL' },
    })
    fireEvent.change(screen.getByLabelText('판단 유형'), {
      target: { value: 'BUY_REVIEW' },
    })
    fireEvent.change(screen.getByLabelText('상태'), {
      target: { value: 'REVIEW_DUE' },
    })
    fireEvent.change(screen.getByLabelText('위험 유형'), {
      target: { value: 'VALUATION' },
    })
    fireEvent.change(screen.getByLabelText('재검토 예정일'), {
      target: { value: '2026-08-01' },
    })

    expect(latestDecisionLogFilters).toEqual({
      targetType: 'SYMBOL',
      decisionType: 'BUY_REVIEW',
      status: 'REVIEW_DUE',
      riskType: 'VALUATION',
      reviewDueBefore: '2026-08-01',
      page: undefined,
    })

    fireEvent.click(screen.getByRole('button', { name: '필터 초기화' }))
    expect(latestDecisionLogFilters).toEqual({})
  })

  it('renders loading state while either shell query is loading', async () => {
    overviewState = { ...overviewState, data: undefined, isLoading: true }
    const { container } = renderRoute()

    expect(
      await screen.findByRole('heading', { name: '판단 기록' }),
    ).toBeVisible()
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(
      0,
    )
    expect(screen.getByLabelText('판단 기록 요약')).toHaveAttribute(
      'aria-busy',
      'true',
    )
    expect(screen.getByRole('table', { name: '판단 기록' })).toBeVisible()
  })

  it('renders an isolated overview error and retries its query', async () => {
    overviewState = {
      ...overviewState,
      data: undefined,
      error: new Error('network failed'),
      isError: true,
    }
    renderRoute()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '판단 기록 요약을 불러오지 못했습니다',
    )
    expect(screen.getByRole('table', { name: '판단 기록' })).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: '재시도' }))
    expect(refetchOverview).toHaveBeenCalledOnce()
    expect(refetchDecisionLogs).not.toHaveBeenCalled()
  })

  it('renders empty state when the list has no records', async () => {
    decisionLogsState = {
      ...decisionLogsState,
      data: { items: [], meta: { page: 1, size: 20, total: 0 } },
    }
    renderRoute()

    expect(await screen.findByText('기록된 판단이 없습니다.')).toBeVisible()
    expect(
      screen.getByRole('heading', { name: '판단 기록 목록' }),
    ).toBeVisible()
    expect(screen.getByLabelText('전체 기록 요약')).toBeVisible()
  })
})

describe('DecisionDetailPage route', () => {
  it('판단→품질→유사 판단→근거→비교→재검토→타임라인→버전 순서로 상세를 렌더한다', async () => {
    renderRoute('/decision-log/42')

    expect(
      await screen.findByRole('heading', { name: '판단 기록 상세' }),
    ).toBeVisible()
    expect(screen.getByRole('heading', { name: 'NVIDIA' })).toBeVisible()
    expect(screen.getAllByText('종목').length).toBeGreaterThan(0)
    expect(screen.getAllByText('관망 유지').length).toBeGreaterThan(0)
    expect(screen.getByText('다음 확인').parentElement).toHaveTextContent(
      '2026. 08. 10. 09:00',
    )

    const sectionHeadings = within(screen.getByRole('main'))
      .getAllByRole('heading', { level: 2 })
      .map((heading) => heading.textContent)
    expect(sectionHeadings).toEqual([
      'NVIDIA',
      '판단 과정 품질',
      '당시 판단',
      '유사 과거 판단',
      '연결된 근거',
      '당시/현재 비교',
      '재검토 조건',
      '변화 타임라인',
      '버전 이력',
    ])
    expect(screen.getByText('데이터센터 수요가 성장을 지지한다.')).toBeVisible()
    expect(screen.getByText('실적 발표까지 관찰한다.')).toBeVisible()
    expect(
      screen.getByRole('link', { name: '복기 작성·보기' }),
    ).toHaveAttribute('href', '/decision-log/42/review')
  })

  it('복기의 process_quality를 공용 라벨과 중립 체크·점수로 표시한다', async () => {
    reviewsState = {
      ...reviewsState,
      data: [
        {
          ...reviewsState.data![0],
          processQuality: {
            evidence_quality: 5,
            counter_argument_review: 4,
            risk_awareness: 3,
            review_condition_clarity: 2,
            discipline: 1,
          },
        },
      ],
    }
    renderRoute('/decision-log/42')

    const qualityHeading = await screen.findByRole('heading', {
      name: '판단 과정 품질',
    })
    const qualitySection = qualityHeading.closest('section')
    expect(qualitySection).not.toBeNull()
    const quality = within(qualitySection!)

    for (const label of [
      '근거 충분성',
      '반대 근거 검토',
      '위험 인식',
      '재검토 명확성',
      '규칙 준수',
    ]) {
      expect(quality.getByText(label)).toBeVisible()
    }
    for (const score of ['5점', '4점', '3점', '2점', '1점']) {
      expect(quality.getByText(score)).toBeVisible()
    }
    expect(quality.getByText('✓ 4–5점 · △ 3점 · ✕ 1–2점')).toBeVisible()
    expect(quality.getByText(/자동 진단이 아닙니다/)).toBeVisible()
    expect(screen.queryByText('evidence_quality')).not.toBeInTheDocument()
  })

  it('복기가 없으면 판단 과정 품질 빈 상태를 표시한다', async () => {
    reviewsState = { ...reviewsState, data: [] }
    renderRoute('/decision-log/42')

    expect(await screen.findByText('복기 후 표시됩니다.')).toBeVisible()
  })

  it('유사 판단을 경량 목록으로 표시하고 항목 클릭 시 상세로 이동한다', async () => {
    renderRoute('/decision-log/42')

    const similarList = await screen.findByRole('list', {
      name: '유사 과거 판단 목록',
    })
    const similarLink = within(similarList).getByRole('link', { name: /AMD/ })
    expect(similarLink).toHaveAttribute('href', '/decision-log/84')
    expect(within(similarLink).getByText('종목')).toBeVisible()
    expect(within(similarLink).getByText('매수 검토')).toBeVisible()
    expect(
      within(similarLink).getByText('실적 성장과 밸류에이션을 함께 검토한다.'),
    ).toBeVisible()
    expect(
      within(similarLink).queryByText('BUY_REVIEW'),
    ).not.toBeInTheDocument()

    fireEvent.click(similarLink)
    await waitFor(() => expect(latestSimilarDecisionId).toBe('84'))
  })

  it('유사 판단의 로딩과 빈 상태를 각각 표시한다', async () => {
    similarDecisionsState = {
      ...similarDecisionsState,
      data: undefined,
      isLoading: true,
    }
    const loadingView = renderRoute('/decision-log/42')

    expect(
      await screen.findByRole('status', {
        name: '유사 과거 판단 불러오는 중',
      }),
    ).toBeVisible()

    loadingView.unmount()
    similarDecisionsState = {
      ...similarDecisionsState,
      data: [],
      isLoading: false,
    }
    renderRoute('/decision-log/42')

    expect(
      await screen.findByText('유사한 과거 판단이 없습니다.'),
    ).toBeVisible()
  })

  it('근거 관계를 나누고 영문 enum을 표시하지 않는다', async () => {
    renderRoute('/decision-log/42')

    for (const label of ['긍정 근거', '반대 근거', '위험', '배경']) {
      expect(await screen.findByRole('heading', { name: label })).toBeVisible()
    }
    expect(screen.getByText('데이터센터 매출 성장')).toBeVisible()
    expect(screen.getByText('대중 수출 규제 강화')).toBeVisible()
    expect(screen.getByText('단기 과매수 구간')).toBeVisible()
    expect(screen.getByText('실적 발표 전 관망 원칙')).toBeVisible()
    expect(screen.queryByText('SUPPORTING')).not.toBeInTheDocument()
    expect(screen.queryByText('CONTRADICTING')).not.toBeInTheDocument()
    expect(screen.queryByText('PENDING')).not.toBeInTheDocument()
  })

  it('스냅샷 원본과 종목 현재가를 비교 표에 함께 렌더한다', async () => {
    renderRoute('/decision-log/42')

    const comparisonTable = await screen.findByRole('table', {
      name: '판단 당시와 현재 데이터 비교',
    })
    expect(within(comparisonTable).getByText('172.4')).toBeVisible()
    expect(within(comparisonTable).getAllByText('181.25 USD')).toHaveLength(2)
    expect(latestPriceQuery).toEqual(['NVDA', 'NASDAQ', '1D'])
    expect(within(comparisonTable).getByText('NASDAQ')).toBeVisible()
    expect(within(comparisonTable).getByText('아니오')).toBeVisible()
    expect(within(comparisonTable).getByText('168')).toBeVisible()
    expect(within(comparisonTable).getByText('값 없음')).toBeVisible()
    expect(screen.queryByText('PRICE')).not.toBeInTheDocument()
    expect(screen.queryByText('VALUATION')).not.toBeInTheDocument()
    expect(screen.queryByText('2차 기능')).not.toBeInTheDocument()
  })

  it('현재값 소스가 비어 있으면 스냅샷 당시 값만 표시한다', async () => {
    priceSeriesState = { data: { closes: [], currency: 'USD' } }
    renderRoute('/decision-log/42')

    const snapshotValue = await screen.findByText('172.4')
    const comparisonRow = snapshotValue.closest('tr')
    expect(comparisonRow).not.toBeNull()
    expect(within(comparisonRow!).getByText('—')).toBeVisible()
  })

  it('라이프사이클·복기·트리거를 시간 오름차순으로 렌더한다', async () => {
    renderRoute('/decision-log/42')

    const timeline = await screen.findByRole('list', {
      name: '판단 변화 타임라인',
    })
    const labels = within(timeline)
      .getAllByRole('listitem')
      .map(
        (item) =>
          within(item).getByText(
            /판단 작성|판단 확정|복기 ·|재검토 조건 발동|판단 복기 완료/,
          ).textContent,
      )

    expect(labels).toEqual([
      '판단 작성',
      '판단 확정',
      '복기 · 가설 확인',
      '재검토 조건 발동 · 날짜',
      '판단 복기 완료',
    ])
    expect(screen.queryByText('THESIS_CONFIRMED')).not.toBeInTheDocument()
    expect(screen.queryByText('CONFIRMED')).not.toBeInTheDocument()
    expect(screen.queryByText('TRIGGERED')).not.toBeInTheDocument()
  })

  it('대체 판단이 있으면 버전 이력 링크를 제공한다', async () => {
    renderRoute('/decision-log/42')

    expect(
      await screen.findByRole('link', {
        name: '이 판단을 대체한 판단 보기',
      }),
    ).toHaveAttribute('href', '/decision-log/84')
  })

  it('대체 판단이 없으면 버전 이력 링크를 노출하지 않는다', async () => {
    decisionLogState = {
      ...decisionLogState,
      data: { ...detail, supersededById: null },
    }
    renderRoute('/decision-log/42')

    expect(
      await screen.findByText('이 판단을 대체한 후속 판단이 없습니다.'),
    ).toBeVisible()
    expect(
      screen.queryByRole('link', { name: '이 판단을 대체한 판단 보기' }),
    ).not.toBeInTheDocument()
  })

  it('상세 로딩 상태를 알린다', async () => {
    decisionLogState = {
      ...decisionLogState,
      data: undefined,
      isLoading: true,
    }
    renderRoute('/decision-log/42')

    expect(
      await screen.findByRole('status', {
        name: '판단 기록 상세 불러오는 중',
      }),
    ).toBeVisible()
  })

  it.each([
    ['DECISION_LOG_NOT_FOUND', '판단 기록을 찾을 수 없습니다'],
    ['DECISION_LOG_FORBIDDEN', '이 판단 기록에 접근할 수 없습니다'],
  ])('%s 오류에서 목록 복귀 안내를 렌더한다', async (code, title) => {
    decisionLogState = {
      ...decisionLogState,
      data: undefined,
      error: new ApiError(code, title),
      isError: true,
    }
    renderRoute('/decision-log/inaccessible')

    expect(await screen.findByRole('heading', { name: title })).toBeVisible()
    expect(
      screen.getByRole('link', { name: '판단 기록 목록으로' }),
    ).toHaveAttribute('href', '/decision-log')
    expect(
      screen.queryByRole('button', { name: '재시도' }),
    ).not.toBeInTheDocument()
  })

  it('renders the detail error state and retries', async () => {
    decisionLogState = {
      ...decisionLogState,
      data: undefined,
      error: new Error('not found'),
      isError: true,
    }
    renderRoute('/decision-log/missing')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '판단 기록 상세를 불러오지 못했습니다',
    )
    fireEvent.click(screen.getByRole('button', { name: '재시도' }))
    expect(refetchDecisionLog).toHaveBeenCalledOnce()
  })
})
