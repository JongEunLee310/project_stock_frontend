import { fireEvent, render, screen } from '@testing-library/react'

import { InfoTooltip } from './InfoTooltip'

describe('InfoTooltip', () => {
  it('shows the connected tooltip on hover and hides it on mouse leave', () => {
    render(<InfoTooltip label="지표 설명" content="지표 정의" />)
    const button = screen.getByRole('button', { name: '지표 설명' })

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    fireEvent.mouseEnter(button)

    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toHaveTextContent('지표 정의')
    expect(button).toHaveAttribute('aria-describedby', tooltip.id)

    fireEvent.mouseLeave(button)

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('shows the tooltip on focus and closes it with Escape', () => {
    render(<InfoTooltip label="지표 설명" content="지표 정의" />)
    const button = screen.getByRole('button', { name: '지표 설명' })

    fireEvent.focus(button)
    expect(screen.getByRole('tooltip')).toBeVisible()

    fireEvent.keyDown(button, { key: 'Escape' })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})
