import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import {
  useNewsEventsQuery,
  useNewsInvestorFlowsQuery,
  useNewsOverviewQuery,
  type NewsEventView,
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

function mockQueries({
  overviewError = false,
  eventsError = false,
  flowsError = false,
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
}

describe('NewsInsightsOverviewPage', () => {
  beforeEach(() => {
    mockQueries()
  })

  it('composes API-backed overview widgets and planned phase panels', () => {
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
    ;['예상 자금 흐름', '이벤트 타임라인', '에이전트 파이프라인'].forEach(
      (title) => {
        expect(screen.getByLabelText(`${title} 준비 중`)).toBeVisible()
      },
    )
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
    expect(screen.getByLabelText('예상 자금 흐름 준비 중')).toBeVisible()
  })
})
