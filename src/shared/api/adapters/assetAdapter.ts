import type {
  AssetBrief,
  AssetBriefDto,
  AssetDetailDto,
  StockViewModel,
} from '@/shared/model'
import { parseDecimal, parseNullableDecimal } from '@/shared/lib/format'

export function adaptAssetBrief(dto: AssetBriefDto): AssetBrief {
  return {
    symbol: dto.symbol,
    name: dto.name,
    price: parseDecimal(dto.price),
    changePercent: parseDecimal(dto.change_percent),
    sector: dto.sector ?? null,
  }
}

export function adaptAssetDetail(dto: AssetDetailDto): StockViewModel {
  return {
    assetId: dto.id,
    symbol: dto.symbol,
    name: dto.name,
    market: dto.market,
    price: parseDecimal(dto.price),
    previousClose: parseDecimal(dto.previous_close),
    change: parseDecimal(dto.change),
    changePercent: parseDecimal(dto.change_percent),
    currency: dto.currency,
    sector: dto.sector,
    industry: dto.industry,
    description: dto.description,
    per: parseNullableDecimal(dto.per),
    peg: parseNullableDecimal(dto.peg),
    fiftyTwoWeekLow: parseNullableDecimal(dto.fifty_two_week_low),
    fiftyTwoWeekHigh: parseNullableDecimal(dto.fifty_two_week_high),
    targetPrice: parseNullableDecimal(dto.target_price),
    targetUpsidePercent: parseNullableDecimal(dto.target_upside_percent),
    asOf: dto.as_of,
  }
}
