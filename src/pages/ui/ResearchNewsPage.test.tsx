import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'

import { ResearchNewsPage } from './ResearchNewsPage'

const mockUseAssetIdBySymbol = vi.hoisted(() => vi.fn())
const mockUseNewsDisclosure = vi.hoisted(() => vi.fn())
const mockAssetIdRefetch = vi.hoisted(() => vi.fn())
const mockNewsDisclosureRefetch = vi.hoisted(() => vi.fn())

vi.mock('@/features/research/queries', () => ({
  useAssetIdBySymbol: mockUseAssetIdBySymbol,
  useNewsDisclosure: mockUseNewsDisclosure,
}))

const newsItem = {
  id: 'news-1',
  title: 'New accelerator announced',
  url: 'https://example.com/news/1',
  source: 'Example News',
  publishedAt: '2026. 7. 10. 오전 9:00',
  summary: 'A new product cycle begins.',
  categoryLabel: '제품',
  impactLabel: '중간',
  sentiment: 'POSITIVE' as const,
}

const disclosureItem = {
  id: 'disclosure-1',
  title: 'Quarterly filing',
  url: 'https://example.com/disclosures/1',
  source: 'DART',
  publishedAt: null,
  summary: 'Quarterly disclosure summary.',
  categoryLabel: '기타',
  impactLabel: '높음',
  sentiment: 'NEUTRAL' as const,
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/research/nvda/news']}>
      <Routes>
        <Route path="/research/:symbol/news" element={<ResearchNewsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  mockUseAssetIdBySymbol.mockReturnValue({
    data: 11,
    error: null,
    isError: false,
    isLoading: false,
    refetch: mockAssetIdRefetch,
  })
  mockUseNewsDisclosure.mockReturnValue({
    data: { news: [newsItem], disclosures: [disclosureItem] },
    error: null,
    isError: false,
    isLoading: false,
    refetch: mockNewsDisclosureRefetch,
  })
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('ResearchNewsPage', () => {
  it('renders full news items, switches tabs, and links back to research', () => {
    renderPage()

    expect(mockUseAssetIdBySymbol).toHaveBeenCalledWith('NVDA')
    expect(mockUseNewsDisclosure).toHaveBeenCalledWith(11)
    expect(
      screen.getByRole('heading', { name: '뉴스 및 공시 — NVDA' }),
    ).toBeVisible()
    expect(screen.getByRole('link', { name: 'NVDA 리서치' })).toHaveAttribute(
      'href',
      '/research/NVDA',
    )
    expect(screen.getByText('A new product cycle begins.')).toBeVisible()
    expect(screen.getByText('영향 긍정')).toBeVisible()
    expect(screen.getByText('중요도 중간')).toBeVisible()

    fireEvent.click(screen.getByRole('tab', { name: '공시' }))

    expect(screen.getByText('Quarterly disclosure summary.')).toBeVisible()
    expect(screen.getByText('영향 중립')).toBeVisible()
    expect(screen.getByText('중요도 높음')).toBeVisible()
    expect(screen.queryByText('New accelerator announced')).toBeNull()
  })

  it('renders a skeleton while resolving the asset id', () => {
    mockUseAssetIdBySymbol.mockReturnValue({
      data: undefined,
      error: null,
      isError: false,
      isLoading: true,
      refetch: mockAssetIdRefetch,
    })
    mockUseNewsDisclosure.mockReturnValue({
      data: undefined,
      error: null,
      isError: false,
      isLoading: false,
      refetch: mockNewsDisclosureRefetch,
    })

    const { container } = renderPage()

    expect(container.querySelector('.animate-pulse')).not.toBeNull()
    expect(mockUseNewsDisclosure).toHaveBeenCalledWith(undefined)
  })

  it('renders the news error and retries the news query', () => {
    mockUseNewsDisclosure.mockReturnValue({
      data: undefined,
      error: new Error('news failed'),
      isError: true,
      isLoading: false,
      refetch: mockNewsDisclosureRefetch,
    })
    renderPage()

    expect(
      screen.getByRole('heading', {
        name: '뉴스 및 공시를 불러오지 못했습니다',
      }),
    ).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: '재시도' }))
    expect(mockNewsDisclosureRefetch).toHaveBeenCalledOnce()
  })

  it('renders tab-specific empty states', () => {
    mockUseNewsDisclosure.mockReturnValue({
      data: { news: [], disclosures: [] },
      error: null,
      isError: false,
      isLoading: false,
      refetch: mockNewsDisclosureRefetch,
    })
    renderPage()

    expect(screen.getByText('표시할 뉴스가 없습니다.')).toBeVisible()
    fireEvent.click(screen.getByRole('tab', { name: '공시' }))
    expect(screen.getByText('표시할 공시가 없습니다.')).toBeVisible()
  })
})
