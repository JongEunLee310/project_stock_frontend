import { render, screen, within } from '@testing-library/react'

import { InsightSummaryCards } from './InsightSummaryCards'

describe('InsightSummaryCards', () => {
  it('renders all four mock metrics with counts and daily changes', () => {
    render(<InsightSummaryCards />)

    const expectedMetrics = [
      ['고중요 이벤트', '12건', '전일 대비 +3건'],
      ['감성 급변', '7건', '전일 대비 -2건'],
      ['키워드 클러스터', '18건', '전일 대비 +4건'],
      ['자금 흐름 시그널', '5건', '전일 대비 +1건'],
    ] as const

    expectedMetrics.forEach(([label, count, delta]) => {
      const card = screen.getByLabelText(`${label} 요약`)

      expect(within(card).getByText(label)).toBeVisible()
      expect(within(card).getByText(count)).toBeVisible()
      expect(within(card).getByText(delta)).toBeVisible()
    })
  })
})
