import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { vi } from 'vitest'

import type { DecisionLogFilters } from '@/features/decision-log/queries'

import { DecisionFilterBar } from './DecisionFilterBar'

function FilterHarness({
  onChange,
}: {
  onChange: (filters: DecisionLogFilters) => void
}) {
  const [filters, setFilters] = useState<DecisionLogFilters>({})

  return (
    <DecisionFilterBar
      filters={filters}
      onChange={(nextFilters) => {
        setFilters(nextFilters)
        onChange(nextFilters)
      }}
    />
  )
}

describe('DecisionFilterBar', () => {
  it('combines labeled filters and clears them', () => {
    const onChange = vi.fn()
    render(<FilterHarness onChange={onChange} />)

    expect(screen.getByRole('option', { name: '종목' })).toBeVisible()
    expect(screen.getByRole('option', { name: '매수 검토' })).toBeVisible()
    expect(screen.getByRole('option', { name: '재검토 예정' })).toBeVisible()
    expect(screen.getByRole('option', { name: '밸류에이션' })).toBeVisible()
    expect(
      screen.queryByRole('option', { name: 'SYMBOL' }),
    ).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('대상 유형'), {
      target: { value: 'SYMBOL' },
    })
    fireEvent.change(screen.getByLabelText('종목 심볼'), {
      target: { value: 'nvda' },
    })
    fireEvent.change(screen.getByLabelText('판단 유형'), {
      target: { value: 'BUY_REVIEW' },
    })
    fireEvent.change(screen.getByLabelText('상태'), {
      target: { value: 'REVIEW_DUE' },
    })
    fireEvent.change(screen.getByLabelText('위험 유형'), {
      target: { value: 'VALUATION' },
    })
    fireEvent.change(screen.getByLabelText('재검토 예정일'), {
      target: { value: '2026-08-01' },
    })

    expect(onChange).toHaveBeenLastCalledWith({
      targetType: 'SYMBOL',
      symbol: 'NVDA',
      decisionType: 'BUY_REVIEW',
      status: 'REVIEW_DUE',
      riskType: 'VALUATION',
      reviewDueBefore: '2026-08-01',
      page: undefined,
    })

    fireEvent.click(screen.getByRole('button', { name: '필터 초기화' }))

    expect(onChange).toHaveBeenLastCalledWith({})
    expect(screen.getByLabelText('대상 유형')).toHaveValue('')
    expect(screen.getByLabelText('종목 심볼')).toHaveValue('')
  })
})
