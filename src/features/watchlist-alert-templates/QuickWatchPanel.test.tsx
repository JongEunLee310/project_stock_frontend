import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TEMPLATE_VISUAL_MAP } from './adapters'
import type { WatchlistAlertTemplateView } from './adapters'
import { QuickWatchPanel } from './QuickWatchPanel'
import {
  useApplyWatchlistAlertTemplate,
  useWatchlistAlertTemplates,
} from './queries'

vi.mock('@/features/watchlist-alert-templates/queries', () => ({
  useApplyWatchlistAlertTemplate: vi.fn(),
  useWatchlistAlertTemplates: vi.fn(),
}))

const templates: WatchlistAlertTemplateView[] = [
  {
    templateType: 'PRICE_SPIKE',
    label: '가격 급변',
    conditionDescription: '±3% 이상',
    isActive: true,
  },
  {
    templateType: 'NEWS_RISK_HIGH',
    label: '뉴스 위험도 상승',
    conditionDescription: '위험도 HIGH',
    isActive: false,
  },
  {
    templateType: 'AI_JUDGMENT_CHANGE',
    label: 'AI 판단 변경',
    conditionDescription: '판단 변경',
    isActive: true,
  },
  {
    templateType: 'THEME_OVERHEAT',
    label: '테마 과열',
    conditionDescription: '과열 감지',
    isActive: false,
  },
  // template_type 원본: app/domains/watchlists/types.py
]

const mutate = vi.fn()
const refetch = vi.fn()

function renderPanel() {
  render(
    <MemoryRouter>
      <QuickWatchPanel />
    </MemoryRouter>,
  )
}

function mockTemplatesQuery(overrides = {}) {
  vi.mocked(useWatchlistAlertTemplates).mockReturnValue({
    data: templates,
    error: null,
    isError: false,
    isLoading: false,
    refetch,
    ...overrides,
  } as unknown as ReturnType<typeof useWatchlistAlertTemplates>)
}

describe('QuickWatchPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTemplatesQuery()
    vi.mocked(useApplyWatchlistAlertTemplate).mockReturnValue({
      mutate,
    } as unknown as ReturnType<typeof useApplyWatchlistAlertTemplate>)
  })

  it('renders all four template labels', () => {
    renderPanel()

    expect(screen.getByText('가격 급변')).toBeVisible()
    expect(screen.getByText('뉴스 위험도 상승')).toBeVisible()
    expect(screen.getByText('AI 판단 변경')).toBeVisible()
    expect(screen.getByText('테마 과열')).toBeVisible()
  })

  it('applies active styles to active templates', () => {
    renderPanel()

    expect(screen.getByRole('button', { name: /가격 급변/ })).toHaveClass(
      TEMPLATE_VISUAL_MAP.PRICE_SPIKE.activeClassName.split(' ')[0],
    )
    expect(screen.getByRole('button', { name: /AI 판단 변경/ })).toHaveClass(
      TEMPLATE_VISUAL_MAP.AI_JUDGMENT_CHANGE.activeClassName.split(' ')[0],
    )
  })

  it('calls mutate with the inverted active state when a tile is clicked', async () => {
    renderPanel()

    fireEvent.click(screen.getByRole('button', { name: /뉴스 위험도 상승/ }))

    expect(mutate).toHaveBeenCalledWith(
      { templateType: 'NEWS_RISK_HIGH', isActive: true },
      { onSettled: expect.any(Function) },
    )
  })

  it('renders four skeleton tiles while loading', () => {
    mockTemplatesQuery({
      data: undefined,
      isLoading: true,
    })

    renderPanel()

    expect(screen.getAllByTestId('quick-watch-skeleton')).toHaveLength(4)
  })

  it('renders an error state when loading fails', () => {
    mockTemplatesQuery({
      data: undefined,
      error: new Error('network failed'),
      isError: true,
    })

    renderPanel()

    expect(
      screen.getByText('빠른 감시 설정을 불러오지 못했습니다'),
    ).toBeVisible()
    expect(screen.getByText('network failed')).toBeVisible()
  })

  it('disables only the pending tile', async () => {
    renderPanel()

    fireEvent.click(screen.getByRole('button', { name: /가격 급변/ }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /가격 급변/ })).toBeDisabled()
    })
    expect(
      screen.getByRole('button', { name: /뉴스 위험도 상승/ }),
    ).toBeEnabled()
    expect(screen.getByRole('button', { name: /AI 판단 변경/ })).toBeEnabled()
    expect(screen.getByRole('button', { name: /테마 과열/ })).toBeEnabled()
  })

  it('links to the alerts settings page', () => {
    renderPanel()

    expect(
      screen.getByRole('link', { name: '알림 설정 관리' }),
    ).toHaveAttribute('href', '/alerts')
  })
})
