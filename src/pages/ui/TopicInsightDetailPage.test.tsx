import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import {
  type NewsTopicDetailView,
  type NewsInvestorFlowsView,
  type NewsTopicScenariosView,
  type NewsTopicEvidenceView,
  type NewsTopicExplanationView,
  type NewsTopicGraphView,
  type NewsTopicSymbolSensitivityView,
  type NewsTopicTrendView,
  useNewsTopicDetailQuery,
  useNewsInvestorFlowsQuery,
  useNewsTopicScenariosQuery,
  useNewsTopicEvidenceQuery,
  useNewsTopicExplanationQuery,
  useNewsTopicGraphQuery,
  useNewsTopicSymbolsQuery,
  useNewsTopicTrendQuery,
} from '@/features/news-insights'

import { TopicInsightDetailPage } from './TopicInsightDetailPage'

vi.mock('@/features/news-insights', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/news-insights')>()
  return {
    ...actual,
    useNewsTopicDetailQuery: vi.fn(),
    useNewsInvestorFlowsQuery: vi.fn(),
    useNewsTopicScenariosQuery: vi.fn(),
    useNewsTopicEvidenceQuery: vi.fn(),
    useNewsTopicExplanationQuery: vi.fn(),
    useNewsTopicGraphQuery: vi.fn(),
    useNewsTopicSymbolsQuery: vi.fn(),
    useNewsTopicTrendQuery: vi.fn(),
  }
})

vi.mock('react-cytoscapejs', () => ({
  default: () => <div data-testid="topic-keyword-cytoscape" />,
}))

const detail: NewsTopicDetailView = {
  title: '페이지 토픽 제목',
  tags: ['AI'],
  lifecycle: { label: '활성', tone: 'success' },
  scores: [
    { id: 'impact', label: '종합 영향도', valuePercent: 90, tone: 'danger' },
  ],
  affectedSymbols: [
    {
      symbol: '005930',
      exposurePercent: 82,
      direction: { label: '긍정', tone: 'success' },
      relationship: { label: '직접 영향', tone: 'info' },
    },
  ],
  insight: {
    summary: '페이지 요약',
    whyItMatters: '페이지 중요성',
    keyEvidence: [],
    riskPoints: [],
    counterArguments: ['수요 회복이 지연될 수 있습니다.'],
  },
  version: 1,
  updatedAt: '2026. 7. 21. 오후 3:00',
}

const trend: NewsTopicTrendView = {
  points: [
    {
      timestamp: '2026-07-21T00:00:00Z',
      timestampLabel: '2026. 7. 21. 오전 9:00',
      mentionCount: 12,
      sentimentScore: 0.7,
      impactScore: 0.9,
    },
  ],
  markers: [],
  sourceDistribution: [],
}

const evidence: NewsTopicEvidenceView = {
  id: '10-20',
  eventId: '10',
  documentId: '20',
  evidenceRole: { label: '핵심 근거', tone: 'info' },
  documentType: { label: '뉴스', tone: 'info' },
  symbol: '005930',
  title: '페이지 근거 제목',
  summary: '페이지 근거 요약',
  direction: { label: '긍정', tone: 'success' },
  relevancePercent: 90,
  source: 'Reuters',
  publishedAt: '2026. 7. 21. 오전 9:00',
}

const topicExplanation: NewsTopicExplanationView = {
  factors: [{ label: '수요 증가', contributionRatio: 0.6 }],
  meta: {
    analysisVersion: 'v3.2',
    dataCoveragePercent: 90,
    lastUpdated: '2026. 7. 21. 오후 3:00',
    missingData: [],
    counterArgumentCount: 1,
    confidencePercent: 84,
    limitations: [],
  },
  counterView: {
    counterArguments: ['밸류에이션 부담이 높습니다.'],
    invalidationConditions: ['주문 감소'],
    alreadyPricedIn: { likely: false, note: '선반영은 제한적입니다.' },
    contradictingEvidence: [],
  },
}

const topicGraph: NewsTopicGraphView = {
  nodes: [
    {
      id: 'keyword:ai',
      label: 'AI 반도체',
      type: 'KEYWORD',
      mentionCount: 17,
      sentimentScore: 0.78,
      sentiment: { label: '긍정', tone: 'success' },
      relatedEventIds: ['101'],
      relatedSymbols: ['NVDA'],
    },
  ],
  edges: [],
}

