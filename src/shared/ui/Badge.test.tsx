import { render, screen } from '@testing-library/react'

import { Badge } from './Badge'
import {
  riskLevelClassNames,
  stockStatusClassNames,
  type RiskLevel,
  type StockStatus,
} from './stockStatus'

const statuses: StockStatus[] = [
  '안정',
  '관망',
  '관망 유지',
  '위험 증가',
  '추가 리서치 필요',
  '매수 검토 가능',
  '비중 축소 검토',
]

const riskLevels: RiskLevel[] = ['높음', '중간', '낮음']

describe('Badge', () => {
  it.each(statuses)('renders token classes for %s status', (status) => {
    render(<Badge status={status} />)

    expect(screen.getByText(status)).toHaveClass(
      ...stockStatusClassNames[status].split(' '),
    )
  })

  it.each(riskLevels)('renders token classes for %s risk level', (riskLevel) => {
    render(<Badge riskLevel={riskLevel} />)

    expect(screen.getByText(riskLevel)).toHaveClass(
      ...riskLevelClassNames[riskLevel].split(' '),
    )
  })
})
