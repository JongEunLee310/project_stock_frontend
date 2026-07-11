import {
  formatKstDateTime,
  parseDecimal,
  researchStanceLabels,
  riskLevelLabels,
  toLabel,
} from '@/shared/lib/format'

import type {
  AssetDetailDto,
  AssetLookupDto,
  BenchmarkComparisonDto,
  BuyChecklistDto,
  CatalystTimelineDto,
  EarningsSummaryDto,
  NewsDisclosureDto,
  PriceSeriesDto,
  ResearchCoverageDto,
  ResearchSummaryDto,
  ThesisDto,
  ValuationMetricsDto,
} from './dto'

export interface ResearchRisk {
  id: string
  title: string
  level: string
  description: string
  evidence: string[]
}

export interface ChecklistItem {
  id: string
  label: string
  description: string
  checked: boolean
}

export type NewsDisclosureSentiment = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'

export interface NewsDisclosureItem {
  id: string
  title: string
  url: string
  source: string
  publishedAt: string | null
  summary: string | null
  categoryLabel: string | null
  impactLabel: string | null
  sentiment: NewsDisclosureSentiment | null
}

export interface NewsDisclosureView {
  news: NewsDisclosureItem[]
  disclosures: NewsDisclosureItem[]
}

export interface CatalystEventItem {
  key: string
  dateLabel: string
  title: string
  typeLabel: string
  isEstimated: boolean
}

export interface ThesisItem {
  id: string
  title: string
  summary: string | null
  createdAt: string
}

export interface ResearchView {
  assetId: number
  symbol: string
  name: string
  market: string | null
  sector: string | null
  price: number | null
  change: number | null
  changePercent: number | null
  currency: string | null
  marketCap: number | null
  per: number | null
  peg: number | null
  fiftyTwoWeekLow: number | null
  fiftyTwoWeekHigh: number | null
  targetPrice: number | null
  targetUpsidePercent: number | null
  nextEarningsDate: string | null
  updatedAt: string | null
  stance: string
  stanceConfidence: number | null
  stanceComment: string | null
  confidenceBasis: string | null
  counterView: string[]
  briefing: {
    headline: string
    body: string
    positiveFactors: string[]
    cautionFactors: string[]
    nextChecks: string[]
    createdAt: string
  }
  keyRisks: ResearchRisk[]
  buyChecklist: ChecklistItem[]
  checklistMemo: string | null
  latestThesis: ThesisItem | null
}

export interface CoverageAxisItem {
  axis: string
  axisLabel: string
  isCollected: boolean
  lastUpdatedAt: string | null
  itemCount: number
}

export interface ResearchListRow {
  assetId: number
  symbol: string
  name: string
  market: string | null
  sector: string | null
  stanceLabel: string | null
  summaryUpdatedAt: string | null
}

export function adaptResearchListRow(
  asset: AssetLookupDto,
  summary: ResearchSummaryDto | null,
): ResearchListRow {
  const stance = summary?.stance?.trim()

  return {
    assetId: asset.id,
    symbol: asset.symbol,
    name: asset.name,
    market: asset.market ?? null,
    sector: asset.sector ?? null,
    stanceLabel: stance
      ? toLabel(researchStanceLabels, stance, '판단 보류')
      : null,
    summaryUpdatedAt: summary ? formatKstDateTime(summary.created_at) : null,
  }
}

export interface PriceSeriesView {
  closes: number[]
  points: PriceSeriesPoint[]
  currency: string | null
  source: string | null
  lastUpdatedAt: string | null
}

export interface PriceSeriesPoint {
  [key: string]: string | number | null
  date: string
  close: number
  volume: number | null
  ma20: number | null
}

export interface BenchmarkSeriesItem {
  kind: string
  label: string
  points: Array<{
    date: string
    returnPercent: number
  }>
}

