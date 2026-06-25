import { render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { vi } from 'vitest'

import { appRouteObjects } from '@/app/router'
import { AuthProvider } from '@/shared/auth/AuthProvider'
import {
  setupAuthenticatedUser,
  teardownAuthenticatedUser,
} from '@/test-utils/authTestSetup'

const refetchDashboardSummary = vi.fn()
let dashboardSummaryQueryState = {
  data: {
    riskAlertCount: 3,
    importantNewsCount: 8,
    reviewSignalCount: 5,
    cashRatio: 22.7,
    riskAlertDelta: null,
    importantNewsDelta: null,
    reviewSignalDelta: null,
    cashRatioDelta: null,
  },
  error: null as Error | null,
  isError: false,
  isLoading: false,
  refetch: refetchDashboardSummary,
}

vi.mock('@/features/dashboard/queries', () => ({
  useDashboardSummary: () => dashboardSummaryQueryState,
}))

beforeEach(() => {
  setupAuthenticatedUser()
  dashboardSummaryQueryState = {
    data: {
      riskAlertCount: 3,
      importantNewsCount: 8,
      reviewSignalCount: 5,
      cashRatio: 22.7,
      riskAlertDelta: null,
      importantNewsDelta: null,
      reviewSignalDelta: null,
      cashRatioDelta: null,
    },
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchDashboardSummary,
  }
})

afterEach(() => {
  teardownAuthenticatedUser()
})

function renderDashboard() {
  const router = createMemoryRouter(appRouteObjects, {
    initialEntries: ['/'],
  })

  const renderResult = render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  )

  return { router, ...renderResult }
}

describe('DashboardPage', () => {
  it('renders the dashboard heading and today brief metrics', async () => {
    renderDashboard()

    expect(
      await screen.findByRole('heading', { name: 'AI 투자 관제실' }),
    ).toBeVisible()
    expect(screen.getByText('위험 증가 종목')).toBeVisible()
    expect(screen.getByText('중요 뉴스')).toBeVisible()
    expect(screen.getByText('검토 시그널')).toBeVisible()
    expect(screen.getByText('현금 비중')).toBeVisible()
    expect(screen.getAllByText('3').length).toBeGreaterThan(0)
    expect(screen.getAllByText('8').length).toBeGreaterThan(0)
    expect(screen.getAllByText('5').length).toBeGreaterThan(0)
    expect(screen.getByText('22.7%')).toBeVisible()
    expect(screen.queryByText('전일 대비 +1')).not.toBeInTheDocument()
  })

  it('renders loading, error, and empty states for Today Brief', async () => {
    dashboardSummaryQueryState = {
      ...dashboardSummaryQueryState,
      data: undefined as never,
      isLoading: true,
    }
    const { unmount } = renderDashboard()

    expect(
      await screen.findByRole('heading', { name: 'AI 투자 관제실' }),
    ).toBeVisible()
    expect(screen.queryByText('22.7%')).not.toBeInTheDocument()

    unmount()
    dashboardSummaryQueryState = {
      ...dashboardSummaryQueryState,
      data: undefined as never,
      error: new Error('network failed'),
      isError: true,
      isLoading: false,
    }
    const { unmount: unmountError } = renderDashboard()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Today Brief를 불러오지 못했습니다',
    )

    unmountError()
    dashboardSummaryQueryState = {
      ...dashboardSummaryQueryState,
      data: undefined as never,
      error: null,
      isError: false,
      isLoading: false,
    }
    renderDashboard()

    expect(
      await screen.findByText('Today Brief 데이터가 없습니다'),
    ).toBeVisible()
  })

  it('renders watchlist status with research links and PER/PEG metrics', async () => {
    renderDashboard()

    const table = await screen.findByRole('table', { name: '관심 종목 상태' })
    const nvdaLink = within(table).getByRole('link', { name: 'NVDA' })

    expect(nvdaLink).toHaveAttribute('href', '/research/NVDA')
    expect(within(table).getByText('NVIDIA Corp.')).toBeVisible()
    expect(within(table).getByText('관망')).toBeVisible()
    expect(within(table).getAllByText('PER').length).toBeGreaterThan(0)
    expect(within(table).getByText('60.3')).toBeVisible()
    expect(within(table).getAllByText('PEG').length).toBeGreaterThan(0)
    expect(within(table).getByText('1.32')).toBeVisible()
  })

  it('renders priority queue titles and risk badges', async () => {
    renderDashboard()

    expect(await screen.findByText('테슬라 뉴스 감성 급락')).toBeVisible()
    expect(screen.getByText('엔비디아 추가 진입 가격 점검')).toBeVisible()
    expect(screen.getAllByText('높음').length).toBeGreaterThan(0)
    expect(screen.getAllByText('중간').length).toBeGreaterThan(0)
  })

  it('renders top signals with confidence values', async () => {
    renderDashboard()

    await screen.findByRole('heading', { name: 'AI 투자 관제실' })

    expect(
      within(
        screen.getByRole('article', { name: 'NVDA 대시보드 시그널' }),
      ).getByText('86%'),
    ).toBeVisible()
    expect(
      within(
        screen.getByRole('article', { name: 'TSLA 대시보드 시그널' }),
      ).getByText('78%'),
    ).toBeVisible()
    expect(
      within(
        screen.getByRole('article', { name: 'AAPL 대시보드 시그널' }),
      ).getByText('71%'),
    ).toBeVisible()
  })

  it('renders recent decision logs with symbols and decision types', async () => {
    renderDashboard()

    const table = await screen.findByRole('table', { name: '최근 판단 기록' })

    expect(within(table).getByRole('link', { name: 'NVDA' })).toBeVisible()
    expect(within(table).getByRole('link', { name: 'TSLA' })).toBeVisible()
    expect(within(table).getAllByText('관망 유지').length).toBeGreaterThan(0)
    expect(within(table).getByText('리스크 증가 검토')).toBeVisible()
  })

  it('renders section links to related routes', async () => {
    renderDashboard()

    await screen.findByRole('heading', { name: 'AI 투자 관제실' })

    expect(
      screen.getByRole('link', { name: '더 많은 종목 보기' }),
    ).toHaveAttribute('href', '/watchlist')
    expect(
      screen.getByRole('link', { name: '전체 시그널 보기' }),
    ).toHaveAttribute('href', '/signals')
    expect(
      screen.getByRole('link', { name: '전체 기록 보기' }),
    ).toHaveAttribute('href', '/decision-log')
  })
})
