import { render, screen } from '@testing-library/react'

import { PanelFreshness } from './PanelFreshness'

describe('PanelFreshness', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-22T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('갱신 시각이 있으면 상대 시간과 접근성 라벨을 표시한다', () => {
    render(<PanelFreshness updatedAt={Date.now() - 5 * 60 * 1000} />)

    expect(screen.getByText('5분 전')).toBeVisible()
    expect(screen.getByLabelText('데이터 갱신 5분 전')).toHaveAttribute(
      'dateTime',
      '2026-07-22T11:55:00.000Z',
    )
  })

  it('갱신 시각이 없거나 유효하지 않으면 렌더링하지 않는다', () => {
    const { container, rerender } = render(<PanelFreshness />)
    expect(container).toBeEmptyDOMElement()

    rerender(<PanelFreshness updatedAt={Number.NaN} />)
    expect(container).toBeEmptyDOMElement()
  })
})
