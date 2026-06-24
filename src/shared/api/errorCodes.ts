export const errorCodeMessages: Record<string, string> = {
  UNAUTHORIZED: '인증이 필요합니다',
  FORBIDDEN: '권한이 없습니다',
  NOT_FOUND: '대상을 찾을 수 없습니다',
  VALIDATION_ERROR: '요청이 올바르지 않습니다',
  CONFLICT: '이미 존재하는 데이터입니다',
  INTERNAL_ERROR: '서버 오류가 발생했습니다',
  SERVICE_UNAVAILABLE: '서비스를 일시적으로 사용할 수 없습니다',
}

export function messageForErrorCode(code: string, fallback?: string): string {
  return errorCodeMessages[code] ?? fallback ?? code
}
