import { render, screen } from '@testing-library/react'

import App from '@/app/App'

describe('App', () => {
  it('renders the ok status', () => {
    render(<App />)

    expect(screen.getByTestId('status')).toHaveTextContent('status: ok')
  })
})
