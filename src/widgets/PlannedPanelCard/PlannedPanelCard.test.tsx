import { render, screen } from '@testing-library/react'

import { PlannedPanelCard } from './PlannedPanelCard'

describe('PlannedPanelCard', () => {
  it('renders the planned phase, issue, and implementation notice', () => {
    render(
      <PlannedPanelCard
        panel={{
          title: '키워드 관계망',
          supportingLabel: '연관 키워드',
          description: '토픽과 키워드 사이의 연결을 표시합니다.',
          phase: '2차',
          issue: '#265',
        }}
      />,
    )

    expect(screen.getByLabelText('키워드 관계망 준비 중')).toBeVisible()
    expect(screen.getByText('연관 키워드')).toBeVisible()
    expect(screen.getByText('2차 · #265')).toBeVisible()
    expect(screen.getByText('구현 예정')).toBeVisible()
  })
})
