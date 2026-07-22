import { fireEvent, render, screen, within } from '@testing-library/react'

import type { NewsEventView } from '@/features/news-insights'

import { RealtimeEventFeed } from './RealtimeEventFeed'

const event: NewsEventView = {
  id: '1',
  eventTypeLabel: '공급 계약',
  documentTypeLabel: '공시',
  documentTypeTone: 'info',
  symbol: '005930',
  title: '삼성전자, 차세대 HBM 공급 확대 계획 발표',
  summary: '공급 확대 계획을 발표했습니다.',
  importance: { label: '높음', tone: 'danger', scorePercent: 91 },
  sentiment: { label: '긍정', tone: 'success', scorePercent: 82 },
  sourceName: 'DART',
  sourceReliabilityPercent: 98,
  publishedAt: '2026. 7. 21. 오전 9:42',
  publishedAtTime: '09:42',
  evidenceCount: 4,
  topicIds: [7],
}

const defaultProps = {
  events: [event],
  isLoading: false,
  isError: false,
  isFetchingNextPage: false,
  isFetchNextPageError: false,
  hasNextPage: false,
  onLoadMore: vi.fn(),
  onRetry: vi.fn(),
}

describe('RealtimeEventFeed', () => {
  it('renders event rows with compact importance, sentiment, and time', () => {
    render(<RealtimeEventFeed {...defaultProps} />)

    const table = screen.getByRole('table', { name: '실시간 이벤트 목록' })
    const firstEvent = within(table).getByText(event.title)
    const row = firstEvent.closest('tr')

    expect(row).not.toBeNull()
    expect(within(row!).getByText('공시')).toBeVisible()
    expect(within(row!).getByText('높음')).toBeVisible()
    expect(within(row!).getByText('긍정')).toBeVisible()
    expect(within(row!).getByText('09:42')).toBeVisible()
  })

  it('renders a table loading state', () => {
    render(<RealtimeEventFeed {...defaultProps} events={[]} isLoading />)

    expect(screen.getByText('이벤트 피드를 불러오는 중입니다.')).toBeVisible()
  })

  it('renders a retryable initial error', () => {
    const onRetry = vi.fn()
    render(
      <RealtimeEventFeed
        {...defaultProps}
        events={[]}
        isError
        onRetry={onRetry}
      />,
    )

    expect(screen.getByText('이벤트 피드를 불러오지 못했습니다')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: '재시도' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('loads the next cursor page without discarding current events', () => {
    const onLoadMore = vi.fn()
    render(
      <RealtimeEventFeed
        {...defaultProps}
        hasNextPage
        onLoadMore={onLoadMore}
      />,
    )

    expect(screen.getByText(event.title)).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: '이벤트 더 보기' }))
    expect(onLoadMore).toHaveBeenCalledOnce()
  })
})
