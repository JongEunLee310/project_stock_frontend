import type {
  Core,
  ElementDefinition,
  EventObjectNode,
  StylesheetJson,
} from 'cytoscape'
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  type NewsTopicGraphNodeView,
  type NewsTopicGraphView,
  useNewsTopicGraphQuery,
} from '@/features/news-insights'
import { Badge, Card, EmptyState, ErrorState, Skeleton } from '@/shared/ui'

const CytoscapeComponent = lazy(() => import('react-cytoscapejs'))

interface TopicKeywordGraphProps {
  topicId: string
}

const sentimentColors = {
  negative: '#f87171',
  neutral: '#94a3b8',
  positive: '#34d399',
} as const

const keywordGraphStylesheet: StylesheetJson = [
  {
    selector: 'node',
    style: {
      width: 'data(visualSize)',
      height: 'data(visualSize)',
      label: 'data(label)',
      color: '#e2e8f0',
      'font-size': 11,
      'font-weight': 600,
      'text-wrap': 'wrap',
      'text-max-width': '110px',
      'text-valign': 'bottom',
      'text-margin-y': 8,
      'background-color': 'data(sentimentColor)',
      'border-width': 2,
      'border-color': '#e2e8f0',
      'overlay-opacity': 0,
    },
  },
  {
    selector: 'edge',
    style: {
      width: 'mapData(strength, 0, 1, 1, 8)',
      opacity: 0.72,
      'line-color': '#64748b',
      'curve-style': 'bezier',
      label: 'data(cooccurrenceLabel)',
      color: '#94a3b8',
      'font-size': 9,
      'text-background-color': '#0f172a',
      'text-background-opacity': 0.8,
      'text-background-padding': '2px',
    },
  },
  {
    selector: 'node:selected',
    style: {
      'border-width': 4,
      'border-color': '#38bdf8',
      'overlay-color': '#38bdf8',
      'overlay-opacity': 0.16,
      'overlay-padding': 8,
    },
  },
]

function sentimentColor(score: number): string {
  if (score < 0.34) return sentimentColors.negative
  if (score < 0.67) return sentimentColors.neutral
  return sentimentColors.positive
}

function calculateNodeSize(mentionCount: number): number {
  return Math.min(88, 34 + Math.sqrt(Math.max(0, mentionCount)) * 6)
}

function toElements(data: NewsTopicGraphView): ElementDefinition[] {
  const nodes: ElementDefinition[] = data.nodes.map((node) => ({
    group: 'nodes',
    data: {
      id: node.id,
      label: node.label,
      type: node.type,
      mentionCount: node.mentionCount,
      sentimentScore: node.sentimentScore,
      sentimentColor: sentimentColor(node.sentimentScore),
      visualSize: calculateNodeSize(node.mentionCount),
    },
  }))
  const edges: ElementDefinition[] = data.edges.map((edge, index) => ({
    group: 'edges',
    data: {
      id: `${edge.source}-${edge.target}-${index}`,
      source: edge.source,
      target: edge.target,
      strength: edge.strength,
      cooccurrenceCount: edge.cooccurrenceCount,
      cooccurrenceLabel: `${edge.cooccurrenceCount}회`,
    },
  }))

  return [...nodes, ...edges]
}

function KeywordGraphLoading() {
  return (
    <div
      role="status"
      aria-label="키워드 관계망 불러오는 중"
      className="p-panel"
    >
      <span className="sr-only">키워드 관계망을 불러오는 중입니다.</span>
      <Skeleton className="h-80 w-full" />
    </div>
  )
}

function GraphLegend() {
  return (
    <div
      aria-label="키워드 관계망 범례"
      className="flex flex-wrap gap-2 border-t border-app-border px-panel py-4"
    >
      <Badge tone="danger">부정 감성</Badge>
      <Badge tone="neutral">중립 감성</Badge>
      <Badge tone="success">긍정 감성</Badge>
      <span className="text-xs leading-6 text-app-text-muted">
        노드 크기: 언급량 · 선 굵기: 연관 강도
      </span>
    </div>
  )
}

