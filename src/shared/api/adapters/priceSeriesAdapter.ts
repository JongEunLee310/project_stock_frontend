import type {
  PriceBar,
  PriceBarDto,
  PriceSeries,
  PriceSeriesDto,
} from '@/shared/model'
import { parseDecimal } from '@/shared/lib/format'

export function adaptPriceBar(dto: PriceBarDto): PriceBar {
  return {
    date: dto.date,
    open: parseDecimal(dto.open),
    high: parseDecimal(dto.high),
    low: parseDecimal(dto.low),
    close: parseDecimal(dto.close),
    adjustedClose: parseDecimal(dto.adjusted_close),
    volume: dto.volume,
  }
}

export function adaptPriceSeries(dto: PriceSeriesDto): PriceSeries {
  return {
    symbol: dto.symbol,
    market: dto.market,
    currency: dto.currency,
    interval: dto.interval,
    range: dto.range,
    source: dto.source,
    lastUpdatedAt: dto.last_updated_at,
    bars: dto.bars.map(adaptPriceBar),
  }
}
