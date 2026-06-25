import { useQuery } from '@tanstack/react-query'

import { apiGet } from '@/shared/api/client'

import { adaptSettingsProfile, type SettingsProfile } from './adapters'
import type { MeDto } from './dto'

export function useSettingsProfile() {
  return useQuery<SettingsProfile>({
    queryKey: ['settings', 'profile'],
    queryFn: async () => {
      const { data } = await apiGet<MeDto>('/auth/me')
      return adaptSettingsProfile(data)
    },
  })
}
