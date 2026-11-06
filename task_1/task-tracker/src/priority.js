export const PRIORITY_VALUES = ['low', 'medium', 'high']

export const DEFAULT_PRIORITY = 'medium'

export function isValidPriority(value) {
  return PRIORITY_VALUES.includes(value)
}
