import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

import { Sidebar } from './Sidebar'

interface UnreadAlertSummaryQueryState {
  data: { unreadCount: number; recent: unknown[] } | undefined
}

let unreadAlertSummaryQueryState: UnreadAlertSummaryQueryState

vi.mock('@/features/alerts/queries', () => ({
  useUnreadAlertSummary: () => unreadAlertSummaryQueryState,
}))

vi.mock('./MarketSummary', () => ({
  MarketSummary: () => <div data-testid="market-summary" />,
}))

vi.mock('./FxRateStrip', () => ({
  FxRateStrip: () => <div data-testid="fx-rate-strip" />,
}))

function setUnreadAlertSummaryQueryState(
  state: Partial<UnreadAlertSummaryQueryState>,
) {
  unreadAlertSummaryQueryState = {
    data: { unreadCount: 0, recent: [] },
    ...state,
  }
}

function renderSidebar() {
  return render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>,
  )
}

describe('Sidebar', () => {
  beforeEach(() => {
    setUnreadAlertSummaryQueryState({
      data: { unreadCount: 0, recent: [] },
    })
  })

  it('renders the unread alert count badge when unread alerts exist', () => {
    setUnreadAlertSummaryQueryState({
      data: { unreadCount: 12, recent: [] },
    })

    renderSidebar()

    expect(screen.getByRole('link', { name: /알림 12/ })).toBeVisible()
  })

  it('hides the alert badge when there are no unread alerts while keeping navigation visible', () => {
    renderSidebar()

    expect(screen.getByRole('link', { name: /알림/ })).toBeVisible()
    expect(screen.queryByText('6')).not.toBeInTheDocument()
  })

  it('hides the alert badge while the unread summary is unavailable', () => {
    setUnreadAlertSummaryQueryState({ data: undefined })

    renderSidebar()

    expect(screen.getByRole('link', { name: /알림/ })).toBeVisible()
    expect(screen.queryByText('6')).not.toBeInTheDocument()
  })

  it('renders the fx strip above the market summary', () => {
    renderSidebar()

    const fxRateStrip = screen.getByTestId('fx-rate-strip')
    const marketSummary = screen.getByTestId('market-summary')

    expect(fxRateStrip).toBeVisible()
    expect(
      fxRateStrip.compareDocumentPosition(marketSummary) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })
})
