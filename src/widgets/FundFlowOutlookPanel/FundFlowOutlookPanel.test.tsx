import { render, screen } from '@testing-library/react'

import {
  type NewsFundFlowOutlookView,
  useNewsFundFlowOutlookQuery,
} from '@/features/news-insights'

import { FundFlowOutlookPanel } from './FundFlowOutlookPanel'

vi.mock('@/features/news-insights', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/news-insights')>()
  return { ...actual, useNewsFundFlowOutlookQuery: vi.fn() }
})

const outlook: NewsFundFlowOutlookView = {
  asOf: '2026. 7. 21. 오후 3:00',
  analysisVersion: 'v3.1',
  items: [
    {
      sector: '반도체',
      direction: { label: '유입 방향', tone: 'success' },
      likelihood: { label: '높음', tone: 'success' },
      estimatedRange: '1,000억~1,500억원',
      horizon: '1개월',
      confidencePercent: 82,
      keyAssumptions: ['AI 수요가 유지됩니다.'],
      riskFactors: ['공급 차질 가능성이 있습니다.'],
    },
  ],
}

function mockQuery(
  state: Partial<ReturnType<typeof useNewsFundFlowOutlookQuery>> = {},
) {
  vi.mocked(useNewsFundFlowOutlookQuery).mockReturnValue({
    data: outlook,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...state,
  } as unknown as ReturnType<typeof useNewsFundFlowOutlookQuery>)
}

describe('FundFlowOutlookPanel', () => {
  beforeEach(() => mockQuery())

  it('renders sector direction, possibility level, range, and grounded numbers', () => {
    render(<FundFlowOutlookPanel />)

    expect(screen.getByRole('heading', { name: '반도체' })).toBeVisible()
    expect(screen.getByText('유입 방향')).toBeVisible()
    expect(screen.getByText('흐름 가능성: 높음')).toBeVisible()
    expect(screen.getByText('1,000억~1,500억원')).toBeVisible()
    expect(screen.getByText('82% · 아래 가정과 위험 요인 기준')).toBeVisible()
    expect(screen.getByText('AI 수요가 유지됩니다.')).toBeVisible()
    expect(screen.getByText('공급 차질 가능성이 있습니다.')).toBeVisible()
    expect(screen.getByText(/확정 예측이 아닙니다/)).toBeVisible()
    expect(screen.getByText(/데이터 기준 .*분석 버전 v3.1/)).toBeVisible()
  })

  it('shows independent loading, error, and empty states', () => {
    mockQuery({ data: undefined, isLoading: true })
    const { rerender } = render(<FundFlowOutlookPanel />)
    expect(screen.getByLabelText('예상 자금 흐름 불러오는 중')).toBeVisible()

    mockQuery({ data: undefined, isLoading: false, isError: true })
    rerender(<FundFlowOutlookPanel />)
    expect(
      screen.getByText('예상 자금 흐름을 불러오지 못했습니다'),
    ).toBeVisible()

    mockQuery({ data: { ...outlook, items: [] } })
    rerender(<FundFlowOutlookPanel />)
    expect(screen.getByText('표시할 예상 자금 흐름이 없습니다')).toBeVisible()
  })
})
