import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'

import type { NewsTopicDetailView } from '@/features/news-insights'

import { TopicActionChecklist } from './TopicActionChecklist'

const affectedSymbols: NewsTopicDetailView['affectedSymbols'] = [
  {
    symbol: '005930',
    exposurePercent: 82,
    direction: { label: '긍정', tone: 'success' },
    relationship: { label: '직접 영향', tone: 'info' },
  },
]

function LocationProbe() {
  return <output aria-label="현재 경로">{useLocation().pathname}</output>
}

function renderChecklist(
  symbols: NewsTopicDetailView['affectedSymbols'] = affectedSymbols,
) {
  return render(
    <MemoryRouter initialEntries={['/news/topics/7']}>
      <TopicActionChecklist topicId="7" affectedSymbols={symbols} />
      <LocationProbe />
    </MemoryRouter>,
  )
}

describe('TopicActionChecklist', () => {
  it.each([
    ['리서치 보기', '/research/005930'],
    ['포트폴리오 보기', '/portfolio'],
    ['판단 기록 보기', '/decision-log'],
    ['알림 만들기', '/alerts'],
  ])('%s 액션을 기존 경로로 연결한다', (buttonName, expectedPath) => {
    renderChecklist()

    fireEvent.click(screen.getByRole('button', { name: buttonName }))

    expect(screen.getByLabelText('현재 경로')).toHaveTextContent(expectedPath)
  })

  it('영향 종목이 없으면 리서치 액션을 비활성화한다', () => {
    renderChecklist([])

    expect(screen.getByText('종목 없음')).toBeVisible()
    expect(screen.getByRole('button', { name: '리서치 보기' })).toBeDisabled()
  })

  it('BE가 준비되지 않은 액션을 준비 중으로 표시하고 비활성화한다', () => {
    renderChecklist()

    expect(screen.getByText('관심 토픽 팔로우')).toBeVisible()
    expect(screen.getByText('유사 토픽·버전 비교')).toBeVisible()
    expect(screen.getAllByText('준비 중')).toHaveLength(4)
    for (const button of screen.getAllByRole('button', { name: '준비 중' })) {
      expect(button).toBeDisabled()
    }
  })
})
