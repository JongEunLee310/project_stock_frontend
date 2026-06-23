import { render, screen } from '@testing-library/react'

import { Sparkline } from './Sparkline'

const data = [{ value: 1 }, { value: 3 }, { value: 2 }]

describe('Sparkline', () => {
  it('renders a semantic sparkline when ariaLabel is provided', () => {
    render(<Sparkline data={data} height={32} width={80} ariaLabel="추세" />)

    expect(screen.getByRole('img', { name: '추세' })).toBeVisible()
  })

  it('renders decorative sparklines as hidden from assistive technology', () => {
    const { container } = render(
      <Sparkline data={data} height={32} width={80} />,
    )

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })
})
