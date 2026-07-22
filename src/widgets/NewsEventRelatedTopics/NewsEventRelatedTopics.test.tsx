import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'

import type { NewsEventDetailView } from '@/features/news-insights'

import { NewsEventRelatedTopics } from './NewsEventRelatedTopics'

const topics: NewsEventDetailView['relatedTopics'] = [
  { topicId: '7', title: 'AI 반도체 수요' },
]

function LocationProbe() {
  return <output>{useLocation().pathname}</output>
}

describe('NewsEventRelatedTopics', () => {
  it('navigates to the selected topic detail', () => {
    render(
      <MemoryRouter initialEntries={['/news/events/10']}>
        <Routes>
          <Route
            path="*"
            element={
              <>
                <NewsEventRelatedTopics topics={topics} />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('AI 반도체 수요')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: '토픽 상세 보기' }))
    expect(screen.getByText('/news/topics/7')).toBeVisible()
  })

  it('renders an empty state', () => {
    render(
      <MemoryRouter>
        <NewsEventRelatedTopics topics={[]} />
      </MemoryRouter>,
    )
    expect(screen.getByText('표시할 관련 토픽이 없습니다')).toBeVisible()
  })
})
