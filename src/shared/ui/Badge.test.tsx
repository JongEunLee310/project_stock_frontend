import { render, screen } from '@testing-library/react'

import { Badge } from './Badge'
import { stockStatusClassNames, type StockStatus } from './stockStatus'

const statuses: StockStatus[] = [
  '안정',
  '관망',
  '위험 증가',
  '추가 리서치 필요',
  '매수 검토 가능',
]

describe('Badge', () => {
  it.each(statuses)('renders token classes for %s status', (status) => {
    render(<Badge status={status} />)

    expect(screen.getByText(status)).toHaveClass(
      ...stockStatusClassNames[status].split(' '),
    )
  })
})