function SelectedKeyword({ node }: { node: NewsTopicGraphNodeView | null }) {
  if (!node) {
    return (
      <p className="px-panel py-5 text-sm text-app-text-muted">
        키워드 노드를 선택하면 관련 이벤트와 종목을 확인할 수 있습니다.
      </p>
    )
  }

  return (
    <div aria-live="polite" className="grid gap-4 px-panel py-5 md:grid-cols-2">
      <div className="md:col-span-2 flex flex-wrap items-center gap-2">
        <h3 className="font-semibold text-app-text">{node.label}</h3>
        <Badge tone={node.sentiment.tone}>{node.sentiment.label} 감성</Badge>
        <span className="text-xs text-app-text-muted">
          언급 {node.mentionCount}건
        </span>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-app-text-muted">
          관련 종목
        </p>
        {node.relatedSymbols.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-2">
            {node.relatedSymbols.map((symbol) => (
              <li key={symbol}>
                <Badge tone="info">{symbol}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-app-text-muted">관련 종목 없음</p>
        )}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-app-text-muted">
          관련 이벤트
        </p>
        {node.relatedEventIds.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-2">
            {node.relatedEventIds.map((eventId) => (
              <li key={eventId}>
                <Badge tone="accent">이벤트 #{eventId}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-app-text-muted">관련 이벤트 없음</p>
        )}
      </div>
    </div>
  )
}

export function TopicKeywordGraph({ topicId }: TopicKeywordGraphProps) {
  const graphQuery = useNewsTopicGraphQuery(topicId)
  const cytoscapeRef = useRef<Core | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const data = graphQuery.data
  const elements = useMemo(() => (data ? toElements(data) : []), [data])
  const selectedNode =
    data?.nodes.find((node) => node.id === selectedNodeId) ?? null

  const handleNodeTap = useCallback((event: EventObjectNode) => {
    setSelectedNodeId(event.target.id())
  }, [])

  const handleCytoscape = useCallback(
    (cy: Core) => {
      if (cytoscapeRef.current && cytoscapeRef.current !== cy) {
        if (!cytoscapeRef.current.destroyed()) cytoscapeRef.current.destroy()
      }
      cytoscapeRef.current = cy
      cy.off('tap', 'node', handleNodeTap)
      cy.on('tap', 'node', handleNodeTap)
    },
    [handleNodeTap],
  )

  useEffect(
    () => () => {
      const cy = cytoscapeRef.current
      if (cy && !cy.destroyed()) cy.destroy()
      cytoscapeRef.current = null
    },
    [],
  )

  return (
    <Card
      aria-labelledby="topic-keyword-graph-title"
      className="overflow-hidden p-0"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 p-panel">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-app-accent">
            Keyword network
          </p>
          <h2
            id="topic-keyword-graph-title"
            className="mt-1 text-xl font-semibold text-app-text"
          >
            키워드 관계망
          </h2>
          <p className="mt-1 text-sm leading-6 text-app-text-muted">
            감성은 노드 색과 텍스트 배지로, 연관 강도는 선 굵기로 구분합니다.
          </p>
        </div>
        <Badge tone="accent">토픽 키워드</Badge>
      </div>

      {graphQuery.isLoading ? <KeywordGraphLoading /> : null}
      {graphQuery.isError ? (
        <ErrorState
          title="키워드 관계망을 불러오지 못했습니다"
          description="다른 토픽 인사이트 패널은 계속 확인할 수 있습니다."
          onRetry={() => void graphQuery.refetch()}
        />
      ) : null}
      {!graphQuery.isLoading &&
      !graphQuery.isError &&
      data?.nodes.length === 0 ? (
        <EmptyState
          title="표시할 키워드 관계가 없습니다"
          description="연결된 키워드가 집계되면 이곳에 표시됩니다."
        />
      ) : null}
      {!graphQuery.isLoading &&
      !graphQuery.isError &&
      data &&
      data.nodes.length > 0 ? (
        <>
          <div
            role="img"
            aria-label={`키워드 ${data.nodes.length}개, 연관 관계 ${data.edges.length}개의 관계망`}
            className="h-80 border-y border-app-border bg-slate-950/50"
          >
            <Suspense fallback={<KeywordGraphLoading />}>
              <CytoscapeComponent
                elements={elements}
                stylesheet={keywordGraphStylesheet}
                layout={{
                  name: 'cose',
                  animate: false,
                  fit: true,
                  padding: 28,
                }}
                cy={handleCytoscape}
                className="h-full w-full"
                minZoom={0.5}
                maxZoom={2}
                boxSelectionEnabled={false}
              />
            </Suspense>
          </div>
          <GraphLegend />
          <SelectedKeyword node={selectedNode} />
        </>
      ) : null}
    </Card>
  )
}
