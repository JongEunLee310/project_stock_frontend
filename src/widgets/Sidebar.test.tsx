import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

import { Sidebar } from './Sidebar'

interface AlertOverviewQueryState {
  data: { unreadCount: number } | undefined
}

let alertOverviewQueryState: AlertOverviewQueryState

vi.mock('@/features/alerts/queries', () => ({
  useAlertOverview: () => alertOverviewQueryState,
}))

function setAlertOverviewQueryState(state: Partial<AlertOverviewQueryState>) {
  alertOverviewQueryState = {
    data: { unreadCount: 0 },
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
    setAlertOverviewQueryState({
      data: { unreadCount: 0 },
    })
  })

  it('renders the unread alert count badge when unread alerts exist', () => {
    setAlertOverviewQueryState({
      data: { unreadCount: 12 },
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
    setAlertOverviewQueryState({ data: undefined })

    renderSidebar()

    expect(screen.getByRole('link', { name: /알림/ })).toBeVisible()
    expect(screen.queryByText('6')).not.toBeInTheDocument()
  })

  it('does not render the floating market widgets inside the sidebar', () => {
    renderSidebar()

    expect(screen.queryByTestId('fx-rate-strip')).not.toBeInTheDocument()
    expect(screen.queryByTestId('market-summary')).not.toBeInTheDocument()
  })
})
