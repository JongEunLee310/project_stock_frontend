import { render, screen } from '@testing-library/react'

import type { NewsTopicDetailView } from '@/features/news-insights'

import { TopicInsightSummary } from './TopicInsightSummary'

const detail: NewsTopicDetailView = {
  title: 'AI 반도체 수요',
  tags: [],
  lifecycle: { label: '활성', tone: 'success' },
  scores: [],
  affectedSymbols: [],
  insight: {
    summary: 'AI 요약',
    whyItMatters: '수요 구조가 달라집니다.',
    keyEvidence: [{ id: 'evidence-1', label: '핵심 계약이 늘었습니다.' }],
    riskPoints: ['수요 둔화 가능성'],
    counterArguments: [],
  },
  version: 1,
  updatedAt: '2026. 7. 22. 오전 9:00',
}

describe('TopicInsightSummary', () => {
  it('renders the live rationale, evidence, and risk points', () => {
    render(
      <TopicInsightSummary
        data={detail}
        isLoading={false}
        isError={false}
        onRetry={vi.fn()}
      />,
    )

    expect(screen.getByRole('heading', { name: '인사이트 요약' })).toBeVisible()
    expect(screen.getByText('수요 구조가 달라집니다.')).toBeVisible()
    expect(screen.getByText(/핵심 계약이 늘었습니다/)).toBeVisible()
    expect(screen.getByText(/수요 둔화 가능성/)).toBeVisible()
  })
})
