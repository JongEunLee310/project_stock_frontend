import {
  clearTokens,
  emitAuthExpired,
  getAccess,
  getTokens,
  setTokens,
} from '@/shared/auth/tokenStore'
import {
  ApiError,
  unwrapEnvelope,
  type ApiMeta,
  type ApiResponseMeta,
} from './envelope'
import { messageForErrorCode } from './errorCodes'

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** false면 Authorization 헤더와 401 refresh를 적용하지 않는다 */
  auth?: boolean
  body?: unknown
}

// single-flight: 진행 중인 refresh Promise
let pendingRefresh: Promise<string> | null = null

async function doRefresh(): Promise<string> {
  const tokens = getTokens()
  if (!tokens) {
    clearTokens()
    emitAuthExpired()
    throw new ApiError('UNAUTHORIZED', messageForErrorCode('UNAUTHORIZED'))
  }

  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? ''
  const res = await fetch(`${baseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: tokens.refreshToken }),
  })

  if (!res.ok) {
    clearTokens()
    emitAuthExpired()
    throw new ApiError('UNAUTHORIZED', messageForErrorCode('UNAUTHORIZED'))
  }

  const json = await res.json()
  const dto = json.data as {
    access_token: string
    refresh_token?: string
    token_type: string
    expires_in: number
  }

  const newAccess = dto.access_token
  // 비회전 정책: 서버가 refresh_token을 비우거나 생략하면 기존 refresh 유지
  const newRefresh = dto.refresh_token || tokens.refreshToken
  setTokens({ accessToken: newAccess, refreshToken: newRefresh })
  return newAccess
}

function refreshAccessToken(): Promise<string> {
  if (!pendingRefresh) {
    pendingRefresh = doRefresh().finally(() => {
      pendingRefresh = null
    })
  }
  return pendingRefresh
}

function buildRequest(
  path: string,
  options: RequestOptions,
  accessToken?: string | null,
): Request {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? ''
  const url = `${baseUrl}${path}`

  const headers = new Headers(options.headers as HeadersInit | undefined)
  if (!headers.has('Content-Type') && options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  // auth는 custom 옵션이므로 fetch Request에 전달하지 않음
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { auth: _, body, ...rest } = options
  return new Request(url, {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

export async function apiRequest<T, TMeta extends ApiResponseMeta = ApiMeta>(
  path: string,
  options: RequestOptions = {},
): Promise<{ data: T; meta?: TMeta }> {
  const { auth = true } = options

  const accessToken = auth ? getAccess() : null
  const request = buildRequest(path, options, accessToken)

  let res = await fetch(request)

  // 401 lazy refresh (auth: true, 최초 시도만)
  if (res.status === 401 && auth) {
    let newAccess: string
    try {
      newAccess = await refreshAccessToken()
    } catch {
      // clearTokens + emitAuthExpired는 doRefresh 내부에서 이미 처리
      throw new ApiError('UNAUTHORIZED', messageForErrorCode('UNAUTHORIZED'))
    }

    // 새 토큰으로 원요청 1회 재시도
    const retryReq = buildRequest(path, options, newAccess)
    res = await fetch(retryReq)
  }

  if (res.status === 204) {
    return { data: undefined as T }
  }

  const json = (await res.json()) as {
    data: T
    error?: { code: string } | null
    meta?: TMeta
  }

  // envelope 형태가 아닌 경우(예: refresh 응답을 직접 호출 등)도 unwrapEnvelope 통과
  return unwrapEnvelope({ data: json.data, error: json.error, meta: json.meta })
}

export async function apiGet<T, TMeta extends ApiResponseMeta = ApiMeta>(
  path: string,
  options?: RequestOptions,
) {
  return apiRequest<T, TMeta>(path, { ...options, method: 'GET' })
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  options?: RequestOptions,
) {
  return apiRequest<T>(path, { ...options, method: 'POST', body })
}

export async function apiPut<T>(
  path: string,
  body?: unknown,
  options?: RequestOptions,
) {
  return apiRequest<T>(path, { ...options, method: 'PUT', body })
}

export async function apiPatch<T>(
  path: string,
  body?: unknown,
  options?: RequestOptions,
) {
  return apiRequest<T>(path, { ...options, method: 'PATCH', body })
}

export async function apiDelete<T>(path: string, options?: RequestOptions) {
  return apiRequest<T>(path, { ...options, method: 'DELETE' })
}
