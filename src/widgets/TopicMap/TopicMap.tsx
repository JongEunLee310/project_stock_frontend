import type {
  Core,
  ElementDefinition,
  EventObjectNode,
  StylesheetJson,
} from 'cytoscape'
import { lazy, Suspense, useCallback, useEffect, useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'

import {
  type NewsTopicMap,
  type NewsTopicMapNode,
} from '@/features/news-insights'
import { appRoutePaths } from '@/shared/config/navigation'
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PanelHeader,
  PanelFreshness,
  Skeleton,
} from '@/shared/ui'

const CytoscapeComponent = lazy(() => import('react-cytoscapejs'))

const topicNodePrefix = 'topic:'

interface TopicMapProps {
  data?: NewsTopicMap
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  updatedAt?: number
}

const categoryPresentations = {
  GROWTH: { label: '성장/투자', color: '#8b5cf6' },
  REGULATION: { label: '규제/정책', color: '#f97316' },
  EARNINGS: { label: '실적/기업', color: '#0ea5e9' },
  DEMAND: { label: '수요/소비', color: '#14b8a6' },
  MARKET_EVENT: { label: '시장 이벤트', color: '#3b82f6' },
  CAPITAL_POLICY: { label: '자본정책', color: '#ec4899' },
  SUPPLY_CHAIN: { label: '공급망', color: '#eab308' },
  UNCATEGORIZED: { label: '미분류', color: '#64748b' },
} as const satisfies Record<string, { label: string; color: string }>

const topicMapStylesheet: StylesheetJson = [
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
      'background-color': '#64748b',
      'border-width': 4,
      'border-color': '#94a3b8',
      'overlay-opacity': 0,
    },
  },
  {
    selector: 'node[type = "TOPIC"]',
    style: {
      shape: 'round-rectangle',
      'font-size': 12,
      'font-weight': 700,
    },
  },
  {
    selector: 'node[sentimentScore < 0.34]',
    style: { 'border-color': '#f87171' },
  },
  {
    selector: 'node[sentimentScore >= 0.34][sentimentScore < 0.67]',
    style: { 'border-color': '#94a3b8' },
  },
  {
    selector: 'node[sentimentScore >= 0.67]',
    style: { 'border-color': '#34d399' },
  },
  ...Object.entries(categoryPresentations).flatMap(
    ([category, presentation]) =>
      category === 'UNCATEGORIZED'
        ? []
        : [
            {
              selector: `node[category = "${category}"]`,
              style: { 'background-color': presentation.color },
            },
          ],
  ),
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
      'overlay-color': '#38bdf8',
      'overlay-opacity': 0.18,
      'overlay-padding': 8,
    },
  },
]

function calculateNodeSize(node: NewsTopicMapNode): number {
  const mentionSize = Math.sqrt(node.mentionCount) * 4
  const momentumSize = node.momentumScore * 12
  return Math.min(88, 36 + mentionSize + momentumSize)
}

function toElements(data: NewsTopicMap): ElementDefinition[] {
  const nodes: ElementDefinition[] = data.nodes.map((node) => ({
    group: 'nodes',
    data: {
      id: node.id,
      label: node.label,
      type: node.type,
      mentionCount: node.mentionCount,
      momentumScore: node.momentumScore,
      sentimentScore: node.sentimentScore,
      category: node.category,
      visualSize: calculateNodeSize(node),
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

function getTopicId(nodeId: string): string | null {
  if (!nodeId.startsWith(topicNodePrefix)) return null
  const topicId = nodeId.slice(topicNodePrefix.length)
  return topicId || null
}

function TopicMapLegend() {
  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-app-border px-panel py-4"
      aria-label="카테고리 범례"
    >
      {Object.entries(categoryPresentations)
        .filter(([category]) => category !== 'UNCATEGORIZED')
        .map(([category, presentation]) => (
          <span
            key={category}
            className="inline-flex items-center gap-1.5 text-xs text-app-text-muted"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: presentation.color }}
              aria-hidden="true"
            />
            {presentation.label}
          </span>
        ))}
    </div>
  )
}

function TopicMapLoading() {
  return (
    <div role="status" className="p-panel" aria-label="토픽 맵 불러오는 중">
      <span className="sr-only">토픽 맵을 불러오는 중입니다.</span>
      <Skeleton className="h-80 w-full" />
    </div>
  )
}

export function TopicMap({
  data,
  isLoading,
  isError,
  onRetry,
  updatedAt,
}: TopicMapProps) {
  const navigate = useNavigate()
  const cytoscapeRef = useRef<Core | null>(null)

  const navigateToTopic = useCallback(
    (nodeId: string) => {
      const topicId = getTopicId(nodeId)
      if (!topicId) return
      void navigate(generatePath(appRoutePaths.newsTopicDetail, { topicId }))
    },
    [navigate],
  )

  const handleNodeTap = useCallback(
    (event: EventObjectNode) => {
      if (event.target.data('type') !== 'TOPIC') return
      navigateToTopic(event.target.id())
    },
    [navigateToTopic],
  )

  const handleCytoscape = useCallback(
    (cy: Core) => {
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

  const elements = data ? toElements(data) : []
  const topicNodes = data?.nodes.filter((node) => node.type === 'TOPIC') ?? []

  return (
    <Card aria-labelledby="topic-map-title" className="overflow-hidden p-0">
      <PanelHeader
        className="p-panel"
        title="토픽 맵"
        titleId="topic-map-title"
        controls={
          <>
            <Badge tone="accent">7일 관계망</Badge>
            <PanelFreshness updatedAt={updatedAt} />
          </>
        }
      />

      {isLoading ? <TopicMapLoading /> : null}
      {isError ? (
        <ErrorState
          title="토픽 맵을 불러오지 못했습니다"
          description="다른 인사이트 패널은 계속 확인할 수 있습니다."
          onRetry={onRetry}
        />
      ) : null}
      {!isLoading && !isError && data?.nodes.length === 0 ? (
        <EmptyState
          title="표시할 토픽 관계가 없습니다"
          description="선택한 기간에 집계된 토픽이 생기면 이곳에 표시됩니다."
        />
      ) : null}
      {!isLoading && !isError && data && data.nodes.length > 0 ? (
        <>
          <div
            role="img"
            aria-label={`토픽 ${topicNodes.length}개, 전체 노드 ${data.nodes.length}개, 연관 관계 ${data.edges.length}개의 토픽 맵`}
            className="h-[28rem] border-y border-app-border bg-slate-950/50"
          >
            <Suspense fallback={<TopicMapLoading />}>
              <CytoscapeComponent
                elements={elements}
                stylesheet={topicMapStylesheet}
                layout={{
                  name: 'cose',
                  animate: false,
                  fit: true,
                  padding: 32,
                }}
                cy={handleCytoscape}
                className="h-full w-full"
                minZoom={0.5}
                maxZoom={2}
                boxSelectionEnabled={false}
              />
            </Suspense>
          </div>
          <TopicMapLegend />
        </>
      ) : null}
    </Card>
  )
}
