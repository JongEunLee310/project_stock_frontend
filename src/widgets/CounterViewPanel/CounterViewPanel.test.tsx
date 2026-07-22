import { render, screen } from '@testing-library/react'

import type { NewsTopicExplanationView } from '@/features/news-insights'

import { CounterViewPanel } from './CounterViewPanel'

const explanation: NewsTopicExplanationView = {
  factors: [{ label: '수요 증가', contributionRatio: 0.6 }],
  meta: {
    analysisVersion: 'v3.2',
    dataCoveragePercent: 90,
    lastUpdated: '2026. 7. 21. 오후 3:00',
    missingData: [],
    counterArgumentCount: 2,
    confidencePercent: 84,
    limitations: [],
  },
  counterView: {
    counterArguments: ['밸류에이션 부담이 높습니다.'],
    invalidationConditions: ['신규 주문이 감소합니다.'],
    alreadyPricedIn: {
      likely: true,
      note: '최근 상승분에 일부 반영됐습니다.',
    },
    contradictingEvidence: [
      {
        id: '30-40',
        eventId: '30',
        documentId: '40',
        title: '수요 둔화 가능성',
        source: 'Reuters',
        publishedAt: '2026. 7. 21. 오전 9:00',
      },
    ],
  },
}

describe('CounterViewPanel', () => {
  it('always exposes the counter-view panel with an explicit empty state', () => {
    render(<CounterViewPanel counterArguments={[]} />)

    expect(screen.getByRole('heading', { name: '반대 관점' })).toBeVisible()
    expect(screen.getByText('등록된 반대 관점이 없습니다')).toBeVisible()
  })

  it('renders every provided counter argument', () => {
    render(
      <CounterViewPanel
        counterArguments={['단기 영향은 제한적이다.', '수요가 둔화될 수 있다.']}
      />,
    )

    expect(screen.getByText('단기 영향은 제한적이다.')).toBeVisible()
    expect(screen.getByText('수요가 둔화될 수 있다.')).toBeVisible()
  })

  it('keeps base arguments and appends structured explanation evidence', () => {
    render(
      <CounterViewPanel
        counterArguments={['기본 반대 근거입니다.']}
        explanation={explanation}
      />,
    )

    expect(screen.getByText('기본 반대 근거입니다.')).toBeVisible()
    expect(screen.getByText('밸류에이션 부담이 높습니다.')).toBeVisible()
    expect(screen.getByText('신규 주문이 감소합니다.')).toBeVisible()
    expect(screen.getByText('선반영 가능성 있음')).toBeVisible()
    expect(screen.getByText('최근 상승분에 일부 반영됐습니다.')).toBeVisible()
    expect(screen.getByText('수요 둔화 가능성')).toBeVisible()
    expect(screen.getByText(/Reuters.*이벤트 #30.*문서 #40/)).toBeVisible()
    expect(screen.getByText('AI 확장 분석 · 신뢰도 84%')).toBeVisible()
    expect(screen.getByText('상충 근거')).toBeVisible()
  })

  it('keeps base arguments visible when explanation fails', () => {
    render(
      <CounterViewPanel
        counterArguments={['기본 반대 근거입니다.']}
        isExplanationError
      />,
    )

    expect(screen.getByText('기본 반대 근거입니다.')).toBeVisible()
    expect(screen.getByText('확장 근거를 불러오지 못했습니다')).toBeVisible()
    expect(screen.getByText(/기본 반대 관점은 계속/)).toBeVisible()
  })
})
