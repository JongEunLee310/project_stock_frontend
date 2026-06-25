import { describe, expect, it } from 'vitest'

import { adaptResearch } from './adapters'
import type {
  AssetDetailDto,
  AssetDto,
  BuyChecklistDto,
  ResearchSummaryDto,
} from './dto'

const asset: AssetDto = {
  id: 1,
  symbol: 'AAPL',
  name: 'Apple Inc.',
  market: 'NASDAQ',
  is_active: true,
  created_at: '2026-06-19T00:00:00Z',
}

const detail: AssetDetailDto = {
  id: 1,
  symbol: 'AAPL',
  name: 'Apple Inc.',
  market: 'NASDAQ',
  price: '195.64',
  previous_close: '193.20',
  change: '2.44',
  change_percent: '1.26',
  currency: 'USD',
  sector: 'Technology',
  industry: null,
  description: 'Makes devices and services.',
  as_of: '2026-06-19T00:00:00Z',
  per: '31.2',
  peg: null,
  fifty_two_week_low: null,
  fifty_two_week_high: null,
  target_price: '210.00',
  target_upside_percent: '',
}

const summary: ResearchSummaryDto = {
  asset_id: 1,
  positive_factors: ['견조한 매출 성장'],
  negative_factors: ['밸류에이션 부담'],
  items_to_verify: ['최근 실적 발표 원문 확인'],
  sources: [],
  updated_at: '2026-06-19T00:00:00Z',
}

const checklist: BuyChecklistDto = {
  asset_id: 1,
  items: [
    {
      key: 'valuation',
      label: '밸류에이션 확인',
      status: 'pending',
      detail: '현재 가격 확인',
    },
  ],
  memo: null,
  checked_item_keys: [],
  is_complete: false,
  decided_at: null,
}

describe('research adapters', () => {
  it('maps contract DTOs to research view and hides nullable fundamentals', () => {
    const view = adaptResearch(
      asset,
      detail,
      summary,
      checklist,
      [],
      null,
      null,
    )

    expect(view.symbol).toBe('AAPL')
    expect(view.price).toBe(195.64)
    expect(view.metrics.map((metric) => metric.label)).toEqual([
      '섹터',
      'PER',
      '목표가',
    ])
    expect(view.checklist[0]).toMatchObject({ id: 'valuation', checked: false })
  })

  it('maps reports, risk labels, thesis, and price bars', () => {
    const view = adaptResearch(
      asset,
      detail,
      summary,
      checklist,
      [
        {
          id: 7,
          asset_id: 1,
          thesis_id: 1,
          summary: 'AI demand remains strong',
          positive_factors: [],
          negative_factors: [],
          risk_level: 'HIGH',
          thesis_conflict_status: 'NONE',
          conflict_reason: null,
          news_item_ids: [],
          created_at: '2026-06-19T00:00:00Z',
        },
      ],
      {
        id: 1,
        user_id: 1,
        asset_id: 1,
        summary: 'Revenue growth thesis',
        risk_factors: null,
        invalidation_conditions: null,
        is_active: true,
        created_at: '2026-06-19T00:00:00Z',
      },
      {
        symbol: 'AAPL',
        market: 'NASDAQ',
        currency: 'USD',
        interval: '1d',
        range: '3M',
        source: 'mock',
        last_updated_at: '2026-06-25T06:00:00Z',
        bars: [
          {
            date: '2026-06-24',
            open: '1',
            high: '1',
            low: '1',
            close: '195.64',
            adjusted_close: '195.64',
            volume: 1,
          },
        ],
      },
    )

    expect(view.reports[0]).toMatchObject({ id: '7', riskLevel: '높음' })
    expect(view.thesis?.summary).toBe('Revenue growth thesis')
    expect(view.pricePoints).toEqual([{ date: '2026-06-24', close: 195.64 }])
  })
})
