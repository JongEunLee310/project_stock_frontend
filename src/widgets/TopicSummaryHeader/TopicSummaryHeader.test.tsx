import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import type { NewsTopicDetailView } from '@/features/news-insights'

import { TopicSummaryHeader } from './TopicSummaryHeader'

const navigate = vi.fn()

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => navigate }
})

const detail: NewsTopicDetailView = {
  title: '반도체 장기 수요 회복',
  tags: ['AI', 'HBM'],
  lifecycle: { label: '상승', tone: 'accent' },
  scores: [
    { id: 'impact', label: '종합 영향도', valuePercent: 91, tone: 'danger' },
    {
      id: 'sentiment',
      label: '감성 방향',
      valuePercent: 73,
      tone: 'success',
      direction: {
        label: '긍정',
        trendLabel: '상승',
        indicator: '↗',
      },
    },
    { id: 'confidence', label: '신뢰도', valuePercent: 88, tone: 'info' },
    { id: 'momentum', label: '모멘텀', valuePercent: 82, tone: 'accent' },
  ],
  affectedSymbols: [
    {
      symbol: '005930',
      exposurePercent: 91,
      direction: { label: '긍정', tone: 'success' },
      relationship: { label: '직접 영향', tone: 'info' },
    },
  ],
  insight: {
    summary: '수요가 회복되고 있습니다.',
    whyItMatters: '공급 가시성이 높아집니다.',
    keyEvidence: [{ id: '10-0', label: '이벤트 #10' }],
    riskPoints: ['계약 지연'],
    counterArguments: [],
  },
  version: 2,
  updatedAt: '2026. 7. 21. 오후 3:00',
}

const defaultProps = {
  data: detail,
  isLoading: false,
  isError: false,
  onRetry: vi.fn(),
}

describe('TopicSummaryHeader', () => {
  beforeEach(() => navigate.mockReset())

  it('renders stat blocks, affected symbols, actions, and AI summary', () => {
    render(
      <MemoryRouter>
        <TopicSummaryHeader {...defaultProps} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: detail.title })).toBeVisible()
    expect(screen.getByLabelText('종합 영향도 91/100')).toBeVisible()
    expect(screen.getByLabelText('감성 방향 긍정 상승')).toBeVisible()
    expect(screen.getByLabelText('신뢰도 88%')).toBeVisible()
    expect(screen.getByText('직접 영향')).toBeVisible()
    expect(screen.getByText(/수익률 점수가 아닌 관찰 우선순위/)).toBeVisible()
    expect(screen.getByText('수요가 회복되고 있습니다.')).toBeVisible()
    expect(
      screen.getByRole('button', { name: '포트폴리오 영향 보기' }),
    ).toBeDisabled()
  })

  it('navigates action buttons and an affected symbol chip', () => {
    render(
      <MemoryRouter>
        <TopicSummaryHeader {...defaultProps} />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: '005930 리서치 보기' }))
    fireEvent.click(screen.getByRole('button', { name: '관련 종목 보기' }))
    fireEvent.click(screen.getByRole('button', { name: '+ 알림 생성' }))
    fireEvent.click(screen.getByRole('button', { name: '판단 기록 연결' }))
    expect(navigate).toHaveBeenNthCalledWith(1, '/research/005930')
    expect(navigate).toHaveBeenNthCalledWith(2, '/research/005930')
    expect(navigate).toHaveBeenNthCalledWith(3, '/alerts')
    expect(navigate).toHaveBeenNthCalledWith(4, '/decision-log')
    expect(navigate).toHaveBeenCalledWith('/research/005930')
  })

  it('renders independent loading and error states', () => {
    const { rerender } = render(
      <MemoryRouter>
        <TopicSummaryHeader {...defaultProps} data={undefined} isLoading />
      </MemoryRouter>,
    )
    expect(screen.getByLabelText('토픽 요약 불러오는 중')).toBeVisible()

    rerender(
      <MemoryRouter>
        <TopicSummaryHeader {...defaultProps} data={undefined} isError />
      </MemoryRouter>,
    )
    expect(screen.getByText('토픽 요약을 불러오지 못했습니다')).toBeVisible()
  })
})
