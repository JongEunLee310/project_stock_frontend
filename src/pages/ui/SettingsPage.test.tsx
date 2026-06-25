import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SettingsPage } from './SettingsPage'

const mockUseSettingsProfile = vi.fn()

vi.mock('@/features/settings/queries', () => ({
  useSettingsProfile: () => mockUseSettingsProfile(),
}))

beforeEach(() => {
  mockUseSettingsProfile.mockReturnValue({
    data: { id: 1, email: 'user@example.com', isActive: true },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  })
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('SettingsPage', () => {
  it('renders auth/me profile data', () => {
    render(<SettingsPage />)

    expect(screen.getByRole('heading', { name: '설정' })).toBeVisible()
    expect(screen.getByText('user@example.com')).toBeVisible()
    expect(screen.getByText('활성')).toBeVisible()
  })

  it('renders loading, error, and empty states', () => {
    mockUseSettingsProfile.mockReturnValueOnce({
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    })
    const loadingRender = render(<SettingsPage />)
    expect(document.querySelector('.animate-pulse')).not.toBeNull()
    loadingRender.unmount()

    mockUseSettingsProfile.mockReturnValueOnce({
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    })
    const errorRender = render(<SettingsPage />)
    expect(screen.getByRole('alert')).toHaveTextContent(
      '설정을 불러오지 못했습니다',
    )
    errorRender.unmount()

    mockUseSettingsProfile.mockReturnValueOnce({
      data: null,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })
    render(<SettingsPage />)
    expect(screen.getByText('프로필 정보가 없습니다')).toBeVisible()
  })
})
