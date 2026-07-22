import { messageForErrorCode } from './errorCodes'

export interface ApiErrorBody {
  code: string
  message?: string
}

export interface ApiMeta {
  page: number
  size: number
  total: number
}

export interface ApiCursorMeta {
  limit: number
  has_more: boolean
  next_cursor: string | null
}

export type ApiResponseMeta = ApiMeta | ApiCursorMeta

export interface ApiEnvelope<T, TMeta extends ApiResponseMeta = ApiMeta> {
  data: T
  message?: string
  error?: ApiErrorBody | null
  meta?: TMeta
}

export class ApiError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

export function unwrapEnvelope<T, TMeta extends ApiResponseMeta = ApiMeta>(
  env: ApiEnvelope<T, TMeta>,
): {
  data: T
  meta?: TMeta
} {
  if (env.error) {
    const message = messageForErrorCode(env.error.code)
    throw new ApiError(env.error.code, message)
  }

  return { data: env.data, meta: env.meta }
}
