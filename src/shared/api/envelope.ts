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

export interface ApiEnvelope<T> {
  data: T
  message?: string
  error?: ApiErrorBody | null
  meta?: ApiMeta
}

export class ApiError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

export function unwrapEnvelope<T>(env: ApiEnvelope<T>): {
  data: T
  meta?: ApiMeta
} {
  if (env.error) {
    const message = messageForErrorCode(env.error.code)
    throw new ApiError(env.error.code, message)
  }

  return { data: env.data, meta: env.meta }
}
