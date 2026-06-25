import { adaptAssetBrief, adaptAssetDetail } from './assetAdapter'
import type { AssetBriefDto, AssetDetailDto } from '@/shared/model'

describe('assetAdapter', () => {
  it('adapts AssetBriefDto decimals and preserves null sector', () => {
    const dto = {
      symbol: '005930',
      name: 'Samsung Electronics',
      price: '74000.50',
      change_percent: '-1.25',
      sector: null,
    } satisfies AssetBriefDto

    expect(adaptAssetBrief(dto)).toEqual({
      symbol: '005930',
      name: 'Samsung Electronics',
      price: 74000.5,
      changePercent: -1.25,
      sector: null,
    })
  })

  it('adapts AssetDetailDto and preserves nullable fundamentals', () => {
    const dto = {
      id: 10,
      symbol: 'AAPL',
      name: 'Apple Inc.',
      market: 'NASDAQ',
      price: '210.12',
      previous_close: '208.00',
      change: '2.12',
      change_percent: '1.02',
      currency: 'USD',
      sector: 'Technology',
      industry: null,
      description: null,
      as_of: '2026-06-24T15:00:00Z',
      per: null,
      peg: null,
      fifty_two_week_low: null,
      fifty_two_week_high: '240.00',
      target_price: null,
      target_upside_percent: null,
    } satisfies AssetDetailDto

    expect(adaptAssetDetail(dto)).toMatchObject({
      assetId: 10,
      price: 210.12,
      previousClose: 208,
      sector: 'Technology',
      industry: null,
      description: null,
      per: null,
      peg: null,
      fiftyTwoWeekLow: null,
      fiftyTwoWeekHigh: 240,
      targetPrice: null,
      targetUpsidePercent: null,
    })
  })
})
