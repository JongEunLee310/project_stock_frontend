import { catalystCategories, newsCategories, riskLevels } from '@/shared/model'

import {
  mockDecisionLogs,
  mockPortfolio,
  mockPriorityQueue,
  mockRecentWatchlist,
  mockSignals,
  mockStockResearch,
  mockStocks,
  mockWatchlistAlertSettings,
  mockWatchlistObservations,
  mockWatchlistSummary,
} from './domain'

describe('domain mock data', () => {
  it('keeps signal symbols and portfolio values aligned with stock mocks', () => {
    const stockSymbols = new Set(mockStocks.map((stock) => stock.symbol))
    const holdingsValue = mockPortfolio.holdings.reduce(
      (totalValue, holding) => totalValue + holding.currentValue,
      0,
    )

    expect(mockSignals.every((signal) => stockSymbols.has(signal.symbol))).toBe(
      true,
    )
    expect(mockPortfolio.totalValue).toBe(holdingsValue)
  })

  it('fills extended stock fields with valid risk levels', () => {
    const stockSymbols = mockStocks.map((stock) => stock.symbol)

    expect(stockSymbols).toEqual(
      expect.arrayContaining(['NVDA', 'AAPL', 'TSLA']),
    )
    expect(
      mockStocks.every(
        (stock) =>
          stock.market.length > 0 &&
          stock.aiVerdict.length > 0 &&
          riskLevels.includes(stock.newsRisk) &&
          riskLevels.includes(stock.themeHeat) &&
          stock.lastUpdatedAt.length > 0 &&
          typeof stock.isFavorite === 'boolean',
      ),
    ).toBe(true)
  })

  it('provides watchlist summary, observations, recent additions, and alert previews', () => {
    expect(mockWatchlistSummary).toHaveLength(4)
    expect(
      mockWatchlistSummary.every((card) => card.deltaLabel.length > 0),
    ).toBe(true)
    expect(mockWatchlistObservations.length).toBeGreaterThanOrEqual(3)
    expect(mockRecentWatchlist.length).toBeGreaterThanOrEqual(3)
    expect(mockWatchlistAlertSettings.length).toBeGreaterThanOrEqual(3)
  })

  it('provides priority queue and research fixtures for follow-up pages', () => {
    expect(mockPriorityQueue.length).toBeGreaterThanOrEqual(3)
    expect(Object.keys(mockStockResearch)).toEqual(
      expect.arrayContaining(['NVDA', 'AAPL', 'TSLA', 'MSFT']),
    )
    expect(
      Object.values(mockStockResearch).every(
        (research) =>
          research.priceAsOf.length > 0 &&
          research.stanceConfidence >= 0 &&
          research.stanceConfidence <= 100 &&
          research.marketCap.length > 0 &&
          research.fiftyTwoWeekLow < research.fiftyTwoWeekHigh &&
          research.sector.length > 0 &&
          research.nextEarningsDate.length > 0 &&
          research.targetPrice > 0 &&
          research.keyRisks.length >= 3 &&
          research.news.every((news) =>
            newsCategories.includes(news.category),
          ) &&
          research.catalysts.every((catalyst) =>
            catalystCategories.includes(catalyst.category),
          ) &&
          research.checklist.every(
            (item) => item.label.length > 0 && item.description.length > 0,
          ),
      ),
    ).toBe(true)
  })

  it('keeps decision logs ready for review workflows', () => {
    expect(
      mockDecisionLogs.every(
        (decisionLog) =>
          decisionLog.decisionType.length > 0 &&
          decisionLog.cognitiveRisks.length > 0 &&
          decisionLog.reviewDate.length > 0,
      ),
    ).toBe(true)
  })
})
