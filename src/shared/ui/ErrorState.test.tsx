import { fireEvent, render, screen } from '@testing-library/react'

import { ErrorState } from './ErrorState'

describe('ErrorState', () => {
  it('renders the default alert title without a retry button', () => {
    render(<ErrorState description="잠시 후 다시 시도해 주세요." />)

    expect(screen.getByRole('alert')).toBeVisible()
    expect(
      screen.getByRole('heading', { name: '문제가 발생했습니다' }),
    ).toBeVisible()
    expect(screen.getByText('잠시 후 다시 시도해 주세요.')).toBeVisible()
    expect(
      screen.queryByRole('button', { name: '재시도' }),
    ).not.toBeInTheDocument()
  })

  it('renders a retry button and calls onRetry when provided', () => {
    const handleRetry = vi.fn()

    render(
      <ErrorState title="데이터를 불러오지 못했습니다" onRetry={handleRetry} />,
    )

    fireEvent.click(screen.getByRole('button', { name: '재시도' }))

    expect(handleRetry).toHaveBeenCalledTimes(1)
  })
})
