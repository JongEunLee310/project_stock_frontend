import { formatKstDateTime, formatKstTime } from '@/shared/lib/format'
import type { BadgeTone } from '@/shared/ui'

import type {
  NewsInsightEventDto,
  NewsInsightOverviewDto,
  NewsInsightSummaryMetricDto,
  NewsTopicCategoryDto,
  NewsTopicMapDto,
  NewsTopicMapNodeTypeDto,
} from './dto'

export interface InsightSummaryMetric {
  id: string
  label: string
  count: number
  change: number
  tone: BadgeTone
}

export interface BriefingHighlight {
  id: string
  text: string
  topicId: number
  evidenceCount: number
  evidenceEventIds: number[]
}

export interface NewsOverviewView {
  asOf: string
  metrics: InsightSummaryMetric[]
  briefing: {
    summary: string
    highlights: BriefingHighlight[]
    generatedAt: string
  }
}

export interface EventStatusPresentation {
  label: string
  tone: BadgeTone
  scorePercent: number
}

export interface NewsEventView {
  id: string
  eventTypeLabel: string
  documentTypeLabel: string
  documentTypeTone: BadgeTone
  symbol: string
  title: string
  summary: string
  importance: EventStatusPresentation
  sentiment: EventStatusPresentation
  sourceName: string
  sourceReliabilityPercent: number | null
  publishedAt: string
  publishedAtTime: string
  evidenceCount: number
  topicIds: number[]
}

export interface NewsTopicMapNode {
  id: string
  label: string
  type: NewsTopicMapNodeTypeDto
  mentionCount: number
  momentumScore: number
  sentimentScore: number
  category: NewsTopicCategoryDto | null
}

export interface NewsTopicMapEdge {
  source: string
  target: string
  strength: number
  cooccurrenceCount: number
}

export interface NewsTopicMap {
  nodes: NewsTopicMapNode[]
  edges: NewsTopicMapEdge[]
}

const summaryMetricDefinitions = [
  {
    key: 'high_importance_events',
    id: 'high-importance-events',
    label: '고중요 이벤트',
    tone: 'danger',
  },
  {
    key: 'sentiment_shifts',
    id: 'sentiment-shifts',
    label: '감성 급변',
    tone: 'warning',
  },
  {
    key: 'active_topic_clusters',
    id: 'active-topic-clusters',
    label: '활성 토픽 클러스터',
    tone: 'accent',
  },
  {
    key: 'fund_flow_signals',
    id: 'fund-flow-signals',
    label: '자금 흐름 시그널',
    tone: 'success',
  },
] as const satisfies ReadonlyArray<{
  key: keyof NewsInsightOverviewDto['summary']
  id: string
  label: string
  tone: BadgeTone
}>

const importancePresentations: Record<
  string,
  { label: string; tone: BadgeTone }
> = {
  HIGH: { label: '높음', tone: 'danger' },
  MEDIUM: { label: '중간', tone: 'warning' },
  LOW: { label: '낮음', tone: 'success' },
}

const sentimentPresentations: Record<
  string,
  { label: string; tone: BadgeTone }
> = {
  POSITIVE: { label: '긍정', tone: 'success' },
  NEUTRAL: { label: '중립', tone: 'neutral' },
  NEGATIVE: { label: '부정', tone: 'danger' },
  MIXED: { label: '혼합', tone: 'warning' },
}

const documentTypePresentations: Record<
  string,
  { label: string; tone: BadgeTone }
> = {
  NEWS: { label: '뉴스', tone: 'info' },
  DISCLOSURE: { label: '공시', tone: 'info' },
  EARNINGS: { label: '실적', tone: 'accent' },
  ANALYST_REPORT: { label: '애널리스트', tone: 'accent' },
  COMMUNITY: { label: '커뮤니티', tone: 'neutral' },
  COMPANY_IR: { label: '기업 IR', tone: 'info' },
}

