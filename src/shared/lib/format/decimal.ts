export function parseDecimal(value: string): number {
  const parsedValue = Number(value)

  if (!Number.isFinite(parsedValue)) {
    throw new Error(`Invalid decimal value: ${value}`)
  }

  return parsedValue
}

export function parseNullableDecimal(value: string | null): number | null {
  return value === null ? null : parseDecimal(value)
}
