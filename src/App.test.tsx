import { render, screen } from '@testing-library/react'

import App from './App'

describe('App', () => {
  it('renders the ok status', () => {
    render(<App />)

    expect(screen.getByTestId('status')).toHaveTextContent('status: ok')
  })
})