const topicSymbols: NewsTopicSymbolSensitivityView[] = [
  {
    symbol: 'NVDA',
    exposurePercent: 82,
    impactDirection: { label: '긍정', tone: 'success' },
    relationship: { label: '직접 영향', tone: 'info' },
    valuationBurden: null,
    portfolioWeightPercent: null,
    currentSignal: null,
  },
]

const investorFlows: NewsInvestorFlowsView = {
  asOf: '2026. 7. 21. 오후 3:00',
  byInvestorType: [
    {
      investorType: 'ETF',
      investor: { label: 'ETF', tone: 'neutral' },
      netValue: '350000000',
      direction: 'BUY',
      directionPresentation: { label: '순매수', tone: 'success' },
      change: 0.08,
    },
  ],
  narrativeAlignment: { aligned: false, note: '뉴스와 수급이 다릅니다.' },
  availability: { available: true, fallback: null },
}

const topicScenarios: NewsTopicScenariosView = {
  topicId: '7',
  analysisVersion: 'v3.1',
  asOf: '2026. 7. 21. 오후 3:00',
  scenarios: [
    {
      kind: 'OPTIMISTIC',
      kindPresentation: { label: '낙관', tone: 'success' },
      weightPercent: 30,
      direction: { label: '유입 방향', tone: 'success' },
      keyAssumptions: ['낙관 가정'],
      benefitingSectors: ['반도체'],
      riskSectors: ['유통'],
      relatedSymbols: ['NVDA'],
      invalidationConditions: ['낙관 무효화 조건'],
    },
    {
      kind: 'BASE',
      kindPresentation: { label: '기준', tone: 'info' },
      weightPercent: 50,
      direction: { label: '중립 방향', tone: 'neutral' },
      keyAssumptions: ['기준 가정'],
      benefitingSectors: ['반도체'],
      riskSectors: ['유통'],
      relatedSymbols: ['NVDA'],
      invalidationConditions: ['기준 무효화 조건'],
    },
    {
      kind: 'CONSERVATIVE',
      kindPresentation: { label: '보수', tone: 'warning' },
      weightPercent: 20,
      direction: { label: '유출 방향', tone: 'danger' },
      keyAssumptions: ['보수 가정'],
      benefitingSectors: ['현금성 자산'],
      riskSectors: ['반도체'],
      relatedSymbols: ['NVDA'],
      invalidationConditions: ['보수 무효화 조건'],
    },
  ],
}

