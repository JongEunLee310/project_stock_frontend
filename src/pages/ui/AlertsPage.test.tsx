import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AlertsPage } from './AlertsPage'

const mutateRead = vi.fn()
const mutateDismiss = vi.fn()
const mutateCandidateRead = vi.fn()
const mutateConfirm = vi.fn()
const refetchAlerts = vi.fn()
const refetchCandidates = vi.fn()
const mockUseAlertsInbox = vi.fn()

vi.mock('@/features/alerts/queries', () => ({
  useAlertsInbox: () => mockUseAlertsInbox(),
  useMarkAlertRead: () => ({ mutate: mutateRead, isPending: false }),
  useDismissAlert: () => ({ mutate: mutateDismiss, isPending: false }),
  useMarkCandidateRead: () => ({
    mutate: mutateCandidateRead,
    isPending: false,
  }),
  useConfirmCandidate: () => ({ mutate: mutateConfirm, isPending: false }),
}))

beforeEach(() => {
  mockUseAlertsInbox.mockReturnValue({
    alerts: {
      data: [
        {
          id: '1',
          signalId: 10,
          status: '안읽음',
          statusCode: 'UNREAD',
          createdAt: '2026-06-19T00:00:00Z',
        },
      ],
      isLoading: false,
      isError: false,
      refetch: refetchAlerts,
    },
    candidates: {
      data: [
        {
          id: '2',
          candidateType: 'NEWS_SURGE',
          candidateTypeLabel: '뉴스 급증',
          importance: '높음',
          status: '안읽음',
          statusCode: 'UNREAD',
          title: 'News volume increased',
          message: 'Review before sending a notification.',
          assetId: 1,
          evidence: null,
          createdAt: '2026-06-20T00:00:00Z',
        },
      ],
      isLoading: false,
      isError: false,
      refetch: refetchCandidates,
    },
  })
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('AlertsPage', () => {
  it('renders inbox rows and calls mutations from in-app buttons', () => {
    render(<AlertsPage />)

    expect(screen.getByText('Signal #10')).toBeVisible()
    expect(screen.getByText('News volume increased')).toBeVisible()

    fireEvent.click(screen.getAllByRole('button', { name: '읽음' })[0])
    fireEvent.click(screen.getByRole('button', { name: '숨김' }))
    fireEvent.click(screen.getByRole('button', { name: '확인' }))

    expect(mutateRead).toHaveBeenCalledWith('1')
    expect(mutateDismiss).toHaveBeenCalledWith('1')
    expect(mutateConfirm).toHaveBeenCalledWith('2')
  })

  it('renders loading, error, and empty states', () => {
    mockUseAlertsInbox.mockReturnValueOnce({
      alerts: { isLoading: true, isError: false, refetch: refetchAlerts },
      candidates: {
        isLoading: false,
        isError: false,
        refetch: refetchCandidates,
      },
    })
    const loadingRender = render(<AlertsPage />)
    expect(document.querySelector('.animate-pulse')).not.toBeNull()
    loadingRender.unmount()

    mockUseAlertsInbox.mockReturnValueOnce({
      alerts: { isLoading: false, isError: true, refetch: refetchAlerts },
      candidates: {
        isLoading: false,
        isError: false,
        refetch: refetchCandidates,
      },
    })
    const errorRender = render(<AlertsPage />)
    expect(screen.getByRole('alert')).toHaveTextContent(
      '알림을 불러오지 못했습니다',
    )
    errorRender.unmount()

    mockUseAlertsInbox.mockReturnValueOnce({
      alerts: {
        data: [],
        isLoading: false,
        isError: false,
        refetch: refetchAlerts,
      },
      candidates: {
        data: [],
        isLoading: false,
        isError: false,
        refetch: refetchCandidates,
      },
    })
    render(<AlertsPage />)
    expect(screen.getByText('확인할 알림이 없습니다')).toBeVisible()
  })
})
