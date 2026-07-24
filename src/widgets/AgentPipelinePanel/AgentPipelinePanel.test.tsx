import { fireEvent, render, screen, within } from '@testing-library/react'

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
      name: 'NORMALIZE',
      namePresentation: { label: '정규화', tone: 'info' },
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
    {
      name: 'CLUSTER',
      namePresentation: { label: '클러스터링', tone: 'accent' },
      status: 'RUNNING',
      statusPresentation: { label: '처리 중', tone: 'info' },
      delayed: false,
    },
    {
      name: 'SENTIMENT',
      namePresentation: { label: '감성 분석', tone: 'accent' },
      status: 'COMPLETED',
      statusPresentation: { label: '완료', tone: 'success' },
      delayed: false,
    },
    {
      name: 'IMPACT',
      namePresentation: { label: '영향 추정', tone: 'warning' },
      status: 'COMPLETED',
      statusPresentation: { label: '완료', tone: 'success' },
      delayed: false,
    },
    {
      name: 'LINK',
      namePresentation: { label: '포트폴리오 연결', tone: 'info' },
      status: 'FAILED',
      statusPresentation: { label: '실패', tone: 'danger' },
      delayed: false,
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
    const metrics = screen.getByLabelText('파이프라인 처리 지표')
    expect(within(metrics).getByText('수집 소스')).toBeVisible()
    expect(within(metrics).getByText('처리 건수')).toBeVisible()
    expect(within(metrics).getByText('이벤트 추출')).toBeVisible()
    expect(within(metrics).getByText('평균 처리 지연')).toBeVisible()
    expect(within(metrics).getByText('정확도')).toBeVisible()
    expect(within(metrics).getAllByTitle('백엔드 지표 연동 예정')).toHaveLength(
      3,
    )
    const stages = screen.getByRole('list', { name: '에이전트 처리 단계' })
    expect(within(stages).getByText('수집')).toBeVisible()
    expect(within(stages).getAllByText('완료')).toHaveLength(4)
    expect(within(stages).getByText('이벤트 추출')).toBeVisible()
    expect(within(stages).getByText('지연')).toBeVisible()
    expect(within(stages).getAllByRole('listitem')).toHaveLength(7)
    expect(
      within(stages).getByRole('listitem', {
        name: '1단계 수집, 완료',
      }),
    ).toHaveClass('bg-emerald-500/12')
    expect(
      within(stages).getByRole('listitem', {
        name: '3단계 이벤트 추출, 지연',
      }),
    ).toHaveClass('bg-amber-500/12')
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

  it('keeps the pipeline hidden behind a status icon until requested', () => {
    render(<AgentPipelinePanel compact presentation="popover" />)

    const trigger = screen.getByRole('button', {
      name: '에이전트 파이프라인 열기',
    })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('에이전트 상태: 지연 있음')).toBeInTheDocument()

    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.getByRole('dialog', { name: '에이전트 파이프라인' }),
    ).toBeVisible()
    expect(screen.getByText('1,200건')).toBeVisible()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
