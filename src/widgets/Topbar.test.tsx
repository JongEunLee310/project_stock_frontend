import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Topbar } from './Topbar'

interface MockAuthValue {
  user: { id: number; email: string } | null
}

let authValue: MockAuthValue

vi.mock('@/shared/auth/AuthProvider', () => ({
  useAuth: () => authValue,
}))

function renderTopbar(queryClient = new QueryClient()) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/']}>
        <Topbar />
        <Routes>
          <Route path="/" element={<div>홈</div>} />
          <Route path="/alerts" element={<div>알림 페이지</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('Topbar', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-02T05:32:00Z'))
    authValue = {
      user: { id: 1, email: 'investor@example.com' },
    }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the uppercase first letter from the user email local part', () => {
    renderTopbar()

    expect(screen.getByText('I')).toBeVisible()
  })

  it('renders the fallback profile initial when there is no user', () => {
    authValue = { user: null }

    renderTopbar()

    expect(screen.getByText('IC')).toBeVisible()
  })

  it('invalidates all queries and updates the KST sync time when refreshed', () => {
    const queryClient = new QueryClient()
    const invalidateQueries = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue()

    renderTopbar(queryClient)

    expect(screen.getByText('14:32')).toBeVisible()

    vi.setSystemTime(new Date('2026-07-02T06:45:00Z'))
    fireEvent.click(screen.getByRole('button', { name: '새로고침' }))

    expect(invalidateQueries).toHaveBeenCalledWith()
    expect(screen.getByText('15:45')).toBeVisible()
    expect(screen.queryByText('14:32')).not.toBeInTheDocument()
  })

  it('navigates to the alerts page when the alert button is clicked', () => {
    renderTopbar()

    fireEvent.click(screen.getByRole('button', { name: '알림' }))

    expect(screen.getByText('알림 페이지')).toBeVisible()
  })
})
