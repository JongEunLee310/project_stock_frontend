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
  useNewsTopicMapQuery,
} from '@/features/news-insights'
import { appRoutePaths } from '@/shared/config/navigation'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
} from '@/shared/ui'

const CytoscapeComponent = lazy(() => import('react-cytoscapejs'))

const topicNodePrefix = 'topic:'

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

const sentimentPresentations = [
  { label: '부정 0–33%', color: '#f87171' },
  { label: '중립 34–66%', color: '#94a3b8' },
  { label: '긍정 67–100%', color: '#34d399' },
] as const

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
    <div className="space-y-3 border-t border-app-border px-panel py-4">
      <div
        className="flex flex-wrap items-center gap-x-4 gap-y-2"
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
      <div className="flex flex-wrap items-center gap-3" aria-label="감성 범례">
        <span className="text-xs font-semibold text-app-text-muted">
          감성 테두리
        </span>
        {sentimentPresentations.map((presentation) => (
          <span
            key={presentation.label}
            className="inline-flex items-center gap-1.5 text-xs text-app-text-muted"
          >
            <span
              className="h-3 w-3 rounded-full border-[3px] bg-app-surface-muted"
              style={{ borderColor: presentation.color }}
              aria-hidden="true"
            />
            {presentation.label}
          </span>
        ))}
      </div>
      <div
        className="flex flex-wrap items-center gap-3"
        aria-label="연관 강도 범례"
      >
        <span className="text-xs font-semibold text-app-text-muted">
          연관 강도
        </span>
        <span className="inline-flex items-center gap-2 text-xs text-app-text-muted">
          <span className="h-px w-8 bg-slate-500" aria-hidden="true" /> 약함
        </span>
        <span className="inline-flex items-center gap-2 text-xs text-app-text-muted">
          <span className="h-1.5 w-8 bg-slate-500" aria-hidden="true" /> 강함
        </span>
      </div>
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

export function TopicMap() {
  const topicMapQuery = useNewsTopicMapQuery()
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

  const data = topicMapQuery.data
  const elements = data ? toElements(data) : []
  const topicNodes = data?.nodes.filter((node) => node.type === 'TOPIC') ?? []

  return (
    <Card aria-labelledby="topic-map-title" className="overflow-hidden p-0">
      <div className="flex flex-wrap items-start justify-between gap-3 p-panel">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-app-accent">
            Topic network
          </p>
          <h2
            id="topic-map-title"
            className="mt-1 text-xl font-semibold text-app-text"
          >
            토픽 맵
          </h2>
          <p className="mt-1 text-sm leading-6 text-app-text-muted">
            노드 크기는 언급량·모멘텀, 테두리는 감성, 선 굵기는 연관 강도를
            나타냅니다.
          </p>
        </div>
        <Badge tone="accent">7일 관계망</Badge>
      </div>

      {topicMapQuery.isLoading ? <TopicMapLoading /> : null}
      {topicMapQuery.isError ? (
        <ErrorState
          title="토픽 맵을 불러오지 못했습니다"
          description="다른 인사이트 패널은 계속 확인할 수 있습니다."
          onRetry={() => void topicMapQuery.refetch()}
        />
      ) : null}
      {!topicMapQuery.isLoading &&
      !topicMapQuery.isError &&
      data?.nodes.length === 0 ? (
        <EmptyState
          title="표시할 토픽 관계가 없습니다"
          description="선택한 기간에 집계된 토픽이 생기면 이곳에 표시됩니다."
        />
      ) : null}
      {!topicMapQuery.isLoading &&
      !topicMapQuery.isError &&
      data &&
      data.nodes.length > 0 ? (
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
          {topicNodes.length > 0 ? (
            <div className="border-t border-app-border px-panel py-4">
              <p className="mb-2 text-xs font-semibold text-app-text-muted">
                토픽 바로가기
              </p>
              <div className="flex flex-wrap gap-2">
                {topicNodes.map((node) => (
                  <Button
                    key={node.id}
                    variant="ghost"
                    className="min-h-8 px-2.5 py-1 text-xs"
                    onClick={() => navigateToTopic(node.id)}
                  >
                    {node.label}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </Card>
  )
}
