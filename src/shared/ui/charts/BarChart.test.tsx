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
})
