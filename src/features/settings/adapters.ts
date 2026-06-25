import type { MeDto } from './dto'

export interface SettingsProfile {
  id: number
  email: string
  isActive: boolean
}

export function adaptSettingsProfile(dto: MeDto): SettingsProfile {
  return {
    id: dto.id,
    email: dto.email,
    isActive: dto.is_active,
  }
}
