import type { Core, ElementDefinition, EventObjectNode } from 'cytoscape'
import { useEffect } from 'react'
import { act, render, screen, waitFor } from '@testing-library/react'

import {
  type NewsTopicGraphView,
  useNewsTopicGraphQuery,
} from '@/features/news-insights'

import { TopicKeywordGraph } from './TopicKeywordGraph'

let nodeTapHandler: ((event: EventObjectNode) => void) | undefined
let isDestroyed = false

const core = {
  destroy: vi.fn(() => {
    isDestroyed = true
  }),
  destroyed: vi.fn(() => isDestroyed),
  off: vi.fn(),
  on: vi.fn(
    (
      _events: string,
      _selector: string,
      handler: (event: EventObjectNode) => void,
    ) => {
      nodeTapHandler = handler
    },
  ),
} as unknown as Core

vi.mock('@/features/news-insights', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/news-insights')>()
  return { ...actual, useNewsTopicGraphQuery: vi.fn() }
})

vi.mock('react-cytoscapejs', () => ({
  default: function MockCytoscape({
    elements,
    cy,
  }: {
    elements: ElementDefinition[]
    cy?: (instance: Core) => void
  }) {
    useEffect(() => {
      cy?.(core)
    }, [cy])

    return (
      <div
        data-testid="cytoscape"
        data-node-count={
          elements.filter((element) => element.group === 'nodes').length
        }
        data-edge-count={
          elements.filter((element) => element.group === 'edges').length
        }
      />
    )
  },
}))

const graph: NewsTopicGraphView = {
  nodes: [
    {
      id: 'keyword:ai-chip',
      label: 'AI 반도체',
      type: 'KEYWORD',
      mentionCount: 17,
      sentimentScore: 0.78,
      sentiment: { label: '긍정', tone: 'success' },
      relatedEventIds: ['101', '102'],
      relatedSymbols: ['NVDA', 'TSM'],
    },
    {
      id: 'keyword:hbm',
      label: 'HBM',
      type: 'KEYWORD',
      mentionCount: 9,
      sentimentScore: 0.52,
      sentiment: { label: '중립', tone: 'neutral' },
      relatedEventIds: [],
      relatedSymbols: [],
    },
  ],
  edges: [
    {
      source: 'keyword:ai-chip',
      target: 'keyword:hbm',
      strength: 0.86,
      cooccurrenceCount: 9,
    },
  ],
}

function mockQuery(
  state: Partial<ReturnType<typeof useNewsTopicGraphQuery>> = {},
) {
  vi.mocked(useNewsTopicGraphQuery).mockReturnValue({
    data: graph,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...state,
  } as unknown as ReturnType<typeof useNewsTopicGraphQuery>)
}

function tapNode(id: string) {
  nodeTapHandler?.({
    target: { id: () => id },
  } as unknown as EventObjectNode)
}

describe('TopicKeywordGraph', () => {
  beforeEach(() => {
    vi.mocked(core.destroy).mockClear()
    vi.mocked(core.destroyed).mockClear()
    vi.mocked(core.off).mockClear()
    vi.mocked(core.on).mockClear()
    nodeTapHandler = undefined
    isDestroyed = false
    mockQuery()
  })

  it('passes every backend node and edge to Cytoscape', async () => {
    render(<TopicKeywordGraph topicId="7" />)

    const renderedGraph = await screen.findByTestId('cytoscape')
    expect(renderedGraph).toHaveAttribute('data-node-count', '2')
    expect(renderedGraph).toHaveAttribute('data-edge-count', '1')
    expect(
      screen.getByRole('img', {
        name: '키워드 2개, 연관 관계 1개의 관계망',
      }),
    ).toBeVisible()
    expect(screen.getByLabelText('키워드 관계망 범례')).toHaveTextContent(
      '노드 크기: 언급량 · 선 굵기: 연관 강도',
    )
    expect(useNewsTopicGraphQuery).toHaveBeenCalledWith('7')
  })

  it('surfaces related symbols and event ids when a node is tapped', async () => {
    render(<TopicKeywordGraph topicId="7" />)
    await waitFor(() => expect(nodeTapHandler).toBeDefined())

    act(() => tapNode('keyword:ai-chip'))

    expect(screen.getByText('AI 반도체')).toBeVisible()
    expect(screen.getByText('NVDA')).toBeVisible()
    expect(screen.getByText('TSM')).toBeVisible()
    expect(screen.getByText('이벤트 #101')).toBeVisible()
    expect(screen.getByText('이벤트 #102')).toBeVisible()
    expect(screen.getAllByText('긍정 감성')).toHaveLength(2)
  })

  it('shows independent loading, error, and empty states', () => {
    mockQuery({ data: undefined, isLoading: true })
    const { rerender } = render(<TopicKeywordGraph topicId="7" />)
    expect(screen.getByLabelText('키워드 관계망 불러오는 중')).toBeVisible()

    mockQuery({ data: undefined, isLoading: false, isError: true })
    rerender(<TopicKeywordGraph topicId="7" />)
    expect(
      screen.getByText('키워드 관계망을 불러오지 못했습니다'),
    ).toBeVisible()

    mockQuery({
      data: { nodes: [], edges: [] },
      isLoading: false,
      isError: false,
    })
    rerender(<TopicKeywordGraph topicId="7" />)
    expect(screen.getByText('표시할 키워드 관계가 없습니다')).toBeVisible()
  })

  it('destroys the Cytoscape instance on unmount', async () => {
    const { unmount } = render(<TopicKeywordGraph topicId="7" />)
    await waitFor(() => expect(nodeTapHandler).toBeDefined())

    unmount()

    expect(core.destroy).toHaveBeenCalledOnce()
  })
})
