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
})
