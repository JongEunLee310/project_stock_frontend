import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

import { FloatingMarketCard } from './FloatingMarketCard'

vi.mock('./MarketSummary', () => ({
  MarketSummary: () => <div data-testid="market-summary" />,
}))

vi.mock('./FxRateStrip', () => ({
  FxRateStrip: () => <div data-testid="fx-rate-strip" />,
}))

describe('FloatingMarketCard', () => {
  it('renders the fx strip and market summary', () => {
    render(<FloatingMarketCard />)

    expect(screen.getByTestId('fx-rate-strip')).toBeVisible()
    expect(screen.getByTestId('market-summary')).toBeVisible()
  })
})
