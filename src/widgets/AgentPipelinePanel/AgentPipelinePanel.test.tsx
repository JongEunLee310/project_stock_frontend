import { render, screen, within } from '@testing-library/react'

import {
  type NewsAgentRunsView,
  useNewsAgentRunsQuery,
} from '@/features/news-insights'

import { AgentPipelinePanel } from './AgentPipelinePanel'

vi.mock('@/features/news-insights', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/news-insights')>()
  return { ...actual, useNewsAgentRunsQuery: vi.fn() }
})

const runs: NewsAgentRunsView = {
  lastProcessedAt: '2026. 7. 22. 오후 3:00',
  processedDocuments: 1200,
  extractedEvents: 48,
  activeTopics: 12,
  stages: [
    {
      name: 'COLLECT',
      namePresentation: { label: '수집', tone: 'info' },
      status: 'COMPLETED',
      statusPresentation: { label: '완료', tone: 'success' },
      delayed: false,
    },
    {
      name: 'EXTRACT',
      namePresentation: { label: '이벤트 추출', tone: 'accent' },
      status: 'DELAYED',
      statusPresentation: { label: '지연', tone: 'warning' },
      delayed: true,
    },
  ],
  analysisVersion: 'v3.2',
  hasDelay: true,
}

function mockQuery(
  state: Partial<ReturnType<typeof useNewsAgentRunsQuery>> = {},
) {
  vi.mocked(useNewsAgentRunsQuery).mockReturnValue({
    data: runs,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...state,
  } as unknown as ReturnType<typeof useNewsAgentRunsQuery>)
}

describe('AgentPipelinePanel', () => {
  beforeEach(() => mockQuery())

  it('shows verifiable stage statuses, delay flags, aggregates, timestamp, and analysis version', () => {
    render(<AgentPipelinePanel />)

    expect(screen.getByText('전체 지연 있음')).toBeVisible()
    expect(screen.getByText('1,200건')).toBeVisible()
    expect(screen.getByText('48건')).toBeVisible()
    expect(screen.getByText('12건')).toBeVisible()
    const stages = screen.getByRole('list', { name: '에이전트 처리 단계' })
    expect(within(stages).getByText('수집')).toBeVisible()
    expect(within(stages).getByText('완료')).toBeVisible()
    expect(within(stages).getByText('이벤트 추출')).toBeVisible()
    expect(within(stages).getByText('지연')).toBeVisible()
    expect(within(stages).getByText('지연 플래그')).toBeVisible()
    expect(screen.getByText(/마지막 처리 시각 .*오후 3:00/)).toBeVisible()
    expect(screen.getByText('분석 버전 v3.2')).toBeVisible()
  })

  it('shows independent loading, error, and empty states', () => {
    mockQuery({ data: undefined, isLoading: true })
    const { rerender } = render(<AgentPipelinePanel />)
    expect(
      screen.getByLabelText('에이전트 파이프라인 불러오는 중'),
    ).toBeVisible()

    mockQuery({ data: undefined, isLoading: false, isError: true })
    rerender(<AgentPipelinePanel />)
    expect(
      screen.getByText('에이전트 파이프라인을 불러오지 못했습니다'),
    ).toBeVisible()

    mockQuery({ data: { ...runs, stages: [] } })
    rerender(<AgentPipelinePanel />)
    expect(screen.getByText('표시할 처리 단계가 없습니다')).toBeVisible()
  })
})
