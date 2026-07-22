import { render, screen } from '@testing-library/react'

import {
  type NewsTopicSymbolSensitivityView,
  useNewsTopicSymbolsQuery,
} from '@/features/news-insights'

import { TopicSymbolSensitivity } from './TopicSymbolSensitivity'

vi.mock('@/features/news-insights', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/news-insights')>()
  return { ...actual, useNewsTopicSymbolsQuery: vi.fn() }
})

const symbols: NewsTopicSymbolSensitivityView[] = [
  {
    symbol: 'NVDA',
    exposurePercent: 82,
    impactDirection: { label: '긍정', tone: 'success' },
    relationship: { label: '직접 영향', tone: 'info' },
    valuationBurden: { label: '높음', tone: 'danger' },
    portfolioWeightPercent: 13,
    currentSignal: { label: '과열', tone: 'warning' },
  },
  {
    symbol: 'TSM',
    exposurePercent: 61,
    impactDirection: { label: '혼합', tone: 'warning' },
    relationship: { label: '공급망', tone: 'warning' },
    valuationBurden: null,
    portfolioWeightPercent: null,
    currentSignal: null,
  },
]

function mockQuery(
  state: Partial<ReturnType<typeof useNewsTopicSymbolsQuery>> = {},
) {
  vi.mocked(useNewsTopicSymbolsQuery).mockReturnValue({
    data: symbols,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...state,
  } as unknown as ReturnType<typeof useNewsTopicSymbolsQuery>)
}

describe('TopicSymbolSensitivity', () => {
  beforeEach(() => mockQuery())

  it('renders every sensitivity column and separates exposure from direction', () => {
    render(<TopicSymbolSensitivity topicId="7" />)
    ;[
      '종목',
      '노출도',
      '영향 방향',
      '관계 유형',
      '밸류 부담',
      '포트폴리오 비중',
      '현재 시그널',
    ].forEach((column) => {
      expect(screen.getByRole('columnheader', { name: column })).toBeVisible()
    })

    expect(screen.getByLabelText('노출도 82%')).toHaveAttribute(
      'data-visualization',
      'exposure-bar',
    )
    expect(screen.getByText('긍정')).toHaveAttribute(
      'data-visualization',
      'direction-badge',
    )
    expect(screen.getByText('직접 영향')).toBeVisible()
    expect(screen.getByText('높음')).toBeVisible()
    expect(screen.getByText('13%')).toBeVisible()
    expect(screen.getByText('과열')).toBeVisible()
    expect(useNewsTopicSymbolsQuery).toHaveBeenCalledWith('7')
  })

  it('renders explicit labels for nullable sensitivity fields', () => {
    render(<TopicSymbolSensitivity topicId="7" />)

    expect(screen.getByText('미보유')).toBeVisible()
    expect(screen.getAllByText('—')).toHaveLength(2)
  })

  it('shows independent loading, error, and empty states', () => {
    mockQuery({ data: undefined, isLoading: true })
    const { rerender } = render(<TopicSymbolSensitivity topicId="7" />)
    expect(screen.getByLabelText('종목 민감도 불러오는 중')).toBeVisible()

    mockQuery({ data: undefined, isLoading: false, isError: true })
    rerender(<TopicSymbolSensitivity topicId="7" />)
    expect(screen.getByText('종목 민감도를 불러오지 못했습니다')).toBeVisible()

    mockQuery({ data: [], isLoading: false, isError: false })
    rerender(<TopicSymbolSensitivity topicId="7" />)
    expect(screen.getByText('표시할 종목 민감도가 없습니다')).toBeVisible()
  })
})
