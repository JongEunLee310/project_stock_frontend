import { formatKstDateTime } from '@/shared/lib/format'

import type { MeDto } from './dto'

export interface UserProfile {
  id: number
  email: string
  username: string
  createdAt: string
}

export function adaptMe(dto: MeDto): UserProfile {
  return {
    id: dto.id,
    email: dto.email,
    username: dto.username,
    createdAt: formatKstDateTime(dto.created_at),
  }
}
