import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'

import type { NewsEventView } from '@/features/news-insights'

import { ResearchNewsPage } from './ResearchNewsPage'

const mockUseNewsEventsQuery = vi.hoisted(() => vi.fn())
const mockFetchNextPage = vi.hoisted(() => vi.fn())
const mockRefetch = vi.hoisted(() => vi.fn())

vi.mock('@/features/news-insights', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/news-insights')>()
  return {
    ...actual,
    useNewsEventsQuery: mockUseNewsEventsQuery,
  }
})

const event: NewsEventView = {
  id: '17',
  eventTypeLabel: '제품',
  documentTypeLabel: '뉴스',
  documentTypeTone: 'info',
  symbol: 'NVDA',
  title: 'NVDA 차세대 가속기 발표',
  summary: '새 가속기를 발표했습니다.',
  importance: { label: '높음', tone: 'danger', scorePercent: 91 },
  sentiment: { label: '긍정', tone: 'success', scorePercent: 82 },
  sourceName: 'Reuters',
  sourceReliabilityPercent: 98,
  publishedAt: '2026. 7. 23. 오전 9:42',
  publishedAtTime: '09:42',
  evidenceCount: 4,
  topicIds: [7],
}

function createQueryResult(overrides: Record<string, unknown> = {}) {
  return {
    data: [{ items: [event], pageInfo: { hasMore: false, nextCursor: null } }],
    dataUpdatedAt: 1_753_238_520_000,
    isLoading: false,
    isError: false,
    isFetchingNextPage: false,
    isFetchNextPageError: false,
    hasNextPage: false,
    fetchNextPage: mockFetchNextPage,
    refetch: mockRefetch,
    ...overrides,
  }
}

function renderPage(initialEntry = '/research/nvda/news') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/research/:symbol/news" element={<ResearchNewsPage />} />
        <Route path="*" element={<ResearchNewsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  mockUseNewsEventsQuery.mockReturnValue(createQueryResult())
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('ResearchNewsPage', () => {
  it('renders the symbol event feed and preserves the research link', () => {
    renderPage()

    expect(mockUseNewsEventsQuery).toHaveBeenCalledWith({ symbols: ['NVDA'] })
    expect(
      screen.getByRole('heading', { name: '뉴스 및 공시 — NVDA' }),
    ).toBeVisible()
    expect(
      screen.getByRole('heading', { name: 'NVDA 뉴스·공시 이벤트' }),
    ).toBeVisible()
    expect(screen.getByRole('link', { name: 'NVDA 리서치' })).toHaveAttribute(
      'href',
      '/research/NVDA',
    )
    expect(screen.getByRole('link', { name: event.title })).toHaveAttribute(
      'href',
      '/news/events/17',
    )
    expect(screen.queryByRole('columnheader', { name: '종목' })).toBeNull()
  })

  it('renders the shared loading state', () => {
    mockUseNewsEventsQuery.mockReturnValue(
      createQueryResult({ data: undefined, isLoading: true }),
    )

    renderPage()

    expect(screen.getByText('이벤트 피드를 불러오는 중입니다.')).toBeVisible()
  })

  it('renders the shared error state and retries the event query', () => {
    mockUseNewsEventsQuery.mockReturnValue(
      createQueryResult({ data: undefined, isError: true }),
    )

    renderPage()

    expect(screen.getByText('이벤트 피드를 불러오지 못했습니다')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: '재시도' }))
    expect(mockRefetch).toHaveBeenCalledOnce()
  })

  it('renders the shared empty state', () => {
    mockUseNewsEventsQuery.mockReturnValue(createQueryResult({ data: [] }))

    renderPage()

    expect(screen.getByText('표시할 이벤트가 없습니다.')).toBeVisible()
  })

  it('safely guides the user when the route symbol is missing', () => {
    renderPage('/research/news')

    expect(screen.getByText('종목 정보가 없습니다')).toBeVisible()
    expect(mockUseNewsEventsQuery).not.toHaveBeenCalled()
  })
})
