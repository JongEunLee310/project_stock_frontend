import { mockPortfolio, mockSignals, mockStocks } from './domain'

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
})
