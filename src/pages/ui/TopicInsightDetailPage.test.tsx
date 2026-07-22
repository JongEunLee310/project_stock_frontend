import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import {
  type NewsTopicDetailView,
  type NewsTopicEvidenceView,
  type NewsTopicGraphView,
  type NewsTopicSymbolSensitivityView,
  type NewsTopicTrendView,
  useNewsTopicDetailQuery,
  useNewsTopicEvidenceQuery,
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
    useNewsTopicEvidenceQuery: vi.fn(),
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
  affectedSymbols: [],
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

function mockQueries({
  detailError = false,
  trendError = false,
  evidenceError = false,
  graphError = false,
  symbolsError = false,
} = {}) {
  vi.mocked(useNewsTopicDetailQuery).mockReturnValue({
    data: detailError ? undefined : detail,
    isLoading: false,
    isError: detailError,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useNewsTopicDetailQuery>)
  vi.mocked(useNewsTopicTrendQuery).mockReturnValue({
    data: trendError ? undefined : trend,
    isLoading: false,
    isError: trendError,
    refetch: vi.fn(),
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
  } as unknown as ReturnType<typeof useNewsTopicEvidenceQuery>)
  vi.mocked(useNewsTopicGraphQuery).mockReturnValue({
    data: graphError ? undefined : topicGraph,
    isLoading: false,
    isError: graphError,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useNewsTopicGraphQuery>)
  vi.mocked(useNewsTopicSymbolsQuery).mockReturnValue({
    data: symbolsError ? undefined : topicSymbols,
    isLoading: false,
    isError: symbolsError,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useNewsTopicSymbolsQuery>)
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

  it('composes live panels and planned phase panels from the route topic id', async () => {
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
    expect(screen.getByText('NVDA')).toBeVisible()
    ;[
      ['투자자 반응', '2차 · #264'],
      ['예상 자금 흐름 시나리오', '3차 · #267'],
      ['왜 이런 인사이트', '3차 · #268'],
      ['액션 체크리스트', '3차 · #268'],
    ].forEach(([title, phaseIssue]) => {
      expect(screen.getByLabelText(`${title} 준비 중`)).toBeVisible()
      expect(screen.getAllByText(phaseIssue).length).toBeGreaterThan(0)
    })
    expect(useNewsTopicDetailQuery).toHaveBeenCalledWith('7')
    expect(useNewsTopicTrendQuery).toHaveBeenCalledWith('7')
    expect(useNewsTopicEvidenceQuery).toHaveBeenCalledWith('7')
    expect(useNewsTopicGraphQuery).toHaveBeenCalledWith('7')
    expect(useNewsTopicSymbolsQuery).toHaveBeenCalledWith('7')
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
    expect(screen.getByText('NVDA')).toBeVisible()
    expect(screen.getByLabelText('투자자 반응 준비 중')).toBeVisible()
    unmount()

    mockQueries({ symbolsError: true })
    renderPage()
    await screen.findByTestId('topic-keyword-cytoscape')
    expect(screen.getByText('종목 민감도를 불러오지 못했습니다')).toBeVisible()
    expect(screen.getByRole('heading', { name: '키워드 관계망' })).toBeVisible()
    expect(screen.getByLabelText('투자자 반응 준비 중')).toBeVisible()
  })
})
