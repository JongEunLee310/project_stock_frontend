import { parseDecimal } from '@/shared/lib/format'

import type { ExchangeRateDto } from './dto'

export interface FxRate {
  pair: string
  rate: number
  changePercent: number
  referenceAt: string
}

export function adaptFxRates(dtos: ExchangeRateDto[]): FxRate[] {
  return dtos.map((dto) => ({
    pair: dto.pair,
    rate: parseDecimal(dto.rate) ?? 0,
    changePercent: parseDecimal(dto.change_percent) ?? 0,
    referenceAt: dto.reference_at,
  }))
}

export function findFxRateByPair(
  rates: FxRate[] | undefined,
  pair: string,
): FxRate | undefined {
  return rates?.find((rate) => rate.pair === pair)
}