export interface ValuationMetricItem {
  metric: string
  metricLabel: string
  value: number | null
  fiveYearMedian: number | null
  percentile: number | null
  isHighlighted: boolean
}

export interface ValuationView {
  profileLabel: string
  metrics: ValuationMetricItem[]
}

export interface EarningsQuarterItem {
  period: string
  revenue: number
  operatingIncome: number
  eps: number
  revenueYoyPercent: number | null
  operatingMarginPercent: number
  epsEstimate: number | null
  epsSurprisePercent: number | null
}

export interface EarningsView {
  quarters: EarningsQuarterItem[]
  guidance: string | null
  segments: Array<{
    name: string
    revenueSharePercent: number
    yoyGrowthPercent: number
  }>
}

export const valuationMetricLabels: Record<string, string> = {
  PER: 'PER',
  FORWARD_PER: 'Forward PER',
  PSR: 'PSR',
  PBR: 'PBR',
  EV_EBITDA: 'EV/EBITDA',
  PEG: 'PEG',
  FCF_YIELD: 'FCF 수익률',
}

export const valuationProfileLabels: Record<string, string> = {
  FINANCIAL: '금융',
  HIGH_GROWTH: '고성장',
  DEFICIT: '적자 전환 관찰',
  DIVIDEND: '배당',
  GENERAL: '일반',
}

export function adaptValuationMetrics(dto: ValuationMetricsDto): ValuationView {
  const highlightedMetrics = new Set(dto.highlighted_metrics)

  return {
    profileLabel: valuationProfileLabels[dto.profile] ?? dto.profile,
    metrics: dto.metrics.map((item) => ({
      metric: item.metric,
      metricLabel: valuationMetricLabels[item.metric] ?? item.metric,
      value: parseDecimal(item.value),
      fiveYearMedian: parseDecimal(item.five_year_median),
      percentile: item.percentile,
      isHighlighted: highlightedMetrics.has(item.metric),
    })),
  }
}

export function adaptEarningsSummary(dto: EarningsSummaryDto): EarningsView {
  return {
    quarters: dto.quarters.map((quarter) => ({
      period: quarter.period,
      revenue: parseDecimal(quarter.revenue) ?? 0,
      operatingIncome: parseDecimal(quarter.operating_income) ?? 0,
      eps: parseDecimal(quarter.eps) ?? 0,
      revenueYoyPercent: parseDecimal(quarter.revenue_yoy_percent),
      operatingMarginPercent:
        parseDecimal(quarter.operating_margin_percent) ?? 0,
      epsEstimate: parseDecimal(quarter.eps_estimate),
      epsSurprisePercent: parseDecimal(quarter.eps_surprise_percent),
    })),
    guidance: dto.guidance,
    segments: dto.segments.map((segment) => ({
      name: segment.name,
      revenueSharePercent: parseDecimal(segment.revenue_share_percent) ?? 0,
      yoyGrowthPercent: parseDecimal(segment.yoy_growth_percent) ?? 0,
    })),
  }
}

interface PricePointWithoutMovingAverage {
  date: string
  close: number
  volume: number | null
}

const MOVING_AVERAGE_WINDOW = 20

export function withMovingAverage(
  points: PricePointWithoutMovingAverage[],
): PriceSeriesPoint[] {
  return points.map((point, index) => {
    if (index < MOVING_AVERAGE_WINDOW - 1) {
      return { ...point, ma20: null }
    }

    const closes = points
      .slice(index - MOVING_AVERAGE_WINDOW + 1, index + 1)
      .map((item) => item.close)
    const total = closes.reduce((sum, close) => sum + close, 0)

    return { ...point, ma20: total / MOVING_AVERAGE_WINDOW }
  })
}

