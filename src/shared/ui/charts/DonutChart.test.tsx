import { render, screen } from '@testing-library/react'

import { DonutChart } from './DonutChart'

const data = [
  { name: 'cash', value: 35 },
  { name: 'invested', value: 65 },
]

describe('DonutChart', () => {
  it('renders a semantic donut chart when ariaLabel is provided', () => {
    render(<DonutChart data={data} height={80} width={80} ariaLabel="비중" />)

    expect(screen.getByRole('img', { name: '비중' })).toBeVisible()
  })

  it('renders decorative donut charts as hidden from assistive technology', () => {
    const { container } = render(
      <DonutChart data={data} height={80} width={80} />,
    )

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })
})
