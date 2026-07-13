import { render, screen } from '@testing-library/react'

import { Button } from './Button'

describe('Button', () => {
  it('renders selected variant classes', () => {
    render(<Button variant="selected">선택됨</Button>)

    expect(screen.getByRole('button', { name: '선택됨' })).toHaveClass(
      'border-app-accent/40',
      'bg-app-accent/15',
      'text-app-accent',
      'hover:bg-app-accent/25',
      'focus-visible:outline-app-accent',
    )
  })
})