export function adaptPriceSeries(dto: PriceSeriesDto): PriceSeriesView {
  const points = withMovingAverage(
    dto.bars.flatMap((bar, index) => {
      const close = parseDecimal(bar.close)

      return close === null
        ? []
        : [
            {
              date: bar.date ?? String(index + 1),
              close,
              volume: bar.volume ?? null,
            },
          ]
    }),
  )

  return {
    closes: points.map((point) => point.close),
    points,
    currency: dto.currency ?? null,
    source: dto.source ?? null,
    lastUpdatedAt: dto.last_updated_at ?? null,
  }
}

export function adaptBenchmarkComparison(
  dto: BenchmarkComparisonDto,
): BenchmarkSeriesItem[] {
  return dto.series.map((series) => ({
    kind: series.kind,
    label: series.label,
    points: series.points.flatMap((point) => {
      const returnPercent = parseDecimal(point.return_percent)

      return returnPercent === null ? [] : [{ date: point.date, returnPercent }]
    }),
  }))
}

export const newsDisclosureCategoryLabels: Record<string, string> = {
  EARNINGS: '실적',
  PRODUCT: '제품',
  PARTNERSHIP: '파트너십',
  REGULATION: '규제',
  PERSONNEL: '인사',
  CAPITAL: '자본',
  MARKET: '시황',
  OTHER: '기타',
}

export const newsDisclosureImpactLabels: Record<string, string> = {
  LOW: '낮음',
  MEDIUM: '중간',
  HIGH: '높음',
  CRITICAL: '심각',
}

export const newsDisclosureSentimentLabels: Record<
  NewsDisclosureSentiment,
  string
> = {
  POSITIVE: '긍정',
  NEUTRAL: '중립',
  NEGATIVE: '부정',
}

export const catalystEventTypeLabels: Record<string, string> = {
  EARNINGS: '실적',
  PRODUCT: '제품',
  SHAREHOLDER_MEETING: '주주총회',
  DIVIDEND: '배당',
  REGULATORY: '규제',
  CONTRACT: '계약',
  LOCKUP: '락업 해제',
  CONFERENCE: '콘퍼런스',
  ECONOMIC: '경제지표',
  OTHER: '기타',
}

export const researchCoverageAxisLabels: Record<string, string> = {
  NEWS: '뉴스',
  PRICE: '가격',
  EARNINGS: '실적',
  VALUATION: '밸류에이션',
  DISCLOSURE: '공시',
}

function normalizeWireValue(value: string | null | undefined) {
  return value?.trim().toUpperCase() ?? ''
}

function mapKnownLabel(
  labels: Record<string, string>,
  value: string | null | undefined,
) {
  return labels[normalizeWireValue(value)] ?? null
}

function normalizeSentiment(
  value: string | null | undefined,
): NewsDisclosureSentiment | null {
  const normalizedValue = normalizeWireValue(value)

  return normalizedValue in newsDisclosureSentimentLabels
    ? (normalizedValue as NewsDisclosureSentiment)
    : null
}

export function adaptNewsDisclosure(
  dto: NewsDisclosureDto,
): NewsDisclosureView {
  const adaptItem = (
    item:
      | NewsDisclosureDto['news'][number]
      | NewsDisclosureDto['disclosures'][number],
  ): NewsDisclosureItem => ({
    id: 'id' in item ? String(item.id) : item.url,
    title: item.title,
    url: item.url,
    source: item.source,
    publishedAt: item.published_at
      ? formatKstDateTime(item.published_at)
      : null,
    summary: item.summary ?? null,
    categoryLabel: mapKnownLabel(newsDisclosureCategoryLabels, item.category),
    impactLabel: mapKnownLabel(newsDisclosureImpactLabels, item.impact_level),
    sentiment: normalizeSentiment(item.sentiment),
  })

  return {
    news: dto.news.map(adaptItem),
    disclosures: dto.disclosures.map(adaptItem),
  }
}

