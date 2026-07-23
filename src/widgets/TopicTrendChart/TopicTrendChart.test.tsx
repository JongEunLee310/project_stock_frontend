import { fireEvent, render, screen } from '@testing-library/react'

import type { NewsTopicTrendView } from '@/features/news-insights'

import { TopicTrendChart } from './TopicTrendChart'

const trend: NewsTopicTrendView = {
  points: [
    {
      timestamp: '2026-07-21T00:00:00Z',
      timestampLabel: '2026. 7. 21. 오전 9:00',
      mentionCount: 12,
      sentimentScore: 0.73,
      impactScore: 0.91,
    },
  ],
  markers: [
    {
      timestamp: '2026-07-21T00:00:00Z',
      timestampLabel: '2026. 7. 21. 오전 9:00',
      label: '공급 계약',
      eventId: '10',
    },
  ],
  sourceDistribution: [
    {
      sourceTypeLabel: '공시',
      sourceTypeTone: 'info',
      count: 3,
      sharePercent: 75,
    },
  ],
}

const defaultProps = {
  data: trend,
  isLoading: false,
  isError: false,
  onRetry: vi.fn(),
  window: '7d' as const,
  onWindowChange: vi.fn(),
}

describe('TopicTrendChart', () => {
  it('binds mention, sentiment, markers, and source distribution data', () => {
    render(<TopicTrendChart {...defaultProps} />)

    expect(
      screen.getByRole('img', {
        name: '언급량 막대와 감성 선 복합 차트, 데이터 1개, 이벤트 마커 1개',
      }),
    ).toBeVisible()
    expect(screen.getByText(/언급 12건, 감성 73%/)).toBeInTheDocument()
    expect(screen.getByText('공급 계약')).toBeVisible()
    expect(screen.getByText('3건 · 75%')).toBeVisible()
  })

  it('renders selectable trend windows and reports window changes', () => {
    const onWindowChange = vi.fn()
    render(
      <TopicTrendChart
        {...defaultProps}
        window="30d"
        onWindowChange={onWindowChange}
      />,
    )

    expect(screen.getByRole('button', { name: '7일' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.getByRole('button', { name: '30일' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: '90일' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )

    fireEvent.click(screen.getByRole('button', { name: '90일' }))
    expect(onWindowChange).toHaveBeenCalledWith('90d')
  })

  it('renders independent empty and error states', () => {
    const { rerender } = render(
      <TopicTrendChart
        {...defaultProps}
        data={{ points: [], markers: [], sourceDistribution: [] }}
      />,
    )
    expect(screen.getByText('표시할 토픽 추이가 없습니다')).toBeVisible()

    rerender(<TopicTrendChart {...defaultProps} data={undefined} isError />)
    expect(screen.getByText('토픽 추이를 불러오지 못했습니다')).toBeVisible()
  })
})
