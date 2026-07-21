import { fireEvent, render, screen, within } from '@testing-library/react'

import type { NewsOverviewView } from '@/features/news-insights'

import { InsightSummaryCards } from './InsightSummaryCards'

const overview: NewsOverviewView = {
  asOf: '2026. 7. 21. 오후 3:00',
  metrics: [
    {
      id: 'high-importance-events',
      label: '고중요 이벤트',
      count: 12,
      change: 3,
      tone: 'danger',
    },
    {
      id: 'sentiment-shifts',
      label: '감성 급변',
      count: 7,
      change: -2,
      tone: 'warning',
    },
    {
      id: 'active-topic-clusters',
      label: '활성 토픽 클러스터',
      count: 18,
      change: 0,
      tone: 'accent',
    },
    {
      id: 'fund-flow-signals',
      label: '자금 흐름 시그널',
      count: 5,
      change: 1,
      tone: 'success',
    },
  ],
  briefing: { summary: '', highlights: [], generatedAt: '' },
}

describe('InsightSummaryCards', () => {
  it('renders all four API metrics with counts and daily changes', () => {
    render(
      <InsightSummaryCards
        data={overview}
        isLoading={false}
        isError={false}
        onRetry={vi.fn()}
      />,
    )

    const expectedMetrics = [
      ['고중요 이벤트', '12건', '전일 대비 +3건'],
      ['감성 급변', '7건', '전일 대비 -2건'],
      ['활성 토픽 클러스터', '18건', '전일과 동일'],
      ['자금 흐름 시그널', '5건', '전일 대비 +1건'],
    ] as const

    expectedMetrics.forEach(([label, count, delta]) => {
      const card = screen.getByLabelText(`${label} 요약`)

      expect(within(card).getByText(label)).toBeVisible()
      expect(within(card).getByText(count)).toBeVisible()
      expect(within(card).getByText(delta)).toBeVisible()
    })
    expect(screen.getByText(`기준 ${overview.asOf}`)).toBeVisible()
  })

  it('renders a panel loading state', () => {
    render(<InsightSummaryCards isLoading isError={false} onRetry={vi.fn()} />)

    expect(
      screen.getByRole('status', { name: '오늘의 인사이트 불러오는 중' }),
    ).toBeVisible()
  })

  it('renders a retryable panel error', () => {
    const onRetry = vi.fn()
    render(<InsightSummaryCards isLoading={false} isError onRetry={onRetry} />)

    expect(
      screen.getByText('오늘의 인사이트를 불러오지 못했습니다'),
    ).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: '재시도' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})
