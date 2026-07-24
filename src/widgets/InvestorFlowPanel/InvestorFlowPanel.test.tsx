import { render, screen, within } from '@testing-library/react'

import {
  type NewsInvestorFlowsView,
  useNewsInvestorFlowsQuery,
} from '@/features/news-insights'

import { InvestorFlowPanel } from './InvestorFlowPanel'

vi.mock('@/features/news-insights', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/news-insights')>()
  return { ...actual, useNewsInvestorFlowsQuery: vi.fn() }
})

const flows: NewsInvestorFlowsView = {
  asOf: '2026. 7. 21. 오후 3:00',
  byInvestorType: [
    {
      investorType: 'FOREIGN',
      investor: { label: '외국인', tone: 'info' },
      netValue: '1234567890.12',
      direction: 'BUY',
      directionPresentation: { label: '순매수', tone: 'success' },
      change: 0.125,
    },
    {
      investorType: 'INSTITUTION',
      investor: { label: '기관', tone: 'accent' },
      netValue: '-420000000.50',
      direction: 'SELL',
      directionPresentation: { label: '순매도', tone: 'danger' },
      change: -0.04,
    },
    {
      investorType: 'RETAIL',
      investor: { label: '개인', tone: 'warning' },
      netValue: '0',
      direction: 'NEUTRAL',
      directionPresentation: { label: '중립', tone: 'neutral' },
      change: 0,
    },
    {
      investorType: 'ETF',
      investor: { label: 'ETF', tone: 'neutral' },
      netValue: '350000000',
      direction: 'BUY',
      directionPresentation: { label: '순매수', tone: 'success' },
      change: 0.08,
    },
  ],
  narrativeAlignment: {
    aligned: false,
    note: '긍정 뉴스와 달리 기관은 순매도입니다.',
  },
  availability: { available: true, fallback: null },
}

function mockQuery(
  state: Partial<ReturnType<typeof useNewsInvestorFlowsQuery>> = {},
) {
  vi.mocked(useNewsInvestorFlowsQuery).mockReturnValue({
    data: flows,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...state,
  } as unknown as ReturnType<typeof useNewsInvestorFlowsQuery>)
}

function renderPanel(topicId?: string, compact = false) {
  return render(
    <InvestorFlowPanel
      market="KR"
      window="7d"
      topicId={topicId}
      title="투자자 반응"
      compact={compact}
    />,
  )
}

describe('InvestorFlowPanel', () => {
  beforeEach(() => mockQuery())

  it('renders investor amounts, direction badges, changes, and mismatch signal', () => {
    renderPanel('7')
    ;['외국인', '기관', '개인', 'ETF'].forEach((label) => {
      expect(screen.getByText(label)).toBeVisible()
    })
    expect(screen.getAllByText('순매수')).toHaveLength(2)
    expect(screen.getByText('순매도')).toBeVisible()
    expect(screen.getByText('중립')).toBeVisible()
    expect(screen.getByText('1,234,567,890.12원')).toBeVisible()
    expect(screen.getByText('-420,000,000.5원')).toBeVisible()
    expect(screen.getByText('전일 대비 +12.5%')).toBeVisible()
    expect(screen.getByText('불일치 신호')).toBeVisible()
    expect(
      screen.getByText('긍정 뉴스와 달리 기관은 순매도입니다.'),
    ).toBeVisible()
    expect(useNewsInvestorFlowsQuery).toHaveBeenCalledWith({
      market: 'KR',
      window: '7d',
      topicId: '7',
    })
  })

  it('shows the server fallback without estimating unavailable values', () => {
    mockQuery({
      data: {
        ...flows,
        availability: {
          available: false,
          fallback: 'ETF 자금 흐름을 참고하세요.',
        },
      },
    })
    renderPanel()

    expect(
      screen.getByText('이 시장의 투자자 수급 데이터가 제공되지 않습니다'),
    ).toBeVisible()
    expect(screen.getByText('ETF 자금 흐름을 참고하세요.')).toBeVisible()
    expect(screen.queryByText('1,234,567,890.12원')).not.toBeInTheDocument()
  })

  it('renders compact investor flows as single summary rows', () => {
    renderPanel(undefined, true)

    const summary = screen.getByRole('list', { name: '투자자 수급 요약' })
    expect(within(summary).getAllByRole('listitem')).toHaveLength(4)
    expect(within(summary).getByText('+12.3억원')).toBeVisible()
    expect(within(summary).getByText('-4.2억원')).toBeVisible()
    expect(within(summary).getByText('순매도')).toBeVisible()
  })

  it('shows independent loading, error, and empty states', () => {
    mockQuery({ data: undefined, isLoading: true })
    const { rerender } = renderPanel()
    expect(screen.getByLabelText('투자자 수급 불러오는 중')).toBeVisible()

    mockQuery({ data: undefined, isLoading: false, isError: true })
    rerender(<InvestorFlowPanel market="KR" window="7d" title="투자자 반응" />)
    expect(screen.getByText('투자자 반응을 불러오지 못했습니다')).toBeVisible()

    mockQuery({
      data: { ...flows, byInvestorType: [] },
      isLoading: false,
      isError: false,
    })
    rerender(<InvestorFlowPanel market="KR" window="7d" title="투자자 반응" />)
    expect(screen.getByText('표시할 투자자 수급이 없습니다')).toBeVisible()
  })
})
