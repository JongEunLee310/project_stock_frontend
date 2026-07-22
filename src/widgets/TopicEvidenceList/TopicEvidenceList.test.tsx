import { fireEvent, render, screen } from '@testing-library/react'

import type { NewsTopicEvidenceView } from '@/features/news-insights'

import { TopicEvidenceList } from './TopicEvidenceList'

const evidence: NewsTopicEvidenceView = {
  id: '10-20',
  eventId: '10',
  documentId: '20',
  evidenceRole: { label: '반대 근거', tone: 'danger' },
  documentType: { label: '뉴스', tone: 'info' },
  symbol: '005930',
  title: '반대 근거 기사',
  summary: 'AI가 생성한 근거 요약',
  direction: { label: '부정', tone: 'danger' },
  relevancePercent: 85,
  source: 'Reuters',
  publishedAt: '2026. 7. 21. 오전 9:00',
}

const defaultProps = {
  evidence: [evidence],
  isLoading: false,
  isError: false,
  isFetchingNextPage: false,
  isFetchNextPageError: false,
  hasNextPage: false,
  onLoadMore: vi.fn(),
  onRetry: vi.fn(),
}

describe('TopicEvidenceList', () => {
  it('separates source metadata from the AI summary', () => {
    render(<TopicEvidenceList {...defaultProps} />)

    expect(screen.getByText('반대 근거')).toBeVisible()
    expect(screen.getByText(/Reuters/)).toBeVisible()
    expect(screen.queryByText(evidence.summary)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'AI 요약 보기' }))
    expect(screen.getByText(evidence.summary)).toBeVisible()
    expect(screen.queryByText(/API가 원문 URL/)).not.toBeInTheDocument()
  })

  it('loads the next cursor page while preserving current evidence', () => {
    const onLoadMore = vi.fn()
    render(
      <TopicEvidenceList
        {...defaultProps}
        hasNextPage
        onLoadMore={onLoadMore}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: '근거 더 보기' }))
    expect(onLoadMore).toHaveBeenCalledOnce()
    expect(screen.getByText(evidence.title)).toBeVisible()
  })

  it('renders independent empty and initial error states', () => {
    const { rerender } = render(
      <TopicEvidenceList {...defaultProps} evidence={[]} />,
    )
    expect(screen.getByText('표시할 관련 근거가 없습니다')).toBeVisible()

    rerender(<TopicEvidenceList {...defaultProps} evidence={[]} isError />)
    expect(screen.getByText('관련 근거를 불러오지 못했습니다')).toBeVisible()
  })
})
