import { render, screen } from '@testing-library/react'

import { NewsInsightsOverviewPage } from './NewsInsightsOverviewPage'

describe('NewsInsightsOverviewPage', () => {
  it('composes the overview widgets and labels every planned phase panel', () => {
    render(<NewsInsightsOverviewPage />)

    expect(
      screen.getByRole('heading', { name: '뉴스·공시 인사이트' }),
    ).toBeVisible()
    expect(
      screen.getByRole('heading', { name: '오늘의 인사이트' }),
    ).toBeVisible()
    expect(
      screen.getByRole('heading', { name: '실시간 이벤트 피드' }),
    ).toBeVisible()
    expect(
      screen.getByRole('heading', { name: '에이전트 브리핑' }),
    ).toBeVisible()
    ;[
      '토픽 맵',
      '투자자 동향',
      '예상 자금 흐름',
      '이벤트 타임라인',
      '에이전트 파이프라인',
    ].forEach((title) => {
      expect(screen.getByLabelText(`${title} 준비 중`)).toBeVisible()
    })
  })
})
