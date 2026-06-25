import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { apiGet } from '@/shared/api/client'

import { adaptMe, type UserProfile } from './adapters'
import type { MeDto } from './dto'

export function useMe(): UseQueryResult<UserProfile> {
  return useQuery<UserProfile>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { data } = await apiGet<MeDto>('/auth/me')

      return adaptMe(data)
    },
  })
}
