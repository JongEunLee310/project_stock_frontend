import { apiGet, apiPost } from '@/shared/api/client'
import { type AuthTokens, setTokens } from './tokenStore'

export interface MeUser {
  id: number
  email: string
  [key: string]: unknown
}

export interface LoginResult extends AuthTokens {
  me?: MeUser
}

interface LoginDto {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user?: MeUser
}

export async function login(credentials: {
  email: string
  password: string
}): Promise<LoginResult> {
  const { data } = await apiPost<LoginDto>('/auth/login', credentials, {
    auth: false,
  })

  const tokens: AuthTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  }

  setTokens(tokens)

  return {
    ...tokens,
    me: data.user,
  }
}

export async function fetchMe(): Promise<MeUser> {
  const { data } = await apiGet<MeUser>('/auth/me')
  return data
}
