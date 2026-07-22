import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import {
  useNewsAgentRunsQuery,
  useNewsCalendarQuery,
  useNewsEventsQuery,
  useNewsFundFlowOutlookQuery,
  useNewsInvestorFlowsQuery,
  useNewsOverviewQuery,
  type NewsAgentRunsView,
  type NewsCalendarItemView,
  type NewsEventView,
  type NewsFundFlowOutlookView,
  type NewsInvestorFlowsView,
  type NewsOverviewView,
} from '@/features/news-insights'

import { NewsInsightsOverviewPage } from './NewsInsightsOverviewPage'

function renderPage() {
  return render(
    <MemoryRouter>
      <NewsInsightsOverviewPage />
    </MemoryRouter>,
  )
}

function openBriefing() {
  fireEvent.click(screen.getByRole('button', { name: '에이전트 브리핑 열기' }))
}

vi.mock('@/features/news-insights', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/news-insights')>()
  return {
    ...actual,
    useNewsEventsQuery: vi.fn(),
    useNewsAgentRunsQuery: vi.fn(),
    useNewsCalendarQuery: vi.fn(),
    useNewsFundFlowOutlookQuery: vi.fn(),
    useNewsInvestorFlowsQuery: vi.fn(),
    useNewsOverviewQuery: vi.fn(),
  }
})

vi.mock('@/widgets/TopicMap', () => ({
  TopicMap: () => <section aria-label="토픽 맵 시각화">토픽 맵</section>,
}))

const overview: NewsOverviewView = {
  asOf: '2026. 7. 21. 오후 3:00',
  metrics: [
    {
      id: 'high-importance-events',
      label: '고중요 이벤트',
      count: 2,
      change: 1,
      tone: 'danger',
    },
  ],
  briefing: {
    summary: '시장 브리핑입니다.',
    generatedAt: '2026. 7. 21. 오후 2:50',
    highlights: [
      {
        id: '3-0',
        text: '근거가 연결된 하이라이트입니다.',
        topicId: 3,
        evidenceCount: 2,
        evidenceEventIds: [1, 2],
      },
    ],
  },
}

const event: NewsEventView = {
  id: '1',
  eventTypeLabel: '공급 계약',
  documentTypeLabel: '공시',
  documentTypeTone: 'info',
  symbol: '005930',
  title: 'API 이벤트 제목',
  summary: 'API 이벤트 요약',
  importance: { label: '높음', tone: 'danger', scorePercent: 90 },
  sentiment: { label: '긍정', tone: 'success', scorePercent: 80 },
  sourceName: 'DART',
  sourceReliabilityPercent: 98,
  publishedAt: '2026. 7. 21. 오후 2:40',
  publishedAtTime: '14:40',
  evidenceCount: 2,
  topicIds: [3],
}

const investorFlows: NewsInvestorFlowsView = {
  asOf: '2026. 7. 21. 오후 3:00',
  byInvestorType: [
    {
      investorType: 'FOREIGN',
      investor: { label: '외국인', tone: 'info' },
      netValue: '1200000000',
      direction: 'BUY',
      directionPresentation: { label: '순매수', tone: 'success' },
      change: 0.1,
    },
  ],
  narrativeAlignment: { aligned: true, note: '수급과 일치합니다.' },
  availability: { available: true, fallback: null },
}

const fundFlowOutlook: NewsFundFlowOutlookView = {
  asOf: '2026. 7. 21. 오후 3:00',
  analysisVersion: 'v3.1',
  items: [
    {
      sector: '반도체',
      direction: { label: '유입 방향', tone: 'success' },
      likelihood: { label: '높음', tone: 'success' },
      estimatedRange: '1,000억~1,500억원',
      horizon: '1개월',
      confidencePercent: 82,
      keyAssumptions: ['AI 수요 유지'],
      riskFactors: ['공급 차질'],
    },
  ],
}

const calendar: NewsCalendarItemView[] = [
  {
    scheduledAt: '2026-08-01T00:00:00Z',
    scheduledAtLabel: '2026. 8. 1. 오전 9:00',
    eventKind: 'EARNINGS',
    eventKindPresentation: { label: '실적 발표', tone: 'accent' },
    title: '예정 실적 발표',
    symbol: '005930',
    market: 'KR',
    importancePercent: 85,
    importancePresentation: { label: '중요도 높음', tone: 'danger' },
    relatedTopicIds: ['3'],
  },
]

const agentRuns: NewsAgentRunsView = {
  lastProcessedAt: '2026. 7. 21. 오후 3:00',
  processedDocuments: 1200,
  extractedEvents: 48,
  activeTopics: 12,
  stages: [
    {
      name: 'COLLECT',
      namePresentation: { label: '수집', tone: 'info' },
      status: 'COMPLETED',
      statusPresentation: { label: '완료', tone: 'success' },
      delayed: false,
    },
  ],
  analysisVersion: 'v3.2',
  hasDelay: false,
}

