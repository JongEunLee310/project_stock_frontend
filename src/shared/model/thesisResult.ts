import { toLabel } from '@/shared/lib/format'

export const thesisResultLabels = {
  CONFIRMED: '확인',
  PARTIALLY_CONFIRMED: '일부 확인',
  INVALIDATED: '무효화',
} as const

export type ThesisResultCode = keyof typeof thesisResultLabels

export type ThesisResult = {
  value: ThesisResultCode
  label: (typeof thesisResultLabels)[ThesisResultCode]
}

export const thesisResults = Object.entries(thesisResultLabels).map(
  ([value, label]) => ({ value: value as ThesisResultCode, label }),
) satisfies ThesisResult[]

export function toThesisResultLabel(value: string): string {
  return toLabel(thesisResultLabels, value, '알 수 없음')
}
