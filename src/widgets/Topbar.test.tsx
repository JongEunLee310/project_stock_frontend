import { act, fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/shared/api/envelope'

import { Topbar } from './Topbar'

interface MockAuthValue {
  user: { id: number; email: string } | null
}

let authValue: MockAuthValue

const { apiGetMock, triggerAnalysisMock } = vi.hoisted(() => ({
  apiGetMock: vi.fn(),
  triggerAnalysisMock: vi.fn(),
}))

vi.mock('@/shared/auth/AuthProvider', () => ({
  useAuth: () => authValue,
}))

vi.mock('@/shared/api/client', () => ({
  apiGet: apiGetMock,
}))

vi.mock('@/features/watchlist/mutations', () => ({
  triggerAnalysis: triggerAnalysisMock,
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

async function clickRefresh() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: '새로고침' }))
  })
}

describe('Topbar', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-02T05:32:00Z'))
    authValue = {
      user: { id: 1, email: 'investor@example.com' },
    }
    apiGetMock.mockResolvedValue({
      data: [{ id: 7, user_id: 1, name: '관심종목', created_at: '' }],
    })
    triggerAnalysisMock.mockResolvedValue({
      job_id: 'job-1',
      status: 'queued',
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
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

  it('invalidates all queries and updates the KST sync time when refreshed', async () => {
    const queryClient = new QueryClient()
    const invalidateQueries = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue()

    renderTopbar(queryClient)

    expect(screen.getByText('14:32')).toBeVisible()

    vi.setSystemTime(new Date('2026-07-02T06:45:00Z'))
    await clickRefresh()

    expect(invalidateQueries).toHaveBeenCalledWith()
    expect(screen.getByText('15:45')).toBeVisible()
    expect(screen.queryByText('14:32')).not.toBeInTheDocument()
  })

  it('requests analysis before invalidating queries and renders the requested status', async () => {
    const queryClient = new QueryClient()
    const invalidateQueries = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue()

    renderTopbar(queryClient)

    await clickRefresh()

    expect(screen.getByText('동기화 요청됨')).toBeVisible()
    expect(invalidateQueries).toHaveBeenCalledWith()
    expect(triggerAnalysisMock).toHaveBeenCalledWith(7)
    expect(triggerAnalysisMock.mock.invocationCallOrder[0]).toBeLessThan(
      invalidateQueries.mock.invocationCallOrder[0],
    )
  })

  it('skips analysis and still completes synchronization when the watchlist is empty', async () => {
    apiGetMock.mockResolvedValue({ data: [] })
    const queryClient = new QueryClient()
    const invalidateQueries = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue()

    renderTopbar(queryClient)

    vi.setSystemTime(new Date('2026-07-02T06:45:00Z'))
    await clickRefresh()

    expect(triggerAnalysisMock).not.toHaveBeenCalled()
    expect(invalidateQueries).toHaveBeenCalledWith()
    expect(screen.getByText(/동기화/)).toHaveTextContent('동기화 15:45')
    expect(screen.queryByText('14:32')).not.toBeInTheDocument()
  })

  it('renders the rate-limit message and still invalidates queries', async () => {
    triggerAnalysisMock.mockRejectedValue(
      new ApiError(
        // BE contract: project_stock PR #244; docs/designs/129-sync-analysis-trigger.md §2.
        'RATE_LIMIT_EXCEEDED',
        '잠시 후 다시 시도해 주세요 (약 60초)',
      ),
    )
    const queryClient = new QueryClient()
    const invalidateQueries = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue()

    renderTopbar(queryClient)

    await clickRefresh()

    expect(
      screen.getByText('잠시 후 다시 시도해 주세요 (약 60초)'),
    ).toBeVisible()
    expect(invalidateQueries).toHaveBeenCalledWith()
    expect(screen.queryByText('14:32')).not.toBeInTheDocument()
  })

  it('keeps the trigger status idle and still invalidates queries after a network error', async () => {
    triggerAnalysisMock.mockRejectedValue(new TypeError('Failed to fetch'))
    const queryClient = new QueryClient()
    const invalidateQueries = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue()

    renderTopbar(queryClient)

    await clickRefresh()

    expect(invalidateQueries).toHaveBeenCalledWith()
    expect(screen.getByText(/동기화/)).toHaveTextContent('동기화 14:32')
    expect(screen.queryByText('동기화 요청됨')).not.toBeInTheDocument()
    expect(
      screen.queryByText('잠시 후 다시 시도해 주세요 (약 60초)'),
    ).not.toBeInTheDocument()
  })

  it('updates the sync time regardless of the trigger result', async () => {
    triggerAnalysisMock.mockRejectedValue(new Error('Server error'))
    const queryClient = new QueryClient()
    vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue()

    renderTopbar(queryClient)

    vi.setSystemTime(new Date('2026-07-02T06:45:00Z'))
    await clickRefresh()

    expect(screen.getByText('15:45')).toBeVisible()
    expect(screen.queryByText('14:32')).not.toBeInTheDocument()
  })

  it('navigates to the alerts page when the alert button is clicked', () => {
    renderTopbar()

    fireEvent.click(screen.getByRole('button', { name: '알림' }))

    expect(screen.getByText('알림 페이지')).toBeVisible()
  })
})
