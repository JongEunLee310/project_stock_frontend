import { render, screen } from '@testing-library/react'

import {
  type NewsTopicExplanationView,
  useNewsTopicExplanationQuery,
} from '@/features/news-insights'

import { InsightExplanationPanel } from './InsightExplanationPanel'

vi.mock('@/features/news-insights', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/news-insights')>()
  return { ...actual, useNewsTopicExplanationQuery: vi.fn() }
})

const explanation: NewsTopicExplanationView = {
  factors: [
    { label: '수요 증가', contributionRatio: 0.425 },
    { label: '공급 제약', contributionRatio: 0.575 },
  ],
  meta: {
    analysisVersion: 'v3.2',
    dataCoveragePercent: 86,
    lastUpdated: '2026. 7. 21. 오후 3:00',
    missingData: ['해외 비공개 주문'],
    counterArgumentCount: 2,
    confidencePercent: 81,
    limitations: ['단기 표본 중심'],
  },
  counterView: {
    counterArguments: [],
    invalidationConditions: [],
    alreadyPricedIn: { likely: false, note: null },
    contradictingEvidence: [],
  },
}

describe('InsightExplanationPanel', () => {
  beforeEach(() => {
    vi.mocked(useNewsTopicExplanationQuery).mockReturnValue({
      data: explanation,
      isLoading: false,
      isError: false,
      dataUpdatedAt: Date.now() - 5 * 60 * 1000,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useNewsTopicExplanationQuery>)
  })

  it('renders backend ratios, metadata, and an explicit AI confidence badge', () => {
    render(<InsightExplanationPanel topicId="7" />)

    expect(
      screen.getByRole('heading', { name: '왜 이런 인사이트가 나왔나' }),
    ).toBeVisible()
    expect(screen.getByText('수요 증가')).toBeVisible()
    expect(screen.getByText('42.5%')).toBeVisible()
    expect(
      screen.getByRole('meter', { name: '수요 증가 기여도 42.5%' }),
    ).toHaveAttribute('aria-valuenow', '0.425')
    expect(screen.getByText('AI 분석 · 신뢰도 81%')).toBeVisible()
    expect(screen.getByText('v3.2')).toBeVisible()
    expect(screen.getByText('수집 대상의 86% 포함')).toBeVisible()
    expect(screen.getByText('해외 비공개 주문')).toBeVisible()
    expect(screen.getByText('단기 표본 중심')).toBeVisible()
    expect(screen.getByLabelText('데이터 갱신 5분 전')).toBeVisible()
    expect(useNewsTopicExplanationQuery).toHaveBeenCalledWith('7')
  })

  it('isolates errors inside the panel', () => {
    vi.mocked(useNewsTopicExplanationQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      dataUpdatedAt: 0,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useNewsTopicExplanationQuery>)

    render(<InsightExplanationPanel topicId="7" />)

    expect(
      screen.getByText('인사이트 설명을 불러오지 못했습니다'),
    ).toBeVisible()
    expect(screen.getByText(/아직 분석되지 않은 토픽/)).toBeVisible()
  })

  it('renders an explicit empty state without inventing factors', () => {
    vi.mocked(useNewsTopicExplanationQuery).mockReturnValue({
      data: { ...explanation, factors: [] },
      isLoading: false,
      isError: false,
      dataUpdatedAt: Date.now(),
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useNewsTopicExplanationQuery>)

    render(<InsightExplanationPanel topicId="7" />)

    expect(screen.getByText('표시할 기여 요인이 없습니다')).toBeVisible()
    expect(screen.queryByText('수요 증가')).not.toBeInTheDocument()
  })
})