function mockQueries({
  overviewError = false,
  eventsError = false,
  flowsError = false,
  outlookError = false,
  calendarError = false,
  agentRunsError = false,
  loading = false,
} = {}) {
  vi.mocked(useNewsOverviewQuery).mockReturnValue({
    data: overviewError || loading ? undefined : overview,
    isLoading: loading,
    isError: overviewError,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useNewsOverviewQuery>)
  vi.mocked(useNewsEventsQuery).mockReturnValue({
    data: eventsError || loading ? undefined : [{ items: [event] }],
    isLoading: loading,
    isError: eventsError,
    isFetchingNextPage: false,
    isFetchNextPageError: false,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useNewsEventsQuery>)
  vi.mocked(useNewsInvestorFlowsQuery).mockReturnValue({
    data: flowsError || loading ? undefined : investorFlows,
    isLoading: loading,
    isError: flowsError,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useNewsInvestorFlowsQuery>)
  vi.mocked(useNewsFundFlowOutlookQuery).mockReturnValue({
    data: outlookError || loading ? undefined : fundFlowOutlook,
    isLoading: loading,
    isError: outlookError,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useNewsFundFlowOutlookQuery>)
  vi.mocked(useNewsCalendarQuery).mockReturnValue({
    data: calendarError || loading ? undefined : calendar,
    isLoading: loading,
    isError: calendarError,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useNewsCalendarQuery>)
  vi.mocked(useNewsAgentRunsQuery).mockReturnValue({
    data: agentRunsError || loading ? undefined : agentRuns,
    isLoading: loading,
    isError: agentRunsError,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useNewsAgentRunsQuery>)
}

describe('NewsInsightsOverviewPage', () => {
  beforeEach(() => {
    mockQueries()
  })

  it('composes API-backed overview widgets and removes the exhausted roadmap section', () => {
    renderPage()

    expect(
      screen.getByRole('heading', { name: '뉴스·공시 인사이트' }),
    ).toBeVisible()
    expect(
      within(screen.getByLabelText('고중요 이벤트 요약')).getByText('2건'),
    ).toBeVisible()
    expect(screen.getByText('API 이벤트 제목')).toBeVisible()
    expect(screen.getByLabelText('토픽 맵 시각화')).toBeVisible()
    openBriefing()
    expect(screen.getByText('시장 브리핑입니다.')).toBeVisible()
    expect(screen.getByRole('heading', { name: '투자자 동향' })).toBeVisible()
    expect(screen.getByText('외국인')).toBeVisible()
    expect(
      screen.queryByLabelText('투자자 동향 준비 중'),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: '예상 자금 흐름' }),
    ).toBeVisible()
    expect(screen.getByText('흐름 가능성: 높음')).toBeVisible()
    expect(
      screen.queryByLabelText('예상 자금 흐름 준비 중'),
    ).not.toBeInTheDocument()
    expect(screen.getByText('예정 실적 발표')).toBeVisible()
    expect(screen.getByText('1,200건')).toBeVisible()
    expect(screen.getByText('분석 버전 v3.2')).toBeVisible()
    expect(
      screen.queryByRole('heading', { name: '단계별 확장 패널' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByLabelText('이벤트 타임라인 준비 중'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByLabelText('에이전트 파이프라인 준비 중'),
    ).not.toBeInTheDocument()
    expect(screen.queryByLabelText('토픽 맵 준비 중')).not.toBeInTheDocument()
  })

  it('keeps the event panel visible when the overview request fails', () => {
    mockQueries({ overviewError: true })
    renderPage()

    expect(screen.getByText('API 이벤트 제목')).toBeVisible()
    expect(
      screen.getByText('오늘의 인사이트를 불러오지 못했습니다'),
    ).toBeVisible()
    openBriefing()
    expect(
      screen.getByText('에이전트 브리핑을 불러오지 못했습니다'),
    ).toBeVisible()
  })

  it('keeps overview panels visible when the events request fails', () => {
    mockQueries({ eventsError: true })
    renderPage()

    expect(
      within(screen.getByLabelText('고중요 이벤트 요약')).getByText('2건'),
    ).toBeVisible()
    expect(screen.getByText('이벤트 피드를 불러오지 못했습니다')).toBeVisible()
    openBriefing()
    expect(screen.getByText('시장 브리핑입니다.')).toBeVisible()
  })

  it('keeps the page visible when investor flows fail', () => {
    mockQueries({ flowsError: true })
    renderPage()

    expect(screen.getByText('API 이벤트 제목')).toBeVisible()
    expect(screen.getByText('투자자 동향을 불러오지 못했습니다')).toBeVisible()
    expect(screen.getByText('흐름 가능성: 높음')).toBeVisible()
  })

  it('isolates fund-flow outlook failures from the other overview panels', () => {
    mockQueries({ outlookError: true })
    renderPage()

    expect(
      screen.getByText('예상 자금 흐름을 불러오지 못했습니다'),
    ).toBeVisible()
    expect(screen.getByText('API 이벤트 제목')).toBeVisible()
    expect(screen.getByRole('heading', { name: '투자자 동향' })).toBeVisible()
    expect(screen.getByText('예정 실적 발표')).toBeVisible()
  })

  it('isolates calendar and agent-run failures from each other and the page', () => {
    mockQueries({ calendarError: true })
    const { unmount } = renderPage()

    expect(
      screen.getByText('이벤트 타임라인을 불러오지 못했습니다'),
    ).toBeVisible()
    expect(screen.getByText('1,200건')).toBeVisible()
    expect(screen.getByText('API 이벤트 제목')).toBeVisible()
    unmount()

    mockQueries({ agentRunsError: true })
    renderPage()
    expect(
      screen.getByText('에이전트 파이프라인을 불러오지 못했습니다'),
    ).toBeVisible()
    expect(screen.getByText('예정 실적 발표')).toBeVisible()
    expect(screen.getByText('API 이벤트 제목')).toBeVisible()
  })
})
