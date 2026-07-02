import {
  formatKstDateTime,
  parseDecimal,
  riskLevelLabels,
  toLabel,
} from '@/shared/lib/format'

import type {
  AssetDetailDto,
  BuyChecklistDto,
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
  reports: ReportItem[]
  latestThesis: ThesisItem | null
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
    marketCap: parseDecimal(detail.market_cap),
    per: parseDecimal(detail.per),
    peg: parseDecimal(detail.peg),
    fiftyTwoWeekLow: parseDecimal(detail.fifty_two_week_low),
    fiftyTwoWeekHigh: parseDecimal(detail.fifty_two_week_high),
    targetPrice: parseDecimal(detail.target_price),
    targetUpsidePercent: parseDecimal(detail.target_upside_percent),
    nextEarningsDate: detail.next_earnings_date ?? null,
    updatedAt: detail.updated_at ? formatKstDateTime(detail.updated_at) : null,
    stance: summary.stance ?? '판단 보류',
    stanceConfidence: parseDecimal(summary.stance_confidence),
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
    buyChecklist: (checklist.items ?? []).map((item, index) => ({
      id: String(item.id ?? index),
      label: item.label,
      description: item.description ?? '',
      checked: item.checked ?? false,
    })),
    reports: reports.map(adaptReport),
    latestThesis: thesis ? adaptThesis(thesis) : null,
  }
}
