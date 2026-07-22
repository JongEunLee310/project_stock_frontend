export interface NewsInsightSummaryMetricDto {
  count: number
  change: number
}

export interface NewsInsightOverviewDto {
  as_of: string
  summary: {
    high_importance_events: NewsInsightSummaryMetricDto
    sentiment_shifts: NewsInsightSummaryMetricDto
    active_topic_clusters: NewsInsightSummaryMetricDto
    fund_flow_signals: NewsInsightSummaryMetricDto
  }
  briefing: {
    summary: string
    highlights: Array<{
      text: string
      topic_id: number
      evidence_count: number
      evidence_event_ids: number[]
    }>
    generated_at: string
  }
}

export interface NewsInsightEventDto {
  id: number
  event_type: string
  document_type: string | null
  symbol: string | null
  title: string
  summary: string
  importance: {
    level: string
    score: number
  }
  sentiment: {
    direction: string
    score: number
  }
  source: {
    name: string
    reliability: number
  } | null
  published_at: string
  evidence_count: number
  topic_ids: number[]
}

export type NewsEventImportanceLevelDto = 'LOW' | 'MEDIUM' | 'HIGH'

export interface NewsEventDetailDto {
  event_type: string
  title: string
  summary: string
  importance: {
    level: NewsEventImportanceLevelDto
    score: number
    explanation: string
  }
  sentiment: {
    direction: SentimentDirectionDto
    score: number
  }
  affected_symbols: Array<{
    symbol: string
    direction: SentimentDirectionDto
    exposure_score: number
    reason: string
  }>
  evidence: Array<{
    document_id: number
    document_type: DocumentTypeDto
    source: string
    title: string
    published_at: string
    evidence_role: EvidenceRoleDto
  }>
  related_topics: Array<{
    topic_id: number
    title: string
  }>
}

export type NewsTopicMapNodeTypeDto = 'TOPIC' | 'KEYWORD'

export type NewsTopicCategoryDto =
  | 'GROWTH'
  | 'REGULATION'
  | 'EARNINGS'
  | 'DEMAND'
  | 'MARKET_EVENT'
  | 'CAPITAL_POLICY'
  | 'SUPPLY_CHAIN'

export interface NewsTopicMapNodeDto {
  id: string
  label: string
  type: NewsTopicMapNodeTypeDto
  mention_count: number
  momentum_score: number
  sentiment_score: number
  category: NewsTopicCategoryDto | null
}

export interface NewsTopicMapEdgeDto {
  source: string
  target: string
  strength: number
  cooccurrence_count: number
}

export interface NewsTopicMapDto {
  nodes: NewsTopicMapNodeDto[]
  edges: NewsTopicMapEdgeDto[]
}

export type TopicLifecycleDto =
  | 'EMERGING'
  | 'RISING'
  | 'ACTIVE'
  | 'COOLING'
  | 'ARCHIVED'

export type SentimentDirectionDto =
  | 'POSITIVE'
  | 'NEUTRAL'
  | 'NEGATIVE'
  | 'MIXED'

export type TopicSymbolRelationshipDto =
  | 'DIRECT'
  | 'SUPPLY_CHAIN'
  | 'COMPETITOR'
  | 'CUSTOMER'

export type DocumentTypeDto =
  | 'NEWS'
  | 'DISCLOSURE'
  | 'EARNINGS'
  | 'ANALYST_REPORT'
  | 'COMMUNITY'
  | 'COMPANY_IR'

export type EvidenceRoleDto =
  | 'PRIMARY'
  | 'SUPPORTING'
  | 'CONTRADICTING'
  | 'BACKGROUND'

export interface NewsTopicDetailDto {
  title: string
  tags: string[]
  lifecycle: TopicLifecycleDto
  scores: {
    impact: number
    sentiment: number
    confidence: number
    momentum: number
  }
  affected_symbols: Array<{
    symbol: string
    exposure_score: number
    impact_direction: SentimentDirectionDto
    relationship: TopicSymbolRelationshipDto
  }>
  insight: {
    summary: string
    why_it_matters: string
    key_evidence: Array<Record<string, unknown>>
    risk_points: string[]
    counter_arguments: string[]
  }
  version: number
  updated_at: string
}

export interface NewsTopicTrendDto {
  points: Array<{
    timestamp: string
    mention_count: number
    sentiment_score: number
    impact_score: number
  }>
  markers: Array<{
    timestamp: string
    label: string
    event_id: number
  }>
  source_distribution: Array<{
    source_type: DocumentTypeDto
    count: number
    share: number
  }>
}

export interface NewsTopicEvidenceItemDto {
  event_id: number
  document_id: number
  evidence_role: EvidenceRoleDto
  document_type: DocumentTypeDto
  symbol: string | null
  title: string
  summary: string
  direction: SentimentDirectionDto
  relevance_score: number
  source: string
  published_at: string
}
