export function minLength(value: string, min: number): boolean {
  return value.trim().length >= min
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function isUsername(value: string): boolean {
  return /^[a-zA-Z0-9_]{4,32}$/.test(value.trim())
}

export function isPassword(value: string, min = 6): boolean {
  return value.length >= min
}

export function passwordsMatch(a: string, b: string): boolean {
  return a === b && a.length > 0
}
