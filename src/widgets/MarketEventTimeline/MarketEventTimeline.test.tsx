import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'

import {
  type NewsCalendarItemView,
  useNewsCalendarQuery,
} from '@/features/news-insights'

import { MarketEventTimeline } from './MarketEventTimeline'

vi.mock('@/features/news-insights', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/news-insights')>()
  return { ...actual, useNewsCalendarQuery: vi.fn() }
})

const events: NewsCalendarItemView[] = [
  {
    scheduledAt: '2026-07-24T00:00:00Z',
    scheduledAtLabel: '2026. 7. 24. 오전 9:00',
    eventKind: 'POLICY',
    eventKindPresentation: { label: '정책 발표', tone: 'warning' },
    title: '두 번째 정책 일정',
    symbol: null,
    market: 'KR',
    importancePercent: 70,
    importancePresentation: { label: '중요도 높음', tone: 'danger' },
    relatedTopicIds: [],
  },
  {
    scheduledAt: '2026-07-22T12:00:00Z',
    scheduledAtLabel: '2026. 7. 22. 오후 9:00',
    eventKind: 'EARNINGS',
    eventKindPresentation: { label: '실적 발표', tone: 'accent' },
    title: '첫 번째 실적 일정',
    symbol: '005930',
    market: 'KR',
    importancePercent: 86,
    importancePresentation: { label: '중요도 높음', tone: 'danger' },
    relatedTopicIds: ['7'],
  },
  {
    scheduledAt: '2026-07-21T00:00:00Z',
    scheduledAtLabel: '2026. 7. 21. 오전 9:00',
    eventKind: 'OTHER',
    eventKindPresentation: { label: '기타 일정', tone: 'neutral' },
    title: '지난 일정',
    symbol: null,
    market: null,
    importancePercent: 10,
    importancePresentation: { label: '중요도 낮음', tone: 'success' },
    relatedTopicIds: [],
  },
]

function LocationProbe() {
  const location = useLocation()
  return <output aria-label="현재 경로">{location.pathname}</output>
}

function renderTimeline() {
  return render(
    <MemoryRouter>
      <MarketEventTimeline market="KR" window="30d" />
      <LocationProbe />
    </MemoryRouter>,
  )
}

function mockQuery(
  state: Partial<ReturnType<typeof useNewsCalendarQuery>> = {},
) {
  vi.mocked(useNewsCalendarQuery).mockReturnValue({
    data: events,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...state,
  } as unknown as ReturnType<typeof useNewsCalendarQuery>)
}

describe('MarketEventTimeline', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-22T00:00:00Z'))
    mockQuery()
  })

  afterEach(() => vi.useRealTimers())

  it('shows future events in time order with kind, D-N, importance, symbol, and topic navigation', () => {
    renderTimeline()

    const items = screen.getAllByRole('listitem')
    expect(within(items[0]).getByText('첫 번째 실적 일정')).toBeVisible()
    expect(within(items[0]).getByText('실적 발표')).toBeVisible()
    expect(within(items[0]).getByText('D-1')).toBeVisible()
    expect(within(items[0]).getByText('중요도 높음 · 86%')).toBeVisible()
    expect(within(items[0]).getByText(/005930/)).toBeVisible()
    expect(within(items[1]).getByText('두 번째 정책 일정')).toBeVisible()
    expect(screen.queryByText('지난 일정')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('link', { name: '토픽 7' }))
    expect(screen.getByLabelText('현재 경로')).toHaveTextContent(
      '/news/topics/7',
    )
  })

  it('shows independent loading, error, and empty states', () => {
    mockQuery({ data: undefined, isLoading: true })
    const { rerender } = renderTimeline()
    expect(screen.getByLabelText('이벤트 타임라인 불러오는 중')).toBeVisible()

    mockQuery({ data: undefined, isLoading: false, isError: true })
    rerender(
      <MemoryRouter>
        <MarketEventTimeline market="KR" window="30d" />
      </MemoryRouter>,
    )
    expect(
      screen.getByText('이벤트 타임라인을 불러오지 못했습니다'),
    ).toBeVisible()

    mockQuery({ data: [] })
    rerender(
      <MemoryRouter>
        <MarketEventTimeline market="KR" window="30d" />
      </MemoryRouter>,
    )
    expect(screen.getByText('예정된 이벤트가 없습니다')).toBeVisible()
  })
})
