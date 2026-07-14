import { render, screen } from '@testing-library/react'

import { BarChart } from './BarChart'

const data = [
  { name: 'A', value: 10 },
  { name: 'B', value: 18 },
]

describe('BarChart', () => {
  it('renders a semantic bar chart when ariaLabel is provided', () => {
    render(<BarChart data={data} height={80} width={120} ariaLabel="분포" />)

    expect(screen.getByRole('img', { name: '분포' })).toBeVisible()
  })

  it('renders decorative bar charts as hidden from assistive technology', () => {
    const { container } = render(
      <BarChart data={data} height={80} width={120} />,
    )

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('uses the existing single fill when getBarColor is omitted', () => {
    const { container } = render(
      <BarChart data={data} height={80} width={120} color="#475569" />,
    )

    const bars = container.querySelectorAll('.recharts-bar-rectangle path')
    expect(bars).toHaveLength(2)
    expect(Array.from(bars, (bar) => bar.getAttribute('fill'))).toEqual([
      '#475569',
      '#475569',
    ])
    expect(
      container.querySelector('.recharts-tooltip-wrapper'),
    ).not.toBeInTheDocument()
  })

  it('renders a Cell fill for every point returned by getBarColor', () => {
    const getBarColor = vi
      .fn()
      .mockReturnValueOnce('#34d399')
      .mockReturnValueOnce('#f87171')
    const { container } = render(
      <BarChart
        data={data}
        height={80}
        width={120}
        getBarColor={getBarColor}
      />,
    )

    const bars = container.querySelectorAll('.recharts-bar-rectangle path')
    expect(Array.from(bars, (bar) => bar.getAttribute('fill'))).toEqual([
      '#34d399',
      '#f87171',
    ])
    expect(getBarColor).toHaveBeenNthCalledWith(1, data[0], 0)
    expect(getBarColor).toHaveBeenNthCalledWith(2, data[1], 1)
  })
})
