import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

import type { ResearchQueueView } from '@/features/research/adapters'
import type { ResearchQueueFilter } from '@/features/research/queries'

import { ResearchListPage } from './ResearchListPage'

interface ResearchQueueQueryState {
  data: ResearchQueueView | undefined
  error: Error | null
  isError: boolean
  isLoading: boolean
  refetch: () => unknown
}

const researchQueue: ResearchQueueView = {
  summary: {
    totalResearchCount: 3,
    needsAttentionCount: 1,
    updatedTodayCount: 2,
    insufficientCount: 1,
  },
  items: [
    {
      assetId: 11,
      symbol: 'NVDA',
      name: 'NVIDIA Corp.',
      market: 'NASDAQ',
      researchStatusLabel: '추가 확인 필요',
      researchStatusTone: 'danger',
      completenessPct: 75,
      stanceLabel: '매수 후보',
      headline: 'AI demand remains durable',
      keyIssue: '밸류에이션 부담을 확인해야 합니다.',
      lastUpdatedAt: '2026. 7. 13. 오전 10:20',
      signalType: 'RISK_ALERT',
    },
    {
      assetId: 12,
      symbol: 'TSLA',
      name: 'Tesla, Inc.',
      market: 'NASDAQ',
      researchStatusLabel: '데이터 부족',
      researchStatusTone: 'neutral',
      completenessPct: 25,
      stanceLabel: null,
      headline: null,
      keyIssue: null,
      lastUpdatedAt: null,
      signalType: null,
    },
  ],
  meta: { page: 1, size: 20, total: 22 },
}

const refetchResearchQueue = vi.fn()
const mockUseResearchQueue = vi.hoisted(() => vi.fn())
let researchQueueQueryState: ResearchQueueQueryState

vi.mock('@/features/research/queries', () => ({
  useResearchQueue: (filter: ResearchQueueFilter | undefined, page: number) => {
    mockUseResearchQueue(filter, page)
    return researchQueueQueryState
  },
}))

beforeEach(() => {
  refetchResearchQueue.mockReset()
  mockUseResearchQueue.mockClear()
  researchQueueQueryState = {
    data: researchQueue,
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchResearchQueue,
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
  it('renders summary counts and research queue columns', () => {
    renderResearchList()

    const summary = screen.getByRole('region', { name: '리서치 큐 요약' })
    const table = screen.getByRole('table', { name: '리서치 큐 목록' })

    expect(
      within(screen.getByLabelText('리서치 대상 요약')).getByText('3'),
    ).toBeVisible()
    expect(
      within(screen.getByLabelText('추가 확인 필요 요약')).getByText('1'),
    ).toBeVisible()
    expect(within(summary).getByText('오늘 업데이트')).toBeVisible()
    expect(within(summary).getByText('데이터 부족')).toBeVisible()
    expect(
      within(table).getByRole('columnheader', { name: 'AI 판단' }),
    ).toBeVisible()
    expect(
      within(table).getByRole('columnheader', { name: '핵심 이슈' }),
    ).toBeVisible()
    expect(
      within(table).getByRole('columnheader', { name: '리서치 상태' }),
    ).toBeVisible()
    expect(
      within(table).getByRole('columnheader', { name: '분석 완성도' }),
    ).toBeVisible()
    expect(
      within(table).queryByRole('columnheader', { name: '섹터' }),
    ).not.toBeInTheDocument()
    expect(within(table).getByText('추가 확인 필요')).toBeVisible()
    expect(within(table).getByText('75%')).toBeVisible()
    expect(
      within(table).getByRole('progressbar', { name: 'NVDA 분석 완성도' }),
    ).toHaveAttribute('aria-valuenow', '75')
    expect(
      within(table).getByTitle('밸류에이션 부담을 확인해야 합니다.'),
    ).toHaveClass('truncate')
    expect(within(table).getByRole('link', { name: 'NVDA' })).toHaveAttribute(
      'href',
      '/research/NVDA',
    )
  })

  it('requests a selected filter and resets the page', () => {
    renderResearchList()

    expect(mockUseResearchQueue).toHaveBeenLastCalledWith(undefined, 1)

    fireEvent.click(screen.getByRole('button', { name: '다음' }))
    expect(mockUseResearchQueue).toHaveBeenLastCalledWith(undefined, 2)

    fireEvent.click(screen.getByRole('button', { name: '추가 리서치 필요' }))

    expect(mockUseResearchQueue).toHaveBeenLastCalledWith('needs_research', 1)
    expect(
      screen.getByRole('button', { name: '추가 리서치 필요' }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  it('filters current queue rows by company name and ticker', () => {
    renderResearchList()

    const searchInput = screen.getByLabelText('종목명·티커 검색')

    fireEvent.change(searchInput, { target: { value: 'tesla' } })
    expect(screen.getByRole('link', { name: 'TSLA' })).toBeVisible()
    expect(screen.queryByRole('link', { name: 'NVDA' })).not.toBeInTheDocument()

    fireEvent.change(searchInput, { target: { value: 'nvd' } })
    expect(screen.getByRole('link', { name: 'NVDA' })).toBeVisible()
    expect(screen.queryByRole('link', { name: 'TSLA' })).not.toBeInTheDocument()
  })

  it('renders loading, error, and empty states', () => {
    researchQueueQueryState = {
      data: undefined,
      error: null,
      isError: false,
      isLoading: true,
      refetch: refetchResearchQueue,
    }
    const { rerender } = renderResearchList()
    expect(
      screen.getByRole('status', { name: '리서치 큐 로딩 중' }),
    ).toBeVisible()

    researchQueueQueryState = {
      data: undefined,
      error: new Error('network failed'),
      isError: true,
      isLoading: false,
      refetch: refetchResearchQueue,
    }
    rerender(
      <MemoryRouter>
        <ResearchListPage />
      </MemoryRouter>,
    )
    expect(screen.getByText('리서치 큐를 불러오지 못했습니다')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: '재시도' }))
    expect(refetchResearchQueue).toHaveBeenCalledTimes(1)

    researchQueueQueryState = {
      data: {
        ...researchQueue,
        items: [],
        meta: { ...researchQueue.meta, total: 0 },
      },
      error: null,
      isError: false,
      isLoading: false,
      refetch: refetchResearchQueue,
    }
    rerender(
      <MemoryRouter>
        <ResearchListPage />
      </MemoryRouter>,
    )
    expect(screen.getByText('조건에 맞는 리서치가 없습니다')).toBeVisible()
  })
})
