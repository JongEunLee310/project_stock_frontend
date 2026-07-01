import type { WatchlistObservations } from '@/shared/model'

import type { WatchlistObservationsDto } from './dto'

export function adaptWatchlistObservations(
  dto: WatchlistObservationsDto,
): WatchlistObservations {
  return {
    summary: dto.summary,
    items: dto.items ?? [],
  }
}
