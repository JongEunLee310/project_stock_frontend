import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  setupAuthenticatedUser,
  teardownAuthenticatedUser,
} from '@/test-utils/authTestSetup'

import type { ResearchView } from '@/features/research/adapters'
import { ResearchPage } from './ResearchPage'

const mockUseResearch = vi.fn()

vi.mock('@/features/research/queries', () => ({
  useResearch: (symbol: string) => mockUseResearch(symbol),
}))

const researchView: ResearchView = {
  assetId: 1,
  symbol: 'AAPL',
  name: 'Apple Inc.',
  market: 'NASDAQ',
  sector: 'Technology',
  industry: null,
  description: 'Makes devices and services.',
  price: 195.64,
  change: 2.44,
  changePercent: 1.26,
  currency: 'USD',
  asOf: '2026-06-19T00:00:00Z',
  metrics: [
    { label: 'PER', value: '31.2' },
    { label: '목표가', value: '210' },
  ],
  pricePoints: [{ date: '2026-06-24', close: 195.64 }],
  briefing: {
    headline: 'Revenue growth thesis',
    body: '긍정: 견조한 매출 성장 주의: 밸류에이션 부담',
    updatedAt: '2026-06-19T00:00:00Z',
  },
  keyRisks: [
    {
      id: 'risk-0',
      title: '밸류에이션 부담',
      level: '중간',
      description: '최근 실적 발표 원문 확인',
    },
  ],
  reports: [
    {
      id: '1',
      summary: 'AI demand remains strong',
      riskLevel: '높음',
      createdAt: '2026-06-19T00:00:00Z',
    },
  ],
  thesis: null,
  checklist: [
    {
      id: 'valuation',
      label: '밸류에이션 확인',
      description: '현재 가격 확인',
      checked: false,
    },
  ],
  memo: '',
}

beforeEach(() => {
  setupAuthenticatedUser()
  mockUseResearch.mockReturnValue({
    data: researchView,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  })
})

afterEach(() => {
  teardownAuthenticatedUser()
  vi.clearAllMocks()
})

function renderResearch(path = '/research/AAPL') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/research/:symbol" element={<ResearchPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ResearchPage', () => {
  it('renders API-backed header, metrics, briefing, risks, reports, and chart', async () => {
    renderResearch()

    expect(
      await screen.findByRole('heading', { name: 'AAPL 리서치' }),
    ).toBeVisible()
    expect(screen.getByText('Apple Inc.')).toBeVisible()
    expect(screen.getAllByText('$195.64').length).toBeGreaterThan(0)
    expect(screen.getByText('31.2')).toBeVisible()
    expect(screen.getByText('Revenue growth thesis')).toBeVisible()
    expect(screen.getByText('밸류에이션 부담')).toBeVisible()
    expect(screen.getByText('AI demand remains strong')).toBeVisible()
    expect(
      screen.getByRole('img', { name: 'AAPL 최근 가격 추이' }),
    ).toBeVisible()
  })

  it('toggles checklist and memo locally', async () => {
    renderResearch()

    await screen.findByRole('heading', { name: 'AAPL 리서치' })
    const checkbox = screen.getByRole('checkbox', { name: /밸류에이션 확인/ })
    fireEvent.click(checkbox)
    expect(checkbox).toBeChecked()

    const memo = screen.getByLabelText('내 메모')
    fireEvent.change(memo, { target: { value: 'Wait for pullback.' } })
    expect(memo).toHaveValue('Wait for pullback.')
  })

  it('renders loading, error, and empty price states', async () => {
    mockUseResearch.mockReturnValue({
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    })
    const loadingRender = render(
      <MemoryRouter initialEntries={['/research/AAPL']}>
        <Routes>
          <Route path="/research/:symbol" element={<ResearchPage />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(document.querySelector('.animate-pulse')).not.toBeNull()
    loadingRender.unmount()

    mockUseResearch.mockReturnValue({
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    })
    const errorRender = render(
      <MemoryRouter initialEntries={['/research/AAPL']}>
        <Routes>
          <Route path="/research/:symbol" element={<ResearchPage />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'AAPL 리서치 데이터를 불러오지 못했습니다',
    )
    errorRender.unmount()

    mockUseResearch.mockReturnValue({
      data: { ...researchView, pricePoints: [] },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })
    render(
      <MemoryRouter initialEntries={['/research/AAPL']}>
        <Routes>
          <Route path="/research/:symbol" element={<ResearchPage />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(await screen.findByText('가격 시계열이 없습니다')).toBeVisible()
  })
})
