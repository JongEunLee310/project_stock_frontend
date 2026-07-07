export interface StockRecommendationDto {
  symbol: string
  name: string
  rationale: string
  reference_metrics: string[]
}

export interface WatchlistRecommendationsDto {
  recommendations: StockRecommendationDto[]
  generated_at: string
}
