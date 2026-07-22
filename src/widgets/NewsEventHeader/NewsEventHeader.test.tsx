import { render, screen } from '@testing-library/react'

import type { NewsEventDetailView } from '@/features/news-insights'

import { NewsEventHeader } from './NewsEventHeader'

const event = {
  eventTypeLabel: '공급 계약',
  title: 'AI 반도체 공급 계약',
  summary: '이벤트 수준 AI 요약',
  importance: {
    label: '높음',
    tone: 'danger',
    scorePercent: 91,
    explanation: '시장 영향이 큽니다.',
  },
  sentiment: { label: '긍정', tone: 'success', scorePercent: 82 },
  affectedSymbols: [],
  evidence: [],
  relatedTopics: [],
} satisfies NewsEventDetailView

describe('NewsEventHeader', () => {
  it('renders importance and sentiment as separate labeled values', () => {
    render(<NewsEventHeader event={event} />)

    expect(
      screen.getByRole('heading', { name: 'AI 반도체 공급 계약' }),
    ).toBeVisible()
    expect(screen.getByText('이벤트 수준 AI 요약')).toBeVisible()
    expect(screen.getByText('중요도')).toBeVisible()
    expect(screen.getByText('91%')).toBeVisible()
    expect(screen.getByText('감성')).toBeVisible()
    expect(screen.getByText('82%')).toBeVisible()
    expect(screen.getByText('시장 영향이 큽니다.')).toBeVisible()
  })
})
