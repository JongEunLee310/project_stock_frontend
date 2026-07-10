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
  BuyChecklistDto,
  PriceSeriesDto,
  ReportDto,
  ResearchSummaryDto,
  ThesisDto,
} from './dto'

export interface ResearchRisk {
  id: string
  title: string
  level: string
  description: string
}

export interface ChecklistItem {
  id: string
  label: string
  description: string
  checked: boolean
}

export interface ReportItem {
  id: string
  title: string
  source: string | null
  summary: string | null
  createdAt: string
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
  briefing: { headline: string; body: string; createdAt: string }
  keyRisks: ResearchRisk[]
  buyChecklist: ChecklistItem[]
  checklistMemo: string | null
  reports: ReportItem[]
  latestThesis: ThesisItem | null
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
  currency: string | null
  source: string | null
  lastUpdatedAt: string | null
}

export function adaptPriceSeries(dto: PriceSeriesDto): PriceSeriesView {
  return {
    closes: dto.bars
      .map((bar) => parseDecimal(bar.close))
      .filter((close): close is number => close !== null),
    currency: dto.currency ?? null,
    source: dto.source ?? null,
    lastUpdatedAt: dto.last_updated_at ?? null,
  }
}

export function adaptReport(dto: ReportDto): ReportItem {
  return {
    id: String(dto.id),
    title: dto.title,
    source: dto.source ?? null,
    summary: dto.summary ?? null,
    createdAt: formatKstDateTime(dto.created_at),
  }
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
  reports: ReportDto[],
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
    briefing: {
      headline: summary.headline ?? '리서치 요약 없음',
      body: summary.body ?? '',
      createdAt: formatKstDateTime(summary.created_at),
    },
    keyRisks: (summary.key_risks ?? []).map((risk, index) => ({
      id: String(risk.id ?? index),
      title: risk.title,
      level: toLabel(riskLevelLabels, risk.level),
      description: risk.description,
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
    reports: reports.map(adaptReport),
    latestThesis: thesis ? adaptThesis(thesis) : null,
  }
}
