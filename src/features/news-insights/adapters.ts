import { formatKstDateTime, formatKstTime } from '@/shared/lib/format'
import type { BadgeTone } from '@/shared/ui'

import type {
  FlowDirectionDto,
  FlowLikelihoodDto,
  FundFlowDirectionDto,
  InvestorTypeDto,
  NewsFundFlowOutlookDto,
  NewsEventDetailDto,
  NewsInvestorFlowsDto,
  NewsTopicScenariosDto,
  NewsInsightEventDto,
  NewsInsightOverviewDto,
  NewsInsightSummaryMetricDto,
  NewsTopicDetailDto,
  NewsTopicEvidenceItemDto,
  NewsTopicExplanationDto,
  NewsTopicGraphDto,
  NewsTopicTrendDto,
  NewsTopicCategoryDto,
  NewsTopicMapDto,
  NewsTopicMapNodeTypeDto,
  NewsTopicSymbolSensitivityItemDto,
  ScenarioKindDto,
} from './dto'

export interface InvestorFlowView {
  investorType: InvestorTypeDto
  investor: { label: string; tone: BadgeTone }
  netValue: string
  direction: FlowDirectionDto
  directionPresentation: { label: string; tone: BadgeTone }
  change: number
}

export interface NewsInvestorFlowsView {
  asOf: string
  byInvestorType: InvestorFlowView[]
  narrativeAlignment: {
    aligned: boolean
    note: string
  }
  availability: {
    available: boolean
    fallback: string | null
  }
}

interface PresentationView {
  label: string
  tone: BadgeTone
}

export interface FundFlowOutlookItemView {
  sector: string
  direction: PresentationView
  likelihood: PresentationView
  estimatedRange: string | null
  horizon: string
  confidencePercent: number
  keyAssumptions: string[]
  riskFactors: string[]
}

export interface NewsFundFlowOutlookView {
  asOf: string
  analysisVersion: string
  items: FundFlowOutlookItemView[]
}

export interface FundFlowScenarioView {
  kind: ScenarioKindDto
  kindPresentation: PresentationView
  weightPercent: number
  direction: PresentationView
  keyAssumptions: string[]
  benefitingSectors: string[]
  riskSectors: string[]
  relatedSymbols: string[]
  invalidationConditions: string[]
}

export interface NewsTopicScenariosView {
  topicId: string
  analysisVersion: string
  asOf: string
  scenarios: FundFlowScenarioView[]
}

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

