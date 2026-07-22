import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'

import type { NewsEventDetailView } from '@/features/news-insights'

import { NewsEventAffectedSymbols } from './NewsEventAffectedSymbols'

const symbols: NewsEventDetailView['affectedSymbols'] = [
  {
    symbol: 'NVDA',
    direction: { label: '긍정', tone: 'success' },
    exposurePercent: 88,
    reason: '매출 증가 가능성',
  },
]

function LocationProbe() {
  return <output>{useLocation().pathname}</output>
}

describe('NewsEventAffectedSymbols', () => {
  it('shows server values and navigates to symbol research', () => {
    render(
      <MemoryRouter initialEntries={['/news/events/10']}>
        <Routes>
          <Route
            path="*"
            element={
              <>
                <NewsEventAffectedSymbols symbols={symbols} />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('영향 긍정')).toBeVisible()
    expect(screen.getByText('노출도 88%')).toBeVisible()
    expect(screen.getByText('매출 증가 가능성')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'NVDA 리서치 보기' }))
    expect(screen.getByText('/research/NVDA')).toBeVisible()
  })

  it('renders an empty state', () => {
    render(
      <MemoryRouter>
        <NewsEventAffectedSymbols symbols={[]} />
      </MemoryRouter>,
    )
    expect(screen.getByText('표시할 영향 종목이 없습니다')).toBeVisible()
  })
})
