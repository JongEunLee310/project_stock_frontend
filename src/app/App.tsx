import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'

import { AuthProvider } from '@/shared/auth/AuthProvider'
import { createQueryClient } from '@/shared/api/queryClient'
import { appRouter } from './router'

const queryClient = createQueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={appRouter} />
      </AuthProvider>
    </QueryClientProvider>
  )
}
