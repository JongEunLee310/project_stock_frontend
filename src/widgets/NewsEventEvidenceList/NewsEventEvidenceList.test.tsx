import { fireEvent, render, screen } from '@testing-library/react'

import type { NewsEventDetailView } from '@/features/news-insights'

import { NewsEventEvidenceList } from './NewsEventEvidenceList'

const evidence: NewsEventDetailView['evidence'] = [
  {
    id: '20',
    documentId: '20',
    documentType: { label: '공시', tone: 'info' },
    source: 'DART',
    title: '공급 계약 공시',
    publishedAt: '2026. 7. 21. 오전 9:00',
    evidenceRole: { label: '핵심 근거', tone: 'info' },
  },
]

describe('NewsEventEvidenceList', () => {
  it('separates source metadata from the honest AI summary availability', () => {
    render(<NewsEventEvidenceList evidence={evidence} />)

    expect(screen.getByText('핵심 근거')).toBeVisible()
    expect(screen.getByText(/DART.*문서 #20/)).toBeVisible()
    expect(
      screen.queryByText(/문서별 AI 요약은 제공되지 않습니다/),
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'AI 요약 보기' }))
    expect(screen.getByText(/문서별 AI 요약은 제공되지 않습니다/)).toBeVisible()
    expect(screen.queryByText(/API가 원문 URL/)).not.toBeInTheDocument()
  })

  it('renders an empty state', () => {
    render(<NewsEventEvidenceList evidence={[]} />)
    expect(screen.getByText('표시할 근거 문서가 없습니다')).toBeVisible()
  })
})
