import { fireEvent, render, screen, within } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { MemoryRouter } from 'react-router-dom'

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

const defaultProps: ComponentProps<typeof RealtimeEventFeed> = {
  events: [event],
  isLoading: false,
  isError: false,
  isFetchingNextPage: false,
  isFetchNextPageError: false,
  hasNextPage: false,
  onLoadMore: vi.fn(),
  onRetry: vi.fn(),
}

function renderFeed(props = defaultProps) {
  return render(
    <MemoryRouter>
      <RealtimeEventFeed {...props} />
    </MemoryRouter>,
  )
}

describe('RealtimeEventFeed', () => {
  it('preserves the overview title, accessibility connection, and columns by default', () => {
    renderFeed()

    const table = screen.getByRole('table', { name: '실시간 이벤트 목록' })
    const firstEvent = within(table).getByText(event.title)
    const row = firstEvent.closest('tr')

    expect(row).not.toBeNull()
    expect(within(row!).getByText('공시')).toBeVisible()
    expect(within(row!).getByText('높음')).toBeVisible()
    expect(within(row!).getByText('긍정')).toBeVisible()
    expect(within(row!).getByText('09:42')).toBeVisible()
    expect(
      screen.getByRole('heading', { name: '실시간 뉴스·공시 피드' }),
    ).toBeVisible()
    expect(
      screen.getByRole('region', { name: '실시간 뉴스·공시 피드' }),
    ).toBeVisible()
    expect(
      screen.queryByText(
        '관련 문서를 하나의 시장 이벤트로 묶어 중요도와 감성을 분리했습니다.',
      ),
    ).not.toBeInTheDocument()
    expect(
      within(table).getByRole('columnheader', { name: '종목' }),
    ).toBeVisible()
    expect(screen.getByRole('link', { name: event.title })).toHaveAttribute(
      'href',
      '/news/events/1',
    )
  })

  it('renders a custom title without panel description and hides the symbol column when requested', () => {
    renderFeed({
      ...defaultProps,
      title: 'NVDA 뉴스·공시 이벤트',
      description: 'NVDA 이벤트 설명',
      showSymbolColumn: false,
    })

    expect(
      screen.getByRole('heading', { name: 'NVDA 뉴스·공시 이벤트' }),
    ).toBeVisible()
    expect(
      screen.getByRole('region', { name: 'NVDA 뉴스·공시 이벤트' }),
    ).toBeVisible()
    expect(screen.queryByText('NVDA 이벤트 설명')).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: '종목' })).toBeNull()
    expect(screen.queryByText(event.symbol)).toBeNull()
  })

  it('renders a table loading state', () => {
    renderFeed({ ...defaultProps, events: [], isLoading: true })

    expect(screen.getByText('이벤트 피드를 불러오는 중입니다.')).toBeVisible()
  })

  it('renders a retryable initial error', () => {
    const onRetry = vi.fn()
    renderFeed({
      ...defaultProps,
      events: [],
      isError: true,
      onRetry,
    })

    expect(screen.getByText('이벤트 피드를 불러오지 못했습니다')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: '재시도' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('loads the next cursor page without discarding current events', () => {
    const onLoadMore = vi.fn()
    renderFeed({ ...defaultProps, hasNextPage: true, onLoadMore })

    expect(screen.getByText(event.title)).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: '이벤트 더 보기' }))
    expect(onLoadMore).toHaveBeenCalledOnce()
  })
})
