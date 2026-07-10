import { describe, expect, it } from 'vitest'

import { formatKstDateTime } from '@/shared/lib/format'

import {
  adaptReport,
  adaptResearchDetail,
  adaptResearchListRow,
  adaptThesis,
} from './adapters'
import type {
  AssetDetailDto,
  BuyChecklistDto,
  ReportDto,
  ResearchSummaryDto,
  ThesisDto,
} from './dto'

const detail: AssetDetailDto = {
  id: 1,
  symbol: 'NVDA',
  name: 'NVIDIA Corp.',
  market: 'NASDAQ',
  sector: 'Technology',
  market_cap: '2540000000000',
  per: '38.4',
  peg: '',
  fifty_two_week_low: '88.12',
  fifty_two_week_high: null,
  target_price: '1145.32',
  target_upside_percent: '11.8',
  next_earnings_date: '2026-08-20',
  updated_at: '2026-05-24T00:00:00.000Z',
}

const summary: ResearchSummaryDto = {
  stance: 'BUY_CANDIDATE',
  stance_confidence: '0.72',
  headline: 'AI demand remains durable',
  body: 'Margins remain the key checkpoint.',
  key_risks: [
    {
      id: 'risk-1',
      title: 'Margin pressure',
      level: 'MEDIUM',
      description: 'Gross margin normalization.',
    },
  ],
  created_at: '2026-05-24T00:00:00.000Z',
}

const checklist: BuyChecklistDto = {
  items: [
    { id: 'entry', label: 'Entry band', description: null, checked: true },
  ],
}

const report: ReportDto = {
  id: 4,
  title: 'Quarterly note',
  source: 'Internal',
  summary: null,
  created_at: '2026-05-24T00:00:00.000Z',
}

const thesis: ThesisDto = {
  id: 5,
  title: 'Latest thesis',
  summary: 'Track AI capex.',
  created_at: '2026-05-24T00:00:00.000Z',
}

describe('research adapters', () => {
  it('combines an asset and research summary into a list row', () => {
    expect(adaptResearchListRow(detail, summary)).toEqual({
      assetId: 1,
      symbol: 'NVDA',
      name: 'NVIDIA Corp.',
      market: 'NASDAQ',
      sector: 'Technology',
      stanceLabel: '매수 후보',
      summaryUpdatedAt: formatKstDateTime(summary.created_at),
    })
  })

  it('keeps list asset data when its research summary is unavailable', () => {
    expect(adaptResearchListRow(detail, null)).toEqual({
      assetId: 1,
      symbol: 'NVDA',
      name: 'NVIDIA Corp.',
      market: 'NASDAQ',
      sector: 'Technology',
      stanceLabel: null,
      summaryUpdatedAt: null,
    })
  })

  it('combines detail, summary, checklist, reports, and thesis', () => {
    const view = adaptResearchDetail(
      detail,
      summary,
      checklist,
      [report],
      thesis,
    )

    expect(view).toMatchObject({
      assetId: 1,
      symbol: 'NVDA',
      name: 'NVIDIA Corp.',
      market: 'NASDAQ',
      marketCap: 2540000000000,
      per: 38.4,
      peg: null,
      fiftyTwoWeekHigh: null,
      targetPrice: 1145.32,
      targetUpsidePercent: 11.8,
      stance: '매수 후보',
      stanceConfidence: 72,
    })
    expect(view).not.toHaveProperty('priceSparkline')
    expect(view.keyRisks[0].level).toBe('중간')
    expect(view.buyChecklist[0]).toMatchObject({
      id: 'entry',
      description: '',
      checked: true,
    })
    expect(view.reports[0].summary).toBeNull()
    expect(view.latestThesis?.title).toBe('Latest thesis')
  })

  it('supports null thesis and empty nested collections', () => {
    const view = adaptResearchDetail(
      detail,
      {
        ...summary,
        stance: 'UNKNOWN',
        key_risks: null,
        stance_confidence: null,
      },
      { items: null },
      [],
      null,
    )

    expect(view.stance).toBe('판단 보류')
    expect(view.stanceConfidence).toBeNull()
    expect(view.keyRisks).toEqual([])
    expect(view.buyChecklist).toEqual([])
    expect(view.latestThesis).toBeNull()
    expect(view).not.toHaveProperty('priceSparkline')
  })

  it('maps missing market to null', () => {
    const view = adaptResearchDetail(
      { ...detail, market: undefined },
      summary,
      checklist,
      [],
      null,
    )

    expect(view.market).toBeNull()
  })

  it('keeps stance and confidence fallbacks for null or invalid wire values', () => {
    const view = adaptResearchDetail(
      detail,
      { ...summary, stance: null, stance_confidence: 'not-a-number' },
      checklist,
      [],
      null,
    )

    expect(view.stance).toBe('판단 보류')
    expect(view.stanceConfidence).toBeNull()
  })

  it('maps report and thesis date-bearing DTOs', () => {
    expect(adaptReport(report).id).toBe('4')
    expect(adaptThesis(thesis).id).toBe('5')
  })
})
