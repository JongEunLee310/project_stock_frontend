import { fireEvent, render, screen } from '@testing-library/react'

import type { NewsOverviewView } from '@/features/news-insights'

import { AgentBriefing } from './AgentBriefing'

const briefing: NewsOverviewView['briefing'] = {
  summary: 'AI 반도체 공급 기대와 일정 위험이 함께 관찰됩니다.',
  generatedAt: '2026. 7. 21. 오후 2:50',
  highlights: [
    {
      id: '7-0',
      text: 'HBM 공급 확대 기대가 높아졌습니다.',
      topicId: 7,
      evidenceCount: 8,
      evidenceEventIds: [10, 11],
    },
    {
      id: '8-1',
      text: '환율 변동성은 남아 있습니다.',
      topicId: 8,
      evidenceCount: 5,
      evidenceEventIds: [12],
    },
  ],
}

function openBriefing() {
  fireEvent.click(screen.getByRole('button', { name: '에이전트 브리핑 열기' }))
}

describe('AgentBriefing', () => {
  it('stays collapsed until the floating button is clicked', () => {
    render(
      <AgentBriefing
        data={briefing}
        isLoading={false}
        isError={false}
        onRetry={vi.fn()}
      />,
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '에이전트 브리핑 열기' }),
    ).toBeVisible()

    openBriefing()

    expect(screen.getByRole('dialog')).toBeVisible()
  })

  it('renders an API summary and evidence counts for every highlight', () => {
    render(
      <AgentBriefing
        data={briefing}
        isLoading={false}
        isError={false}
        onRetry={vi.fn()}
      />,
    )
    openBriefing()
    expect(screen.getByText('AI 분석')).toBeVisible()
    expect(screen.getByText(briefing.summary)).toBeVisible()
    expect(screen.getByText('HBM 공급 확대 기대가 높아졌습니다.')).toBeVisible()
    expect(screen.getByText('환율 변동성은 남아 있습니다.')).toBeVisible()
    expect(screen.getByText('근거 8건')).toBeVisible()
    expect(screen.getByText('근거 5건')).toBeVisible()
  })

  it('renders a panel loading state', () => {
    render(<AgentBriefing isLoading isError={false} onRetry={vi.fn()} />)
    openBriefing()

    expect(
      screen.getByRole('status', { name: '브리핑 불러오는 중' }),
    ).toBeVisible()
  })

  it('renders a retryable panel error', () => {
    const onRetry = vi.fn()
    render(<AgentBriefing isLoading={false} isError onRetry={onRetry} />)
    openBriefing()

    expect(
      screen.getByText('에이전트 브리핑을 불러오지 못했습니다'),
    ).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: '재시도' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('renders the empty state after opening the briefing', () => {
    render(
      <AgentBriefing
        data={{
          summary: '',
          generatedAt: briefing.generatedAt,
          highlights: [],
        }}
        isLoading={false}
        isError={false}
        onRetry={vi.fn()}
      />,
    )
    openBriefing()

    expect(screen.getByText('생성된 브리핑이 없습니다')).toBeVisible()
  })
})
