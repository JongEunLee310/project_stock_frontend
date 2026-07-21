import { render, screen, within } from '@testing-library/react'

import { RealtimeEventFeed } from './RealtimeEventFeed'

describe('RealtimeEventFeed', () => {
  it('renders event-centered rows with separate importance, sentiment, and evidence', () => {
    render(<RealtimeEventFeed />)

    const table = screen.getByRole('table', { name: '실시간 이벤트 목록' })
    const firstEvent = within(table).getByText(
      '삼성전자, 차세대 HBM 공급 확대 계획 발표',
    )
    const row = firstEvent.closest('tr')

    expect(row).not.toBeNull()
    expect(within(row!).getByText('공시')).toBeVisible()
    expect(within(row!).getByText('중요도 높음')).toBeVisible()
    expect(within(row!).getByText('감성 긍정')).toBeVisible()
    expect(within(row!).getByText('4건')).toBeVisible()
  })
})
