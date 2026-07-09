import { fireEvent, render } from '@testing-library/react'

import { StockLogo } from './StockLogo'

describe('StockLogo', () => {
  it('uses the symbol as-is for a NASDAQ logo', () => {
    const { container } = render(<StockLogo symbol="NVDA" market="NASDAQ" />)

    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'https://assets.parqet.com/logos/symbol/NVDA',
    )
  })

  it('adds the KS suffix for a KOSPI logo', () => {
    const { container } = render(<StockLogo symbol="005930" market="KOSPI" />)

    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'https://assets.parqet.com/logos/symbol/005930.KS',
    )
  })

  it('renders the text mark after the logo fails to load', () => {
    const { container } = render(<StockLogo symbol="NVDA" />)
    const image = container.querySelector('img')

    expect(image).not.toBeNull()
    fireEvent.error(image!)

    expect(container.querySelector('img')).not.toBeInTheDocument()
    expect(container).toHaveTextContent('N')
  })
})
