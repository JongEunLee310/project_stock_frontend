import type { MarketIndexBoard } from '@/shared/model'
import { parseDecimal } from '@/shared/lib/format'

import type { MarketIndexQuoteDto } from './dto'

export function adaptMarketIndexBoard(
  dtos: MarketIndexQuoteDto[],
): MarketIndexBoard {
  return {
    indices: dtos.map((dto) => ({
      symbol: dto.symbol,
      name: dto.name,
      value: parseDecimal(dto.value) ?? 0,
      changePercent: parseDecimal(dto.change_percent) ?? 0,
    })),
    referenceAt: dtos[0]?.reference_at ?? null,
  }
}
