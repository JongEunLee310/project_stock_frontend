import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import {
  type NewsEventDetailView,
  useNewsEventDetailQuery,
} from '@/features/news-insights'
import { ApiError } from '@/shared/api'

import { NewsEventDetailPage } from './NewsEventDetailPage'

vi.mock('@/features/news-insights', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/news-insights')>()
  return { ...actual, useNewsEventDetailQuery: vi.fn() }
})

const event = {
  eventTypeLabel: '공급 계약',
  title: '페이지 이벤트 제목',
  summary: '페이지 이벤트 요약',
  importance: {
    label: '높음',
    tone: 'danger',
    scorePercent: 91,
    explanation: '중요도 설명',
  },
  sentiment: { label: '긍정', tone: 'success', scorePercent: 82 },
  affectedSymbols: [],
  evidence: [],
  relatedTopics: [],
} satisfies NewsEventDetailView

function renderPage(path = '/news/events/204') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/news/events/:eventId" element={<NewsEventDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('NewsEventDetailPage', () => {
  beforeEach(() => {
    vi.mocked(useNewsEventDetailQuery).mockReturnValue({
      data: event,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useNewsEventDetailQuery>)
  })

  it('loads the route event id and composes all detail panels', () => {
    renderPage()

    expect(useNewsEventDetailQuery).toHaveBeenCalledWith('204')
    expect(
      screen.getByRole('heading', { name: '페이지 이벤트 제목' }),
    ).toBeVisible()
    expect(screen.getByRole('heading', { name: '영향 종목' })).toBeVisible()
    expect(screen.getByRole('heading', { name: '관련 토픽' })).toBeVisible()
    expect(screen.getByRole('heading', { name: '근거 문서' })).toBeVisible()
  })

  it('renders loading and not-found errors', () => {
    vi.mocked(useNewsEventDetailQuery).mockReturnValue({
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useNewsEventDetailQuery>)
    const { unmount } = renderPage()
    expect(screen.getByLabelText('이벤트 상세 불러오는 중')).toBeVisible()
    unmount()

    vi.mocked(useNewsEventDetailQuery).mockReturnValue({
      isLoading: false,
      isError: true,
      error: new ApiError('NEWS_INSIGHT_EVENT_NOT_FOUND', '이벤트가 없습니다.'),
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useNewsEventDetailQuery>)
    renderPage()
    expect(screen.getByText('이벤트를 찾을 수 없습니다')).toBeVisible()
  })
})
