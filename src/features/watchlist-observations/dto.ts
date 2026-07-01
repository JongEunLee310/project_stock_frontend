export interface WatchlistObservationItemDto {
  symbol: string
  note: string
}

export interface WatchlistObservationsDto {
  summary: string
  items?: WatchlistObservationItemDto[] | null
  generated_at: string
}

export interface ObservationsWatchlistDto {
  id: number
}
