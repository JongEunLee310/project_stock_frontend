import { render, screen } from '@testing-library/react'

import { CounterViewPanel } from './CounterViewPanel'

describe('CounterViewPanel', () => {
  it('always exposes the counter-view panel with an explicit empty state', () => {
    render(<CounterViewPanel counterArguments={[]} />)

    expect(screen.getByRole('heading', { name: '반대 관점' })).toBeVisible()
    expect(screen.getByText('등록된 반대 관점이 없습니다')).toBeVisible()
  })

  it('renders every provided counter argument', () => {
    render(
      <CounterViewPanel
        counterArguments={['단기 영향은 제한적이다.', '수요가 둔화될 수 있다.']}
      />,
    )

    expect(screen.getByText('단기 영향은 제한적이다.')).toBeVisible()
    expect(screen.getByText('수요가 둔화될 수 있다.')).toBeVisible()
  })
})
