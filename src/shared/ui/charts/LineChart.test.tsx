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
    expect(container.querySelector('.recharts-area')).not.toBeInTheDocument()
    expect(container.querySelector('linearGradient')).not.toBeInTheDocument()
    expect(
      container.querySelector('[data-last-value-label]'),
    ).not.toBeInTheDocument()
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

  it('renders accessible event markers when configured', () => {
    const label = '07.10 실적 발표 · EPS 1.52 (예상 1.48, 서프라이즈 +2.70%)'

    render(
      <LineChart
        data={data}
        height={120}
        width={240}
        ariaLabel="가격"
        markers={[{ x: 'B', y: 12, label }]}
      />,
    )

    expect(screen.getByRole('img', { name: label })).toHaveAttribute(
      'tabindex',
      '0',
    )
    expect(screen.getByText(label, { selector: 'title' })).toBeInTheDocument()
  })

  it('does not render event markers when markers are omitted', () => {
    render(<LineChart data={data} height={120} width={240} />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('renders an area gradient, right axis, and last valid value label', () => {
    const { container } = render(
      <LineChart
        data={[...data, { name: 'D', value: null }]}
        height={120}
        width={240}
        areaSeries={{ dataKey: 'value', color: '#5fa8ff' }}
        yAxisOrientation="right"
        lastValueLabel={{ dataKey: 'value', color: '#5fa8ff' }}
      />,
    )

    const gradient = container.querySelector('linearGradient')
    const area = container.querySelector('.recharts-area-area')
    const yAxisTick = container.querySelector(
      '.recharts-yAxis-tick-labels .recharts-cartesian-axis-tick-value',
    )

    expect(gradient).toBeInTheDocument()
    expect(area).toBeInTheDocument()
    expect(area).toHaveAttribute('fill', `url(#${gradient?.id})`)
    expect(yAxisTick).toHaveAttribute('text-anchor', 'start')
    expect(
      container.querySelector('[data-last-value-label="11"]'),
    ).toBeInTheDocument()
  })

  it.each([
    {
      caseName: '구간 최저',
      points: [
        { name: 'A', value: 12 },
        { name: 'B', value: 10 },
      ],
      expectedY: '90',
    },
    {
      caseName: '구간 최고',
      points: [
        { name: 'A', value: 10 },
        { name: 'B', value: 12 },
      ],
      expectedY: '12',
    },
  ])(
    'keeps the last value pill inside the plot at the $caseName',
    ({ points, expectedY }) => {
      const { container } = render(
        <LineChart
          data={points}
          height={120}
          width={240}
          hideXAxis
          lastValueLabel={{ dataKey: 'value' }}
        />,
      )

      const pill = container.querySelector('[data-last-value-label]')

      expect(pill?.querySelector('rect')).toHaveAttribute('y', expectedY)
    },
  )

  it('hides the x axis when hideXAxis is set', () => {
    const { container, rerender } = render(
      <LineChart data={data} height={120} width={240} />,
    )

    expect(container.querySelector('.recharts-xAxis')).toBeInTheDocument()

    rerender(<LineChart data={data} height={120} width={240} hideXAxis />)

    expect(container.querySelector('.recharts-xAxis')).not.toBeInTheDocument()
  })

  it('uses a unique area gradient id for each chart instance', () => {
    const { container } = render(
      <>
        <LineChart
          data={data}
          height={120}
          width={240}
          areaSeries={{ dataKey: 'value', color: '#5fa8ff' }}
        />
        <LineChart
          data={data}
          height={120}
          width={240}
          areaSeries={{ dataKey: 'value', color: '#5fa8ff' }}
        />
      </>,
    )

    const gradientIds = Array.from(
      container.querySelectorAll('linearGradient'),
      (gradient) => gradient.id,
    )

    expect(gradientIds).toHaveLength(2)
    expect(new Set(gradientIds).size).toBe(2)
  })
})
