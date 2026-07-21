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
