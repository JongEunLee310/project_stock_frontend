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

export type InvestorTypeDto = 'FOREIGN' | 'INSTITUTION' | 'RETAIL' | 'ETF'

export type FlowDirectionDto = 'BUY' | 'SELL' | 'NEUTRAL'

export interface NewsInvestorFlowsDto {
  as_of: string
  by_investor_type: Array<{
    investor_type: InvestorTypeDto
    net_value: string
    direction: FlowDirectionDto
    change: number
  }>
  narrative_alignment: {
    aligned: boolean
    note: string
  }
  availability: {
    available: boolean
    fallback: string | null
  }
}

export type FundFlowDirectionDto = 'INFLOW' | 'OUTFLOW' | 'NEUTRAL'

export type FlowLikelihoodDto = 'LOW' | 'MEDIUM' | 'HIGH'

export interface EstimatedFlowDto {
  low: string
  high: string
  currency: string
}

export interface NewsFundFlowOutlookDto {
  as_of: string
  analysis_version: string
  items: Array<{
    sector: string
    direction: FundFlowDirectionDto
    likelihood: FlowLikelihoodDto
    estimated_flow: EstimatedFlowDto | null
    horizon: string
    confidence: number
    key_assumptions: string[]
    risk_factors: string[]
  }>
}

export type ScenarioKindDto = 'OPTIMISTIC' | 'BASE' | 'CONSERVATIVE'

export interface NewsTopicScenariosDto {
  topic_id: number
  analysis_version: string
  as_of: string
  scenarios: Array<{
    scenario_kind: ScenarioKindDto
    weight: number
    expected_flow_direction: FundFlowDirectionDto
    key_assumptions: string[]
    benefiting_sectors: string[]
    risk_sectors: string[]
    related_symbols: string[]
    invalidation_conditions: string[]
  }>
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

export type TopicSymbolValuationBurdenDto = 'LOW' | 'MEDIUM' | 'HIGH'

export type TopicSymbolSignalDto =
  | 'WATCH'
  | 'RISK_ALERT'
  | 'THESIS_BROKEN'
  | 'BUY_CANDIDATE'
  | 'SELL_REVIEW'
  | 'OVERHEATED'

export interface NewsTopicSymbolSensitivityItemDto {
  symbol: string
  exposure_score: number
  impact_direction: SentimentDirectionDto
  relationship: TopicSymbolRelationshipDto
  valuation_burden: TopicSymbolValuationBurdenDto | null
  portfolio_weight: number | null
  current_signal: TopicSymbolSignalDto | null
}

export interface NewsTopicGraphNodeDto {
  id: string
  label: string
  type: 'KEYWORD'
  mention_count: number
  sentiment_score: number
  related_event_ids: number[]
  related_symbols: string[]
}

export interface NewsTopicGraphEdgeDto {
  source: string
  target: string
  strength: number
  cooccurrence_count: number
}

export interface NewsTopicGraphDto {
  nodes: NewsTopicGraphNodeDto[]
  edges: NewsTopicGraphEdgeDto[]
}

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

export interface NewsTopicExplanationDto {
  factors: Array<{
    label: string
    contribution_ratio: number
  }>
  meta: {
    analysis_version: string
    data_coverage: number
    last_updated: string
    missing_data: string[]
    counter_argument_count: number
    confidence: number
    limitations: string[]
  }
  counter_view: {
    counter_arguments: string[]
    invalidation_conditions: string[]
    already_priced_in: {
      likely: boolean
      note: string | null
    }
    contradicting_evidence: Array<{
      event_id: number
      document_id: number
      title: string
      source: string
      published_at: string
    }>
  }
}

export type MarketEventKindDto =
  | 'EARNINGS'
  | 'IR_EVENT'
  | 'POLICY'
  | 'RATE_DECISION'
  | 'SHAREHOLDER_MEETING'
  | 'PRODUCT_EVENT'
  | 'REGULATION'
  | 'LOCKUP_EXPIRY'
  | 'OTHER'

export interface NewsCalendarItemDto {
  scheduled_at: string
  event_kind: MarketEventKindDto
  title: string
  symbol: string | null
  market: string | null
  importance: number
  related_topic_ids: number[]
}

export type AgentStageDto =
  | 'COLLECT'
  | 'NORMALIZE'
  | 'EXTRACT'
  | 'CLUSTER'
  | 'SENTIMENT'
  | 'IMPACT'
  | 'LINK'

export type AgentRunStatusDto = 'RUNNING' | 'COMPLETED' | 'DELAYED' | 'FAILED'

export interface NewsAgentRunsDto {
  last_processed_at: string
  processed_documents: number
  extracted_events: number
  active_topics: number
  stages: Array<{
    name: AgentStageDto
    status: AgentRunStatusDto
    delayed: boolean
  }>
  analysis_version: string
  has_delay: boolean
}
