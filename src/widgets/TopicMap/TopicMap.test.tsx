import type { Core, ElementDefinition, EventObjectNode } from 'cytoscape'
import { useEffect } from 'react'
import { act, render, screen, waitFor } from '@testing-library/react'

import {
  type NewsTopicMap,
  useNewsTopicMapQuery,
} from '@/features/news-insights'

import { TopicMap } from './TopicMap'

const navigate = vi.fn()
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

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => navigate }
})

vi.mock('@/features/news-insights', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/news-insights')>()
  return { ...actual, useNewsTopicMapQuery: vi.fn() }
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

    const nodeCount = elements.filter(
      (element) => element.group === 'nodes',
    ).length
    const edgeCount = elements.filter(
      (element) => element.group === 'edges',
    ).length
    return (
      <div
        data-testid="cytoscape"
        data-node-count={nodeCount}
        data-edge-count={edgeCount}
      />
    )
  },
}))

const topicMap: NewsTopicMap = {
  nodes: [
    {
      id: 'topic:7',
      label: '반도체 장기 수요 회복',
      type: 'TOPIC',
      mentionCount: 12,
      momentumScore: 0.81,
      sentimentScore: 0.76,
      category: 'DEMAND',
    },
    {
      id: 'keyword:2',
      label: '장기 공급계약',
      type: 'KEYWORD',
      mentionCount: 8,
      momentumScore: 0.92,
      sentimentScore: 0.78,
      category: 'DEMAND',
    },
  ],
  edges: [
    {
      source: 'keyword:2',
      target: 'keyword:3',
      strength: 0.86,
      cooccurrenceCount: 5,
    },
  ],
}

function mockQuery(
  state: Partial<ReturnType<typeof useNewsTopicMapQuery>> = {},
) {
  vi.mocked(useNewsTopicMapQuery).mockReturnValue({
    data: topicMap,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...state,
  } as unknown as ReturnType<typeof useNewsTopicMapQuery>)
}

function tapNode(id: string, type: 'TOPIC' | 'KEYWORD') {
  nodeTapHandler?.({
    target: {
      id: () => id,
      data: (key: string) => (key === 'type' ? type : undefined),
    },
  } as unknown as EventObjectNode)
}

describe('TopicMap', () => {
  beforeEach(() => {
    navigate.mockReset()
    vi.mocked(core.destroy).mockClear()
    vi.mocked(core.destroyed).mockClear()
    vi.mocked(core.off).mockClear()
    vi.mocked(core.on).mockClear()
    nodeTapHandler = undefined
    isDestroyed = false
    mockQuery()
  })

  it('passes every backend node and edge to Cytoscape', async () => {
    render(<TopicMap />)

    const graph = await screen.findByTestId('cytoscape')
    expect(graph).toHaveAttribute('data-node-count', '2')
    expect(graph).toHaveAttribute('data-edge-count', '1')
    expect(
      screen.getByRole('img', {
        name: '토픽 1개, 전체 노드 2개, 연관 관계 1개의 토픽 맵',
      }),
    ).toBeVisible()
    expect(screen.getByLabelText('카테고리 범례')).toBeVisible()
    expect(screen.getByText('성장/투자')).toBeVisible()
  })

  it('navigates only TOPIC node taps to the topic detail path', async () => {
    render(<TopicMap />)
    await waitFor(() => expect(nodeTapHandler).toBeDefined())

    act(() => tapNode('keyword:2', 'KEYWORD'))
    expect(navigate).not.toHaveBeenCalled()

    act(() => tapNode('topic:7', 'TOPIC'))
    expect(navigate).toHaveBeenCalledWith('/news/topics/7')
  })

  it('shows independent loading, error, and empty panel states', () => {
    mockQuery({ data: undefined, isLoading: true })
    const { rerender } = render(<TopicMap />)
    expect(screen.getByLabelText('토픽 맵 불러오는 중')).toBeVisible()

    mockQuery({ data: undefined, isLoading: false, isError: true })
    rerender(<TopicMap />)
    expect(screen.getByText('토픽 맵을 불러오지 못했습니다')).toBeVisible()

    mockQuery({
      data: { nodes: [], edges: [] },
      isLoading: false,
      isError: false,
    })
    rerender(<TopicMap />)
    expect(screen.getByText('표시할 토픽 관계가 없습니다')).toBeVisible()
  })

  it('destroys the Cytoscape instance on unmount', async () => {
    const { unmount } = render(<TopicMap />)
    await waitFor(() => expect(nodeTapHandler).toBeDefined())

    unmount()

    expect(core.destroy).toHaveBeenCalledOnce()
  })
})
