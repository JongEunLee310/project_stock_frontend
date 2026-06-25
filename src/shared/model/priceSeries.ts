export interface PriceBarDto {
  date: string
  open: string
  high: string
  low: string
  close: string
  adjusted_close: string
  volume: number
}

export interface PriceSeriesDto {
  symbol: string
  market: string
  currency: string
  interval: string
  range: string
  source: string
  last_updated_at: string
  bars: PriceBarDto[]
}

export interface PriceBar {
  date: string
  open: number
  high: number
  low: number
  close: number
  adjustedClose: number
  volume: number
}

export interface PriceSeries {
  symbol: string
  market: string
  currency: string
  interval: string
  range: string
  source: string
  lastUpdatedAt: string
  bars: PriceBar[]
}
