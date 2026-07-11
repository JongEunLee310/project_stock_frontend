import { render, screen } from '@testing-library/react'

import { LineChart } from './LineChart'

const data = [
  { name: 'A', value: 10 },
  { name: 'B', value: 12 },
  { name: 'C', value: 11 },
]

describe('LineChart', () => {
  it('renders a semantic line chart when ariaLabel is provided', () => {
    render(<LineChart data={data} height={120} width={240} ariaLabel="가격" />)

    expect(screen.getByRole('img', { name: '가격' })).toBeVisible()
  })

  it('renders decorative line charts as hidden from assistive technology', () => {
    const { container } = render(
      <LineChart data={data} height={120} width={240} />,
    )

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('keeps rendering one line for the existing single-series API', () => {
    const { container } = render(
      <LineChart data={data} height={120} width={240} />,
    )

    expect(container.querySelectorAll('.recharts-line')).toHaveLength(1)
  })

  it('renders every configured series', () => {
    const { container } = render(
      <LineChart
        data={data.map((point) => ({ ...point, average: point.value - 1 }))}
        height={120}
        width={240}
        series={[
          { dataKey: 'value', color: '#5fa8ff' },
          {
            dataKey: 'average',
            color: '#f59e0b',
            strokeDasharray: '6 4',
          },
        ]}
      />,
    )

    expect(container.querySelectorAll('.recharts-line')).toHaveLength(2)
  })
})
