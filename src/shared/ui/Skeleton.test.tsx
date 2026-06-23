import { render } from '@testing-library/react'

import { Skeleton } from './Skeleton'

describe('Skeleton', () => {
  it('renders a single decorative block by default', () => {
    const { container } = render(<Skeleton className="h-6 w-24" />)
    const skeleton = container.firstElementChild

    expect(skeleton).toHaveAttribute('aria-hidden', 'true')
    expect(skeleton).toHaveClass('animate-pulse', 'h-6', 'w-24')
  })

  it('renders text placeholder lines when lines is provided', () => {
    const { container } = render(<Skeleton lines={3} />)
    const skeleton = container.firstElementChild

    expect(skeleton).toHaveAttribute('aria-hidden', 'true')
    expect(skeleton).toHaveClass('flex')
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(3)
  })
})
