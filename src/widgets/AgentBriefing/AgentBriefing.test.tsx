import { render, screen } from '@testing-library/react'

import { AgentBriefing } from './AgentBriefing'

describe('AgentBriefing', () => {
  it('renders an AI summary and evidence counts for every theme highlight', () => {
    render(<AgentBriefing />)

    expect(screen.getByText('AI 분석')).toBeVisible()
    expect(screen.getByText('AI 반도체')).toBeVisible()
    expect(screen.getByText('금리·환율')).toBeVisible()
    expect(screen.getByText('2차전지')).toBeVisible()
    expect(screen.getByText('근거 8건')).toBeVisible()
    expect(screen.getByText('근거 5건')).toBeVisible()
    expect(screen.getByText('근거 6건')).toBeVisible()
  })
})