const eventTypeLabels: Record<string, string> = {
  EARNINGS_GUIDANCE: '실적 가이던스',
  BUYBACK: '자사주 매입',
  REGULATION: '규제',
  SUPPLY_CONTRACT: '공급 계약',
  MANAGEMENT_CHANGE: '경영진 변경',
  ACCOUNTING_ISSUE: '회계 이슈',
  PRODUCTION_DISRUPTION: '생산 차질',
  OTHER: '기타',
}

function toNonNegativeInteger(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0
}

function toScorePercent(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.round(Math.min(1, Math.max(0, value)) * 100)
}

function formatDateTime(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '시각 미상' : formatKstDateTime(value)
}

function formatTime(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '시각 미상' : formatKstTime(value)
}

function adaptSummaryMetric(
  dto: NewsInsightSummaryMetricDto,
  definition: (typeof summaryMetricDefinitions)[number],
): InsightSummaryMetric {
  return {
    id: definition.id,
    label: definition.label,
    count: toNonNegativeInteger(dto.count),
    change: Number.isFinite(dto.change) ? Math.trunc(dto.change) : 0,
    tone: definition.tone,
  }
}

export function adaptNewsOverview(
  dto: NewsInsightOverviewDto,
): NewsOverviewView {
  return {
    asOf: formatDateTime(dto.as_of),
    metrics: summaryMetricDefinitions.map((definition) =>
      adaptSummaryMetric(dto.summary[definition.key], definition),
    ),
    briefing: {
      summary: dto.briefing.summary.trim(),
      highlights: dto.briefing.highlights.map((highlight, index) => ({
        id: `${highlight.topic_id}-${index}`,
        text: highlight.text.trim(),
        topicId: highlight.topic_id,
        evidenceCount: toNonNegativeInteger(highlight.evidence_count),
        evidenceEventIds: [...highlight.evidence_event_ids],
      })),
      generatedAt: formatDateTime(dto.briefing.generated_at),
    },
  }
}

export function adaptNewsEvent(dto: NewsInsightEventDto): NewsEventView {
  const importance = importancePresentations[dto.importance.level] ?? {
    label: '알 수 없음',
    tone: 'neutral' as const,
  }
  const sentiment = sentimentPresentations[dto.sentiment.direction] ?? {
    label: '알 수 없음',
    tone: 'neutral' as const,
  }
  const documentType = dto.document_type
    ? (documentTypePresentations[dto.document_type] ?? {
        label: '기타 문서',
        tone: 'neutral' as const,
      })
    : { label: '문서 미상', tone: 'neutral' as const }
  const sourceName = dto.source?.name.trim()

  return {
    id: String(dto.id),
    eventTypeLabel: eventTypeLabels[dto.event_type] ?? '기타 이벤트',
    documentTypeLabel: documentType.label,
    documentTypeTone: documentType.tone,
    symbol: dto.symbol?.trim() || '시장',
    title: dto.title.trim() || '제목 없음',
    summary: dto.summary.trim(),
    importance: {
      ...importance,
      scorePercent: toScorePercent(dto.importance.score),
    },
    sentiment: {
      ...sentiment,
      scorePercent: toScorePercent(dto.sentiment.score),
    },
    sourceName: sourceName || '출처 미상',
    sourceReliabilityPercent:
      dto.source === null ? null : toScorePercent(dto.source.reliability),
    publishedAt: formatDateTime(dto.published_at),
    publishedAtTime: formatTime(dto.published_at),
    evidenceCount: toNonNegativeInteger(dto.evidence_count),
    topicIds: [...dto.topic_ids],
  }
}

export function adaptNewsTopicMap(dto: NewsTopicMapDto): NewsTopicMap {
  return {
    nodes: dto.nodes.map((node) => ({
      id: node.id,
      label: node.label,
      type: node.type,
      mentionCount: node.mention_count,
      momentumScore: node.momentum_score,
      sentimentScore: node.sentiment_score,
      category: node.category,
    })),
    edges: dto.edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
      strength: edge.strength,
      cooccurrenceCount: edge.cooccurrence_count,
    })),
  }
}