export function adaptCatalystTimeline(
  dto: CatalystTimelineDto,
): CatalystEventItem[] {
  const currentYear = new Date().getFullYear()

  return dto.events.map((event, index) => {
    const [year, month, day] = event.event_date.split('-')
    const dateLabel =
      Number(year) === currentYear
        ? `${month}.${day}`
        : `${year}.${month}.${day}`

    return {
      key: `${event.event_date}:${event.event_type}:${index}`,
      dateLabel,
      title: event.title,
      typeLabel:
        catalystEventTypeLabels[normalizeWireValue(event.event_type)] ?? '기타',
      isEstimated: event.is_estimated,
    }
  })
}

export function adaptResearchCoverage(
  dto: ResearchCoverageDto,
): CoverageAxisItem[] {
  return dto.axes.map((item) => ({
    axis: item.axis,
    axisLabel: researchCoverageAxisLabels[item.axis] ?? item.axis,
    isCollected: item.status === 'COLLECTED',
    lastUpdatedAt: item.last_updated_at
      ? formatKstDateTime(item.last_updated_at)
      : null,
    itemCount: item.item_count,
  }))
}

export function adaptThesis(dto: ThesisDto): ThesisItem {
  return {
    id: String(dto.id),
    title: dto.title,
    summary: dto.summary ?? null,
    createdAt: formatKstDateTime(dto.created_at),
  }
}

function normalizeStanceConfidence(
  value: string | null | undefined,
): number | null {
  const parsed = parseDecimal(value)
  return parsed === null ? null : parsed * 100
}

export function adaptResearchDetail(
  detail: AssetDetailDto,
  summary: ResearchSummaryDto,
  checklist: BuyChecklistDto,
  thesis: ThesisDto | null,
): ResearchView {
  return {
    assetId: detail.id,
    symbol: detail.symbol,
    name: detail.name,
    market: detail.market ?? null,
    sector: detail.sector ?? null,
    price: parseDecimal(detail.price),
    change: parseDecimal(detail.change),
    changePercent: parseDecimal(detail.change_percent),
    currency: detail.currency ?? null,
    marketCap: parseDecimal(detail.market_cap),
    per: parseDecimal(detail.per),
    peg: parseDecimal(detail.peg),
    fiftyTwoWeekLow: parseDecimal(detail.fifty_two_week_low),
    fiftyTwoWeekHigh: parseDecimal(detail.fifty_two_week_high),
    targetPrice: parseDecimal(detail.target_price),
    targetUpsidePercent: parseDecimal(detail.target_upside_percent),
    nextEarningsDate: detail.next_earnings_date ?? null,
    updatedAt: detail.updated_at ? formatKstDateTime(detail.updated_at) : null,
    stance: toLabel(researchStanceLabels, summary.stance ?? '', '판단 보류'),
    stanceConfidence: normalizeStanceConfidence(summary.stance_confidence),
    stanceComment: summary.stance_comment ?? null,
    confidenceBasis: summary.confidence_basis ?? null,
    counterView: summary.counter_view ?? [],
    briefing: {
      headline: summary.headline ?? '리서치 요약 없음',
      body: summary.body ?? '',
      positiveFactors: summary.positive_factors ?? [],
      cautionFactors: summary.caution_factors ?? [],
      nextChecks: summary.next_checks ?? [],
      createdAt: formatKstDateTime(summary.created_at),
    },
    keyRisks: (summary.key_risks ?? []).map((risk, index) => ({
      id: String(risk.id ?? index),
      title: risk.title,
      level: toLabel(riskLevelLabels, risk.level),
      description: risk.description,
      evidence: risk.evidence ?? [],
    })),
    buyChecklist: (checklist.items ?? []).map((item, index) => {
      const id = String(item.id ?? index)

      return {
        id,
        label: item.label,
        description: item.description ?? '',
        checked: checklist.checked_item_keys
          ? checklist.checked_item_keys.includes(id)
          : (item.checked ?? false),
      }
    }),
    checklistMemo: checklist.memo ?? null,
    latestThesis: thesis ? adaptThesis(thesis) : null,
  }
}
