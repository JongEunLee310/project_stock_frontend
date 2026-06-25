import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { useMarkAlertRead } from './queries'

const mockApiPost = vi.fn()

vi.mock('@/shared/api/client', () => ({
  apiGet: vi.fn(),
  apiPost: (...args: unknown[]) => mockApiPost(...args),
}))

describe('alerts queries', () => {
  it('invalidates alert lists after mutation success', async () => {
    mockApiPost.mockResolvedValue({ data: null })
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useMarkAlertRead(), { wrapper })

    result.current.mutate('1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApiPost).toHaveBeenCalledWith('/alerts/1/read')
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['alerts'] })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['alert-candidates'],
    })
  })
})
