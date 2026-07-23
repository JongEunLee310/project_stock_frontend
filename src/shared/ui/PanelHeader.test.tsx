import { render, screen } from '@testing-library/react'

import { PanelHeader } from './PanelHeader'

describe('PanelHeader', () => {
  it('connects the panel to its title and renders controls without a description by default', () => {
    render(
      <section aria-labelledby="panel-title">
        <PanelHeader
          title="패널 제목"
          titleId="panel-title"
          controls={<button type="button">새로고침</button>}
        />
      </section>,
    )

    expect(
      screen.getByRole('region', { name: '패널 제목' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '패널 제목' })).toHaveAttribute(
      'id',
      'panel-title',
    )
    expect(screen.getByRole('button', { name: '새로고침' })).toBeInTheDocument()
  })

  it('renders the optional description', () => {
    render(<PanelHeader title="패널 제목" description="보조 설명" />)

    expect(screen.getByText('보조 설명')).toBeInTheDocument()
  })
})
