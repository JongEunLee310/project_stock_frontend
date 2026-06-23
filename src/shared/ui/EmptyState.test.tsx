import { render, screen } from '@testing-library/react'

import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('renders title, description, role, icon, and action', () => {
    render(
      <EmptyState
        title="표시할 항목이 없습니다"
        description="필터를 조정해 다시 확인해 주세요."
        icon="⌕"
        action={<button type="button">필터 초기화</button>}
      />,
    )

    expect(screen.getByRole('status')).toBeVisible()
    expect(
      screen.getByRole('heading', { name: '표시할 항목이 없습니다' }),
    ).toBeVisible()
    expect(screen.getByText('필터를 조정해 다시 확인해 주세요.')).toBeVisible()
    expect(screen.getByText('⌕')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('button', { name: '필터 초기화' })).toBeVisible()
  })
})