function mockQueries({
  detailError = false,
  trendError = false,
  evidenceError = false,
  graphError = false,
  symbolsError = false,
  flowsError = false,
  scenariosError = false,
  explanationError = false,
} = {}) {
  const dataUpdatedAt = Date.now() - 5 * 60 * 1000

  vi.mocked(useNewsTopicDetailQuery).mockReturnValue({
    data: detailError ? undefined : detail,
    isLoading: false,
    isError: detailError,
    refetch: vi.fn(),
    dataUpdatedAt,
  } as unknown as ReturnType<typeof useNewsTopicDetailQuery>)
  vi.mocked(useNewsTopicTrendQuery).mockReturnValue({
    data: trendError ? undefined : trend,
    isLoading: false,
    isError: trendError,
    refetch: vi.fn(),
    dataUpdatedAt,
  } as unknown as ReturnType<typeof useNewsTopicTrendQuery>)
  vi.mocked(useNewsTopicEvidenceQuery).mockReturnValue({
    data: evidenceError ? undefined : [{ items: [evidence] }],
    isLoading: false,
    isError: evidenceError,
    isFetchingNextPage: false,
    isFetchNextPageError: false,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
    refetch: vi.fn(),
    dataUpdatedAt,
  } as unknown as ReturnType<typeof useNewsTopicEvidenceQuery>)
  vi.mocked(useNewsTopicExplanationQuery).mockReturnValue({
    data: explanationError ? undefined : topicExplanation,
    isLoading: false,
    isError: explanationError,
    refetch: vi.fn(),
    dataUpdatedAt,
  } as unknown as ReturnType<typeof useNewsTopicExplanationQuery>)
  vi.mocked(useNewsTopicGraphQuery).mockReturnValue({
    data: graphError ? undefined : topicGraph,
    isLoading: false,
    isError: graphError,
    refetch: vi.fn(),
    dataUpdatedAt,
  } as unknown as ReturnType<typeof useNewsTopicGraphQuery>)
  vi.mocked(useNewsTopicSymbolsQuery).mockReturnValue({
    data: symbolsError ? undefined : topicSymbols,
    isLoading: false,
    isError: symbolsError,
    refetch: vi.fn(),
    dataUpdatedAt,
  } as unknown as ReturnType<typeof useNewsTopicSymbolsQuery>)
  vi.mocked(useNewsInvestorFlowsQuery).mockReturnValue({
    data: flowsError ? undefined : investorFlows,
    isLoading: false,
    isError: flowsError,
    refetch: vi.fn(),
    dataUpdatedAt,
  } as unknown as ReturnType<typeof useNewsInvestorFlowsQuery>)
  vi.mocked(useNewsTopicScenariosQuery).mockReturnValue({
    data: scenariosError ? undefined : topicScenarios,
    isLoading: false,
    isError: scenariosError,
    refetch: vi.fn(),
    dataUpdatedAt,
  } as unknown as ReturnType<typeof useNewsTopicScenariosQuery>)
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/news/topics/7']}>
      <Routes>
        <Route
          path="/news/topics/:topicId"
          element={<TopicInsightDetailPage />}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('TopicInsightDetailPage', () => {
  beforeEach(() => mockQueries())

  it('composes live panels and topic actions from the route topic id', async () => {
    renderPage()
    await screen.findByTestId('topic-keyword-cytoscape')

    expect(
      screen.getByRole('heading', { name: '페이지 토픽 제목' }),
    ).toBeVisible()
    expect(screen.getByText(/언급 12건, 감성 70%/)).toBeInTheDocument()
    expect(screen.getByText('페이지 근거 제목')).toBeVisible()
    expect(screen.getByText('페이지 중요성')).toBeVisible()
    expect(screen.getByText('수요 회복이 지연될 수 있습니다.')).toBeVisible()
    expect(screen.getByRole('heading', { name: '키워드 관계망' })).toBeVisible()
    expect(screen.getByRole('heading', { name: '종목 민감도' })).toBeVisible()
    expect(screen.getAllByText('NVDA').length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: '투자자 반응' })).toBeVisible()
    expect(screen.getByText('ETF')).toBeVisible()
    expect(screen.getByText('불일치 신호')).toBeVisible()
    expect(
      screen.queryByLabelText('투자자 반응 준비 중'),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: '예상 자금 흐름 시나리오' }),
    ).toBeVisible()
    expect(screen.getByText('현재 근거 기준 가중치 50%')).toBeVisible()
    expect(
      screen.queryByLabelText('예상 자금 흐름 시나리오 준비 중'),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: '왜 이런 인사이트가 나왔나' }),
    ).toBeVisible()
    expect(screen.getByText('수요 증가')).toBeVisible()
    expect(screen.queryByLabelText('왜 이런 인사이트 준비 중')).toBeNull()
    expect(
      screen.getByRole('heading', { name: '액션 체크리스트' }),
    ).toBeVisible()
    expect(screen.queryByLabelText('액션 체크리스트 준비 중')).toBeNull()
    expect(
      screen.getByText('토픽 7의 근거 확인 후 실행할 다음 행동을 점검합니다.'),
    ).toBeVisible()
    expect(
      screen.getByText('첫 영향 종목 005930의 리서치를 확인합니다.'),
    ).toBeVisible()
    expect(screen.getByRole('button', { name: '리서치 보기' })).toBeEnabled()
    expect(useNewsTopicDetailQuery).toHaveBeenCalledWith('7')
    expect(useNewsTopicTrendQuery).toHaveBeenCalledWith('7')
    expect(useNewsTopicEvidenceQuery).toHaveBeenCalledWith('7')
    expect(useNewsTopicExplanationQuery).toHaveBeenCalledWith('7')
    expect(useNewsTopicGraphQuery).toHaveBeenCalledWith('7')
    expect(useNewsTopicSymbolsQuery).toHaveBeenCalledWith('7')
    expect(useNewsInvestorFlowsQuery).toHaveBeenCalledWith({
      market: 'KR',
      window: '7d',
      topicId: '7',
    })
    expect(useNewsTopicScenariosQuery).toHaveBeenCalledWith('7')
    expect(
      screen.getAllByLabelText('데이터 갱신 5분 전').length,
    ).toBeGreaterThanOrEqual(10)
  })

  it('keeps trend and evidence visible when the detail panel fails', async () => {
    mockQueries({ detailError: true })
    renderPage()
    await screen.findByTestId('topic-keyword-cytoscape')

    expect(screen.getByText('토픽 요약을 불러오지 못했습니다')).toBeVisible()
    expect(
      screen.getByText('인사이트 요약을 불러오지 못했습니다'),
    ).toBeVisible()
    expect(screen.getByText('반대 관점을 불러오지 못했습니다')).toBeVisible()
    expect(screen.getByText(/언급 12건, 감성 70%/)).toBeInTheDocument()
    expect(screen.getByText('페이지 근거 제목')).toBeVisible()
    expect(
      screen.getByRole('heading', { name: '액션 체크리스트' }),
    ).toBeVisible()
    expect(screen.getByRole('button', { name: '리서치 보기' })).toBeDisabled()
    expect(
      screen.getByRole('button', { name: '포트폴리오 보기' }),
    ).toBeEnabled()
  })

  it('keeps the other panels visible when trend or evidence fails', async () => {
    mockQueries({ trendError: true })
    const { unmount } = renderPage()
    await screen.findByTestId('topic-keyword-cytoscape')
    expect(screen.getByText('페이지 토픽 제목')).toBeVisible()
    expect(screen.getByText('토픽 추이를 불러오지 못했습니다')).toBeVisible()
    expect(screen.getByText('페이지 근거 제목')).toBeVisible()
    unmount()

    mockQueries({ evidenceError: true })
    renderPage()
    await screen.findByTestId('topic-keyword-cytoscape')
    expect(screen.getByText('페이지 토픽 제목')).toBeVisible()
    expect(screen.getByText(/언급 12건, 감성 70%/)).toBeInTheDocument()
    expect(screen.getByText('관련 근거를 불러오지 못했습니다')).toBeVisible()
  })

  it('isolates keyword graph and symbol sensitivity failures', async () => {
    mockQueries({ graphError: true })
    const { unmount } = renderPage()

    expect(
      screen.getByText('키워드 관계망을 불러오지 못했습니다'),
    ).toBeVisible()
    expect(screen.getAllByText('NVDA').length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: '투자자 반응' })).toBeVisible()
    unmount()

    mockQueries({ symbolsError: true })
    renderPage()
    await screen.findByTestId('topic-keyword-cytoscape')
    expect(screen.getByText('종목 민감도를 불러오지 못했습니다')).toBeVisible()
    expect(screen.getByRole('heading', { name: '키워드 관계망' })).toBeVisible()
    expect(screen.getByRole('heading', { name: '투자자 반응' })).toBeVisible()
  })

  it('isolates investor flow failures from the other topic panels', async () => {
    mockQueries({ flowsError: true })
    renderPage()
    await screen.findByTestId('topic-keyword-cytoscape')

    expect(screen.getByText('투자자 반응을 불러오지 못했습니다')).toBeVisible()
    expect(screen.getByText('페이지 토픽 제목')).toBeVisible()
    expect(screen.getAllByText('NVDA').length).toBeGreaterThan(0)
    expect(screen.getByText('현재 근거 기준 가중치 50%')).toBeVisible()
  })

  it('isolates unanalysed topic scenario errors from the other panels', async () => {
    mockQueries({ scenariosError: true })
    renderPage()
    await screen.findByTestId('topic-keyword-cytoscape')

    expect(
      screen.getByText('예상 자금 흐름 시나리오를 불러오지 못했습니다'),
    ).toBeVisible()
    expect(screen.getByText(/아직 분석되지 않은 토픽/)).toBeVisible()
    expect(screen.getByText('페이지 토픽 제목')).toBeVisible()
    expect(screen.getByText('NVDA')).toBeVisible()
    expect(
      screen.getByRole('heading', { name: '왜 이런 인사이트가 나왔나' }),
    ).toBeVisible()
  })

  it('isolates explanation errors and keeps the base counter view visible', async () => {
    mockQueries({ explanationError: true })
    renderPage()
    await screen.findByTestId('topic-keyword-cytoscape')

    expect(
      screen.getByText('인사이트 설명을 불러오지 못했습니다'),
    ).toBeVisible()
    expect(screen.getByText('확장 근거를 불러오지 못했습니다')).toBeVisible()
    expect(screen.getByText('수요 회복이 지연될 수 있습니다.')).toBeVisible()
    expect(screen.getByText('페이지 토픽 제목')).toBeVisible()
    expect(
      screen.getByRole('heading', { name: '액션 체크리스트' }),
    ).toBeVisible()
  })
})
