import { adaptPriceSeries } from '@/features/signals/adapters'
import { parseDecimal, riskLevelLabels, toLabel } from '@/shared/lib/format'
import type { ChecklistItem, PricePoint, RiskLevel } from '@/shared/model'

import type {
  AssetDetailDto,
  AssetDto,
  BuyChecklistDto,
  PriceSeriesDto,
  ResearchReportDto,
  ResearchSummaryDto,
  ThesisDto,
} from './dto'

export interface ResearchMetric {
  label: string
  value: string
}

export interface ResearchView {
  assetId: number
  symbol: string
  name: string
  market: string
  sector: string | null
  industry: string | null
  description: string | null
  price: number | null
  change: number | null
  changePercent: number | null
  currency: string
  asOf: string
  metrics: ResearchMetric[]
  pricePoints: PricePoint[]
  briefing: {
    headline: string
    body: string
    updatedAt: string
  }
  keyRisks: Array<{
    id: string
    title: string
    level: RiskLevel
    description: string
  }>
  reports: Array<{
    id: string
    summary: string
    riskLevel: RiskLevel
    createdAt: string
  }>
  thesis: {
    summary: string
    riskFactors: string | null
    invalidationConditions: string | null
  } | null
  checklist: ChecklistItem[]
  memo: string
}

function formatNullableNumber(value: string | null, suffix = '') {
  const parsed = parseDecimal(value)
  return parsed === null ? null : `${parsed.toLocaleString('en-US')}${suffix}`
}

export function adaptResearch(
  asset: AssetDto,
  detail: AssetDetailDto,
  summary: ResearchSummaryDto,
  checklist: BuyChecklistDto,
  reports: ResearchReportDto[],
  thesis: ThesisDto | null,
  prices: PriceSeriesDto | null,
): ResearchView {
  const metricCandidates: Array<ResearchMetric | null> = [
    detail.sector ? { label: '섹터', value: detail.sector } : null,
    detail.industry ? { label: '산업', value: detail.industry } : null,
    formatNullableNumber(detail.per)
      ? { label: 'PER', value: formatNullableNumber(detail.per) as string }
      : null,
    formatNullableNumber(detail.peg)
      ? { label: 'PEG', value: formatNullableNumber(detail.peg) as string }
      : null,
    detail.fifty_two_week_low && detail.fifty_two_week_high
      ? {
          label: '52주 범위',
          value: `${formatNullableNumber(
            detail.fifty_two_week_low,
          )} ~ ${formatNullableNumber(detail.fifty_two_week_high)}`,
        }
      : null,
    formatNullableNumber(detail.target_price)
      ? {
          label: '목표가',
          value: formatNullableNumber(detail.target_price) as string,
        }
      : null,
    formatNullableNumber(detail.target_upside_percent, '%')
      ? {
          label: '목표 상승여력',
          value: formatNullableNumber(
            detail.target_upside_percent,
            '%',
          ) as string,
        }
      : null,
  ]

  const pricePoints =
    prices?.bars.map((bar) => ({
      date: bar.date,
      close: parseDecimal(bar.close) ?? 0,
    })) ?? []

  return {
    assetId: asset.id,
    symbol: asset.symbol,
    name: asset.name,
    market: asset.market,
    sector: detail.sector,
    industry: detail.industry,
    description: detail.description,
    price: parseDecimal(detail.price),
    change: parseDecimal(detail.change),
    changePercent: parseDecimal(detail.change_percent),
    currency: detail.currency,
    asOf: detail.as_of,
    metrics: metricCandidates.filter(
      (metric): metric is ResearchMetric => metric !== null,
    ),
    pricePoints:
      pricePoints.length > 0
        ? pricePoints
        : adaptPriceSeries(
            prices ?? {
              symbol: asset.symbol,
              market: asset.market,
              currency: detail.currency,
              interval: '1d',
              range: '1M',
              source: 'empty',
              last_updated_at: detail.as_of,
              bars: [],
            },
          ).map((close, index) => ({ date: String(index + 1), close })),
    briefing: {
      headline: thesis?.summary ?? '최신 투자 가설 없음',
      body: [
        ...summary.positive_factors.map((item) => `긍정: ${item}`),
        ...summary.negative_factors.map((item) => `주의: ${item}`),
      ].join(' '),
      updatedAt: summary.updated_at,
    },
    keyRisks: summary.negative_factors.map((factor, index) => ({
      id: `risk-${index}`,
      title: factor,
      level: '중간',
      description: summary.items_to_verify[index] ?? factor,
    })),
    reports: reports.map((report) => ({
      id: String(report.id),
      summary: report.summary,
      riskLevel: toLabel(
        riskLevelLabels,
        report.risk_level,
        '중간',
      ) as RiskLevel,
      createdAt: report.created_at,
    })),
    thesis: thesis
      ? {
          summary: thesis.summary,
          riskFactors: thesis.risk_factors,
          invalidationConditions: thesis.invalidation_conditions,
        }
      : null,
    checklist: checklist.items.map((item) => ({
      id: item.key,
      label: item.label,
      description: item.detail,
      checked: checklist.checked_item_keys.includes(item.key),
    })),
    memo: checklist.memo ?? '',
  }
}