export interface NewsEventDetailView {
  eventTypeLabel: string
  title: string
  summary: string
  importance: EventStatusPresentation & { explanation: string }
  sentiment: EventStatusPresentation
  affectedSymbols: Array<{
    symbol: string
    direction: { label: string; tone: BadgeTone }
    exposurePercent: number
    reason: string
  }>
  evidence: Array<{
    id: string
    documentId: string
    documentType: { label: string; tone: BadgeTone }
    source: string
    title: string
    publishedAt: string
    evidenceRole: { label: string; tone: BadgeTone }
  }>
  relatedTopics: Array<{
    topicId: string
    title: string
  }>
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

export interface TopicScoreView {
  id: keyof NewsTopicDetailDto['scores']
  label: string
  valuePercent: number
  tone: BadgeTone
  direction?: {
    label: string
    trendLabel: string
    indicator: '↗' | '→' | '↘'
  }
}

export interface NewsTopicDetailView {
  title: string
  tags: string[]
  lifecycle: { label: string; tone: BadgeTone }
  scores: TopicScoreView[]
  affectedSymbols: Array<{
    symbol: string
    exposurePercent: number
    direction: { label: string; tone: BadgeTone }
    relationship: { label: string; tone: BadgeTone }
  }>
  insight: {
    summary: string
    whyItMatters: string
    keyEvidence: Array<{ id: string; label: string }>
    riskPoints: string[]
    counterArguments: string[]
  }
  version: number
  updatedAt: string
}

export interface NewsTopicTrendView {
  points: Array<{
    timestamp: string
    timestampLabel: string
    mentionCount: number
    sentimentScore: number
    impactScore: number
  }>
  markers: Array<{
    timestamp: string
    timestampLabel: string
    label: string
    eventId: string
  }>
  sourceDistribution: Array<{
    sourceTypeLabel: string
    sourceTypeTone: BadgeTone
    count: number
    sharePercent: number
  }>
}

export interface NewsTopicEvidenceView {
  id: string
  eventId: string
  documentId: string
  evidenceRole: { label: string; tone: BadgeTone }
  documentType: { label: string; tone: BadgeTone }
  symbol: string
  title: string
  summary: string
  direction: { label: string; tone: BadgeTone }
  relevancePercent: number
  source: string
  publishedAt: string
}

export interface NewsTopicExplanationView {
  factors: Array<{
    label: string
    contributionRatio: number
  }>
  meta: {
    analysisVersion: string
    dataCoveragePercent: number
    lastUpdated: string
    missingData: string[]
    counterArgumentCount: number
    confidencePercent: number
    limitations: string[]
  }
  counterView: {
    counterArguments: string[]
    invalidationConditions: string[]
    alreadyPricedIn: {
      likely: boolean
      note: string | null
    }
    contradictingEvidence: Array<{
      id: string
      eventId: string
      documentId: string
      title: string
      source: string
      publishedAt: string
    }>
  }
}

export interface NewsTopicSymbolSensitivityView {
  symbol: string
  exposurePercent: number
  impactDirection: { label: string; tone: BadgeTone }
  relationship: { label: string; tone: BadgeTone }
  valuationBurden: { label: string; tone: BadgeTone } | null
  portfolioWeightPercent: number | null
  currentSignal: { label: string; tone: BadgeTone } | null
}

export interface NewsTopicGraphNodeView {
  id: string
  label: string
  type: 'KEYWORD'
  mentionCount: number
  sentimentScore: number
  sentiment: { label: string; tone: BadgeTone }
  relatedEventIds: string[]
  relatedSymbols: string[]
}

export interface NewsTopicGraphEdgeView {
  source: string
  target: string
  strength: number
  cooccurrenceCount: number
}

export interface NewsTopicGraphView {
  nodes: NewsTopicGraphNodeView[]
  edges: NewsTopicGraphEdgeView[]
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

const lifecyclePresentations: Record<
  string,
  { label: string; tone: BadgeTone }
> = {
  EMERGING: { label: '출현', tone: 'info' },
  RISING: { label: '상승', tone: 'accent' },
  ACTIVE: { label: '활성', tone: 'success' },
  COOLING: { label: '둔화', tone: 'warning' },
  ARCHIVED: { label: '보관', tone: 'neutral' },
}

const relationshipPresentations: Record<
  string,
  { label: string; tone: BadgeTone }
> = {
  DIRECT: { label: '직접 영향', tone: 'info' },
  SUPPLY_CHAIN: { label: '공급망', tone: 'warning' },
  COMPETITOR: { label: '경쟁사', tone: 'danger' },
  CUSTOMER: { label: '고객사', tone: 'accent' },
}

const valuationBurdenPresentations: Record<
  string,
  { label: string; tone: BadgeTone }
> = {
  LOW: { label: '낮음', tone: 'success' },
  MEDIUM: { label: '중간', tone: 'warning' },
  HIGH: { label: '높음', tone: 'danger' },
}

const topicSignalPresentations: Record<
  string,
  { label: string; tone: BadgeTone }
> = {
  WATCH: { label: '관찰', tone: 'info' },
  RISK_ALERT: { label: '위험 경보', tone: 'danger' },
  THESIS_BROKEN: { label: '투자 가설 훼손', tone: 'danger' },
  BUY_CANDIDATE: { label: '매수 후보', tone: 'success' },
  SELL_REVIEW: { label: '매도 검토', tone: 'warning' },
  OVERHEATED: { label: '과열', tone: 'warning' },
}

const evidenceRolePresentations: Record<
  string,
  { label: string; tone: BadgeTone }
> = {
  PRIMARY: { label: '핵심 근거', tone: 'info' },
  SUPPORTING: { label: '보조 근거', tone: 'success' },
  CONTRADICTING: { label: '반대 근거', tone: 'danger' },
  BACKGROUND: { label: '배경 정보', tone: 'neutral' },
}

export const investorTypePresentations: Record<
  InvestorTypeDto,
  { label: string; tone: BadgeTone }
> = {
  FOREIGN: { label: '외국인', tone: 'info' },
  INSTITUTION: { label: '기관', tone: 'accent' },
  RETAIL: { label: '개인', tone: 'warning' },
  ETF: { label: 'ETF', tone: 'neutral' },
}

export const flowDirectionPresentations: Record<
  FlowDirectionDto,
  { label: string; tone: BadgeTone }
> = {
  BUY: { label: '순매수', tone: 'success' },
  SELL: { label: '순매도', tone: 'danger' },
  NEUTRAL: { label: '중립', tone: 'neutral' },
}

export const fundFlowDirectionPresentations: Record<
  FundFlowDirectionDto,
  PresentationView
> = {
  INFLOW: { label: '유입 방향', tone: 'success' },
  OUTFLOW: { label: '유출 방향', tone: 'danger' },
  NEUTRAL: { label: '중립 방향', tone: 'neutral' },
}

export const flowLikelihoodPresentations: Record<
  FlowLikelihoodDto,
  PresentationView
> = {
  LOW: { label: '낮음', tone: 'neutral' },
  MEDIUM: { label: '중간', tone: 'warning' },
  HIGH: { label: '높음', tone: 'success' },
}

export const scenarioKindPresentations: Record<
  ScenarioKindDto,
  PresentationView
> = {
  OPTIMISTIC: { label: '낙관', tone: 'success' },
  BASE: { label: '기준', tone: 'info' },
  CONSERVATIVE: { label: '보수', tone: 'warning' },
}

const topicScoreDefinitions = [
  { id: 'impact', label: '종합 영향도', tone: 'danger' },
  { id: 'sentiment', label: '감성 방향', tone: 'success' },
  { id: 'confidence', label: '신뢰도', tone: 'info' },
  { id: 'momentum', label: '모멘텀', tone: 'accent' },
] as const satisfies ReadonlyArray<{
  id: keyof NewsTopicDetailDto['scores']
  label: string
  tone: BadgeTone
}>

function sentimentScorePresentation(valuePercent: number): {
  label: string
  trendLabel: string
  indicator: '↗' | '→' | '↘'
  tone: BadgeTone
} {
  if (valuePercent > 50) {
    return {
      ...sentimentPresentations.POSITIVE,
      trendLabel: '상승',
      indicator: '↗',
    }
  }
  if (valuePercent < 50) {
    return {
      ...sentimentPresentations.NEGATIVE,
      trendLabel: '하락',
      indicator: '↘',
    }
  }
  return {
    ...sentimentPresentations.NEUTRAL,
    trendLabel: '중립',
    indicator: '→',
  }
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

function sentimentForScore(score: number): { label: string; tone: BadgeTone } {
  if (score < 0.34) return sentimentPresentations.NEGATIVE
  if (score < 0.67) return sentimentPresentations.NEUTRAL
  return sentimentPresentations.POSITIVE
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

export function adaptNewsInvestorFlows(
  dto: NewsInvestorFlowsDto,
): NewsInvestorFlowsView {
  return {
    asOf: formatDateTime(dto.as_of),
    byInvestorType: dto.by_investor_type.map((item) => ({
      investorType: item.investor_type,
      investor: investorTypePresentations[item.investor_type],
      netValue: item.net_value,
      direction: item.direction,
      directionPresentation: flowDirectionPresentations[item.direction],
      change: item.change,
    })),
    narrativeAlignment: {
      aligned: dto.narrative_alignment.aligned,
      note: dto.narrative_alignment.note.trim(),
    },
    availability: {
      available: dto.availability.available,
      fallback: dto.availability.fallback?.trim() || null,
    },
  }
}

function trimStrings(values: string[]): string[] {
  return values.map((value) => value.trim()).filter(Boolean)
}

export function adaptNewsFundFlowOutlook(
  dto: NewsFundFlowOutlookDto,
): NewsFundFlowOutlookView {
  return {
    asOf: formatDateTime(dto.as_of),
    analysisVersion: dto.analysis_version.trim() || '버전 미상',
    items: dto.items.map((item) => ({
      sector: item.sector.trim() || '섹터 미상',
      direction: fundFlowDirectionPresentations[item.direction],
      likelihood: flowLikelihoodPresentations[item.likelihood],
      estimatedRange: item.estimated_range?.trim() || null,
      horizon: item.horizon.trim() || '기간 미상',
      confidencePercent: toScorePercent(item.confidence),
      keyAssumptions: trimStrings(item.key_assumptions),
      riskFactors: trimStrings(item.risk_factors),
    })),
  }
}

export function adaptNewsTopicScenarios(
  dto: NewsTopicScenariosDto,
): NewsTopicScenariosView {
  return {
    topicId: String(dto.topic_id),
    analysisVersion: dto.analysis_version.trim() || '버전 미상',
    asOf: formatDateTime(dto.as_of),
    scenarios: dto.scenarios.map((scenario) => ({
      kind: scenario.scenario_kind,
      kindPresentation: scenarioKindPresentations[scenario.scenario_kind],
      weightPercent: toScorePercent(scenario.weight),
      direction:
        fundFlowDirectionPresentations[scenario.expected_flow_direction],
      keyAssumptions: trimStrings(scenario.key_assumptions),
      benefitingSectors: trimStrings(scenario.benefiting_sectors),
      riskSectors: trimStrings(scenario.risk_sectors),
      relatedSymbols: trimStrings(scenario.related_symbols),
      invalidationConditions: trimStrings(scenario.invalidation_conditions),
    })),
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

export function adaptNewsEventDetail(
  dto: NewsEventDetailDto,
): NewsEventDetailView {
  const importance = presentationFor(
    importancePresentations,
    dto.importance.level,
    '알 수 없음',
  )
  const sentiment = presentationFor(
    sentimentPresentations,
    dto.sentiment.direction,
    '알 수 없음',
  )

  return {
    eventTypeLabel: eventTypeLabels[dto.event_type] ?? '기타 이벤트',
    title: dto.title.trim() || '제목 없음',
    summary: dto.summary.trim(),
    importance: {
      ...importance,
      scorePercent: toScorePercent(dto.importance.score),
      explanation: dto.importance.explanation.trim(),
    },
    sentiment: {
      ...sentiment,
      scorePercent: toScorePercent(dto.sentiment.score),
    },
    affectedSymbols: dto.affected_symbols.map((item) => ({
      symbol: item.symbol.trim() || '종목 미상',
      direction: presentationFor(
        sentimentPresentations,
        item.direction,
        '방향 미상',
      ),
      exposurePercent: toScorePercent(item.exposure_score),
      reason: item.reason.trim(),
    })),
    evidence: dto.evidence.map((item) => ({
      id: String(item.document_id),
      documentId: String(item.document_id),
      documentType: presentationFor(
        documentTypePresentations,
        item.document_type,
        '기타 문서',
      ),
      source: item.source.trim() || '출처 미상',
      title: item.title.trim() || '제목 없음',
      publishedAt: formatDateTime(item.published_at),
      evidenceRole: presentationFor(
        evidenceRolePresentations,
        item.evidence_role,
        '근거 역할 미상',
      ),
    })),
    relatedTopics: dto.related_topics.map((topic) => ({
      topicId: String(topic.topic_id),
      title: topic.title.trim() || '제목 없는 토픽',
    })),
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

export function adaptNewsTopicSymbols(
  dto: NewsTopicSymbolSensitivityItemDto[],
): NewsTopicSymbolSensitivityView[] {
  return dto.map((item) => ({
    symbol: item.symbol.trim() || '종목 미상',
    exposurePercent: toScorePercent(item.exposure_score),
    impactDirection: presentationFor(
      sentimentPresentations,
      item.impact_direction,
      '방향 미상',
    ),
    relationship: presentationFor(
      relationshipPresentations,
      item.relationship,
      '관계 미상',
    ),
    valuationBurden:
      item.valuation_burden === null
        ? null
        : presentationFor(
            valuationBurdenPresentations,
            item.valuation_burden,
            '부담 미상',
          ),
    portfolioWeightPercent:
      item.portfolio_weight === null
        ? null
        : toScorePercent(item.portfolio_weight),
    currentSignal:
      item.current_signal === null
        ? null
        : presentationFor(
            topicSignalPresentations,
            item.current_signal,
            '시그널 미상',
          ),
  }))
}

export function adaptNewsTopicGraph(
  dto: NewsTopicGraphDto,
): NewsTopicGraphView {
  return {
    nodes: dto.nodes.map((node) => ({
      id: node.id,
      label: node.label.trim() || '키워드 없음',
      type: node.type,
      mentionCount: node.mention_count,
      sentimentScore: node.sentiment_score,
      sentiment: sentimentForScore(node.sentiment_score),
      relatedEventIds: node.related_event_ids.map(String),
      relatedSymbols: node.related_symbols.map((symbol) => symbol.trim()),
    })),
    edges: dto.edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
      strength: edge.strength,
      cooccurrenceCount: edge.cooccurrence_count,
    })),
  }
}

function presentationFor(
  presentations: Record<string, { label: string; tone: BadgeTone }>,
  value: string,
  fallbackLabel: string,
) {
  return (
    presentations[value] ?? {
      label: fallbackLabel,
      tone: 'neutral' as const,
    }
  )
}

function adaptKeyEvidence(
  evidence: Record<string, unknown>,
  index: number,
): { id: string; label: string } {
  const eventId = evidence.event_id
  const labelCandidate =
    evidence.title ?? evidence.summary ?? evidence.quote ?? evidence.text
  const label =
    typeof labelCandidate === 'string' && labelCandidate.trim()
      ? labelCandidate.trim()
      : typeof eventId === 'number' || typeof eventId === 'string'
        ? `이벤트 #${String(eventId)}`
        : `핵심 근거 ${index + 1}`

  return {
    id: `${typeof eventId === 'number' || typeof eventId === 'string' ? String(eventId) : 'evidence'}-${index}`,
    label,
  }
}

export function adaptNewsTopicDetail(
  dto: NewsTopicDetailDto,
): NewsTopicDetailView {
  return {
    title: dto.title.trim() || '제목 없는 토픽',
    tags: dto.tags.map((tag) => tag.trim()).filter(Boolean),
    lifecycle: presentationFor(
      lifecyclePresentations,
      dto.lifecycle,
      '상태 미상',
    ),
    scores: topicScoreDefinitions.map((definition) => {
      const valuePercent = toScorePercent(dto.scores[definition.id])
      if (definition.id !== 'sentiment') {
        return { ...definition, valuePercent }
      }
      const sentiment = sentimentScorePresentation(valuePercent)
      return {
        ...definition,
        valuePercent,
        tone: sentiment.tone,
        direction: {
          label: sentiment.label,
          trendLabel: sentiment.trendLabel,
          indicator: sentiment.indicator,
        },
      }
    }),
    affectedSymbols: dto.affected_symbols.map((item) => ({
      symbol: item.symbol.trim() || '종목 미상',
      exposurePercent: toScorePercent(item.exposure_score),
      direction: presentationFor(
        sentimentPresentations,
        item.impact_direction,
        '방향 미상',
      ),
      relationship: presentationFor(
        relationshipPresentations,
        item.relationship,
        '관계 미상',
      ),
    })),
    insight: {
      summary: dto.insight.summary.trim(),
      whyItMatters: dto.insight.why_it_matters.trim(),
      keyEvidence: dto.insight.key_evidence.map(adaptKeyEvidence),
      riskPoints: dto.insight.risk_points.map((point) => point.trim()),
      counterArguments: dto.insight.counter_arguments.map((point) =>
        point.trim(),
      ),
    },
    version: dto.version,
    updatedAt: formatDateTime(dto.updated_at),
  }
}

export function adaptNewsTopicTrend(
  dto: NewsTopicTrendDto,
): NewsTopicTrendView {
  return {
    points: dto.points.map((point) => ({
      timestamp: point.timestamp,
      timestampLabel: formatDateTime(point.timestamp),
      mentionCount: point.mention_count,
      sentimentScore: point.sentiment_score,
      impactScore: point.impact_score,
    })),
    markers: dto.markers.map((marker) => ({
      timestamp: marker.timestamp,
      timestampLabel: formatDateTime(marker.timestamp),
      label: marker.label.trim() || '이벤트',
      eventId: String(marker.event_id),
    })),
    sourceDistribution: dto.source_distribution.map((source) => {
      const presentation = presentationFor(
        documentTypePresentations,
        source.source_type,
        '기타 문서',
      )
      return {
        sourceTypeLabel: presentation.label,
        sourceTypeTone: presentation.tone,
        count: source.count,
        sharePercent: toScorePercent(source.share),
      }
    }),
  }
}

export function adaptNewsTopicEvidence(
  dto: NewsTopicEvidenceItemDto,
): NewsTopicEvidenceView {
  return {
    id: `${dto.event_id}-${dto.document_id}`,
    eventId: String(dto.event_id),
    documentId: String(dto.document_id),
    evidenceRole: presentationFor(
      evidenceRolePresentations,
      dto.evidence_role,
      '근거 역할 미상',
    ),
    documentType: presentationFor(
      documentTypePresentations,
      dto.document_type,
      '기타 문서',
    ),
    symbol: dto.symbol?.trim() || '시장',
    title: dto.title.trim() || '제목 없음',
    summary: dto.summary.trim(),
    direction: presentationFor(
      sentimentPresentations,
      dto.direction,
      '방향 미상',
    ),
    relevancePercent: toScorePercent(dto.relevance_score),
    source: dto.source.trim() || '출처 미상',
    publishedAt: formatDateTime(dto.published_at),
  }
}

export function adaptNewsTopicExplanation(
  dto: NewsTopicExplanationDto,
): NewsTopicExplanationView {
  return {
    factors: dto.factors.map((factor) => ({
      label: factor.label.trim() || '요인명 없음',
      contributionRatio: factor.contribution_ratio,
    })),
    meta: {
      analysisVersion: dto.meta.analysis_version.trim() || '버전 미상',
      dataCoveragePercent: toScorePercent(dto.meta.data_coverage),
      lastUpdated: formatDateTime(dto.meta.last_updated),
      missingData: trimStrings(dto.meta.missing_data),
      counterArgumentCount: toNonNegativeInteger(
        dto.meta.counter_argument_count,
      ),
      confidencePercent: toScorePercent(dto.meta.confidence),
      limitations: trimStrings(dto.meta.limitations),
    },
    counterView: {
      counterArguments: trimStrings(dto.counter_view.counter_arguments),
      invalidationConditions: trimStrings(
        dto.counter_view.invalidation_conditions,
      ),
      alreadyPricedIn: {
        likely: dto.counter_view.already_priced_in.likely,
        note: dto.counter_view.already_priced_in.note?.trim() || null,
      },
      contradictingEvidence: dto.counter_view.contradicting_evidence.map(
        (evidence) => ({
          id: `${evidence.event_id}-${evidence.document_id}`,
          eventId: String(evidence.event_id),
          documentId: String(evidence.document_id),
          title: evidence.title.trim() || '제목 없음',
          source: evidence.source.trim() || '출처 미상',
          publishedAt: formatDateTime(evidence.published_at),
        }),
      ),
    },
  }
}
