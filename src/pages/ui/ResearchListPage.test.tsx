import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

import type { ResearchListRow } from '@/features/research/adapters'

import { ResearchListPage } from './ResearchListPage'

interface ResearchListQueryState {
  data: ResearchListRow[] | undefined
  error: Error | null
  isError: boolean
  isLoading: boolean
  refetch: () => unknown
}

const researchRows: ResearchListRow[] = [
  {
    assetId: 11,
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    market: 'NASDAQ',
    sector: 'Technology',
    stanceLabel: '매수 후보',
    summaryUpdatedAt: '2026. 5. 24. 오전 9:00',
  },
  {
    assetId: 12,
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    market: 'NASDAQ',
    sector: 'Consumer Cyclical',
    stanceLabel: null,
    summaryUpdatedAt: null,
  },
]

const refetchResearchList = vi.fn()
let researchListQueryState: ResearchListQueryState

vi.mock('@/features/research/queries', () => ({
  useResearchList: () => researchListQueryState,
}))

beforeEach(() => {
  refetchResearchList.mockReset()
  researchListQueryState = {
    data: researchRows,
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchResearchList,
  }
})

function renderResearchList() {
  return render(
    <MemoryRouter>
      <ResearchListPage />
    </MemoryRouter>,
  )
}

describe('ResearchListPage', () => {
  it('renders the research table and detail links', () => {
    renderResearchList()

    const table = screen.getByRole('table', { name: '리서치 종목 목록' })

    expect(screen.getByRole('heading', { name: '리서치 목록' })).toBeVisible()
    expect(
      within(table).getByRole('columnheader', { name: '종목' }),
    ).toBeVisible()
    expect(
      within(table).getByRole('columnheader', { name: '시장' }),
    ).toBeVisible()
    expect(
      within(table).getByRole('columnheader', { name: '섹터' }),
    ).toBeVisible()
    expect(
      within(table).getByRole('columnheader', { name: 'AI 판단' }),
    ).toBeVisible()
    expect(
      within(table).getByRole('columnheader', { name: '마지막 갱신' }),
    ).toBeVisible()
    expect(within(table).getByText('NVIDIA Corp.')).toBeVisible()
    expect(within(table).getByText('매수 후보')).toBeVisible()
    expect(within(table).getByRole('link', { name: 'NVDA' })).toHaveAttribute(
      'href',
      '/research/NVDA',
    )
  })

  it('filters rows by company name and ticker', () => {
    renderResearchList()

    const searchInput = screen.getByLabelText('종목명·티커 검색')

    fireEvent.change(searchInput, { target: { value: 'tesla' } })

    expect(screen.getByRole('link', { name: 'TSLA' })).toBeVisible()
    expect(screen.queryByRole('link', { name: 'NVDA' })).not.toBeInTheDocument()

    fireEvent.change(searchInput, { target: { value: 'nvd' } })

    expect(screen.getByRole('link', { name: 'NVDA' })).toBeVisible()
    expect(screen.queryByRole('link', { name: 'TSLA' })).not.toBeInTheDocument()
  })

  it('renders an empty state with a watchlist link', () => {
    researchListQueryState = {
      ...researchListQueryState,
      data: [],
    }

    renderResearchList()

    expect(screen.getByText('등록된 종목이 없습니다')).toBeVisible()
    expect(
      screen.getByRole('link', { name: '관심 종목으로 이동' }),
    ).toHaveAttribute('href', '/watchlist')
  })

  it('renders an error state and retries the list query', () => {
    researchListQueryState = {
      data: undefined,
      error: new Error('network failed'),
      isError: true,
      isLoading: false,
      refetch: refetchResearchList,
    }

    renderResearchList()

    expect(screen.getByText('리서치 목록을 불러오지 못했습니다')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: '재시도' }))
    expect(refetchResearchList).toHaveBeenCalledTimes(1)
  })
})
